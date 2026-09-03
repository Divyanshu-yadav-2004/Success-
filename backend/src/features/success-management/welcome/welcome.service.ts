import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotificationEngineService } from "../notifications/notification-engine.service";
import { NotificationType } from "../notifications/notification.types";
import { generateWelcomeEmailHtml, generateWelcomeEmailText, safeHttpsUrl } from "../email/welcome-email.template";
import { ConfigService } from "@nestjs/config";
import { MailService } from "../../../mail/mail.service";
import { LOGO_CID } from "../../../mail/templates/assets/logo";
import { OFFICIAL_LOGO_BASE64 } from "../../../mail/templates/assets/logo";

@Injectable()
export class WelcomeService {
  private readonly logger = new Logger(WelcomeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationEngine: NotificationEngineService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Ensures a one-time welcome notification & welcome email are sent to a new user.
   */
  async sendWelcomeNotificationIfNeeded(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) return;

    // Check if welcome notification was already sent
    if (user.welcomeNotificationSentAt) {
      return;
    }

    // Atomic check and update to prevent race conditions
    const updated = await this.prisma.user.updateMany({
      where: {
        id: userId,
        welcomeNotificationSentAt: null,
      },
      data: {
        welcomeNotificationSentAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return; // Already processed
    }

    const customerName = user.profile?.fullName || user.email.split("@")[0] || "Customer";
    const frontendUrl = (
      this.configService.get<string>("FRONTEND_URL") ||
      (process.env.NODE_ENV !== "production" ? "http://localhost:5173" : "")
    ).replace(/\/$/, "");
    const registrationDate = new Date(user.createdAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " IST";

    // 1. Create In-App Notification
    await this.notificationEngine.createNotification({
      userId,
      title: "🎉 Welcome to Success MP Online!",
      message:
        "We're happy to have you here. You can now apply for available services, track your applications, receive important updates, and securely access your documents.",
      type: NotificationType.WELCOME,
      actionUrl: "/#services",
    });

    // 2. Dispatch Welcome Email via centralized MailService
    try {
      const supportEmail = this.configService.get<string>("SUPPORT_EMAIL") || "helpSuccessMPonline@gmail.com";
      const supportPhone = this.configService.get<string>("SUPPORT_PHONE") || "7415921990";

      if (user.email && user.email.includes("@")) {
        const logoUrl = this.configService.get<string>("EMAIL_LOGO_URL");
        const publicLogoUrl = safeHttpsUrl(logoUrl);
        const html = generateWelcomeEmailHtml({
          customerName,
          email: user.email,
          mobileNumber: user.phone,
          registrationDate,
          dashboardUrl: `${frontendUrl}/#services`,
          supportEmail,
          supportPhone,
          logoUrl: publicLogoUrl,
        });
        const text = generateWelcomeEmailText({
          customerName,
          email: user.email,
          mobileNumber: user.phone,
          registrationDate,
          dashboardUrl: `${frontendUrl}/#services`,
          supportEmail,
          supportPhone,
        });

        const mailOptions: any = {
          to: user.email,
          subject: "Welcome to Success MP Online — Your Registration is Confirmed",
          text,
          html,
        };

        // Attach logo CID when no public HTTPS asset is configured
        if (!publicLogoUrl) {
          mailOptions.attachments = [{
            filename: "success-mp-online-logo.png",
            content: Buffer.from(OFFICIAL_LOGO_BASE64.replace(/^data:image\/png;base64,/, ""), "base64"),
            cid: LOGO_CID,
            contentType: "image/png",
            contentDisposition: "inline",
          }];
        }

        const result = await this.mailService.sendMail(mailOptions);

        if (result.success) {
          this.logger.log(`Welcome email dispatched to ${user.email}`);
        } else {
          this.logger.warn(`Welcome email delivery failed for ${user.email}: ${result.error} { code: "${result.code}" }`);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed sending welcome email to user ${userId}: ${err.message}`);
    }
  }
}


