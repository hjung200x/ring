import { writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { FastifyInstance } from "fastify";
import { ensureStoragePath } from "../../config/paths.js";
import { extractNotice } from "../documents/extractor-bridge.js";
import { normalizeNoticeText } from "../documents/normalizer.js";
import { buildRuleBasedSummary } from "../documents/summarizer.js";
import { runKeywordFilter } from "../matching/keyword-filter.js";
import { selectPrimaryNoticeAttachment } from "./attachment-selector.js";
import type { KeitAnnouncementDetail } from "./keit.client.js";
import { KeitClient } from "./keit.client.js";

const JOB_KEY = { source: "keit", jobName: "collect-announcements" };
const MAX_PAGES = 10;
const DUPLICATE_STREAK_LIMIT = 10;
const CHEAP_TEXT_LIMIT = 6000;

const safeFilename = (value: string) => value.replace(/[\\/:*?"<>|]/g, "_");
const parseKeywords = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);

interface CandidateDocument {
  primaryFilename: string;
  primaryAtchDocId: string;
  primaryAtchFileId: string;
  extension: string;
  extractionStatus: "success" | "failed";
  extractionError: string | null;
  rawText: string | null;
  normalizedText: string;
  summaryText: string | null;
  textHash: string | null;
  localPath: string | null;
  downloadedAt: Date | null;
}

export class CollectorService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly client: KeitClient,
  ) {}

  async syncLatest(): Promise<void> {
    const existingState = await this.app.prisma.sourceSyncState.findUnique({
      where: { source_jobName: JOB_KEY },
    });

    await this.app.prisma.sourceSyncState.upsert({
      where: { source_jobName: JOB_KEY },
      update: { lastRunStartedAt: new Date(), status: "running", lastError: null },
      create: { ...JOB_KEY, status: "running", lastRunStartedAt: new Date() },
    });

    const profiles = await this.app.prisma.interestProfile.findMany({
      where: { enabled: true },
      include: { user: true },
    });

    let duplicateStreak = 0;
    let lastSeenPostedAt: Date | null = null;
    let topCheckpointKey: string | null = null;

    try {
      for (let pageIndex = 1; pageIndex <= MAX_PAGES; pageIndex += 1) {
        const stubs = await this.client.fetchListPage(pageIndex);
        if (stubs.length === 0) {
          break;
        }

        if (pageIndex === 1 && stubs[0]) {
          topCheckpointKey = `${stubs[0].sourceAncmId}:${stubs[0].sourceBsnsYy}`;
        }

        for (const stub of stubs) {
          const seen = await this.app.prisma.seenAnnouncement.findUnique({
            where: {
              source_sourceAncmId_sourceBsnsYy: {
                source: "keit",
                sourceAncmId: stub.sourceAncmId,
                sourceBsnsYy: stub.sourceBsnsYy,
              },
            },
          });

          if (seen) {
            duplicateStreak += 1;
            await this.app.prisma.seenAnnouncement.update({
              where: { id: seen.id },
              data: { lastSeenAt: new Date() },
            });

            if (duplicateStreak >= DUPLICATE_STREAK_LIMIT) {
              await this.finishSync(topCheckpointKey ?? existingState?.lastSeenItemKey ?? null, lastSeenPostedAt);
              return;
            }
            continue;
          }

          duplicateStreak = 0;

          try {
            const detail = await this.client.fetchDetail(stub.sourceAncmId, stub.sourceBsnsYy);
            const postedAt = detail.postedAt ? new Date(`${detail.postedAt}T00:00:00`) : null;
            lastSeenPostedAt = postedAt;

            const cheapMatchedProfiles = this.findCheapMatchedProfiles(stub.title, detail, profiles);
            if (cheapMatchedProfiles.length === 0) {
              await this.recordSeen({
                sourceAncmId: stub.sourceAncmId,
                sourceBsnsYy: stub.sourceBsnsYy,
                title: detail.title || stub.title,
                postedAt,
                decision: "ignored",
              });
              continue;
            }

            const candidate = await this.buildCandidate(detail, stub.title);
            const matchedProfiles = cheapMatchedProfiles.filter((profile) => {
              const keyword = runKeywordFilter({
                title: detail.title || stub.title,
                filename: candidate.primaryFilename,
                text: candidate.normalizedText,
                includeKeywords: parseKeywords(profile.includeKeywordsJson),
                excludeKeywords: parseKeywords(profile.excludeKeywordsJson),
              });
              return keyword.keywordPass;
            });

            if (matchedProfiles.length === 0) {
              await this.recordSeen({
                sourceAncmId: stub.sourceAncmId,
                sourceBsnsYy: stub.sourceBsnsYy,
                title: detail.title || stub.title,
                postedAt,
                decision: "ignored",
              });
              continue;
            }

            const announcement = await this.app.prisma.announcement.create({
              data: {
                source: "keit",
                sourceAncmId: stub.sourceAncmId,
                sourceBsnsYy: stub.sourceBsnsYy,
                programId: "XPG201040000",
                title: detail.title || stub.title,
                statusText: detail.statusText ?? stub.statusText,
                postedAt,
                applyStartAt: detail.applyStartAt,
                applyEndAt: detail.applyEndAt,
                detailUrl: detail.detailUrl,
              },
            });

            await this.app.prisma.announcementDetail.create({
              data: {
                announcementId: announcement.id,
                sourcePayloadJson: {
                  sourceAncmId: stub.sourceAncmId,
                  sourceBsnsYy: stub.sourceBsnsYy,
                  statusText: detail.statusText ?? stub.statusText,
                  matchedProfileIds: matchedProfiles.map((profile) => profile.id),
                },
              },
            });

            const attachment = await this.app.prisma.attachment.create({
              data: {
                announcementId: announcement.id,
                filename: candidate.primaryFilename,
                extension: candidate.extension,
                atchDocId: candidate.primaryAtchDocId,
                atchFileId: candidate.primaryAtchFileId,
                isPrimaryNoticeDoc: true,
                localPath: candidate.localPath,
                downloadedAt: candidate.downloadedAt,
              },
            });

            await this.app.prisma.document.create({
              data: {
                announcementId: announcement.id,
                attachmentId: attachment.id,
                docType: candidate.extension || "unknown",
                extractionStatus: candidate.extractionStatus,
                extractionError: candidate.extractionError,
                rawText: candidate.rawText,
                normalizedText: candidate.normalizedText,
                summaryText: candidate.summaryText,
                textHash: candidate.textHash,
              },
            });

            await this.recordSeen({
              sourceAncmId: stub.sourceAncmId,
              sourceBsnsYy: stub.sourceBsnsYy,
              title: detail.title || stub.title,
              postedAt,
              decision: "matched",
            });
          } catch (error) {
            await this.recordSeen({
              sourceAncmId: stub.sourceAncmId,
              sourceBsnsYy: stub.sourceBsnsYy,
              title: stub.title,
              postedAt: stub.postedAt ? new Date(`${stub.postedAt}T00:00:00`) : null,
              decision: "failed",
              lastError: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      await this.finishSync(topCheckpointKey ?? existingState?.lastSeenItemKey ?? null, lastSeenPostedAt);
    } catch (error) {
      await this.app.prisma.sourceSyncState.update({
        where: { source_jobName: JOB_KEY },
        data: {
          status: "failed",
          lastError: error instanceof Error ? error.message : String(error),
          lastRunFinishedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private findCheapMatchedProfiles(
    stubTitle: string,
    detail: KeitAnnouncementDetail,
    profiles: Array<{
      id: string;
      includeKeywordsJson: unknown;
      excludeKeywordsJson: unknown;
    }>,
  ) {
    const attachmentNames = detail.attachments.map((attachment) => attachment.filename).join("\n");
    const cheapText = `${detail.title || stubTitle}\n${attachmentNames}\n${detail.rawHtml.slice(0, CHEAP_TEXT_LIMIT)}`;

    return profiles.filter((profile) => {
      const keyword = runKeywordFilter({
        title: detail.title || stubTitle,
        filename: attachmentNames,
        text: cheapText,
        includeKeywords: parseKeywords(profile.includeKeywordsJson),
        excludeKeywords: parseKeywords(profile.excludeKeywordsJson),
      });
      return keyword.keywordPass;
    });
  }

  private async buildCandidate(detail: KeitAnnouncementDetail, fallbackTitle: string): Promise<CandidateDocument> {
    const primary = selectPrimaryNoticeAttachment(detail.attachments);
    if (!primary) {
      return {
        primaryFilename: "",
        primaryAtchDocId: "",
        primaryAtchFileId: "",
        extension: "unknown",
        extractionStatus: "failed",
        extractionError: "primary notice attachment not found",
        rawText: null,
        normalizedText: detail.rawHtml,
        summaryText: null,
        textHash: null,
        localPath: null,
        downloadedAt: null,
      };
    }

    const extension = extname(primary.filename).toLowerCase().replace(".", "");
    if (extension !== "hwp" && extension !== "hwpx") {
      return {
        primaryFilename: primary.filename,
        primaryAtchDocId: primary.atchDocId,
        primaryAtchFileId: primary.atchFileId,
        extension,
        extractionStatus: "failed",
        extractionError: `unsupported extension: ${extension}`,
        rawText: null,
        normalizedText: detail.rawHtml,
        summaryText: null,
        textHash: null,
        localPath: null,
        downloadedAt: null,
      };
    }

    try {
      const buffer = await this.client.downloadAttachment(primary.atchDocId, primary.atchFileId);
      const tempDir = ensureStoragePath(this.app.config.STORAGE_ROOT, "ingest-temp");
      const localPath = resolve(tempDir, safeFilename(`${primary.atchDocId}_${primary.atchFileId}_${primary.filename}`));
      await writeFile(localPath, buffer);

      const scriptsRoot = resolve(process.cwd(), "scripts");
      const extractScript = resolve(scriptsRoot, "extract_notice.py");
      const extracted = await extractNotice(extractScript, localPath, extension);
      const normalizedText = normalizeNoticeText(extracted.normalizedText);
      const summaryText = buildRuleBasedSummary({
        title: detail.title || fallbackTitle,
        postedAt: detail.postedAt,
        applyStartAt: detail.applyStartAt,
        applyEndAt: detail.applyEndAt,
        normalizedText,
      });

      return {
        primaryFilename: primary.filename,
        primaryAtchDocId: primary.atchDocId,
        primaryAtchFileId: primary.atchFileId,
        extension,
        extractionStatus: "success",
        extractionError: null,
        rawText: extracted.rawText,
        normalizedText,
        summaryText,
        textHash: `${normalizedText.length}`,
        localPath,
        downloadedAt: new Date(),
      };
    } catch (error) {
      return {
        primaryFilename: primary.filename,
        primaryAtchDocId: primary.atchDocId,
        primaryAtchFileId: primary.atchFileId,
        extension,
        extractionStatus: "failed",
        extractionError: error instanceof Error ? error.message : String(error),
        rawText: null,
        normalizedText: detail.rawHtml,
        summaryText: null,
        textHash: null,
        localPath: null,
        downloadedAt: null,
      };
    }
  }

  private async recordSeen(input: {
    sourceAncmId: string;
    sourceBsnsYy: string;
    title: string;
    postedAt: Date | null;
    decision: "matched" | "ignored" | "failed";
    lastError?: string | null;
  }) {
    await this.app.prisma.seenAnnouncement.upsert({
      where: {
        source_sourceAncmId_sourceBsnsYy: {
          source: "keit",
          sourceAncmId: input.sourceAncmId,
          sourceBsnsYy: input.sourceBsnsYy,
        },
      },
      create: {
        source: "keit",
        sourceAncmId: input.sourceAncmId,
        sourceBsnsYy: input.sourceBsnsYy,
        title: input.title,
        postedAt: input.postedAt,
        decision: input.decision,
        matchedAt: input.decision === "matched" ? new Date() : null,
        ignoredAt: input.decision === "ignored" ? new Date() : null,
        failedAt: input.decision === "failed" ? new Date() : null,
        lastError: input.lastError ?? null,
      },
      update: {
        title: input.title,
        postedAt: input.postedAt,
        decision: input.decision,
        lastSeenAt: new Date(),
        matchedAt: input.decision === "matched" ? new Date() : undefined,
        ignoredAt: input.decision === "ignored" ? new Date() : undefined,
        failedAt: input.decision === "failed" ? new Date() : undefined,
        lastError: input.lastError ?? null,
      },
    });
  }

  private async finishSync(topCheckpointKey: string | null, lastSeenPostedAt: Date | null) {
    await this.app.prisma.sourceSyncState.update({
      where: { source_jobName: JOB_KEY },
      data: {
        status: "success",
        cursorJson: { topCheckpointKey },
        lastSeenItemKey: topCheckpointKey,
        lastSeenPostedAt,
        lastSuccessAt: new Date(),
        lastRunFinishedAt: new Date(),
      },
    });
  }
}
