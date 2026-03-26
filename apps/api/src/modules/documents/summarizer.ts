const sectionNames = ["사업개요", "사업목적", "지원대상", "지원내용", "신청자격"];

export const buildRuleBasedSummary = (input: {
  title: string;
  postedAt?: string | null;
  applyStartAt?: Date | null;
  applyEndAt?: Date | null;
  normalizedText: string;
}): string => {
  const sections = sectionNames
    .map((name) => {
      const index = input.normalizedText.indexOf(name);
      if (index < 0) return null;
      return input.normalizedText.slice(index, index + 300);
    })
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);

  const fallback = input.normalizedText.slice(0, 600);
  const period =
    input.applyStartAt && input.applyEndAt
      ? `${input.applyStartAt.toISOString()} ~ ${input.applyEndAt.toISOString()}`
      : null;

  return [input.title, period, ...(sections.length ? sections : [fallback])]
    .filter(Boolean)
    .join("\n\n");
};