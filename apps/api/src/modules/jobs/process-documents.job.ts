import { createHash } from "node:crypto";
import { statSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import { ensureStoragePath } from "../../config/paths.js";
import { KeitClient } from "../collector/keit.client.js";
import { extractNotice } from "../documents/extractor-bridge.js";
import { normalizeNoticeText } from "../documents/normalizer.js";
import { buildRuleBasedSummary } from "../documents/summarizer.js";

const EXTRACTOR_MARKER = "ring-extractor-bodytext-hwp-v2";
const apiRoot = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const PREVIEW_LIMIT = 240;
const preview = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim().slice(0, PREVIEW_LIMIT);
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

  const scriptsRoot = resolve(apiRoot, "scripts");
  const extractScript = resolve(scriptsRoot, "extract_notice.py");
  const scriptMtime = statSync(extractScript).mtime.toISOString();

  app.log.info(
    {
      marker: EXTRACTOR_MARKER,
      extractScript,
      scriptMtime,
      attachmentCount: attachments.length,
    },
    "process-documents.extractor.marker",
  );

  for (const attachment of attachments) {
    const extension = extname(attachment.filename).toLowerCase().replace(".", "");
    app.log.info(
      {
        announcementTitle: attachment.announcement.title,
        attachmentId: attachment.id,
        filename: attachment.filename,
        atchDocId: attachment.atchDocId,
        atchFileId: attachment.atchFileId,
        existingLocalPath: attachment.localPath,
      },
      "process-documents.attachment.start",
    );
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

      app.log.info(
        {
          announcementTitle: attachment.announcement.title,
          attachmentId: attachment.id,
          filename: attachment.filename,
          atchDocId: attachment.atchDocId,
          atchFileId: attachment.atchFileId,
          byteLength: buffer.length,
          sha1: createHash("sha1").update(buffer).digest("hex"),
          localPath,
        },
        "process-documents.attachment.downloaded",
      );

      await app.prisma.attachment.update({
        where: { id: attachment.id },
        data: { localPath, downloadedAt: new Date() },
      });

      const extracted = await extractNotice(extractScript, localPath, extension);
      app.log.info(
        {
          announcementTitle: attachment.announcement.title,
          attachmentId: attachment.id,
          filename: attachment.filename,
          rawTextPreview: preview(extracted.rawText),
          summaryPreview: preview(extracted.summaryText),
        },
        "process-documents.attachment.extracted",
      );
      const normalizedText = normalizeNoticeText(extracted.normalizedText);
      const extractedSummary = normalizeNoticeText(extracted.summaryText ?? "");
      const fallbackSummary = buildRuleBasedSummary({
        title: attachment.announcement.title,
        postedAt: attachment.announcement.postedAt?.toISOString().slice(0, 10) ?? null,
        applyStartAt: attachment.announcement.applyStartAt,
        applyEndAt: attachment.announcement.applyEndAt,
        normalizedText,
      });
      const summaryText = extractedSummary || fallbackSummary;

      app.log.info(
        {
          announcementTitle: attachment.announcement.title,
          attachmentId: attachment.id,
          filename: attachment.filename,
          normalizedPreview: preview(normalizedText),
          finalSummaryPreview: preview(summaryText),
        },
        "process-documents.attachment.finalized",
      );

      await upsertDocument(app, attachment.id, {
        announcementId: attachment.announcementId,
        docType: extension,
        extractionStatus: "success",
        extractionError: null,
        rawText: extracted.rawText,
        normalizedText,
        summaryText,
        textHash: `${summaryText.length}:${normalizedText.length}`,
      });
    } catch (error) {
      app.log.warn(
        {
          announcementTitle: attachment.announcement.title,
          attachmentId: attachment.id,
          filename: attachment.filename,
          atchDocId: attachment.atchDocId,
          atchFileId: attachment.atchFileId,
          message: error instanceof Error ? error.message : String(error),
        },
        "process-documents.attachment.failed",
      );
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
