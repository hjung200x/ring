export const normalizeNoticeText = (rawText: string): string =>
  rawText
    .replace(/\r/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

export const buildEmbeddingSource = (input: {
  title: string;
  applyPeriodText?: string | null;
  normalizedText: string;
}): string => {
  const excerpt = input.normalizedText.slice(0, 8000);
  return [
    `제목: ${input.title}`,
    input.applyPeriodText ? `접수기간: ${input.applyPeriodText}` : null,
    '본문:',
    excerpt,
  ]
    .filter(Boolean)
    .join("\n");
};
