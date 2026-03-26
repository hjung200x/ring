import type { FastifyPluginAsync } from "fastify";
import { NotificationsService } from "./notifications.service.js";

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  const service = new NotificationsService(app);

  app.get("/", { preHandler: app.requireSession }, async (request) => {
    const query = request.query as { isRead?: string };
    const parsed =
      query.isRead === undefined ? undefined : query.isRead.toLowerCase() === "true";
    return {
      page: 1,
      items: await service.list(request.currentUser!.id, parsed),
    };
  });

  app.get("/:notificationId", { preHandler: app.requireSession }, async (request) => {
    const { notificationId } = request.params as { notificationId: string };
    await service.markRead(request.currentUser!.id, notificationId);
    return service.detail(request.currentUser!.id, notificationId);
  });

  app.post(
    "/:notificationId/read",
    { preHandler: app.requireSession },
    async (request, reply) => {
      const { notificationId } = request.params as { notificationId: string };
      await service.markRead(request.currentUser!.id, notificationId);
      return reply.status(204).send();
    },
  );
};
