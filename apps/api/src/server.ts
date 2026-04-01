import { buildApp } from './app.js';
import { registerHourlyJobs } from './lib/scheduled-jobs.js';

const BACKEND_BOOT_MARKER = 'ring-backend-bodytext-hwp-v2';

const start = async () => {
  const app = await buildApp();
  registerHourlyJobs(app);
  const host = app.config.HOST;
  const port = app.config.PORT;
  app.log.info(
    {
      marker: BACKEND_BOOT_MARKER,
      databaseUrl: app.config.DATABASE_URL,
    },
    'backend.boot.marker',
  );
  await app.listen({ host, port });
  app.log.info(`api listening on http://${host}:${port}`);
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
