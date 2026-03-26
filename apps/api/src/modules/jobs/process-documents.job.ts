import { writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import type { FastifyInstance } from "fastify";
import { ensureStoragePath } from "../../config/paths.js";
import { KeitClient } from "../collector/keit.client.js";
import { extractNotice } from "../documents/extractor-bridge.js";
import { normalizeNoticeText } from "../documents/normalizer.js";
import { buildRuleBasedSummary } from "../documents/summarizer.js";

const safeFilename = (value: string) => value.replace(/[\\/:*?"<>|]/g, "_");

const upsertDocument = (
  app: FastifyInstance,
  attachmentId: string,
  data: {
    announcementId: string;
    docType: string;
    extractionStatus: string;
    extractionError?: string | null;
    rawText?: string | null;
    normalizedText?: string | null;
    summaryText?: string | null;
    textHash?: string | null;
  },
) =>
  app.prisma.document.upsert({
    where: { attachmentId },
    create: {
      attachmentId,
      ...data,
    },
    update: data,
  });

export const processDocumentsJob = async (app: FastifyInstance) => {
  const client = new KeitClient();
  const attachments = await app.prisma.attachment.findMany({
    where: { isPrimaryNoticeDoc: true },
    include: { announcement: true },
    take: 20,
  });

  const scriptsRoot = resolve(process.cwd(), "scripts");
  const extractScript = resolve(scriptsRoot, "extract_notice.py");

  for (const attachment of attachments) {
    const extension = extname(attachment.filename).toLowerCase().replace(".", "");
    if (extension !== "hwp" && extension !== "hwpx") {
      await upsertDocument(app, attachment.id, {
        announcementId: attachment.announcementId,
        docType: extension || "unknown",
        extractionStatus: "failed",
        extractionError: `unsupported extension: ${extension}`,
        rawText: null,
        normalizedText: null,
        summaryText: null,
        textHash: null,
      });
      continue;
    }

    try {
      const buffer = await client.downloadAttachment(attachment.atchDocId, attachment.atchFileId);
      const dir = ensureStoragePath(app.config.STORAGE_ROOT, "attachments", attachment.announcementId);
      const localPath = resolve(dir, safeFilename(attachment.filename));
      await writeFile(localPath, buffer);

      await app.prisma.attachment.update({
        where: { id: attachment.id },
        data: { localPath, downloadedAt: new Date() },
      });

      const extracted = await extractNotice(extractScript, localPath, extension);
      const normalizedText = normalizeNoticeText(extracted.normalizedText);
      const summaryText = buildRuleBasedSummary({
        title: attachment.announcement.title,
        postedAt: attachment.announcement.postedAt?.toISOString().slice(0, 10) ?? null,
        applyStartAt: attachment.announcement.applyStartAt,
        applyEndAt: attachment.announcement.applyEndAt,
        normalizedText,
      });

      await upsertDocument(app, attachment.id, {
        announcementId: attachment.announcementId,
        docType: extension,
        extractionStatus: "success",
        extractionError: null,
        rawText: extracted.rawText,
        normalizedText,
        summaryText,
        textHash: `${normalizedText.length}`,
      });
    } catch (error) {
      await upsertDocument(app, attachment.id, {
        announcementId: attachment.announcementId,
        docType: extension,
        extractionStatus: "failed",
        extractionError: error instanceof Error ? error.message : String(error),
        rawText: null,
        normalizedText: null,
        summaryText: null,
        textHash: null,
      });
    }
  }

  app.log.info({ count: attachments.length }, "process-documents job finished");
};

