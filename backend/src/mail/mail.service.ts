import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
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
import { OFFICIAL_LOGO_BASE64, LOGO_CID } from "./templates/assets/logo";

export interface SendConfirmationEmailOptions {
  to: string;
  applicantName: string;
  applicationNo: string;
  serviceName: string;
  createdAt: Date;
  status: string;
}

export interface SmtpDiagnosticStatus {
  configured: boolean;
  status: "up" | "down" | "unverified" | "not_configured";
  host?: string;
  port?: number;
  secure?: boolean;
  error?: string | null;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;
  private readonly isProduction: boolean;
  private readonly isSmtpConfigured: boolean;
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly pass: string;
  private smtpVerified: boolean = false;
  private smtpLastError: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.isProduction = process.env.NODE_ENV === "production";

    const rawHost = this.configService.get<string>("EMAIL_HOST");
    const rawPort = this.configService.get<string>("EMAIL_PORT");
    const rawUser = this.configService.get<string>("EMAIL_USER");
    const rawPass = this.configService.get<string>("EMAIL_PASSWORD");
    const rawFrom = this.configService.get<string>("EMAIL_FROM");
    const rawFrontendUrl = this.configService.get<string>("FRONTEND_URL");

    this.host = rawHost ? rawHost.trim() : "";
    const portStr = rawPort ? rawPort.trim() : "";
    this.port = parseInt(portStr, 10) || 587;
    this.user = rawUser ? rawUser.trim() : "";
    
    // Clean password: if Gmail and contains spaces (common with 16-char app passwords), strip inner spaces
    let pass = rawPass ? rawPass.trim() : "";
    if (this.host.includes("gmail") && pass.includes(" ")) {
      pass = pass.replace(/\s+/g, "");
    }
    this.pass = pass;

    const from = rawFrom ? rawFrom.trim() : "";
    const frontendUrl = rawFrontendUrl ? rawFrontendUrl.trim() : "";

    this.fromAddress =
      from || (this.user ? `Success MP Online <${this.user}>` : "Success MP Online <noreply@successmponline.in>");
    this.frontendUrl =
      frontendUrl || (this.isProduction ? "" : "http://localhost:5173");

    // Safe metadata logging (values NEVER logged)
    this.logger.log(`[MailService] EMAIL_HOST configured: ${Boolean(this.host)} (${this.host || "none"})`);
    this.logger.log(`[MailService] EMAIL_PORT configured: ${Boolean(portStr)} (${this.port})`);
    this.logger.log(`[MailService] EMAIL_USER configured: ${Boolean(this.user)} (${this.maskEmail(this.user)})`);
    this.logger.log(`[MailService] EMAIL_PASSWORD configured: ${Boolean(this.pass)}`);
    this.logger.log(`[MailService] EMAIL_FROM configured: ${Boolean(from)}`);

    const isDummyUser = this.user.toLowerCase().includes("dummy_email_user") || this.user.toLowerCase().includes("dummy");
    const isDummyPass = this.pass.toLowerCase() === "dummy";

    this.isSmtpConfigured = Boolean(
      this.host && this.user && this.pass && !isDummyUser && !isDummyPass
    );

