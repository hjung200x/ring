# Matching Flow V1

## Processing Flow
1. Extract raw text from primary notice file.
2. Normalize text.
3. Build rule-based summary.
4. Build announcement embedding source text.
5. Generate announcement embedding.
6. For each enabled interest profile, run keyword prefilter.
7. If prefilter passes, compare against profile embedding.
8. Compare against positive example embeddings.
9. Calculate final score.
10. If score >= threshold, create notification.

## Recommended Formula
```text
keywordBoost = min(0.1, includeHits * 0.03)
excludePenalty = min(0.2, excludeHits * 0.08)

finalScore =
  0.40 * profileSimilarity +
  0.45 * exampleMaxSimilarity +
  0.15 * exampleAvgSimilarity +
  keywordBoost -
  excludePenalty
```

## Fallback
If no examples exist, reuse profile similarity for example fallback.
