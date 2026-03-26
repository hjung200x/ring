export interface AttachmentCandidate {
  filename: string;
  atchDocId: string;
  atchFileId: string;
}

const rankingPatterns = [
  /공고문\.(hwp|hwpx)$/i,
  /재공고.*\.(hwp|hwpx)$/i,
  /공고.*\.(hwp|hwpx)$/i,
  /공모.*\.(hwp|hwpx)$/i,
];

export const selectPrimaryNoticeAttachment = (
  attachments: AttachmentCandidate[],
): AttachmentCandidate | null => {
  const docs = attachments.filter((item) => /\.(hwp|hwpx)$/i.test(item.filename));
  if (docs.length === 0) {
    return null;
  }

  for (const pattern of rankingPatterns) {
    const match = docs.find((item) => pattern.test(item.filename));
    if (match) {
      return match;
    }
  }

  return docs[0];
};
