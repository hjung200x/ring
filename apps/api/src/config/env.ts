import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";

const configDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(configDir, "..", "..");
const canonicalDatabasePath = resolve(apiRoot, "prisma", "dev.db");
const canonicalDatabaseUrl = `file:${canonicalDatabasePath.replace(/\\/g, "/")}`;

const normalizeDatabaseUrl = (value: string) => {
  if (!value.startsWith("file:")) {
    return canonicalDatabaseUrl;
  }

  const rawPath = value.slice(5);
  if (!rawPath) {
    return canonicalDatabaseUrl;
  }

  if (/^[A-Za-z]:\//.test(rawPath) || rawPath.startsWith('/')) {
    return `file:${rawPath.replace(/\\/g, "/")}`;
  }

  const normalizedPath = resolve(apiRoot, rawPath);
  return `file:${normalizedPath.replace(/\\/g, "/")}`;
};

const parseBooleanEnv = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  }
  return Boolean(value);
};

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default(canonicalDatabaseUrl).transform(normalizeDatabaseUrl),
  COOKIE_SECRET: z.string().default("dev-cookie-secret"),
  COOKIE_SECURE: z.preprocess(parseBooleanEnv, z.boolean()).default(false),
  CORS_ORIGIN: z.string().default("http://127.0.0.1:5173"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  SOLAPI_API_KEY: z.string().optional(),
  SOLAPI_API_SECRET: z.string().optional(),
  SOLAPI_SENDER: z.string().optional(),
  SOLAPI_RECIPIENT: z.string().optional(),
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: z.string().min(8).default("change-me-now"),
  ADMIN_NAME: z.string().default("Admin"),
  JOB_ENABLED: z.preprocess(parseBooleanEnv, z.boolean()).default(true),
  STORAGE_ROOT: z.string().default("apps/api/storage")
});
