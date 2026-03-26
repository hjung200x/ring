import type { FastifyInstance } from 'fastify';

export const getSharedOwnerId = async (app: FastifyInstance) => {
  const admin = await app.prisma.user.findFirst({
    where: { username: app.config.ADMIN_USERNAME },
    select: { id: true },
  });

  if (admin) {
    return admin.id;
  }

  const fallback = await app.prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (!fallback) {
    throw Object.assign(new Error('Shared owner account not found.'), { statusCode: 500 });
  }

  return fallback.id;
};
