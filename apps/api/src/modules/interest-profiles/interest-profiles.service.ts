import type { FastifyInstance } from "fastify";
import type { InterestProfileInput } from "@ring/types";
import { EmbeddingsService } from "../embeddings/embeddings.service.js";
import { buildProfileSource } from "../matching/profile-source.js";

const MAX_DEFAULT_THRESHOLD = 0.6;
const normalizeThreshold = (value: number) => Math.min(value, MAX_DEFAULT_THRESHOLD);
const withNormalizedThreshold = <T extends { similarityThreshold: number }>(profile: T): T => ({
  ...profile,
  similarityThreshold: normalizeThreshold(Number(profile.similarityThreshold)),
});

export class InterestProfilesService {
  constructor(private readonly app: FastifyInstance) {}

  private async syncProfileEmbedding(profile: {
    id: string;
    name: string;
    description: string;
    includeKeywordsJson: unknown;
  }) {
    if (!this.app.config.OPENAI_API_KEY) {
      return;
    }

    const embeddings = new EmbeddingsService(this.app);
    const sourceText = buildProfileSource(profile);
    const embedding = await embeddings.embedText(sourceText);

    await this.app.prisma.profileEmbedding.upsert({
      where: { profileId: profile.id },
      update: {
        embeddingModel: this.app.config.OPENAI_EMBEDDING_MODEL,
        sourceText,
        embeddingJson: embedding,
      },
      create: {
        profileId: profile.id,
        embeddingModel: this.app.config.OPENAI_EMBEDDING_MODEL,
        sourceText,
        embeddingJson: embedding,
      },
    });
  }

  async list(userId: string) {
    const profiles = await this.app.prisma.interestProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return profiles.map(withNormalizedThreshold);
  }

  async get(userId: string, profileId: string) {
    const profile = await this.app.prisma.interestProfile.findFirstOrThrow({
      where: { id: profileId, userId },
    });
    return withNormalizedThreshold(profile);
  }

  async create(userId: string, input: InterestProfileInput) {
    const profile = await this.app.prisma.interestProfile.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        includeKeywordsJson: input.includeKeywords,
        excludeKeywordsJson: input.excludeKeywords,
        similarityThreshold: normalizeThreshold(input.similarityThreshold),
        enabled: input.enabled ?? true,
      },
    });
    await this.syncProfileEmbedding(profile);
    return withNormalizedThreshold(profile);
  }

  async update(userId: string, profileId: string, input: InterestProfileInput) {
    await this.get(userId, profileId);
    const profile = await this.app.prisma.interestProfile.update({
      where: { id: profileId },
      data: {
        name: input.name,
        description: input.description,
        includeKeywordsJson: input.includeKeywords,
        excludeKeywordsJson: input.excludeKeywords,
        similarityThreshold: normalizeThreshold(input.similarityThreshold),
        enabled: input.enabled ?? true,
      },
    });
    await this.syncProfileEmbedding(profile);
    return withNormalizedThreshold(profile);
  }

  async delete(userId: string, profileId: string) {
    await this.get(userId, profileId);
    await this.app.prisma.interestProfile.delete({
      where: { id: profileId },
    });
  }
}
