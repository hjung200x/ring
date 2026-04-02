import { statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { registerHourlyJobs } from "./lib/scheduled-jobs.js";

const BACKEND_BOOT_MARKER = "ring-backend-bodytext-hwp-v5";
const SOURCE_FINGERPRINT = "ring-source-2026-04-02-c";
const serverModulePath = fileURLToPath(import.meta.url);
const serverModuleMtime = statSync(serverModulePath).mtime.toISOString();
const apiRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const start = async () => {
  const app = await buildApp();
  registerHourlyJobs(app);
  const host = app.config.HOST;
  const port = app.config.PORT;
  app.log.info(
    {
      marker: BACKEND_BOOT_MARKER,
      sourceFingerprint: SOURCE_FINGERPRINT,
      databaseUrl: app.config.DATABASE_URL,
      serverModulePath,
      serverModuleMtime,
      apiRoot,
    },
    "backend.boot.marker",
  );
  await app.listen({ host, port });
  app.log.info(`api listening on http://${host}:${port}`);
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
