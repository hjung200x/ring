import type { FastifyInstance } from "fastify";
import type { InterestProfileInput } from "@ring/types";

export class InterestProfilesService {
  constructor(private readonly app: FastifyInstance) {}

  async list(userId: string) {
    return this.app.prisma.interestProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { examples: true },
    });
  }

  async get(userId: string, profileId: string) {
    return this.app.prisma.interestProfile.findFirstOrThrow({
      where: { id: profileId, userId },
      include: { examples: true },
    });
  }

  async create(userId: string, input: InterestProfileInput) {
    return this.app.prisma.interestProfile.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        includeKeywordsJson: input.includeKeywords,
        excludeKeywordsJson: input.excludeKeywords,
        similarityThreshold: input.similarityThreshold,
        enabled: input.enabled ?? true,
      },
      include: { examples: true },
    });
  }

  async update(userId: string, profileId: string, input: InterestProfileInput) {
    await this.get(userId, profileId);
    return this.app.prisma.interestProfile.update({
      where: { id: profileId },
      data: {
        name: input.name,
        description: input.description,
        includeKeywordsJson: input.includeKeywords,
        excludeKeywordsJson: input.excludeKeywords,
        similarityThreshold: input.similarityThreshold,
        enabled: input.enabled ?? true,
      },
      include: { examples: true },
    });
  }

  async addManualExample(userId: string, profileId: string, title: string, text: string) {
    await this.get(userId, profileId);
    return this.app.prisma.interestExample.create({
      data: {
        profileId,
        sourceType: "manual_text",
        title,
        rawText: text,
        normalizedText: text.trim(),
      },
    });
  }

  async addExampleFromAnnouncement(userId: string, profileId: string, announcementId: string) {
    await this.get(userId, profileId);
    const document = await this.app.prisma.document.findFirstOrThrow({
      where: { announcementId, extractionStatus: "success" },
      include: { announcement: true },
    });
    return this.app.prisma.interestExample.create({
      data: {
        profileId,
        sourceType: "announcement",
        sourceRef: announcementId,
        title: document.announcement.title,
        rawText: document.rawText ?? document.normalizedText ?? "",
        normalizedText: document.normalizedText ?? "",
      },
    });
  }

  async deleteExample(userId: string, profileId: string, exampleId: string) {
    await this.get(userId, profileId);
    await this.app.prisma.interestExample.deleteMany({
      where: { id: exampleId, profileId },
    });
  }
}
