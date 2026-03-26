import type { FastifyInstance } from "fastify";
import type { NotificationDetailDto, NotificationListItemDto, NotificationReason } from "@ring/types";

export class NotificationsService {
  constructor(private readonly app: FastifyInstance) {}

  async list(userId: string, isRead?: boolean): Promise<NotificationListItemDto[]> {
    const rows = await this.app.prisma.notification.findMany({
      where: {
        userId,
        ...(isRead === undefined ? {} : { isRead }),
      },
      include: {
        profile: true,
        announcement: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row: (typeof rows)[number]) => ({
      id: row.id,
      title: row.title,
      profileName: row.profile.name,
      finalScore: Number((row.reasonJson as Record<string, number>).finalScore ?? 0),
      summary: row.summary,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
      applyEndAt: row.announcement.applyEndAt?.toISOString() ?? null,
    }));
  }

  async detail(userId: string, notificationId: string): Promise<NotificationDetailDto> {
    const row = await this.app.prisma.notification.findFirstOrThrow({
      where: { id: notificationId, userId },
      include: { announcement: true },
    });

    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      reason: row.reasonJson as unknown as NotificationReason,
      source: {
        detailUrl: row.announcement.detailUrl,
        postedAt: row.announcement.postedAt?.toISOString().slice(0, 10) ?? null,
        applyStartAt: row.announcement.applyStartAt?.toISOString() ?? null,
        applyEndAt: row.announcement.applyEndAt?.toISOString() ?? null,
      },
    };
  }

  async markRead(userId: string, notificationId: string) {
    await this.app.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
