import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";

const hashPassword = (password: string) =>
  createHash("sha256").update(password).digest("hex");

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async ensureSeedAdmin(): Promise<void> {
    const existingByUsername = await this.app.prisma.user.findFirst({
      where: { username: this.app.config.ADMIN_USERNAME },
    });

    if (existingByUsername) {
      if (existingByUsername.email !== this.app.config.ADMIN_EMAIL || existingByUsername.name !== this.app.config.ADMIN_NAME) {
        await this.app.prisma.user.update({
          where: { id: existingByUsername.id },
          data: {
            email: this.app.config.ADMIN_EMAIL,
            name: this.app.config.ADMIN_NAME,
          },
        });
      }
      return;
    }

    const existingByEmail = await this.app.prisma.user.findUnique({
      where: { email: this.app.config.ADMIN_EMAIL },
    });

    if (existingByEmail) {
      await this.app.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          username: this.app.config.ADMIN_USERNAME,
          passwordHash: hashPassword(this.app.config.ADMIN_PASSWORD),
          name: this.app.config.ADMIN_NAME,
          isActive: true,
        },
      });
      this.app.log.info({ username: this.app.config.ADMIN_USERNAME }, "auth.seed_admin.updated_username");
      return;
    }

    await this.app.prisma.user.create({
      data: {
        username: this.app.config.ADMIN_USERNAME,
        email: this.app.config.ADMIN_EMAIL,
        passwordHash: hashPassword(this.app.config.ADMIN_PASSWORD),
        name: this.app.config.ADMIN_NAME,
      },
    });

    this.app.log.info(
      { username: this.app.config.ADMIN_USERNAME },
      "auth.seed_admin.created"
    );
  }

  async login(username: string, password: string) {
    await this.ensureSeedAdmin();
    const user = await this.app.prisma.user.findFirst({ where: { username } });
    if (!user) {
      this.app.log.warn({ username }, "auth.login.user_not_found");
      throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }

    if (user.passwordHash !== hashPassword(password)) {
      this.app.log.warn({ username, userId: user.id }, "auth.login.password_mismatch");
      throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }

    if (!user.isActive) {
      this.app.log.warn({ username, userId: user.id }, "auth.login.inactive_user");
      throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }
    return user;
  }
}
