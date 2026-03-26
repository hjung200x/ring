import type { AnnouncementScoreResult, KeywordFilterResult } from "@ring/types";

const average = (values: number[]) =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

export const calculateAnnouncementScore = (input: {
  keyword: KeywordFilterResult;
  profileSimilarity: number | null;
  exampleSimilarities: number[];
  threshold: number;
}): AnnouncementScoreResult => {
  const keywordBoost = Math.min(0.1, input.keyword.includeHits.length * 0.03);
  const excludePenalty = Math.min(0.2, input.keyword.excludeHits.length * 0.08);
  const exampleMax =
    input.exampleSimilarities.length === 0 ? null : Math.max(...input.exampleSimilarities);
  const exampleAverage = average(input.exampleSimilarities);
  const fallback = input.profileSimilarity ?? 0;
  const finalScore =
    0.4 * fallback +
    0.45 * (exampleMax ?? fallback) +
    0.15 * (exampleAverage ?? fallback) +
    keywordBoost -
    excludePenalty;

  return {
    ...input.keyword,
    profileSimilarity: input.profileSimilarity,
    exampleMaxSimilarity: exampleMax,
    exampleAvgSimilarity: exampleAverage,
    finalScore,
    decision: finalScore >= input.threshold ? "notify" : "skip",
    scorerVersion: "v1.0.0",
  };
};
