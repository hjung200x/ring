import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { envSchema } from "./config/env.js";
import { registerAuthSession } from "./plugins/auth-session.js";
import { registerPrisma } from "./plugins/prisma.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { internalJobRoutes } from "./modules/internal-jobs/internal-jobs.routes.js";
import { interestProfileRoutes } from "./modules/interest-profiles/interest-profiles.routes.js";
import { notificationRoutes } from "./modules/notifications/notifications.routes.js";

export const buildApp = async () => {
  const app = Fastify({ logger: true });
  const config = envSchema.parse(process.env);
  app.decorate("config", config);

  await app.register(cors, { origin: config.CORS_ORIGIN, credentials: true });
  await app.register(cookie, { secret: config.COOKIE_SECRET });
  await app.register(registerPrisma);
  await app.register(registerAuthSession);

  app.get("/health", async () => ({ ok: true }));
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(interestProfileRoutes, { prefix: "/api/profiles" });
  await app.register(notificationRoutes, { prefix: "/api/notifications" });
  await app.register(internalJobRoutes, { prefix: "/internal/jobs" });

  app.get("/api/me", { preHandler: app.requireSession }, async (request) => request.currentUser);
  return app;
};

declare module "fastify" {
  interface FastifyInstance {
    config: ReturnType<typeof envSchema.parse>;
  }
}
