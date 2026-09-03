import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {
    const maxRetries = 5;
    let delayMs = 1500;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log("Successfully connected to the database (Neon PostgreSQL).");
        return;
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${Math.round(delayMs)}ms...`
        );
        if (attempt === maxRetries) {
          this.logger.error("Could not establish connection to the database server after max retries.");
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 1.5;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

