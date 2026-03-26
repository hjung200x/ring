import type { FastifyInstance } from "fastify";
import { buildEmbeddingSource } from "../documents/normalizer.js";
import { EmbeddingsService } from "../embeddings/embeddings.service.js";
import { runKeywordFilter } from "../matching/keyword-filter.js";
import { calculateAnnouncementScore } from "../matching/scorer.js";

const buildProfileSource = (profile: {
  name: string;
  description: string;
  includeKeywordsJson: unknown;
}) => {
  const includeKeywords = Array.isArray(profile.includeKeywordsJson)
    ? profile.includeKeywordsJson.map(String)
    : [];
  return [
    `\uAC80\uC0C9\uC870\uAC74 \uC774\uB984: ${profile.name}`,
    `\uC124\uBA85: ${profile.description}`,
    includeKeywords.length ? `\uD3EC\uD568 \uD0A4\uC6CC\uB4DC: ${includeKeywords.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

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
    include: { user: true, examples: true },
  });

  for (const document of documents) {
    const sourceText = buildEmbeddingSource({
      title: document.announcement.title,
      applyPeriodText:
        document.announcement.applyStartAt && document.announcement.applyEndAt
          ? `${document.announcement.applyStartAt.toISOString()} ~ ${document.announcement.applyEndAt.toISOString()}`
          : null,
      normalizedText: document.normalizedText ?? "",
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
        text: document.normalizedText ?? "",
        includeKeywords,
        excludeKeywords,
      });

      if (!keyword.keywordPass) {
        continue;
      }

      const profileEmbedding = await embeddings.embedText(buildProfileSource(profile));
      const profileSimilarity = embeddings.cosineSimilarity(announcementEmbedding, profileEmbedding);

      const exampleSimilarities: number[] = [];
      for (const example of profile.examples) {
        const exampleEmbedding = await embeddings.embedText(example.normalizedText);
        exampleSimilarities.push(embeddings.cosineSimilarity(announcementEmbedding, exampleEmbedding));
      }

      const result = calculateAnnouncementScore({
        keyword,
        profileSimilarity,
        exampleSimilarities,
        threshold: Number(profile.similarityThreshold),
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
          exampleMaxSimilarity: result.exampleMaxSimilarity,
          exampleAvgSimilarity: result.exampleAvgSimilarity,
          finalScore: result.finalScore,
        },
        create: {
          announcementId: document.announcementId,
          profileId: profile.id,
          keywordPass: result.keywordPass,
          keywordHitsJson: result.includeHits,
          excludeHitsJson: result.excludeHits,
          profileSimilarity: result.profileSimilarity,
          exampleMaxSimilarity: result.exampleMaxSimilarity,
          exampleAvgSimilarity: result.exampleAvgSimilarity,
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
            exampleMaxSimilarity: result.exampleMaxSimilarity,
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
            exampleMaxSimilarity: result.exampleMaxSimilarity,
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
