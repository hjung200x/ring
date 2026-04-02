import { createWriteStream, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { SolapiMessageService } from "solapi";
import { adminUserPasswordSchema, scheduleUpdateSchema } from "@ring/schemas";
import type { SessionUserDto } from "@ring/types";
import { z } from "zod";
import { hashPassword } from "./modules/auth/password.js";
import { envSchema } from "./config/env.js";
import { getSharedOwnerId } from "./lib/shared-scope.js";
import { runScheduledPipelineForUsers } from "./lib/scheduled-jobs.js";
import { adminUsersRoutes } from "./modules/admin-users/admin-users.routes.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { internalJobRoutes } from "./modules/internal-jobs/internal-jobs.routes.js";
import { interestProfileRoutes } from "./modules/interest-profiles/interest-profiles.routes.js";
import { notificationRoutes } from "./modules/notifications/notifications.routes.js";
import { smsRecipientsRoutes } from "./modules/sms-recipients/sms-recipients.routes.js";
import { registerAuthSession } from "./plugins/auth-session.js";
import { registerPrisma } from "./plugins/prisma.js";

export const buildApp = async () => {
  const config = envSchema.parse(process.env);
  const logPath = resolve(process.cwd(), '..', '..', 'log', 'backend.log');
  mkdirSync(dirname(logPath), { recursive: true });
  const logFileStream = createWriteStream(logPath, { flags: 'a' });
  const app = Fastify({
    logger: {
      stream: {
        write(chunk: string) {
          process.stdout.write(chunk);
          logFileStream.write(chunk);
        },
      },
    },
  });
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
  await app.register(smsRecipientsRoutes, { prefix: "/api/sms-recipients" });
  await app.register(internalJobRoutes, { prefix: "/internal/jobs" });

  app.get("/api/me", { preHandler: app.requireSession }, async (request) => {
    const user = await app.prisma.user.findUniqueOrThrow({
      where: { id: request.currentUser!.id },
    });
    const sharedOwnerId = await getSharedOwnerId(app);
    const sharedOwner = await app.prisma.user.findUniqueOrThrow({
      where: { id: sharedOwnerId },
      select: {
        scheduleEnabled: true,
        smsEnabled: true,
        scheduleUnit: true,
        scheduleValue: true,
        lastRunAt: true,
        nextRunAt: true,
      },
    });

    const resolvedUsername = user.username ?? user.email;
    const response: SessionUserDto = {
      id: user.id,
      username: resolvedUsername,
      email: user.email,
      name: user.name,
      isAdmin: resolvedUsername === app.config.ADMIN_USERNAME,
      schedule: {
        scheduleEnabled: sharedOwner.scheduleEnabled,
        smsEnabled: sharedOwner.smsEnabled,
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
        scheduleEnabled: payload.scheduleEnabled,
        smsEnabled: payload.smsEnabled,
        scheduleUnit: payload.scheduleUnit,
        scheduleValue: payload.scheduleValue,
      },
      "schedule.update.requested"
    );
    await app.prisma.user.update({
      where: { id: sharedOwnerId },
      data: {
        scheduleEnabled: payload.scheduleEnabled,
        smsEnabled: payload.smsEnabled,
        scheduleUnit: payload.scheduleUnit,
        scheduleValue: payload.scheduleValue,
        nextRunAt: payload.scheduleEnabled ? new Date() : null,
      },
    });

    if (payload.scheduleEnabled) {
      void runScheduledPipelineForUsers(app, [sharedOwnerId], "schedule-updated");
    }
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

  const adminSmsTestSchema = z.object({
    to: z.string().min(1).optional(),
    text: z.string().min(1).max(2000).optional(),
  });

  app.post("/api/admin/test-sms", { preHandler: app.requireSession }, async (request) => {
    if (request.currentUser!.username !== app.config.ADMIN_USERNAME) {
      throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    }

    const payload = adminSmsTestSchema.parse(request.body ?? {});
    const apiKey = app.config.SOLAPI_API_KEY;
    const apiSecret = app.config.SOLAPI_API_SECRET;
    const from = app.config.SOLAPI_SENDER?.replace(/[^0-9]/g, "");
    const to = (payload.to ?? app.config.SOLAPI_RECIPIENT)?.replace(/[^0-9]/g, "");

    if (!apiKey || !apiSecret || !from || !to) {
      throw Object.assign(
        new Error("SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER, SOLAPI_RECIPIENT are required."),
        { statusCode: 400 }
      );
    }

    const text =
      payload.text ??
      `RING 테스트 문자입니다. ${new Date().toISOString()}`;

    app.log.info(
      { actor: request.currentUser!.username, from, to, textLength: text.length },
      "solapi.sms.test.requested"
    );

    try {
      const service = new SolapiMessageService(apiKey, apiSecret);
      const result = await service.sendOne({
        to,
        from,
        text,
        type: "SMS",
      });

      app.log.info(
        {
          actor: request.currentUser!.username,
          from,
          to,
          messageId: result.messageId,
          groupId: result.groupId,
          statusCode: result.statusCode,
        },
        "solapi.sms.test.succeeded"
      );

      return {
        ok: true,
        to,
        from,
        messageId: result.messageId,
        groupId: result.groupId,
        statusCode: result.statusCode,
      };
    } catch (error) {
      app.log.error(
        {
          actor: request.currentUser!.username,
          from,
          to,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        "solapi.sms.test.failed"
      );
      throw Object.assign(new Error("SMS test send failed"), { statusCode: 502 });
    }
  });

  return app;
};

declare module "fastify" {
  interface FastifyInstance {
    config: ReturnType<typeof envSchema.parse>;
  }
}
