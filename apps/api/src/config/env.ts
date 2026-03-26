import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default("file:C:/proj/ring/apps/api/prisma/dev.db"),
  COOKIE_SECRET: z.string().default("dev-cookie-secret"),
  CORS_ORIGIN: z.string().default("http://127.0.0.1:5173"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: z.string().min(8).default("change-me-now"),
  ADMIN_NAME: z.string().default("Admin"),
  JOB_ENABLED: z.coerce.boolean().default(true),
  STORAGE_ROOT: z.string().default("apps/api/storage")
});

