export const buildProfileSource = (profile: {
  name: string;
  description: string;
  includeKeywordsJson: unknown;
}) => {
  const includeKeywords = Array.isArray(profile.includeKeywordsJson)
    ? profile.includeKeywordsJson.map(String)
    : [];
  return [
    `검색조건 이름: ${profile.name}`,
    `설명: ${profile.description}`,
    includeKeywords.length ? `포함 키워드: ${includeKeywords.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");
};

export const toEmbeddingVector = (value: unknown): number[] =>
  Array.isArray(value) ? value.map(Number).filter((item) => Number.isFinite(item)) : [];
