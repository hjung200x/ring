import { describe, expect, it } from 'vitest';
import { selectPrimaryNoticeAttachment } from '../../modules/collector/attachment-selector.js';

describe('attachment selector', () => {
  it('prefers gonggomun over zip attachments', () => {
    const result = selectPrimaryNoticeAttachment([
      { filename: '붙임.zip', atchDocId: '1', atchFileId: '1' },
      { filename: '2026년도 공고문.hwp', atchDocId: '2', atchFileId: '2' },
    ]);
    expect(result?.filename).toBe('2026년도 공고문.hwp');
  });
});
