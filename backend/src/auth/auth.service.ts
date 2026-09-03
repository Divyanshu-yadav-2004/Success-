import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RoleName } from "@prisma/client";
import { MailService } from "../mail/mail.service";
import { WelcomeService } from "../features/success-management/welcome/welcome.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private welcomeService: WelcomeService,
  ) {}

  // ----------------------------------------------------------------
  // Register — email/password
  // ----------------------------------------------------------------
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException("User with this email already exists");
    }

    const defaultRole = await this.prisma.role.findUnique({
      where: { name: RoleName.USER },
    });
    if (!defaultRole) {
      throw new BadRequestException(
        "Default user role not found in database. Run seed script first.",
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        roleId: defaultRole.id,
        profile: {
          create: {
            fullName: dto.fullName,
            address: dto.address,
          },
        },
      },
      include: { role: true, profile: true },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role.name,
    );

    // Fire-and-forget: send one-time welcome notification
    setImmediate(() => {
      this.welcomeService
        .sendWelcomeNotificationIfNeeded(user.id)
        .catch((err) => this.logger.warn(`Welcome notification failed: ${err.message}`));
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.profile?.fullName,
        role: user.role.name,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  // ----------------------------------------------------------------
  // Login — email/password
  // ----------------------------------------------------------------
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true, profile: true },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is disabled");
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role.name,
    );
    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.profile?.fullName,
        role: user.role.name,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  // ----------------------------------------------------------------
  // Google OAuth — called by GoogleStrategy after successful OAuth
  //
  // Receives verified profile from Google directly (no Supabase).
  // Finds or creates the user in PostgreSQL/Prisma, then issues JWT.
  // ----------------------------------------------------------------
  async loginWithGoogle(googleUser: {
    email: string;
    fullName: string;
    googleId: string;
  }) {
    const { email, fullName, googleId } = googleUser;

    if (!email) {
      throw new UnauthorizedException(
        "Google did not return an email address. Please ensure your Google account has a verified email.",
      );
    }

    this.logger.log(`Google auth: looking up user with email=${email}`);

    // Find or create user in Prisma/PostgreSQL
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, profile: true },
    });

    if (!user) {
      const defaultRole = await this.prisma.role.findUnique({
        where: { name: RoleName.USER },
      });
      if (!defaultRole) {
        throw new InternalServerErrorException(
          "Default user role not configured. Run prisma seed first.",
        );
      }

      // Google users have no password — store a non-guessable random hash
      const randomPasswordHash = await bcrypt.hash(
        googleId + Date.now().toString(),
        10,
      );

      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: randomPasswordHash,
          roleId: defaultRole.id,
          profile: {
            create: {
              fullName: fullName || email.split("@")[0],
              address: "Madhya Pradesh",
            },
          },
        },
        include: { role: true, profile: true },
      });

      this.logger.log(`Google auth: provisioned new user — ${email}`);

      // Fire-and-forget: send one-time welcome notification & email for new Google user
      const newUserId = user.id;
      setImmediate(() => {
        this.welcomeService
          .sendWelcomeNotificationIfNeeded(newUserId)
          .catch((err) =>
            this.logger.warn(
              `Google welcome notification failed: ${err.message}`,
            ),
          );
      });
    } else {
      this.logger.log(`Google auth: existing user found — ${email}`);
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is disabled. Contact support.");
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role.name,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.profile?.fullName || fullName,
        role: user.role.name,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  // ----------------------------------------------------------------
  // Refresh token
  // ----------------------------------------------------------------
  async refreshToken(refreshToken: string) {
    try {
      const secret =
        this.configService.get<string>("JWT_REFRESH_SECRET") ||
        "super_secret_refresh_key_success_mp_online_2026";
      const payload = this.jwtService.verify(refreshToken, { secret });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true, profile: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      return this.generateTokens(user.id, user.email, user.role.name);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  /** Profile data is needed only for the explicit /auth/me endpoint. */
  async getCurrentUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: { select: { name: true } },
        profile: true,
      },
    });

    if (!user || !user.role) {
      throw new UnauthorizedException("User not active or found");
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      profile: user.profile,
    };
  }

  // ----------------------------------------------------------------
  // Delete account — Google Play Store compliance (Account Erasure)
  //
  // Deletes the user from PostgreSQL via Prisma (cascades UserProfile,
  // RefreshToken, Application, etc. per schema onDelete: Cascade).
  // ----------------------------------------------------------------
  async deleteAccount(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Already deleted or never existed — treat as success (idempotent)
      return { success: true, message: "Account not found or already deleted." };
    }

    this.logger.log(`Deleting account for userId=${userId}, email=${user.email}`);

    try {
      await this.prisma.user.delete({ where: { id: userId } });
      this.logger.log(`deleteAccount: PostgreSQL user deleted — ${user.email}`);
    } catch (e: any) {
      this.logger.error(
        `deleteAccount: failed to delete PostgreSQL user — ${e.message}`,
      );
      throw new InternalServerErrorException(
        "Failed to delete account data. Please try again.",
      );
    }

    return { success: true, message: "Account deleted successfully." };
  }

  // ----------------------------------------------------------------
  // Forgot Password — generate secure reset token and send email
  //
  // Security: always returns the same message whether the email exists
  // or not, to prevent email enumeration attacks.
  // ----------------------------------------------------------------
  async forgotPassword(email: string): Promise<{ message: string }> {
    const SAFE_MESSAGE =
      "If an account exists for this email, you'll receive a password reset link shortly.";

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      // Always return same message — never reveal if email is registered
      if (!user) {
        this.logger.log(`forgotPassword: no user found for email (not revealed to client)`);
        return { message: SAFE_MESSAGE };
      }

      // Invalidate all existing unused tokens for this user
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      // Generate a cryptographically secure raw token (never stored)
      const rawToken = crypto.randomBytes(32).toString("hex");

      // Store only the SHA-256 hash
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const frontendUrl = (
        this.configService.get<string>("FRONTEND_URL") ||
        (process.env.NODE_ENV !== "production" ? "http://localhost:5173" : "")
      ).replace(/\/$/, "");
      const resetUrl = frontendUrl
        ? `${frontendUrl}/reset-password?token=${rawToken}`
        : `/reset-password?token=${rawToken}`;

      const userName =
        user.profile?.fullName || email.split("@")[0] || "User";
      const supportEmail =
        this.configService.get<string>("SUPPORT_EMAIL") ||
        "helpSuccessMPonline@gmail.com";
      const supportPhone =
        this.configService.get<string>("SUPPORT_PHONE") || "7415921990";

      // Fire-and-forget: don't block the response on email delivery
      this.mailService
        .sendPasswordResetEmailTo(email, {
          userName,
          resetUrl,
          supportEmail,
          supportPhone,
        })
        .catch((err) =>
          this.logger.error(`forgotPassword: email send error — ${err?.message}`),
        );

      this.logger.log(
        `forgotPassword: reset token created for userId=${user.id} — email dispatched`,
      );
    } catch (err: any) {
      // Log the error internally but still return the safe message
      this.logger.error(`forgotPassword: unexpected error — ${err?.message}`);
    }

    return { message: SAFE_MESSAGE };
  }

  // ----------------------------------------------------------------
  // Reset Password — validate token and update password
  // ----------------------------------------------------------------
  async resetPassword(
    rawToken: string,
    newPassword: string,
  ): Promise<{ success: boolean }> {
    const INVALID_MSG = "This password reset link is invalid or has expired. Please request a new one.";

    // Hash the supplied token for DB lookup
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      throw new BadRequestException(INVALID_MSG);
    }

    if (record.usedAt) {
      throw new BadRequestException(INVALID_MSG);
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException(INVALID_MSG);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and mark token as used in a transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      // Invalidate any other tokens for this user
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId, tokenHash: { not: tokenHash } },
      }),
    ]);

    this.logger.log(
      `resetPassword: password updated successfully for userId=${record.userId}`,
    );

    return { success: true };
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ) {
    const payload = { sub: userId, email, role };
    const accessSecret =
      this.configService.get<string>("JWT_ACCESS_SECRET") ||
      "super_secret_access_key_success_mp_online_2026";
    const refreshSecret =
      this.configService.get<string>("JWT_REFRESH_SECRET") ||
      "super_secret_refresh_key_success_mp_online_2026";

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES_IN") || "15m",
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") || "7d",
    });

    return { accessToken, refreshToken };
  }
}