    if (this.isSmtpConfigured) {
      const isSecure = this.port === 465;
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: isSecure,
        auth: {
          user: this.user,
          pass: this.pass,
        },
        connectionTimeout: 15_000, // 15 seconds connection timeout
        greetingTimeout: 15_000,
        socketTimeout: 30_000, // 30 seconds socket timeout
      });
      this.logger.log(`[MailService] SMTP Mailer initialized: host=${this.host}, port=${this.port}, secure=${isSecure}`);
    } else {
      if (this.isProduction) {
        // In production, do NOT silently mock email sends with jsonTransport
        this.transporter = null;
        this.logger.error(
          "[MailService] FATAL: Production SMTP email is NOT configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in Railway variables. Email delivery will explicitly fail rather than silently pretending to succeed.",
        );
      } else {
        // In local development, activate jsonTransport for testing
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
        this.logger.log(
          "[MailService] [DEV ONLY] SMTP credentials not configured or dummy; fallback jsonTransport activated for local development logging.",
        );
      }
    }
  }

  async onModuleInit() {
    if (this.isSmtpConfigured && this.transporter) {
      // Non-blocking background SMTP connection test on startup
      this.verifyConnection()
        .then((res) => {
          if (res.ok) {
            this.logger.log("[email] ✓ SMTP connection & authentication verified with server");
          } else {
            this.logger.error(
              `[email] ✗ SMTP connection verification failed: ${res.message} { code: "${res.code || "UNKNOWN"}" }`,
            );
          }
        })
        .catch((err) => {
          this.logger.error(`[email] ✗ SMTP verification unexpected error: ${err.message}`);
        });
    }
  }

  /**
   * Safe verification method for diagnostic endpoints and startup checks.
   */
  async verifyConnection(): Promise<{ ok: boolean; message: string; code?: string }> {
    if (!this.transporter || !this.isSmtpConfigured) {
      return {
        ok: false,
        message: "SMTP transporter is not configured.",
        code: "ESMTP_NOT_CONFIGURED",
      };
    }

    try {
      this.logger.log("[email] verifying SMTP connection with server...");
      await this.transporter.verify();
      this.smtpVerified = true;
      this.smtpLastError = null;
      return { ok: true, message: "SMTP connection verified." };
    } catch (err: any) {
      this.smtpVerified = false;
      const code = err.code || "UNKNOWN";
      this.smtpLastError = err.message || String(err);
      return { ok: false, message: this.smtpLastError ?? "SMTP verification failed", code };
    }
  }

  /**
   * Diagnostic summary for health checks without leaking credentials.
   */
  getSmtpStatus(): SmtpDiagnosticStatus {
    if (!this.isSmtpConfigured) {
      return {
        configured: false,
        status: "not_configured",
      };
    }

    return {
      configured: true,
      status: this.smtpVerified ? "up" : this.smtpLastError ? "down" : "unverified",
      host: this.host,
      port: this.port,
      secure: this.port === 465,
      error: this.smtpLastError,
    };
  }

  /**
   * Safe email masking helper for logging: user@example.com -> u***@example.com
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes("@")) return "none";
    const [local, domain] = email.split("@");
    if (local.length <= 2) return `${local.charAt(0)}***@${domain}`;
    return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
  }

  /**
   * Production-grade centralized sendMail implementation.
   */
  async sendMail(
    options: nodemailer.SendMailOptions & { logRecordId?: string },
  ): Promise<{ success: boolean; messageId?: string; error?: string; code?: string }> {
    const to = Array.isArray(options.to) ? options.to.join(", ") : String(options.to || "");
    const maskedRecipient = this.maskEmail(to);
    const subject = String(options.subject || "(no subject)");

    this.logger.log(`[email] send started: to=${maskedRecipient}, subject="${subject}"`);

    if (!this.transporter) {
      const errorMsg = this.isProduction
        ? "SMTP is not configured on the production server (missing EMAIL_HOST, EMAIL_USER, or EMAIL_PASSWORD)."
        : "SMTP is not configured in development environment.";
      this.logger.error(`[email] send failed: ${errorMsg} { code: "ESMTP_NOT_CONFIGURED" }`);

      if (options.logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: options.logRecordId },
            data: { status: NotificationStatus.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }

      return { success: false, error: errorMsg, code: "ESMTP_NOT_CONFIGURED" };
    }

    if (!to || !to.includes("@")) {
      const errorMsg = `Invalid recipient email address: "${to}"`;
      this.logger.error(`[email] send failed: ${errorMsg} { code: "EINVALID_RECIPIENT" }`);

      if (options.logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: options.logRecordId },
            data: { status: NotificationStatus.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }

      return { success: false, error: errorMsg, code: "EINVALID_RECIPIENT" };
    }

    // Clone options and ensure from address and logo attachment
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.fromAddress,
      ...options,
    };

    // Automatically attach logo CID if template references cid:LOGO_CID
    if (
      typeof mailOptions.html === "string" &&
      mailOptions.html.includes(`cid:${LOGO_CID}`)
    ) {
      const existingAttachments = Array.isArray(mailOptions.attachments)
        ? [...mailOptions.attachments]
        : [];
      const hasLogo = existingAttachments.some((a: any) => a.cid === LOGO_CID);
      if (!hasLogo) {
        existingAttachments.push({
          filename: "success-mp-online-logo.png",
          content: Buffer.from(
            OFFICIAL_LOGO_BASE64.replace(/^data:image\/png;base64,/, ""),
            "base64",
          ),
          cid: LOGO_CID,
          contentType: "image/png",
          contentDisposition: "inline",
        });
        mailOptions.attachments = existingAttachments;
      }
    }

    try {
      this.logger.log(`[email] sending message via SMTP transporter to ${maskedRecipient}`);
      const info = await this.transporter.sendMail(mailOptions);

      // Verify acceptance
      const isAccepted = Array.isArray(info.accepted) && info.accepted.length > 0;
      if (isAccepted || info.messageId) {
        this.logger.log(
          `[email] message accepted by SMTP server (messageId: ${info.messageId || "accepted"})`,
        );

        if (options.logRecordId) {
          await this.prisma.notificationLog
            .update({
              where: { id: options.logRecordId },
              data: { status: NotificationStatus.SENT, sentAt: new Date() },
            })
            .catch(() => {});
        }

        return { success: true, messageId: info.messageId };
      } else {
        const errorMsg = "SMTP server rejected the recipient.";
        this.logger.error(`[email] send failed: ${errorMsg} { code: "ERECIPIENT_REJECTED" }`);

        if (options.logRecordId) {
          await this.prisma.notificationLog
            .update({
              where: { id: options.logRecordId },
              data: { status: NotificationStatus.FAILED, error: errorMsg },
            })
            .catch(() => {});
        }

        return { success: false, error: errorMsg, code: "ERECIPIENT_REJECTED" };
      }
    } catch (err: any) {
      const code = err.code || "UNKNOWN";
      const errorMsg = err.message || String(err);
      this.logger.error(
        `[email] send failed to ${maskedRecipient}: ${errorMsg} { code: "${code}" }`,
      );

      if (options.logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: options.logRecordId },
            data: { status: NotificationStatus.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }

      return { success: false, error: errorMsg, code };
    }
  }

  async sendApplicationConfirmationEmail(
    options: SendConfirmationEmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string; code?: string }> {
    const { to, applicantName, applicationNo, serviceName, createdAt, status } =
      options;

    const formattedDate = new Date(createdAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " IST";

    const trackUrl = this.frontendUrl ? `${this.frontendUrl}/#my-applications` : "/#my-applications";
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

    return this.sendMail({
      to,
      subject,
      text: textContent,
      html: htmlContent,
      logRecordId: logRecordId || undefined,
    });
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
  ): Promise<{ success: boolean; messageId?: string; error?: string; code?: string }> {
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

    return this.sendMail({
      to,
      subject,
      text: textContent,
      html: htmlContent,
      logRecordId: logRecordId || undefined,
    });
  }

  /**
   * Sends a welcome/registration confirmation email when a new user registers.
   * Displays the user's name, mobile, email, and IST registration date/time.
   */
  async sendRegistrationWelcomeEmail(options: {
    to: string;
    userName: string;
    mobileNumber?: string;
    registrationDate: Date;
  }): Promise<{ success: boolean; messageId?: string; error?: string; code?: string }> {
    const { to, userName, mobileNumber = "", registrationDate } = options;

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

    return this.sendMail({
      to,
      subject,
      text: textContent,
      html: htmlContent,
      logRecordId: logRecordId || undefined,
    });
  }
}
