import { buildApp } from './app.js';
import { registerDailyJobs } from './lib/scheduled-jobs.js';

const start = async () => {
  const app = await buildApp();
  registerDailyJobs(app);
  const host = app.config.HOST;
  const port = app.config.PORT;
  await app.listen({ host, port });
  app.log.info(`api listening on http://${host}:${port}`);
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
