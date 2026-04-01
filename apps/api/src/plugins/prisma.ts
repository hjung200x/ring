import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

export const registerPrisma = fp(async (app) => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: app.config.DATABASE_URL,
      },
    },
  });
  await prisma.$connect();
  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
