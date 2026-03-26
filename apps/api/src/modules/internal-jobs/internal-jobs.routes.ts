import type { FastifyPluginAsync } from "fastify";
import { collectAnnouncementsJob } from "../jobs/collect-announcements.job.js";
import { processDocumentsJob } from "../jobs/process-documents.job.js";
import { scoreNotificationsJob } from "../jobs/score-notifications.job.js";

export const internalJobRoutes: FastifyPluginAsync = async (app) => {
  app.post("/collect-announcements", async (_request, reply) => {
    await collectAnnouncementsJob(app);
    return reply.status(202).send();
  });

  app.post("/process-documents", async (_request, reply) => {
    await processDocumentsJob(app);
    return reply.status(202).send();
  });

  app.post("/score-notifications", async (_request, reply) => {
    await scoreNotificationsJob(app);
    return reply.status(202).send();
  });
};
