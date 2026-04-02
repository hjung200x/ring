import type { FastifyInstance } from "fastify";
import { SolapiMessageService } from "solapi";

const SMS_MESSAGE_PREFIX = "\uAC80\uC0C9 \uC870\uAC74\uC5D0 \uB9DE\uB294 \uACF5\uACE0\uBB38 ";
const SMS_MESSAGE_SUFFIX = "\uAC74\uC744 \uCC3E\uC558\uC2B5\uB2C8\uB2E4.";

export class SmsService {
  constructor(private readonly app: FastifyInstance) {}

  private getClient() {
    const apiKey = this.app.config.SOLAPI_API_KEY;
    const apiSecret = this.app.config.SOLAPI_API_SECRET;
    const sender = this.app.config.SOLAPI_SENDER?.replace(/[^0-9]/g, "");

    if (!apiKey || !apiSecret || !sender) {
      return null;
    }

    return {
      sender,
      client: new SolapiMessageService(apiKey, apiSecret),
    };
  }

  async dispatchBatch(batchKey: string, notificationCount: number) {
    const recipients = await this.app.prisma.smsRecipient.findMany({
      where: { enabled: true },
      orderBy: { createdAt: "asc" },
    });

    if (notificationCount < 1) {
      this.app.log.info({ batchKey }, "sms.batch.skipped.no_notifications");
      return;
    }

    if (!recipients.length) {
      this.app.log.info({ batchKey }, "sms.batch.skipped.no_recipients");
      return;
    }

    const binding = this.getClient();
    const messageText = `${SMS_MESSAGE_PREFIX}${notificationCount}${SMS_MESSAGE_SUFFIX}`;

    this.app.log.info(
      { batchKey, notificationCount, recipientCount: recipients.length },
      "sms.batch.requested",
    );

    for (const recipient of recipients) {
      if (!binding) {
        await this.app.prisma.smsDispatch.upsert({
          where: { batchKey_recipientId: { batchKey, recipientId: recipient.id } },
          update: {
            notificationCount,
            messageText,
            status: "failed",
            provider: "solapi",
            errorMessage: "SOLAPI env configuration is missing.",
          },
          create: {
            batchKey,
            recipientId: recipient.id,
            notificationCount,
            messageText,
            status: "failed",
            provider: "solapi",
            errorMessage: "SOLAPI env configuration is missing.",
          },
        });
        this.app.log.warn({ batchKey, recipientId: recipient.id }, "sms.dispatch.failed");
        continue;
      }

      try {
        const result = await binding.client.sendOne({
          to: recipient.phoneNumber,
          from: binding.sender,
          text: messageText,
          type: "SMS",
        });

        await this.app.prisma.smsDispatch.upsert({
          where: { batchKey_recipientId: { batchKey, recipientId: recipient.id } },
          update: {
            notificationCount,
            messageText,
            status: "sent",
            provider: "solapi",
            providerMessageId: result.messageId,
            providerGroupId: result.groupId,
            errorMessage: null,
            sentAt: new Date(),
          },
          create: {
            batchKey,
            recipientId: recipient.id,
            notificationCount,
            messageText,
            status: "sent",
            provider: "solapi",
            providerMessageId: result.messageId,
            providerGroupId: result.groupId,
            sentAt: new Date(),
          },
        });

        this.app.log.info(
          { batchKey, recipientId: recipient.id, messageId: result.messageId, groupId: result.groupId },
          "sms.dispatch.succeeded",
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.app.prisma.smsDispatch.upsert({
          where: { batchKey_recipientId: { batchKey, recipientId: recipient.id } },
          update: {
            notificationCount,
            messageText,
            status: "failed",
            provider: "solapi",
            errorMessage,
          },
          create: {
            batchKey,
            recipientId: recipient.id,
            notificationCount,
            messageText,
            status: "failed",
            provider: "solapi",
            errorMessage,
          },
        });
        this.app.log.error(
          { batchKey, recipientId: recipient.id, message: errorMessage },
          "sms.dispatch.failed",
        );
      }
    }
  }
}
