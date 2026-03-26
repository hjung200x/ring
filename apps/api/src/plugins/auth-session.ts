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
    return { token, expiresAt };
  });

  app.decorate("requireSession", async (request, reply) => {
    const token = request.cookies[COOKIE_NAME];
    if (!token) {
      throw unauthorizedError();
    }

    const session = await app.prisma.authSession.findUnique({
      where: { sessionTokenHash: hashToken(token) },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      throw unauthorizedError();
    }

    request.currentUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  });

  app.decorate("clearSessionCookie", (reply) => {
    reply.clearCookie(COOKIE_NAME, { path: "/" });
  });

  app.decorate("setSessionCookie", (reply, token: string, expiresAt: Date) => {
    reply.setCookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: app.config.NODE_ENV === "production",
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
    currentUser: { id: string; email: string; name: string } | null;
  }
}
