import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from "@nestjs/swagger";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto, RefreshTokenDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { GoogleAuthGuard } from "../common/guards/google-auth.guard";
import { RateLimitGuard } from "../common/guards/rate-limit.guard";
import { GetUser } from "../common/decorators/get-user.decorator";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post("register")
  @ApiOperation({ summary: "Register new citizen user" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @ApiOperation({ summary: "Login with email & password" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── Google OAuth — Step 1: Redirect to Google ──────────────────────
  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Initiate Google OAuth login (browser redirect)" })
  async googleAuth() {
    // Passport redirects to Google automatically — nothing to return here
  }

  // ── Google OAuth — Step 2: Google callback ─────────────────────────
  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    // 1. Check configured FRONTEND_URL env var
    // 2. Check OAuth state parameter (passed by frontend and returned by Google)
    // 3. In dev, fall back to http://localhost:5173
    const configuredFrontend = this.configService.get<string>("FRONTEND_URL")?.trim();
    const stateOrigin = req.query?.state as string | undefined;

    let frontendUrl: string | undefined;

    if (configuredFrontend && !configuredFrontend.includes("localhost")) {
      frontendUrl = configuredFrontend.replace(/\/$/, "");
    } else if (stateOrigin && (stateOrigin.startsWith("http://") || stateOrigin.startsWith("https://"))) {
      try {
        frontendUrl = new URL(stateOrigin).origin;
      } catch {
        // ignore malformed state
      }
    } else if (configuredFrontend) {
      frontendUrl = configuredFrontend.replace(/\/$/, "");
    }

    if (!frontendUrl) {
      if (process.env.NODE_ENV !== "production") {
        frontendUrl = "http://localhost:5173";
      } else {
        this.logger.error(
          "FATAL: FRONTEND_URL is not configured on the production backend and no valid state origin was received.",
        );
        return res
          .status(500)
          .send(
            "Configuration Error: FRONTEND_URL environment variable is missing on Railway backend.",
          );
      }
    }

    try {
      // req.user is populated by GoogleStrategy.validate()
      const result = await this.authService.loginWithGoogle(req.user);

      // Redirect to frontend with tokens as query params
      // Frontend reads these from the URL and stores them in localStorage
      const redirectUrl = new URL("/auth/callback", frontendUrl);
      redirectUrl.searchParams.set("accessToken", result.accessToken);
      redirectUrl.searchParams.set("refreshToken", result.refreshToken);

      this.logger.log(
        `Google OAuth callback: user ${result.user.email} authenticated — redirecting to ${frontendUrl}/auth/callback`,
      );

      return res.redirect(redirectUrl.toString());
    } catch (err: any) {
      this.logger.error(`Google OAuth callback error: ${err.message}`);
      const errorUrl = new URL("/auth/callback", frontendUrl);
      errorUrl.searchParams.set("error", "google_auth_failed");
      errorUrl.searchParams.set("message", "Google sign-in failed. Please try again.");
      return res.redirect(errorUrl.toString());
    }
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user profile" })
  getProfile(@GetUser() user: any) {
    return this.authService.getCurrentUserProfile(user.id);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: "Request a password reset email (rate-limited: 3 req/60s per IP)",
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password using a valid reset token" })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  /**
   * DELETE /api/v1/auth/account
   *
   * Google Play Store Account Deletion Policy compliance endpoint.
   * Permanently deletes the authenticated user's account and all
   * associated data from PostgreSQL (via Prisma).
   *
   * Protected: requires a valid NestJS JWT Bearer token.
   */
  @Delete("account")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Delete authenticated user account (Google Play Account Erasure compliance)",
  })
  async deleteAccount(@GetUser() user: any) {
    return this.authService.deleteAccount(user.id);
  }
}
