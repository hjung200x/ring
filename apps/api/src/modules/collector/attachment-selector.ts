export interface AttachmentCandidate {
  filename: string;
  atchDocId: string;
  atchFileId: string;
}

const POSITIVE_RULES: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /재공고/i, score: 7 },
  { pattern: /산업통상부\s*공고/i, score: 6 },
  { pattern: /신규\s*지원대상/i, score: 5 },
  { pattern: /지원대상/i, score: 4 },
  { pattern: /연구개발과제/i, score: 4 },
  { pattern: /공고문/i, score: 4 },
  { pattern: /공고/i, score: 3 },
  { pattern: /공모/i, score: 2 },
];

const NEGATIVE_RULES: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /양식/i, score: -8 },
  { pattern: /신청서/i, score: -8 },
  { pattern: /매뉴얼/i, score: -8 },
  { pattern: /제도안내/i, score: -8 },
  { pattern: /안내/i, score: -4 },
  { pattern: /요청서/i, score: -8 },
  { pattern: /평가/i, score: -5 },
  { pattern: /법령/i, score: -7 },
  { pattern: /규정/i, score: -7 },
  { pattern: /품목요약서/i, score: -9 },
  { pattern: /\bRFP\b/i, score: -9 },
  { pattern: /질의응답/i, score: -7 },
  { pattern: /FAQ/i, score: -7 },
  { pattern: /명단/i, score: -10 },
];

const scoreAttachment = (filename: string) => {
  const normalized = filename.replace(/\s+/g, " ").trim();
  const extension = normalized.toLowerCase().split(".").pop() ?? "";

  if (extension === "zip") {
    return -100;
  }

  let score = 0;

  if (extension === "hwp" || extension === "hwpx") {
    score += 3;
  } else if (extension === "pdf") {
    score += 1;
  }

  for (const rule of POSITIVE_RULES) {
    if (rule.pattern.test(normalized)) {
      score += rule.score;
    }
  }

  for (const rule of NEGATIVE_RULES) {
    if (rule.pattern.test(normalized)) {
      score += rule.score;
    }
  }

  return score;
};

export const selectPrimaryNoticeAttachment = (
  attachments: AttachmentCandidate[],
): AttachmentCandidate | null => {
  const docs = attachments.filter((item) => /\.(hwp|hwpx|pdf|zip)$/i.test(item.filename));
  if (docs.length === 0) {
    return null;
  }

  const ranked = docs
    .map((item, index) => ({
      item,
      index,
      score: scoreAttachment(item.filename),
      extensionPriority: /\.(hwp|hwpx)$/i.test(item.filename) ? 2 : /\.pdf$/i.test(item.filename) ? 1 : 0,
      filenameLength: item.filename.length,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.extensionPriority !== a.extensionPriority) return b.extensionPriority - a.extensionPriority;
      if (b.filenameLength !== a.filenameLength) return b.filenameLength - a.filenameLength;
      return a.index - b.index;
    });

  const winner = ranked[0];
  if (!winner || winner.score < 0) {
    return null;
  }

  return winner.item;
};
