import type { FastifyInstance } from "fastify";
import { buildEmbeddingSource } from "../documents/normalizer.js";
import { EmbeddingsService } from "../embeddings/embeddings.service.js";
import { runKeywordFilter } from "../matching/keyword-filter.js";
import { buildProfileSource, toEmbeddingVector } from "../matching/profile-source.js";
import { calculateAnnouncementScore } from "../matching/scorer.js";

export const scoreNotificationsJob = async (
  app: FastifyInstance,
  options?: { userIds?: string[] },
) => {
  if (!app.config.OPENAI_API_KEY) {
    app.log.warn("OPENAI_API_KEY is missing; skipping score-notifications job");
    return;
  }

  const embeddings = new EmbeddingsService(app);
  const documents = await app.prisma.document.findMany({
    where: { extractionStatus: "success" },
    include: {
      announcement: true,
      attachment: true,
    },
    take: 20,
  });
  const profiles = await app.prisma.interestProfile.findMany({
    where: {
      enabled: true,
      ...(options?.userIds?.length ? { userId: { in: options.userIds } } : {}),
    },
    include: { user: true, profileEmbedding: true },
  });

  for (const document of documents) {
    const embeddingBody = document.summaryText?.trim() || (document.normalizedText ?? "");
    const sourceText = buildEmbeddingSource({
      title: document.announcement.title,
      applyPeriodText:
        document.announcement.applyStartAt && document.announcement.applyEndAt
          ? `${document.announcement.applyStartAt.toISOString()} ~ ${document.announcement.applyEndAt.toISOString()}`
          : null,
      normalizedText: embeddingBody,
    });

    const announcementEmbedding = await embeddings.embedText(sourceText);

    for (const profile of profiles) {
      const includeKeywords = Array.isArray(profile.includeKeywordsJson)
        ? profile.includeKeywordsJson.map(String)
        : [];
      const excludeKeywords = Array.isArray(profile.excludeKeywordsJson)
        ? profile.excludeKeywordsJson.map(String)
        : [];

      const keyword = runKeywordFilter({
        title: document.announcement.title,
        filename: document.attachment.filename,
        text: `${document.summaryText ?? ""}\n${document.normalizedText ?? ""}`,
        includeKeywords,
        excludeKeywords,
      });

      if (!keyword.keywordPass) {
        continue;
      }

      const profileSource = buildProfileSource(profile);
      const profileEmbedding =
        profile.profileEmbedding &&
        profile.profileEmbedding.embeddingModel === app.config.OPENAI_EMBEDDING_MODEL &&
        profile.profileEmbedding.sourceText === profileSource
          ? toEmbeddingVector(profile.profileEmbedding.embeddingJson)
          : await (async () => {
              const embedding = await embeddings.embedText(profileSource);
              await app.prisma.profileEmbedding.upsert({
                where: { profileId: profile.id },
                update: {
                  embeddingModel: app.config.OPENAI_EMBEDDING_MODEL,
                  sourceText: profileSource,
                  embeddingJson: embedding,
                },
                create: {
                  profileId: profile.id,
                  embeddingModel: app.config.OPENAI_EMBEDDING_MODEL,
                  sourceText: profileSource,
                  embeddingJson: embedding,
                },
              });
              return embedding;
            })();
      const profileSimilarity = embeddings.cosineSimilarity(announcementEmbedding, profileEmbedding);

      const result = calculateAnnouncementScore({
        keyword,
        profileSimilarity,
        threshold: Math.min(Number(profile.similarityThreshold), 0.7),
      });

      const score = await app.prisma.score.upsert({
        where: {
          profileId_announcementId_scorerVersion: {
            profileId: profile.id,
            announcementId: document.announcementId,
            scorerVersion: result.scorerVersion,
          },
        },
        update: {
          keywordPass: result.keywordPass,
          keywordHitsJson: result.includeHits,
          excludeHitsJson: result.excludeHits,
          profileSimilarity: result.profileSimilarity,
          exampleMaxSimilarity: null,
          exampleAvgSimilarity: null,
          finalScore: result.finalScore,
        },
        create: {
          announcementId: document.announcementId,
          profileId: profile.id,
          keywordPass: result.keywordPass,
          keywordHitsJson: result.includeHits,
          excludeHitsJson: result.excludeHits,
          profileSimilarity: result.profileSimilarity,
          exampleMaxSimilarity: null,
          exampleAvgSimilarity: null,
          finalScore: result.finalScore,
          scorerVersion: result.scorerVersion,
        },
      });

      if (result.decision !== "notify" || result.finalScore === null) {
        continue;
      }

      const dedupeKey = `${profile.userId}:${profile.id}:${document.announcementId}:${result.scorerVersion}`;
      await app.prisma.notification.upsert({
        where: { dedupeKey },
        update: {
          summary: document.summaryText ?? document.normalizedText?.slice(0, 600) ?? "",
          reasonJson: {
            includeHits: result.includeHits,
            excludeHits: result.excludeHits,
            finalScore: result.finalScore,
            profileSimilarity: result.profileSimilarity,
          },
        },
        create: {
          userId: profile.userId,
          profileId: profile.id,
          announcementId: document.announcementId,
          scoreId: score.id,
          title: document.announcement.title,
          summary: document.summaryText ?? document.normalizedText?.slice(0, 600) ?? "",
          reasonJson: {
            includeHits: result.includeHits,
            excludeHits: result.excludeHits,
            finalScore: result.finalScore,
            profileSimilarity: result.profileSimilarity,
          },
          dedupeKey,
        },
      });
    }
  }

  app.log.info(
    { documents: documents.length, profiles: profiles.length, filteredUsers: options?.userIds?.length ?? 0 },
    "score-notifications job finished",
  );
};
