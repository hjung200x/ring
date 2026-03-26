import type { FastifyPluginAsync } from "fastify";
import {
  adminUserCreateSchema,
  adminUserPasswordSchema,
  adminUserUpdateSchema,
} from "@ring/schemas";
import { AdminUsersService } from "./admin-users.service.js";

export const adminUsersRoutes: FastifyPluginAsync = async (app) => {
  const service = new AdminUsersService(app);

  app.get("/", { preHandler: app.requireSession }, async (request) => {
    return service.list(request.currentUser!.username);
  });

  app.post("/", { preHandler: app.requireSession }, async (request, reply) => {
    const payload = adminUserCreateSchema.parse(request.body);
    const user = await service.create(request.currentUser!.username, payload);
    return reply.status(201).send(user);
  });

  app.patch("/:userId", { preHandler: app.requireSession }, async (request) => {
    const { userId } = request.params as { userId: string };
    const payload = adminUserUpdateSchema.parse(request.body);
    return service.update(request.currentUser!.username, userId, payload);
  });

  app.patch("/:userId/password", { preHandler: app.requireSession }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const payload = adminUserPasswordSchema.parse(request.body);
    await service.changePassword(request.currentUser!.username, userId, payload);
    return reply.status(204).send();
  });

  app.delete("/:userId", { preHandler: app.requireSession }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    await service.remove(request.currentUser!.username, userId);
    return reply.status(204).send();
  });
};
