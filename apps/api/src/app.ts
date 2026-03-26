import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { adminUserPasswordSchema, scheduleUpdateSchema } from "@ring/schemas";
import type { SessionUserDto } from "@ring/types";
import { hashPassword } from "./modules/auth/password.js";
import { envSchema } from "./config/env.js";
import { getSharedOwnerId } from "./lib/shared-scope.js";
import { runScheduledPipelineForUsers } from "./lib/scheduled-jobs.js";
import { adminUsersRoutes } from "./modules/admin-users/admin-users.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { internalJobRoutes } from "./modules/internal-jobs/internal-jobs.routes.js";
import { interestProfileRoutes } from "./modules/interest-profiles/interest-profiles.routes.js";
import { notificationRoutes } from "./modules/notifications/notifications.routes.js";
import { registerAuthSession } from "./plugins/auth-session.js";
import { registerPrisma } from "./plugins/prisma.js";

export const buildApp = async () => {
  const app = Fastify({ logger: true });
  const config = envSchema.parse(process.env);
  app.decorate("config", config);

  app.setErrorHandler((error, request, reply) => {
    const appError = error as Error & { statusCode?: number };
    const statusCode = Number(appError.statusCode ?? 500);
    const logPayload = {
      method: request.method,
      path: request.url,
      statusCode,
      userId: request.currentUser?.id ?? null,
      message: appError.message,
      stack: statusCode >= 500 ? appError.stack : undefined,
    };

    if (statusCode >= 500) {
      app.log.error(logPayload, "request.failed");
    } else {
      app.log.warn(logPayload, "request.failed");
    }

    if (!reply.sent) {
      void reply.status(statusCode).send({ error: appError.message });
    }
  });

  await app.register(cors, { origin: config.CORS_ORIGIN, credentials: true });
  await app.register(cookie, { secret: config.COOKIE_SECRET });
  await app.register(registerPrisma);
  await app.register(registerAuthSession);

  app.get("/health", async () => ({ ok: true }));
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(adminUsersRoutes, { prefix: "/api/admin/users" });
  await app.register(interestProfileRoutes, { prefix: "/api/profiles" });
  await app.register(notificationRoutes, { prefix: "/api/notifications" });
  await app.register(internalJobRoutes, { prefix: "/internal/jobs" });

  app.get("/api/me", { preHandler: app.requireSession }, async (request) => {
    const user = await app.prisma.user.findUniqueOrThrow({
      where: { id: request.currentUser!.id },
    });
    const sharedOwnerId = await getSharedOwnerId(app);
    const sharedOwner = await app.prisma.user.findUniqueOrThrow({
      where: { id: sharedOwnerId },
      select: { scheduleUnit: true, scheduleValue: true, lastRunAt: true, nextRunAt: true },
    });

    const resolvedUsername = user.username ?? user.email;
    const response: SessionUserDto = {
      id: user.id,
      username: resolvedUsername,
      email: user.email,
      name: user.name,
      isAdmin: resolvedUsername === app.config.ADMIN_USERNAME,
      schedule: {
        scheduleUnit: sharedOwner.scheduleUnit as "week" | "day" | "hour",
        scheduleValue: sharedOwner.scheduleValue,
        lastRunAt: sharedOwner.lastRunAt?.toISOString() ?? null,
        nextRunAt: sharedOwner.nextRunAt?.toISOString() ?? null,
      },
    };

    app.log.info({ userId: user.id }, "auth.me.succeeded");
    return response;
  });

  app.patch("/api/me/schedule", { preHandler: app.requireSession }, async (request, reply) => {
    const payload = scheduleUpdateSchema.parse(request.body);
    const sharedOwnerId = await getSharedOwnerId(app);
    app.log.info(
      {
        userId: request.currentUser!.id,
        sharedOwnerId,
        scheduleUnit: payload.scheduleUnit,
        scheduleValue: payload.scheduleValue,
      },
      "schedule.update.requested"
    );
    await app.prisma.user.update({
      where: { id: sharedOwnerId },
      data: {
        scheduleUnit: payload.scheduleUnit,
        scheduleValue: payload.scheduleValue,
        nextRunAt: new Date(),
      },
    });

    void runScheduledPipelineForUsers(app, [sharedOwnerId], "schedule-updated");
    app.log.info({ userId: request.currentUser!.id, sharedOwnerId }, "schedule.update.succeeded");
    return reply.status(204).send();
  });

  app.patch('/api/me/password', { preHandler: app.requireSession }, async (request, reply) => {
    const payload = adminUserPasswordSchema.parse(request.body);
    await app.prisma.user.update({
      where: { id: request.currentUser!.id },
      data: { passwordHash: hashPassword(payload.password) },
    });
    await app.prisma.authSession.deleteMany({ where: { userId: request.currentUser!.id } });
    app.clearSessionCookie(reply);
    return reply.status(204).send();
  });

  return app;
};

declare module "fastify" {
  interface FastifyInstance {
    config: ReturnType<typeof envSchema.parse>;
  }
}
