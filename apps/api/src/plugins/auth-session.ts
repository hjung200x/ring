import { createHash, randomUUID } from "node:crypto";
import fp from "fastify-plugin";

const COOKIE_NAME = "ring_session";

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const unauthorizedError = () =>
  Object.assign(new Error("Unauthorized"), { statusCode: 401 });

export const registerAuthSession = fp(async (app) => {
  app.decorateRequest("currentUser", null);

  app.decorate("createSession", async (userId: string) => {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    await app.prisma.authSession.create({
      data: {
        userId,
        sessionTokenHash: hashToken(token),
        expiresAt,
      },
    });
    app.log.info(
      { userId, expiresAt: expiresAt.toISOString() },
      "auth.session.created"
    );
    return { token, expiresAt };
  });

  app.decorate("requireSession", async (request, _reply) => {
    const token = request.cookies[COOKIE_NAME];
    if (!token) {
      app.log.warn(
        { path: request.url, method: request.method },
        "auth.session.missing_cookie"
      );
      throw unauthorizedError();
    }

    const session = await app.prisma.authSession.findUnique({
      where: { sessionTokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!session) {
      app.log.warn(
        { path: request.url, method: request.method },
        "auth.session.not_found"
      );
      throw unauthorizedError();
    }

    if (session.expiresAt < new Date()) {
      app.log.warn(
        {
          path: request.url,
          method: request.method,
          userId: session.userId,
          expiresAt: session.expiresAt.toISOString(),
        },
        "auth.session.expired"
      );
      throw unauthorizedError();
    }

    if (!session.user.isActive) {
      app.log.warn(
        { path: request.url, method: request.method, userId: session.userId },
        "auth.session.inactive_user"
      );
      throw unauthorizedError();
    }

    request.currentUser = {
      id: session.user.id,
      username: session.user.username ?? session.user.email,
      email: session.user.email,
      name: session.user.name,
    };

    app.log.info(
      { path: request.url, method: request.method, userId: session.user.id },
      "auth.session.accepted"
    );
  });

  app.decorate("clearSessionCookie", (reply) => {
    reply.clearCookie(COOKIE_NAME, { path: "/" });
  });

  app.decorate("setSessionCookie", (reply, token: string, expiresAt: Date) => {
    reply.setCookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: app.config.COOKIE_SECURE,
      expires: expiresAt,
    });
  });
});

declare module "fastify" {
  interface FastifyInstance {
    createSession(userId: string): Promise<{ token: string; expiresAt: Date }>;
    requireSession: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply
    ) => Promise<void>;
    setSessionCookie: (
      reply: import("fastify").FastifyReply,
      token: string,
      expiresAt: Date
    ) => void;
    clearSessionCookie: (reply: import("fastify").FastifyReply) => void;
  }

  interface FastifyRequest {
    currentUser: { id: string; username: string; email: string; name: string } | null;
  }
}
