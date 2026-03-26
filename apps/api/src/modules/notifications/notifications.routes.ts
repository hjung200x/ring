import type { FastifyPluginAsync } from "fastify";
import { getSharedOwnerId } from "../../lib/shared-scope.js";
import { NotificationsService } from "./notifications.service.js";

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  const service = new NotificationsService(app);

  app.get("/", { preHandler: app.requireSession }, async (request) => {
    const query = request.query as { isRead?: string };
    const parsed =
      query.isRead === undefined ? undefined : query.isRead.toLowerCase() === "true";
    return {
      page: 1,
      items: await service.list(await getSharedOwnerId(app), parsed),
    };
  });

  app.get("/:notificationId", { preHandler: app.requireSession }, async (request) => {
    const { notificationId } = request.params as { notificationId: string };
    const sharedOwnerId = await getSharedOwnerId(app);
    await service.markRead(sharedOwnerId, notificationId);
    return service.detail(sharedOwnerId, notificationId);
  });

  app.post(
    "/:notificationId/read",
    { preHandler: app.requireSession },
    async (request, reply) => {
      const { notificationId } = request.params as { notificationId: string };
      await service.markRead(await getSharedOwnerId(app), notificationId);
      return reply.status(204).send();
    },
  );
};
