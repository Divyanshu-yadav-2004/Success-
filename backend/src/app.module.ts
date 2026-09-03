import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import * as path from "path";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { ServicesModule } from "./services/services.module";
import { ApplicationsModule } from "./applications/applications.module";
import { PaymentsModule } from "./payments/payments.module";
import { ReceiptsModule } from "./receipts/receipts.module";
import { DocumentsModule } from "./documents/documents.module";
import { AdminModule } from "./admin/admin.module";
import { AiModule } from "./ai/ai.module";
import { MailModule } from "./mail/mail.module";
import { SuccessManagementModule } from "./features/success-management/success-management.module";

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        ".env",
        "backend/.env",
        path.resolve(process.cwd(), ".env"),
        path.resolve(process.cwd(), "backend", ".env"),
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    MailModule,
    ServicesModule,
    ApplicationsModule,
    PaymentsModule,
    ReceiptsModule,
    DocumentsModule,
    AdminModule,
    AiModule,
    SuccessManagementModule,
  ],
})
export class AppModule {}
