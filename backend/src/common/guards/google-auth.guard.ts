import {
  Injectable,
  ExecutionContext,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  constructor(private configService: ConfigService) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    // Allow frontend to pass origin or redirect_uri via query parameter, or read referer
    const origin = req.query?.origin || req.query?.redirect_uri || req.headers?.referer;
    if (origin && typeof origin === "string") {
      try {
        const parsed = new URL(origin);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          return {
            state: parsed.origin,
          };
        }
      } catch {
        // invalid URL, ignore
      }
    }
    return {};
  }

  canActivate(context: ExecutionContext) {
    const clientID = this.configService.get<string>("GOOGLE_CLIENT_ID")?.trim();
    const clientSecret = this.configService.get<string>("GOOGLE_CLIENT_SECRET")?.trim();

    if (!clientID || !clientSecret || clientID === "not_configured") {
      throw new BadRequestException(
        "Google Sign-In is not configured on this server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env.",
      );
    }

    return super.canActivate(context);
  }
}
