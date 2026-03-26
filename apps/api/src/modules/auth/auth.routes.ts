import type { FastifyPluginAsync } from "fastify";
import { loginRequestSchema } from "@ring/schemas";
import { AuthService } from "./auth.service.js";

export const authRoutes: FastifyPluginAsync = async (app) => {
  const authService = new AuthService(app);

  app.post("/login", async (request, reply) => {
    const payload = loginRequestSchema.parse(request.body);
    const user = await authService.login(payload.email, payload.password);
    const session = await app.createSession(user.id);
    app.setSessionCookie(reply, session.token, session.expiresAt);
    return reply.status(204).send();
  });

  app.post("/logout", { preHandler: app.requireSession }, async (_request, reply) => {
    app.clearSessionCookie(reply);
    return reply.status(204).send();
  });
};
