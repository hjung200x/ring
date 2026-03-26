import type { KeywordFilterResult } from "@ring/types";

export const runKeywordFilter = (input: {
  title: string;
  filename?: string | null;
  text: string;
  includeKeywords: string[];
  excludeKeywords: string[];
}): KeywordFilterResult => {
  const corpus = [input.title, input.filename ?? "", input.text].join("\n");
  const includeHits = input.includeKeywords.filter((keyword) => corpus.includes(keyword));
  const excludeHits = input.excludeKeywords.filter((keyword) => corpus.includes(keyword));

  return {
    keywordPass: includeHits.length > 0,
    includeHits,
    excludeHits,
  };
};
