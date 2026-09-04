import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import * as dns from "dns";
import * as net from "net";
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
  provider?: "resend" | "smtp" | "none";
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
  private readonly resendFrom: string;
  private readonly frontendUrl: string;
  private readonly isProduction: boolean;
  private readonly isSmtpConfigured: boolean;
  private readonly resendApiKey: string;
  private readonly provider: "resend" | "smtp" | "none";
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

    // 1. Check RESEND_API_KEY first - Takes absolute priority in production & staging
    const rawResendKey =
      this.configService.get<string>("RESEND_API_KEY") ||
      process.env.RESEND_API_KEY;
    const cleanResendKey = rawResendKey ? rawResendKey.trim().replace(/^["']|["']$/g, "") : "";
    const isResendConfigured = Boolean(
      cleanResendKey &&
      !cleanResendKey.includes("placeholder") &&
      !cleanResendKey.includes("YOUR_") &&
      !cleanResendKey.toLowerCase().includes("dummy")
    );
    this.resendApiKey = isResendConfigured ? cleanResendKey : "";

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

    // 2. Configure RESEND_FROM sender
    const rawResendFrom =
      this.configService.get<string>("RESEND_FROM") ||
      process.env.RESEND_FROM;
    const cleanResendFrom = rawResendFrom ? rawResendFrom.trim().replace(/^["']|["']$/g, "") : "";

    if (cleanResendFrom) {
      this.resendFrom = cleanResendFrom;
    } else if (from && !from.toLowerCase().includes("gmail.com")) {
      this.resendFrom = from;
    } else {
      this.resendFrom = "Success MP Online <noreply@successmponline.in>";
    }

    const isDummyUser = this.user.toLowerCase().includes("dummy_email_user") || this.user.toLowerCase().includes("dummy");
    const isDummyPass = this.pass.toLowerCase() === "dummy";

    this.isSmtpConfigured = Boolean(
      this.host && this.user && this.pass && !isDummyUser && !isDummyPass
    );

    // Safe metadata logging (secrets NEVER logged)
    this.logger.log(`[MailService] RESEND_API_KEY configured: ${Boolean(this.resendApiKey)}`);
    this.logger.log(`[MailService] RESEND_FROM configured: ${this.resendFrom}`);
    this.logger.log(`[MailService] EMAIL_HOST configured: ${Boolean(this.host)} (${this.host || "none"})`);
    this.logger.log(`[MailService] EMAIL_PORT configured: ${Boolean(portStr)} (${this.port})`);
    this.logger.log(`[MailService] EMAIL_USER configured: ${Boolean(this.user)} (${this.maskEmail(this.user)})`);
    this.logger.log(`[MailService] EMAIL_PASSWORD configured: ${Boolean(this.pass)}`);
    this.logger.log(`[MailService] EMAIL_FROM configured: ${Boolean(from)}`);

    // 3. Deterministic provider selection:
    // RESEND_API_KEY present -> Resend HTTPS API (port 443)
    // Otherwise -> SMTP
    if (this.resendApiKey) {
      this.provider = "resend";
      this.transporter = null; // NEVER initialize SMTP transporter when Resend is active
      this.logger.log("[MailService] Active email provider: Resend HTTPS API (port 443 — prioritized, Gmail SMTP disabled)");
    } else if (this.isSmtpConfigured) {
      this.provider = "smtp";
      const isSecure = this.port === 465;
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: isSecure,
        auth: {
          user: this.user,
          pass: this.pass,
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
      this.logger.log(`[MailService] Active email provider: SMTP (${this.host}:${this.port}, secure=${isSecure})`);
    } else {
      this.provider = "none";
      if (this.isProduction) {
        this.transporter = null;
        this.logger.error(
          "[MailService] FATAL: Neither RESEND_API_KEY nor valid SMTP credentials are configured. Set RESEND_API_KEY (recommended on Railway) or SMTP settings in Railway variables.",
        );
      } else {
        this.transporter = nodemailer.createTransport({
          jsonTransport: true,
        });
        this.logger.log(
          "[MailService] [DEV ONLY] Email credentials not configured; jsonTransport activated for local development logging.",
        );
      }
    }
  }

  async onModuleInit() {
    if (this.provider === "resend") {
      this.verifyConnection()
        .then((res) => {
          if (res.ok) {
            this.logger.log("[email] ✓ Resend HTTPS API connection verified (port 443)");
          } else {
            this.logger.error(`[email] ✗ Resend verification failed: ${res.message}`);
          }
        })
        .catch((err) => {
          this.logger.error(`[email] ✗ Resend verification unexpected error: ${err.message}`);
        });
    } else if (this.provider === "smtp" && this.transporter) {
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
    if (this.provider === "resend") {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch("https://api.resend.com", {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok || res.status < 500) {
          this.smtpVerified = true;
          this.smtpLastError = null;
          return { ok: true, message: "Resend HTTPS API endpoint verified reachable on port 443." };
        } else {
          this.smtpVerified = false;
          this.smtpLastError = `api.resend.com returned status ${res.status}`;
          return { ok: false, message: this.smtpLastError, code: `HTTP_${res.status}` };
        }
      } catch (err: any) {
        this.smtpVerified = false;
        const errMsg =
          err.name === "AbortError"
            ? "Connection timeout (5000ms connecting to api.resend.com:443)"
            : err.message || String(err);
        this.smtpLastError = errMsg;
        return { ok: false, message: errMsg, code: err.code || "ENETERROR" };
      }
    }

    if (!this.transporter || !this.isSmtpConfigured) {
      return {
        ok: false,
        message: "Email provider is not configured.",
        code: "ENOTCONFIGURED",
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
      let errMsg = err.message || String(err);
      if (errMsg.toLowerCase().includes("timeout") || code === "ETIMEDOUT") {
        errMsg = "Connection timeout (outbound SMTP ports 587/465 restricted by hosting provider network)";
      }
      this.smtpLastError = errMsg;
      return { ok: false, message: this.smtpLastError ?? "SMTP verification failed", code };
    }
  }

  /**
   * Diagnostic summary for health checks without leaking credentials.
   */
  getSmtpStatus(): SmtpDiagnosticStatus {
    if (this.provider === "resend") {
      return {
        configured: true,
        status: this.smtpLastError ? "down" : "up",
        provider: "resend",
        host: "api.resend.com",
        port: 443,
        secure: true,
        error: this.smtpLastError,
      };
    }

    if (!this.isSmtpConfigured) {
      return {
        configured: false,
        status: "not_configured",
        provider: "none",
      };
    }

    return {
      configured: true,
      status: this.smtpVerified ? "up" : this.smtpLastError ? "down" : "unverified",
      provider: "smtp",
      host: this.host,
      port: this.port,
      secure: this.port === 465,
      error: this.smtpLastError,
    };
  }

  /**
   * Internal TCP test helper.
   */
  private testTcp(
    targetHost: string,
    port: number,
    timeoutMs = 4000,
  ): Promise<{ status: "PASS" | "FAIL"; latencyMs?: number; error?: string }> {
    return new Promise((resolve) => {
      const start = Date.now();
      const socket = new net.Socket();
      let finished = false;

      socket.setTimeout(timeoutMs);

      socket.on("connect", () => {
        if (!finished) {
          finished = true;
          const latencyMs = Date.now() - start;
          socket.destroy();
          resolve({ status: "PASS", latencyMs });
        }
      });

      socket.on("timeout", () => {
        if (!finished) {
          finished = true;
          socket.destroy();
          resolve({ status: "FAIL", error: `Connection timed out (${timeoutMs}ms)` });
        }
      });

      socket.on("error", (err: any) => {
        if (!finished) {
          finished = true;
          socket.destroy();
          resolve({ status: "FAIL", error: err.message || "Connection error" });
        }
      });

      try {
        socket.connect(port, targetHost);
      } catch (e: any) {
        if (!finished) {
          finished = true;
          resolve({ status: "FAIL", error: e.message });
        }
      }
    });
  }

  /**
   * Safe live network diagnostic to run from the actual Railway environment.
   */
  async runDiagnostic(): Promise<any> {
    const host = this.host || "smtp.gmail.com";
    const diagnostic: any = {
      timestamp: new Date().toISOString(),
      environment: this.isProduction ? "production" : "development",
      activeProvider: this.provider,
      targetSmtpHost: host,
      dns: { status: "TESTING" },
      tcp587: { status: "TESTING" },
      tcp465: { status: "TESTING" },
      tcp25: { status: "TESTING" },
      https443: { status: "TESTING" },
      smtpHandshake: { status: "NOT REACHED" },
      analysis: "",
    };

    // 1. DNS Resolution
    try {
      const addresses = await dns.promises.lookup(host, { all: true });
      diagnostic.dns = {
        status: "PASS",
        records: addresses.map((a) => `${a.address} (IPv${a.family})`),
      };
    } catch (err: any) {
      diagnostic.dns = {
        status: "FAIL",
        error: err.message,
      };
    }

    // 2. TCP 587
    diagnostic.tcp587 = await this.testTcp(host, 587, 4000);

    // 3. TCP 465
    diagnostic.tcp465 = await this.testTcp(host, 465, 4000);

    // 4. TCP 25
    diagnostic.tcp25 = await this.testTcp(host, 25, 3000);

    // 5. HTTPS 443 (test reachability to api.resend.com)
    diagnostic.https443 = await this.testTcp("api.resend.com", 443, 3000);

    // 6. SMTP Handshake / AUTH if TCP 587 or 465 passed
    if (diagnostic.tcp587.status === "PASS" || diagnostic.tcp465.status === "PASS") {
      if (this.transporter && this.isSmtpConfigured) {
        const verifyRes = await this.verifyConnection();
        diagnostic.smtpHandshake = {
          status: verifyRes.ok ? "PASS" : "FAIL",
          message: verifyRes.message,
          code: verifyRes.code,
        };
      } else {
        diagnostic.smtpHandshake = {
          status: "NOT REACHED",
          message: "TCP port is open but SMTP credentials not configured",
        };
      }
    } else {
      diagnostic.smtpHandshake = {
        status: "NOT REACHED",
        message: "Outbound TCP connections to SMTP ports (587, 465, 25) are blocked by hosting provider network firewall",
      };
    }

    // Analysis
    if (this.provider === "resend") {
      diagnostic.analysis =
        diagnostic.https443.status === "PASS"
          ? "RESEND_ACTIVE_AND_REACHABLE: Resend HTTPS REST API is the active, prioritized email provider. Connectivity to api.resend.com:443 is confirmed. Direct SMTP port restrictions do not affect delivery."
          : "RESEND_ACTIVE_BUT_PORT_443_ISSUE: Resend is selected as the active provider, but connection to api.resend.com:443 failed.";
    } else if (
      diagnostic.tcp587.status === "FAIL" &&
      diagnostic.tcp465.status === "FAIL" &&
      diagnostic.https443.status === "PASS"
    ) {
      diagnostic.analysis =
        "RAILWAY_OUTBOUND_SMTP_RESTRICTION_CONFIRMED: Railway blocks direct outbound TCP connections on SMTP ports 25, 465, and 587. Standard HTTPS on port 443 is OPEN. Configure RESEND_API_KEY to route transactional email via HTTPS API.";
    } else if (diagnostic.tcp587.status === "PASS" || diagnostic.tcp465.status === "PASS") {
      diagnostic.analysis = "Outbound TCP connectivity to SMTP server is open and reachable.";
    } else {
      diagnostic.analysis = "Network connectivity diagnostic complete.";
    }

    return diagnostic;
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
   * Dispatches email via Resend HTTPS REST API (port 443).
   * Used when RESEND_API_KEY is configured (recommended for Railway deployment).
   */
  private async sendViaResend(
    mailOptions: nodemailer.SendMailOptions,
    logRecordId: string | undefined,
    maskedRecipient: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string; code?: string }> {
    const to = Array.isArray(mailOptions.to)
      ? mailOptions.to.map((t) => String(t))
      : [String(mailOptions.to || "")];

    // Priority: configured RESEND_FROM; allow custom mailOptions.from if not Gmail and not default
    let resendFrom = this.resendFrom;
    if (
      mailOptions.from &&
      typeof mailOptions.from === "string" &&
      !mailOptions.from.toLowerCase().includes("gmail.com") &&
      mailOptions.from !== this.fromAddress
    ) {
      resendFrom = mailOptions.from;
    }

    const payload: any = {
      from: resendFrom,
      to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
    };

    if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length > 0) {
      payload.attachments = mailOptions.attachments.map((att: any) => {
        let contentBase64 = "";
        if (Buffer.isBuffer(att.content)) {
          contentBase64 = att.content.toString("base64");
        } else if (typeof att.content === "string") {
          contentBase64 = Buffer.from(
            att.content.replace(/^data:image\/[a-zA-Z]+;base64,/, ""),
            "base64",
          ).toString("base64");
        }
        const item: any = {
          filename: att.filename || "attachment.png",
          content: contentBase64,
        };
        if (att.cid) {
          item.id = att.cid;
        }
        if (att.contentType) {
          item.content_type = att.contentType;
        }
        return item;
      });
    }

    try {
      this.logger.log(`[email] sending message via Resend HTTPS API (port 443) from="${resendFrom}" to=${maskedRecipient}`);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json().catch(() => ({}));

      if (res.ok && data?.id) {
        this.logger.log(
          `[email] message accepted by Resend API (messageId: ${data.id})`,
        );

        if (logRecordId) {
          await this.prisma.notificationLog
            .update({
              where: { id: logRecordId },
              data: { status: NotificationStatus.SENT, sentAt: new Date() },
            })
            .catch(() => {});
        }

        return { success: true, messageId: data.id };
      } else {
        const errorMsg =
          data?.message || data?.error?.message || `Resend API returned status ${res.status}`;
        this.logger.error(
          `[email] Resend API error to ${maskedRecipient}: ${errorMsg}`,
        );

        if (logRecordId) {
          await this.prisma.notificationLog
            .update({
              where: { id: logRecordId },
              data: { status: NotificationStatus.FAILED, error: errorMsg },
            })
            .catch(() => {});
        }

        return { success: false, error: errorMsg, code: "ERESEND_API_ERROR" };
      }
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      this.logger.error(
        `[email] Resend network error to ${maskedRecipient}: ${errorMsg}`,
      );

      if (logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: logRecordId },
            data: { status: NotificationStatus.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }

      return { success: false, error: errorMsg, code: "ERESEND_NETWORK_ERROR" };
    }
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

    if (this.provider === "none") {
      const errorMsg = this.isProduction
        ? "Neither RESEND_API_KEY nor SMTP credentials are configured on the production server."
        : "Email service is not configured in development environment.";
      this.logger.error(`[email] send failed: ${errorMsg} { code: "EEMAIL_NOT_CONFIGURED" }`);

      if (options.logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: options.logRecordId },
            data: { status: NotificationStatus.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }

      return { success: false, error: errorMsg, code: "EEMAIL_NOT_CONFIGURED" };
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
    // (Run for BOTH Resend HTTPS and SMTP so inline logo works everywhere)
    if (
      typeof mailOptions.html === "string" &&
      mailOptions.html.includes(`cid:${LOGO_CID}`)
    ) {
      const existingAttachments = Array.isArray(mailOptions.attachments)
        ? [...mailOptions.attachments]
        : [];
      const hasLogo = existingAttachments.some((a: any) => a.cid === LOGO_CID || a.id === LOGO_CID);
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

    // If active provider is Resend HTTPS API, route via Resend (never touches SMTP)
    if (this.provider === "resend") {
      return this.sendViaResend(mailOptions, options.logRecordId, maskedRecipient);
    }

    if (!this.transporter) {
      const errorMsg = "SMTP transporter is not initialized.";
      this.logger.error(`[email] send failed: ${errorMsg} { code: "ESMTP_NOT_INITIALIZED" }`);
      if (options.logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: options.logRecordId },
            data: { status: NotificationStatus.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }
      return { success: false, error: errorMsg, code: "ESMTP_NOT_INITIALIZED" };
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
