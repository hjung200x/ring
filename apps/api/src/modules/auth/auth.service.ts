import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";

const hashPassword = (password: string) =>
  createHash("sha256").update(password).digest("hex");

export class AuthService {
  constructor(private readonly app: FastifyInstance) {}

  async ensureSeedAdmin(): Promise<void> {
    const existing = await this.app.prisma.user.findUnique({
      where: { email: this.app.config.ADMIN_EMAIL },
    });

    if (existing) {
      return;
    }

    await this.app.prisma.user.create({
      data: {
        email: this.app.config.ADMIN_EMAIL,
        passwordHash: hashPassword(this.app.config.ADMIN_PASSWORD),
        name: this.app.config.ADMIN_NAME,
      },
    });
  }

  async login(email: string, password: string) {
    await this.ensureSeedAdmin();
    const user = await this.app.prisma.user.findUnique({ where: { email } });
    if (!user || user.passwordHash !== hashPassword(password) || !user.isActive) {
      throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }
    return user;
  }
}
