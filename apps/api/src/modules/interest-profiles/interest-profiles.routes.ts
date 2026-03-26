import type { FastifyPluginAsync } from "fastify";
import {
  fromAnnouncementExampleSchema,
  manualExampleSchema,
  profileUpsertSchema,
} from "@ring/schemas";
import { InterestProfilesService } from "./interest-profiles.service.js";

export const interestProfileRoutes: FastifyPluginAsync = async (app) => {
  const service = new InterestProfilesService(app);

  app.get("/", { preHandler: app.requireSession }, async (request) => {
    return service.list(request.currentUser!.id);
  });

  app.post("/", { preHandler: app.requireSession }, async (request, reply) => {
    const payload = profileUpsertSchema.parse(request.body);
    const profile = await service.create(request.currentUser!.id, payload);
    return reply.status(201).send(profile);
  });

  app.get("/:profileId", { preHandler: app.requireSession }, async (request) => {
    const { profileId } = request.params as { profileId: string };
    return service.get(request.currentUser!.id, profileId);
  });

  app.patch("/:profileId", { preHandler: app.requireSession }, async (request) => {
    const { profileId } = request.params as { profileId: string };
    const payload = profileUpsertSchema.parse(request.body);
    return service.update(request.currentUser!.id, profileId, payload);
  });

  app.post(
    "/:profileId/examples/manual-text",
    { preHandler: app.requireSession },
    async (request, reply) => {
      const { profileId } = request.params as { profileId: string };
      const payload = manualExampleSchema.parse(request.body);
      const example = await service.addManualExample(
        request.currentUser!.id,
        profileId,
        payload.title,
        payload.text,
      );
      return reply.status(201).send(example);
    },
  );

  app.post(
    "/:profileId/examples/from-announcement",
    { preHandler: app.requireSession },
    async (request, reply) => {
      const { profileId } = request.params as { profileId: string };
      const payload = fromAnnouncementExampleSchema.parse(request.body);
      const example = await service.addExampleFromAnnouncement(
        request.currentUser!.id,
        profileId,
        payload.announcementId,
      );
      return reply.status(201).send(example);
    },
  );

  app.delete(
    "/:profileId/examples/:exampleId",
    { preHandler: app.requireSession },
    async (request, reply) => {
      const { profileId, exampleId } = request.params as {
        profileId: string;
        exampleId: string;
      };
      await service.deleteExample(request.currentUser!.id, profileId, exampleId);
      return reply.status(204).send();
    },
  );
};
