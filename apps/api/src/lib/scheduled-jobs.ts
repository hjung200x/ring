import type { FastifyInstance } from 'fastify';
import { getSharedOwnerId } from './shared-scope.js';
import { collectAnnouncementsJob } from '../modules/jobs/collect-announcements.job.js';
import { processDocumentsJob } from '../modules/jobs/process-documents.job.js';
import { scoreNotificationsJob } from '../modules/jobs/score-notifications.job.js';
import { calculateNextRunAt } from './user-schedule.js';

const HOUR_MS = 60 * 60 * 1000;

export const runScheduledPipelineForUsers = async (
  app: FastifyInstance,
  _userIds: string[],
  reason: string,
) => {
  const sharedOwnerId = await getSharedOwnerId(app);

  app.log.info({ reason, sharedOwnerId }, 'scheduled pipeline started');
  await collectAnnouncementsJob(app);
  await processDocumentsJob(app);
  await scoreNotificationsJob(app, { userIds: [sharedOwnerId] });

  const sharedOwner = await app.prisma.user.findUniqueOrThrow({
    where: { id: sharedOwnerId },
    select: { id: true, scheduleEnabled: true, scheduleUnit: true, scheduleValue: true },
  });

  const now = new Date();
  await app.prisma.user.update({
    where: { id: sharedOwner.id },
    data: {
      lastRunAt: now,
      nextRunAt: sharedOwner.scheduleEnabled
        ? calculateNextRunAt(sharedOwner.scheduleUnit as 'week' | 'day' | 'hour', sharedOwner.scheduleValue, now)
        : null,
    },
  });

  app.log.info({ reason, sharedOwnerId }, 'scheduled pipeline finished');
};

export const registerHourlyJobs = (app: FastifyInstance) => {
  if (!app.config.JOB_ENABLED || app.config.NODE_ENV === 'test') {
    return;
  }

  const tick = async () => {
    try {
      const sharedOwnerId = await getSharedOwnerId(app);
      const now = new Date();
      const dueOwner = await app.prisma.user.findFirst({
        where: {
          id: sharedOwnerId,
          isActive: true,
          scheduleEnabled: true,
          profiles: { some: { enabled: true } },
          OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }],
        },
        select: { id: true },
      });

      if (!dueOwner) {
        return;
      }

      await runScheduledPipelineForUsers(app, [sharedOwnerId], 'hourly-tick');
    } catch (error) {
      app.log.error(error, 'hourly jobs failed');
    }
  };

  setTimeout(tick, 5_000);
  setInterval(tick, HOUR_MS);
};
