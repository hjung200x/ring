import type { FastifyInstance } from "fastify";
import type {
  AdminUserCreateInput,
  AdminUserDto,
  AdminUserPasswordInput,
  AdminUserUpdateInput,
} from "@ring/types";
import { hashPassword } from "../auth/password.js";

const toDto = (user: {
  id: string;
  username: string | null;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminUserDto => ({
  id: user.id,
  username: user.username ?? user.email,
  email: user.email,
  name: user.name,
  isActive: user.isActive,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

export class AdminUsersService {
  constructor(private readonly app: FastifyInstance) {}

  private ensureAdminActor(actorUsername: string) {
    if (actorUsername !== this.app.config.ADMIN_USERNAME) {
      throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    }
  }

  private async getManagedUser(userId: string) {
    return this.app.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  async list(actorUsername: string) {
    this.ensureAdminActor(actorUsername);
    const users = await this.app.prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    return users.map(toDto);
  }

  async create(actorUsername: string, input: AdminUserCreateInput) {
    this.ensureAdminActor(actorUsername);
    const user = await this.app.prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash: hashPassword(input.password),
        name: input.name,
        isActive: input.isActive ?? true,
      },
    });
    return toDto(user);
  }

  async update(actorUsername: string, userId: string, input: AdminUserUpdateInput) {
    this.ensureAdminActor(actorUsername);
    const target = await this.getManagedUser(userId);
    const isConfiguredAdmin = (target.username ?? target.email) === this.app.config.ADMIN_USERNAME;

    if (isConfiguredAdmin && !input.isActive) {
      throw Object.assign(new Error("Configured admin account cannot be disabled."), { statusCode: 400 });
    }

    const data: {
      email: string;
      name: string;
      isActive: boolean;
      passwordHash?: string;
    } = {
      email: input.email,
      name: input.name,
      isActive: input.isActive,
    };

    if (input.password) {
      data.passwordHash = hashPassword(input.password);
    }

    const user = await this.app.prisma.user.update({
      where: { id: userId },
      data,
    });

    if (input.password) {
      await this.app.prisma.authSession.deleteMany({ where: { userId } });
    }

    return toDto(user);
  }

  async changePassword(actorUsername: string, userId: string, input: AdminUserPasswordInput) {
    this.ensureAdminActor(actorUsername);
    await this.getManagedUser(userId);
    await this.app.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(input.password) },
    });
    await this.app.prisma.authSession.deleteMany({ where: { userId } });
  }

  async remove(actorUsername: string, userId: string) {
    this.ensureAdminActor(actorUsername);
    const target = await this.getManagedUser(userId);

    if ((target.username ?? target.email) === this.app.config.ADMIN_USERNAME) {
      throw Object.assign(new Error("Configured admin account cannot be deleted."), { statusCode: 400 });
    }

    await this.app.prisma.user.delete({ where: { id: userId } });
  }
}
