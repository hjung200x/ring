import type { AnnouncementScoreResult, KeywordFilterResult } from "@ring/types";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const calculateKeywordScore = (keyword: KeywordFilterResult) => {
  const hitCount = keyword.includeHits.length;
  if (hitCount <= 0) return 0;
  if (hitCount === 1) return 0.4;
  if (hitCount === 2) return 0.7;
  return 1;
};

export const calculateAnnouncementScore = (input: {
  keyword: KeywordFilterResult;
  profileSimilarity: number | null;
  threshold: number;
}): AnnouncementScoreResult => {
  const keywordScore = calculateKeywordScore(input.keyword);
  const excludePenalty = Math.min(0.3, input.keyword.excludeHits.length * 0.12);
  const profileSimilarity = input.profileSimilarity ?? 0;
  const weightedProfileScore = 0.9 * profileSimilarity;
  const weightedKeywordScore = 0.1 * keywordScore;

  const finalScore = clamp01(weightedProfileScore + weightedKeywordScore - excludePenalty);

  return {
    ...input.keyword,
    profileSimilarity: input.profileSimilarity,
    keywordScore,
    excludePenalty,
    weightedProfileScore,
    weightedKeywordScore,
    threshold: input.threshold,
    finalScore,
    decision: finalScore >= input.threshold ? "notify" : "skip",
    scorerVersion: "v1.4.0",
  };
};
