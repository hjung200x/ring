import { describe, expect, it } from 'vitest';
import { calculateAnnouncementScore } from '../../modules/matching/scorer.js';

describe('matching scorer', () => {
  it('returns notify when threshold is met', () => {
    const result = calculateAnnouncementScore({
      keyword: { keywordPass: true, includeHits: ['광물자원', '재자원화', '텅스텐'], excludeHits: [] },
      profileSimilarity: 0.8,
      threshold: 0.7,
    });
    expect(result.decision).toBe('notify');
    expect(result.finalScore).toBeGreaterThanOrEqual(0.7);
  });
});
