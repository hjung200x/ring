import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const profileUpsertSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  includeKeywords: z.array(z.string().min(1)).default([]),
  excludeKeywords: z.array(z.string().min(1)).default([]),
  similarityThreshold: z.number().min(0).max(1),
  enabled: z.boolean().optional(),
});

export const manualExampleSchema = z.object({
  title: z.string().min(1).max(255),
  text: z.string().min(1),
});

export const fromAnnouncementExampleSchema = z.object({
  announcementId: z.string().uuid(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type ProfileUpsertRequest = z.infer<typeof profileUpsertSchema>;
export type ManualExampleRequest = z.infer<typeof manualExampleSchema>;
export type FromAnnouncementExampleRequest = z.infer<
  typeof fromAnnouncementExampleSchema
>;
