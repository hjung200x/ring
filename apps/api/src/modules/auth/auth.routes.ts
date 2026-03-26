import type { FastifyPluginAsync } from "fastify";
import { loginRequestSchema } from "@ring/schemas";
import { AuthService } from "./auth.service.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  const authService = new AuthService(app);

  app.addHook("onRequest", async (request) => {
    app.log.info(
      {
        method: request.method,
        path: request.url,
        hasSessionCookie: Boolean(request.cookies?.ring_session),
      },
      "auth.request.received"
    );
  });

  app.post("/login", async (request, reply) => {
    const payload = loginRequestSchema.parse(request.body);
    app.log.info({ username: payload.username }, "auth.login.requested");
    const user = await authService.login(payload.username, payload.password);
    const session = await app.createSession(user.id);
    app.setSessionCookie(reply, session.token, session.expiresAt);
    app.log.info({ userId: user.id, username: user.username ?? user.email }, "auth.login.succeeded");
    return reply.status(204).send();
  });

  app.post("/logout", { preHandler: app.requireSession }, async (request, reply) => {
    app.log.info(
      { userId: request.currentUser?.id ?? null },
      "auth.logout.requested"
    );
    app.clearSessionCookie(reply);
    app.log.info(
      { userId: request.currentUser?.id ?? null },
      "auth.logout.succeeded"
    );
    return reply.status(204).send();
  });
};
