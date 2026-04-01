import type { FastifyInstance } from "fastify";
import type { InterestProfileInput } from "@ring/types";

const MAX_DEFAULT_THRESHOLD = 0.7;
const normalizeThreshold = (value: number) => Math.min(value, MAX_DEFAULT_THRESHOLD);
const withNormalizedThreshold = <T extends { similarityThreshold: number }>(profile: T): T => ({
  ...profile,
  similarityThreshold: normalizeThreshold(Number(profile.similarityThreshold)),
});

export class InterestProfilesService {
  constructor(private readonly app: FastifyInstance) {}

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
    return withNormalizedThreshold(profile);
  }

  async delete(userId: string, profileId: string) {
    await this.get(userId, profileId);
    await this.app.prisma.interestProfile.delete({
      where: { id: profileId },
    });
  }
}
