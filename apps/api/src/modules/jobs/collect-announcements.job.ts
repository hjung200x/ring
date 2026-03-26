import type { FastifyInstance } from 'fastify';
import { CollectorService } from '../collector/collector.service.js';
import { KeitClient } from '../collector/keit.client.js';

export const collectAnnouncementsJob = async (app: FastifyInstance) => {
  const service = new CollectorService(app, new KeitClient());
  await service.syncLatest();
  app.log.info('collect-announcements job finished');
};
