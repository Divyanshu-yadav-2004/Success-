import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationChannel, NotificationStatus } from "@prisma/client";
import {
  generateConfirmationEmailHtml,
  generateConfirmationEmailText,
} from "./templates/confirmation-email.template";
import {
  generatePasswordResetEmailHtml,
  generatePasswordResetEmailText,
  type PasswordResetEmailOptions,
} from "./templates/password-reset-email.template";
import {
  generateRegistrationEmailHtml,
  generateRegistrationEmailText,
} from "./templates/registration-email.template";

export interface SendConfirmationEmailOptions {
  to: string;
  applicantName: string;
  applicationNo: string;
  serviceName: string;
  createdAt: Date;
  status: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const rawHost = this.configService.get<string>("EMAIL_HOST");
    const rawPort = this.configService.get<string>("EMAIL_PORT");
    const rawUser = this.configService.get<string>("EMAIL_USER");
    const rawPass = this.configService.get<string>("EMAIL_PASSWORD");
    const rawFrom = this.configService.get<string>("EMAIL_FROM");
    const rawFrontendUrl = this.configService.get<string>("FRONTEND_URL");

    const host = rawHost ? rawHost.trim() : "";
    const portStr = rawPort ? rawPort.trim() : "";
    const user = rawUser ? rawUser.trim() : "";
    const pass = rawPass ? rawPass.trim() : "";
    const from = rawFrom ? rawFrom.trim() : "";
    const frontendUrl = rawFrontendUrl ? rawFrontendUrl.trim() : "";

    this.fromAddress =
      from || "Success MP Online <noreply@successmponline.in>";
    this.frontendUrl =
      frontendUrl || "http://localhost:5173";

    this.logger.log(`EMAIL_HOST: ${host ? "PRESENT" : "MISSING"}`);
    this.logger.log(`EMAIL_PORT: ${portStr ? "PRESENT" : "MISSING"}`);
    this.logger.log(`EMAIL_USER: ${user ? "PRESENT" : "MISSING"}`);
    this.logger.log(`EMAIL_PASSWORD: ${pass ? "PRESENT" : "MISSING"}`);
    this.logger.log(`EMAIL_FROM: ${from ? "PRESENT" : "MISSING"}`);

    const allSixPresent = Boolean(
      host && portStr && user && pass && from && frontendUrl
    );

    const isDummyUser = user.toLowerCase().includes("dummy_email_user");
    const isDummyPass = pass.toLowerCase() === "dummy";

    if (allSixPresent && !isDummyUser && !isDummyPass) {
      const port = parseInt(portStr, 10) || 587;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mailer initialized with host: ${host}:${port}`);
    } else {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.logger.log(
        "SMTP credentials not configured or dummy; fallback email transport activated for dev logging.",
      );
    }
  }

  async sendApplicationConfirmationEmail(
    options: SendConfirmationEmailOptions,
  ): Promise<{ success: boolean; error?: string }> {
    const { to, applicantName, applicationNo, serviceName, createdAt, status } =
      options;

    const formattedDate = new Date(createdAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " IST";

    const trackUrl = `${this.frontendUrl}/#my-applications`;
    const supportPhone = "7415921990";
    const supportEmail = "support@successmponline.in";

    const htmlContent = generateConfirmationEmailHtml({
      applicantName,
      applicationNo,
      serviceName,
      submissionDate: formattedDate,
      status: status.replace("_", " ").toUpperCase(),
      trackUrl,
      supportPhone,
      supportEmail,
    });

    const textContent = generateConfirmationEmailText({
      applicantName,
      applicationNo,
      serviceName,
      submissionDate: formattedDate,
      status: status.replace("_", " ").toUpperCase(),
      trackUrl,
      supportPhone,
      supportEmail,
    });

    const subject = `Application Submitted Successfully [ID: ${applicationNo}] - Success MP Online`;

    let logRecordId: string | null = null;
    try {
      // Record pending notification log in DB
      const logRecord = await this.prisma.notificationLog.create({
        data: {
          channel: NotificationChannel.EMAIL,
          recipient: to,
          subject,
          content: textContent,
          status: NotificationStatus.PENDING,
        },
      });
      logRecordId = logRecord.id;
    } catch (dbErr: any) {
      this.logger.warn(`Could not create NotificationLog entry: ${dbErr.message}`);
    }

    try {
      if (!to || !to.includes("@")) {
        throw new Error(`Invalid email recipient address: "${to}"`);
      }

      if (this.transporter) {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          text: textContent,
          html: htmlContent,
        });
      }

      this.logger.log(
        `[MailService] Confirmation email successfully dispatched to ${to} for Application ${applicationNo}`,
      );

