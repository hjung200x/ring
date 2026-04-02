import type { FastifyInstance } from "fastify";
import type {
  SmsRecipientCreateInput,
  SmsRecipientDto,
  SmsRecipientUpdateInput,
} from "@ring/types";

const normalizePhoneNumber = (value: string) => value.replace(/[^0-9]/g, "");

const toDto = (row: {
  id: string;
  name: string;
  phoneNumber: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SmsRecipientDto => ({
  id: row.id,
  name: row.name,
  phoneNumber: row.phoneNumber,
  enabled: row.enabled,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export class SmsRecipientsService {
  constructor(private readonly app: FastifyInstance) {}

  async list() {
    const rows = await this.app.prisma.smsRecipient.findMany({
      orderBy: [{ enabled: "desc" }, { createdAt: "asc" }],
    });
    return rows.map(toDto);
  }

  async create(input: SmsRecipientCreateInput) {
    const row = await this.app.prisma.smsRecipient.create({
      data: {
        name: input.name.trim(),
        phoneNumber: normalizePhoneNumber(input.phoneNumber),
        enabled: input.enabled ?? true,
      },
    });
    return toDto(row);
  }

  async update(recipientId: string, input: SmsRecipientUpdateInput) {
    const row = await this.app.prisma.smsRecipient.update({
      where: { id: recipientId },
      data: {
        name: input.name.trim(),
        phoneNumber: normalizePhoneNumber(input.phoneNumber),
        enabled: input.enabled,
      },
    });
    return toDto(row);
  }

  async remove(recipientId: string) {
    await this.app.prisma.smsRecipient.delete({ where: { id: recipientId } });
  }
}
