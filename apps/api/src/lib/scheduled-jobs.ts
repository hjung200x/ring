import type { FastifyInstance } from 'fastify';
import { collectAnnouncementsJob } from '../modules/jobs/collect-announcements.job.js';
import { processDocumentsJob } from '../modules/jobs/process-documents.job.js';
import { scoreNotificationsJob } from '../modules/jobs/score-notifications.job.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const registerDailyJobs = (app: FastifyInstance) => {
  if (!app.config.JOB_ENABLED || app.config.NODE_ENV === 'test') {
    return;
  }

  const runAll = async () => {
    try {
      await collectAnnouncementsJob(app);
      await processDocumentsJob(app);
      await scoreNotificationsJob(app);
    } catch (error) {
      app.log.error(error, 'daily jobs failed');
    }
  };

  setTimeout(runAll, 5_000);
  setInterval(runAll, DAY_MS);
};