      if (logRecordId) {
        await this.prisma.notificationLog.update({
          where: { id: logRecordId },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        }).catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      this.logger.error(
        `[MailService] Failed to send confirmation email to ${to}: ${errorMessage}`,
      );

      if (logRecordId) {
        await this.prisma.notificationLog.update({
          where: { id: logRecordId },
          data: {
            status: NotificationStatus.FAILED,
            error: errorMessage,
          },
        }).catch(() => {});
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sends a password reset email to the given address.
   * Called by AuthService — the raw reset token is NEVER stored or logged here.
   * Only the recipient address and a generic log entry are recorded.
   */
  async sendPasswordResetEmailTo(
    to: string,
    options: {
      userName: string;
      resetUrl: string;
      supportEmail: string;
      supportPhone: string;
    },
  ): Promise<{ success: boolean; error?: string }> {
    const { userName, resetUrl, supportEmail, supportPhone } = options;

    const subject = "Reset Your Success MP Online Password";

    const htmlContent = generatePasswordResetEmailHtml({
      userName,
      resetUrl,
      supportEmail,
      supportPhone,
    });

    const textContent = generatePasswordResetEmailText({
      userName,
      resetUrl,
      supportEmail,
      supportPhone,
    });

    let logRecordId: string | null = null;
    try {
      const logRecord = await this.prisma.notificationLog.create({
        data: {
          channel: NotificationChannel.EMAIL,
          recipient: to,
          subject,
          // Do NOT log the reset URL or token — security requirement
          content: `Password reset email dispatched to user.`,
          status: NotificationStatus.PENDING,
        },
      });
      logRecordId = logRecord.id;
    } catch (dbErr: any) {
      this.logger.warn(`Could not create NotificationLog entry: ${dbErr.message}`);
    }

    try {
      if (!to || !to.includes("@")) {
        throw new Error(`Invalid email recipient address: "${to}"`);
      }

      if (this.transporter) {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          text: textContent,
          html: htmlContent,
        });
      }

      this.logger.log(
        `[MailService] Password reset email dispatched to ${to}`,
      );

      if (logRecordId) {
        await this.prisma.notificationLog.update({
          where: { id: logRecordId },
          data: { status: NotificationStatus.SENT, sentAt: new Date() },
        }).catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      this.logger.error(
        `[MailService] Failed to send password reset email to ${to}: ${errorMessage}`,
      );

      if (logRecordId) {
        await this.prisma.notificationLog.update({
          where: { id: logRecordId },
          data: { status: NotificationStatus.FAILED, error: errorMessage },
        }).catch(() => {});
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sends a welcome/registration confirmation email when a new user registers.
   * Displays the user's name, mobile, email, and IST registration date/time.
   */
  async sendRegistrationWelcomeEmail(options: {
    to: string;
    userName: string;
    mobileNumber: string;
    registrationDate: Date;
  }): Promise<{ success: boolean; error?: string }> {
    const { to, userName, mobileNumber, registrationDate } = options;

    const formattedDate =
      new Date(registrationDate).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " IST";

    const portalUrl = this.frontendUrl;
    const supportEmail = "helpSuccessMPonline@gmail.com";
    const supportPhone = "7415921990";

    const htmlContent = generateRegistrationEmailHtml({
      userName,
      mobileNumber,
      email: to,
      registrationDate: formattedDate,
      portalUrl,
      supportEmail,
      supportPhone,
    });

    const textContent = generateRegistrationEmailText({
      userName,
      mobileNumber,
      email: to,
      registrationDate: formattedDate,
      portalUrl,
      supportEmail,
      supportPhone,
    });

    const subject = `Welcome to Success MP Online — Your Registration is Confirmed`;

    let logRecordId: string | null = null;
    try {
      const logRecord = await this.prisma.notificationLog.create({
        data: {
          channel: NotificationChannel.EMAIL,
          recipient: to,
          subject,
          content: textContent,
          status: NotificationStatus.PENDING,
        },
      });
      logRecordId = logRecord.id;
    } catch (dbErr: any) {
      this.logger.warn(`Could not create NotificationLog entry: ${dbErr.message}`);
    }

    try {
      if (!to || !to.includes("@")) {
        throw new Error(`Invalid email recipient address: "${to}"`);
      }

      if (this.transporter) {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          text: textContent,
          html: htmlContent,
        });
      }

      this.logger.log(
        `[MailService] Registration welcome email dispatched to ${to} for user: ${userName}`,
      );

      if (logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: logRecordId },
            data: { status: NotificationStatus.SENT, sentAt: new Date() },
          })
          .catch(() => {});
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      this.logger.error(
        `[MailService] Failed to send registration welcome email to ${to}: ${errorMessage}`,
      );

      if (logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: logRecordId },
            data: { status: NotificationStatus.FAILED, error: errorMessage },
          })
          .catch(() => {});
      }

      return { success: false, error: errorMessage };
    }
  }
}
