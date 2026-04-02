import { z } from "zod";

export const loginRequestSchema = z.object({
  username: z.string().min(1).max(100),
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

export const scheduleUpdateSchema = z
  .object({
    scheduleEnabled: z.boolean(),
    scheduleUnit: z.enum(["week", "day", "hour"]),
    scheduleValue: z.coerce.number().int(),
  })
  .superRefine((value, ctx) => {
    const ranges = {
      week: [1, 7],
      day: [1, 12],
      hour: [1, 24],
    } as const;

    const [min, max] = ranges[value.scheduleUnit];
    if (value.scheduleValue < min || value.scheduleValue > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${value.scheduleUnit} must be between ${min} and ${max}`,
        path: ["scheduleValue"],
      });
    }
  });

export const adminUserCreateSchema = z.object({
  username: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
  isActive: z.boolean().optional(),
});

export const adminUserUpdateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  isActive: z.boolean(),
  password: z.string().min(8).optional(),
});

export const adminUserPasswordSchema = z.object({
  password: z.string().min(8),
});

export const smsRecipientCreateSchema = z.object({
  name: z.string().min(1).max(100),
  phoneNumber: z.string().min(1).max(30),
  enabled: z.boolean().optional(),
});

export const smsRecipientUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  phoneNumber: z.string().min(1).max(30),
  enabled: z.boolean(),
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
export type ScheduleUpdateRequest = z.infer<typeof scheduleUpdateSchema>;
export type AdminUserCreateRequest = z.infer<typeof adminUserCreateSchema>;
export type AdminUserUpdateRequest = z.infer<typeof adminUserUpdateSchema>;
export type AdminUserPasswordRequest = z.infer<typeof adminUserPasswordSchema>;
export type SmsRecipientCreateRequest = z.infer<typeof smsRecipientCreateSchema>;
export type SmsRecipientUpdateRequest = z.infer<typeof smsRecipientUpdateSchema>;
export type ManualExampleRequest = z.infer<typeof manualExampleSchema>;
export type FromAnnouncementExampleRequest = z.infer<
  typeof fromAnnouncementExampleSchema
>;
