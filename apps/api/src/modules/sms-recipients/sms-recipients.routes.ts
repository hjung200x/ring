import type { FastifyPluginAsync } from "fastify";
import {
  smsRecipientCreateSchema,
  smsRecipientUpdateSchema,
} from "@ring/schemas";
import { SmsRecipientsService } from "./sms-recipients.service.js";

export const smsRecipientsRoutes: FastifyPluginAsync = async (app) => {
  const service = new SmsRecipientsService(app);

  app.get("/", { preHandler: app.requireSession }, async () => {
    return service.list();
  });

  app.post("/", { preHandler: app.requireSession }, async (request, reply) => {
    const payload = smsRecipientCreateSchema.parse(request.body);
    const recipient = await service.create(payload);
    return reply.status(201).send(recipient);
  });

  app.patch("/:recipientId", { preHandler: app.requireSession }, async (request) => {
    const { recipientId } = request.params as { recipientId: string };
    const payload = smsRecipientUpdateSchema.parse(request.body);
    return service.update(recipientId, payload);
  });

  app.delete("/:recipientId", { preHandler: app.requireSession }, async (request, reply) => {
    const { recipientId } = request.params as { recipientId: string };
    await service.remove(recipientId);
    return reply.status(204).send();
  });
};
