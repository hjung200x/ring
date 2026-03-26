export type InterestExampleSourceType = "announcement" | "manual_text";
export type UserScheduleUnit = "week" | "day" | "hour";

export interface InterestProfileInput {
  name: string;
  description: string;
  includeKeywords: string[];
  excludeKeywords: string[];
  similarityThreshold: number;
  enabled?: boolean;
}

export interface InterestExampleInput {
  sourceType: InterestExampleSourceType;
  title: string;
  text?: string;
  announcementId?: string;
}

export interface UserScheduleInput {
  scheduleUnit: UserScheduleUnit;
  scheduleValue: number;
}

export interface UserScheduleDto {
  scheduleUnit: UserScheduleUnit;
  scheduleValue: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface SessionUserDto {
  id: string;
  username: string;
  email: string;
  name: string;
  isAdmin: boolean;
  schedule: UserScheduleDto;
}

export interface AdminUserDto {
  id: string;
  username: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserCreateInput {
  username: string;
  email: string;
  password: string;
  name: string;
  isActive?: boolean;
}

export interface AdminUserUpdateInput {
  email: string;
  name: string;
  isActive: boolean;
  password?: string;
}

export interface AdminUserPasswordInput {
  password: string;
}

export interface NoticeExtractionResult {
  rawText: string;
  normalizedText: string;
  summaryText: string;
  docType: "hwp" | "hwpx";
}

export interface KeywordFilterResult {
  keywordPass: boolean;
  includeHits: string[];
  excludeHits: string[];
}

export interface AnnouncementScoreResult extends KeywordFilterResult {
  profileSimilarity: number | null;
  exampleMaxSimilarity: number | null;
  exampleAvgSimilarity: number | null;
  finalScore: number | null;
  decision: "skip" | "notify";
  scorerVersion: "v1.0.0";
}

export interface NotificationReason {
  includeHits: string[];
  excludeHits: string[];
  finalScore: number;
  profileSimilarity: number | null;
  exampleMaxSimilarity: number | null;
}

export interface NotificationListItemDto {
  id: string;
  title: string;
  profileName: string;
  finalScore: number;
  summary: string;
  isRead: boolean;
  createdAt: string;
  applyEndAt: string | null;
}

export interface NotificationDetailDto {
  id: string;
  title: string;
  summary: string;
  reason: NotificationReason;
  source: {
    detailUrl: string;
    postedAt: string | null;
    applyStartAt: string | null;
    applyEndAt: string | null;
  };
}
