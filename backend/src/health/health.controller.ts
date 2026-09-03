import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Check system health, database connection, and email service status" })
  async checkHealth() {
    let dbStatus = "down";
    let dbDetails: Record<string, any> = {};

    try {
      // Verify basic connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = "up";

      // Verify tables exist and count seed data
      const roleCount = await this.prisma.role.count();
      const serviceCount = await this.prisma.service.count();
      const userCount = await this.prisma.user.count();

      dbDetails = {
        roles: roleCount,
        services: serviceCount,
        users: userCount,
        seeded: roleCount > 0 && serviceCount > 0,
      };
    } catch (err) {
      dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
    }

    const emailStatus = this.mailService.getSmtpStatus();

    return {
      status: dbStatus === "up" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      services: {
        api: "up",
        database: dbStatus,
        email: emailStatus,
        ...(dbStatus === "up" ? { databaseDetails: dbDetails } : {}),
      },
    };
  }
}
