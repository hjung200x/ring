import { describe, expect, it } from 'vitest';
import { calculateAnnouncementScore } from '../../modules/matching/scorer.js';

describe('matching scorer', () => {
  it('returns notify when threshold is met', () => {
    const result = calculateAnnouncementScore({
      keyword: { keywordPass: true, includeHits: ['광물자원'], excludeHits: [] },
      profileSimilarity: 0.8,
      exampleSimilarities: [0.84, 0.82],
      threshold: 0.82,
    });
    expect(result.decision).toBe('notify');
    expect(result.finalScore).toBeGreaterThanOrEqual(0.82);
  });
});
