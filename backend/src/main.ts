import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // Environment variable presence check (never log values, only presence)
  const requiredEnvKeys = [
    "DATABASE_URL",
    "JWT_ACCESS_SECRET",
  ];
  const optionalEnvKeys = [
    "JWT_REFRESH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GEMINI_API_KEY",
    "RAZORPAY_KEY_ID",
  ];

  // Ensure DATABASE_URL is set from Railway PostgreSQL fallback environment variables if needed
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder")) {
    const railwayDbUrl =
      process.env.DATABASE_PRIVATE_URL ||
      process.env.DATABASE_PUBLIC_URL ||
      process.env.POSTGRES_URL;
    if (railwayDbUrl) {
      process.env.DATABASE_URL = railwayDbUrl;
    }
  }

  logger.log("--- Environment Configuration Check ---");
  for (const key of requiredEnvKeys) {
    const val = process.env[key];
    const isPresent = !!(val && val.trim() !== "" && !val.includes("YOUR_") && !val.includes("placeholder"));
    logger.log(`ENV [${key}]: ${isPresent ? "✓ PRESENT" : "✗ MISSING"}`);
    if (!isPresent) {
      logger.error(`FATAL: Required environment variable ${key} is missing or invalid!`);
    }
  }
  for (const key of optionalEnvKeys) {
    const val = process.env[key];
    const isPresent = !!(val && val.trim() !== "" && !val.includes("YOUR_"));
    logger.log(`ENV [${key}]: ${isPresent ? "✓ PRESENT" : "○ NOT SET (optional)"}`);
  }
  logger.log("---------------------------------------");

  const app = await NestFactory.create(AppModule);

  // Security & Middleware
  app.use(helmet());

  // CORS — allows configured FRONTEND_URL, deployed domains, and localhost in dev
  const frontendUrl = process.env.FRONTEND_URL?.trim();

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (frontendUrl && (origin === frontendUrl || origin === frontendUrl.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      // Allow local development
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }

      // Allow deployed frontend domains (Railway, Vercel, Netlify)
      if (
        origin.endsWith(".railway.app") ||
        origin.endsWith(".up.railway.app") ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app")
      ) {
        return callback(null, true);
      }

      // If FRONTEND_URL is not configured yet, allow the origin so deployed frontend can communicate
      if (!frontendUrl) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  });

  // Global Prefix — root '/' is excluded so the status endpoint works without the prefix
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });

  // Pipes & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle("Success MP Online Enterprise API")
    .setDescription("Government Services Portal — Production Backend API Specification")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Server listening on http://localhost:${port}/api/v1`);
  logger.log(`Swagger documentation available at http://localhost:${port}/api/docs`);
  logger.log(`Health endpoint: http://localhost:${port}/api/v1/health`);
  logger.log(`Google OAuth: http://localhost:${port}/api/v1/auth/google`);
}

bootstrap();
