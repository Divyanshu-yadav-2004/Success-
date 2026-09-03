import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private configService: ConfigService) {
    const clientID =
      configService.get<string>("GOOGLE_CLIENT_ID")?.trim() || "not_configured";
    const clientSecret =
      configService.get<string>("GOOGLE_CLIENT_SECRET")?.trim() || "not_configured";
    const callbackURL =
      configService.get<string>("GOOGLE_CALLBACK_URL")?.trim() ||
      "http://localhost:3000/api/v1/auth/google/callback";

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
    });

    if (clientID === "not_configured" || clientSecret === "not_configured") {
      this.logger.warn(
        "Google OAuth keys (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are missing in environment variables. Google login will be disabled until configured.",
      );
    }
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    const email = emails?.[0]?.value;
    const fullName =
      `${name?.givenName || ""}` +
      (name?.familyName ? ` ${name?.familyName}` : "");
    const safeFullName =
      fullName.trim() || email?.split("@")[0] || "Google User";

    this.logger.log(`Google OAuth: validated profile for ${email}`);

    return {
      googleId: id,
      email,
      fullName: safeFullName,
      picture: photos?.[0]?.value,
    };
  }
}
