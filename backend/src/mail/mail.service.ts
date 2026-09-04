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
  provider?: "gmail-api" | "resend" | "smtp" | "none";
  transport?: "https" | "smtp" | "none";
  host?: string;
  port?: number;
  secure?: boolean;
  sender?: string;
  authMethod?: "oauth2_refresh_token" | "service_account";
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
  private readonly provider: "gmail-api" | "resend" | "smtp" | "none";
  private readonly host: string;
  private readonly port: number;
  private readonly user: string;
  private readonly pass: string;
  private smtpVerified: boolean = false;
  private smtpLastError: string | null = null;

  // Gmail API configuration (HTTPS / 443)
  private readonly gmailSenderEmail: string;
  private readonly gmailClientId: string;
  private readonly gmailClientSecret: string;
  private readonly gmailRefreshToken: string;
  private readonly googleSaClientEmail: string;
  private readonly googleSaPrivateKey: string;
  private readonly isGmailApiConfigured: boolean;
  private readonly gmailAuthMethod: "oauth2_refresh_token" | "service_account" | "none";
  private gmailCachedAccessToken: string | null = null;
  private gmailTokenExpiresAt: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.isProduction = process.env.NODE_ENV === "production";

    // 1. Gmail API sender configuration (Takes ABSOLUTE PRIORITY in production & staging)
    const rawSenderEmail =
      this.configService.get<string>("GMAIL_SENDER_EMAIL") ||
      this.configService.get<string>("EMAIL_USER") ||
      process.env.GMAIL_SENDER_EMAIL ||
      process.env.EMAIL_USER;
    this.gmailSenderEmail = rawSenderEmail ? rawSenderEmail.trim() : "";

    // Dedicated sender OAuth2 refresh token credentials (preferred simplicity)
    const rawGmailClientId =
      this.configService.get<string>("GMAIL_CLIENT_ID") ||
      process.env.GMAIL_CLIENT_ID;
    this.gmailClientId = rawGmailClientId ? rawGmailClientId.trim() : "";

    const rawGmailClientSecret =
      this.configService.get<string>("GMAIL_CLIENT_SECRET") ||
      process.env.GMAIL_CLIENT_SECRET;
    this.gmailClientSecret = rawGmailClientSecret ? rawGmailClientSecret.trim() : "";

    const rawGmailRefreshToken =
      this.configService.get<string>("GMAIL_REFRESH_TOKEN") ||
      process.env.GMAIL_REFRESH_TOKEN;
    this.gmailRefreshToken = rawGmailRefreshToken ? rawGmailRefreshToken.trim() : "";

    // Google Workspace Service Account with Domain-Wide Delegation credentials (alternative)
    const rawSaEmail =
      this.configService.get<string>("GOOGLE_SERVICE_ACCOUNT_EMAIL") ||
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.googleSaClientEmail = rawSaEmail ? rawSaEmail.trim() : "";

    const rawSaKey =
      this.configService.get<string>("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY") ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    this.googleSaPrivateKey = rawSaKey ? rawSaKey.replace(/\\n/g, "\n").trim() : "";

    const isOAuth2Configured = Boolean(
      this.gmailClientId &&
      this.gmailClientSecret &&
      this.gmailRefreshToken &&
      this.gmailSenderEmail
    );

    const isSaConfigured = Boolean(
      this.googleSaClientEmail &&
      this.googleSaPrivateKey &&
      this.gmailSenderEmail
    );

    this.isGmailApiConfigured = isOAuth2Configured || isSaConfigured;
    this.gmailAuthMethod = isOAuth2Configured
      ? "oauth2_refresh_token"
      : isSaConfigured
        ? "service_account"
        : "none";

    // 2. Check RESEND_API_KEY (secondary fallback)
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

    // 3. SMTP configuration (local dev fallback only; blocked by Railway in production)
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
      from || (this.user ? `Success MP Online <${this.user}>` : "Success MP Online <helpSuccessMPonline@gmail.com>");
    this.frontendUrl =
      frontendUrl || (this.isProduction ? "" : "http://localhost:5173");

    // Configure RESEND_FROM sender
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
    this.logger.log(`[MailService] GMAIL_API configured: ${this.isGmailApiConfigured} (method: ${this.gmailAuthMethod}, sender: ${this.maskEmail(this.gmailSenderEmail)})`);
    this.logger.log(`[MailService] RESEND_API_KEY configured: ${Boolean(this.resendApiKey)}`);
    this.logger.log(`[MailService] EMAIL_HOST configured: ${Boolean(this.host)} (${this.host || "none"})`);
    this.logger.log(`[MailService] EMAIL_USER configured: ${Boolean(this.user)} (${this.maskEmail(this.user)})`);

    // 4. Deterministic provider selection:
    // GMAIL_API configured -> GMAIL_API (HTTPS port 443 — top priority, solves Railway SMTP block & Resend domain check)
    // RESEND_API_KEY configured -> Resend HTTPS API (port 443)
    // Otherwise -> SMTP / jsonTransport
    if (this.isGmailApiConfigured) {
      this.provider = "gmail-api";
      this.transporter = null;
      this.logger.log(`[MailService] Active email provider: GMAIL_API HTTPS REST API (port 443, authMethod: ${this.gmailAuthMethod})`);
    } else if (this.resendApiKey) {
      this.provider = "resend";
      this.transporter = null;
      this.logger.log("[MailService] Active email provider: Resend HTTPS API (port 443)");
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
          "[MailService] FATAL: No valid production email credentials configured. Configure GMAIL_API credentials in Railway environment variables.",
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

    // Structured provider selection diagnostic (safe — booleans only, no secrets)
    this.logger.log(
      `[email] provider selection:\n  gmail variables configured = ${this.isGmailApiConfigured}\n  resend configured = ${Boolean(this.resendApiKey)}\n  smtp configured = ${this.isSmtpConfigured}\n  active provider = ${this.provider}`
    );
  }

  async onModuleInit() {
    if (this.provider === "gmail-api") {
      this.verifyConnection()
        .then((res) => {
          if (res.ok) {
            this.logger.log(`[email] ✓ Gmail API authentication & token reachability verified: ${res.message}`);
          } else {
            this.logger.error(`[email] ✗ Gmail API verification failed: ${res.message}`);
          }
        })
        .catch((err) => {
          this.logger.error(`[email] ✗ Gmail API verification unexpected error: ${err.message}`);
        });
    } else if (this.provider === "resend") {
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
   * Acquires a valid OAuth2 access token for the Gmail API using either
   * an offline OAuth2 refresh token or a service account JWT bearer flow.
   * Caches token in memory until expiration.
   */
  private async getGmailAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    // Return cached token if valid for at least 60 more seconds
    if (this.gmailCachedAccessToken && this.gmailTokenExpiresAt > now + 60) {
      return this.gmailCachedAccessToken;
    }

    if (this.gmailAuthMethod === "oauth2_refresh_token") {
      const params = new URLSearchParams({
        client_id: this.gmailClientId,
        client_secret: this.gmailClientSecret,
        refresh_token: this.gmailRefreshToken,
        grant_type: "refresh_token",
      });

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.access_token) {
        const safeError = data?.error_description || data?.error || `HTTP_${res.status}`;
        throw new Error(`Gmail API OAuth2 token refresh failed: ${safeError}`);
      }

      this.gmailCachedAccessToken = String(data.access_token);
      this.gmailTokenExpiresAt = now + (data.expires_in || 3600);
      return this.gmailCachedAccessToken;
    }

    if (this.gmailAuthMethod === "service_account") {
      const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
      const claim = Buffer.from(
        JSON.stringify({
          iss: this.googleSaClientEmail,
          sub: this.gmailSenderEmail,
          scope: "https://www.googleapis.com/auth/gmail.send",
          aud: "https://oauth2.googleapis.com/token",
          iat: now,
          exp: now + 3600,
        }),
      ).toString("base64url");

      const signer = (await import("crypto")).createSign("RSA-SHA256");
      signer.update(`${header}.${claim}`);
      const signature = signer.sign(this.googleSaPrivateKey, "base64url");
      const assertion = `${header}.${claim}.${signature}`;

      const params = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      });

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.access_token) {
        const safeError = data?.error_description || data?.error || `HTTP_${res.status}`;
        throw new Error(`Gmail API service account token assertion failed: ${safeError}`);
      }

      this.gmailCachedAccessToken = String(data.access_token);
      this.gmailTokenExpiresAt = now + (data.expires_in || 3600);
      return this.gmailCachedAccessToken;
    }

    throw new Error("No Gmail API authentication credentials configured");
  }

  /**
   * Safe verification method for diagnostic endpoints and startup checks.
   */
  async verifyConnection(): Promise<{ ok: boolean; message: string; code?: string }> {
    if (this.provider === "gmail-api") {
      try {
        const token = await this.getGmailAccessToken();
        if (!token) {
          throw new Error("Unable to obtain Gmail API access token");
        }
        // Test Gmail API token validation via Google OAuth tokeninfo endpoint
        const tokenInfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`,
        );
        const tokenInfo: any = await tokenInfoRes.json().catch(() => ({}));

        if (!tokenInfoRes.ok) {
          const err = tokenInfo?.error_description || tokenInfo?.error || "Invalid access token";
          this.smtpVerified = false;
          this.smtpLastError = String(err);
          return { ok: false, message: String(err), code: "EGMAIL_TOKEN_INVALID" };
        }

        const scope = String(tokenInfo?.scope || "");
        if (!scope.includes("gmail.send") && !scope.includes("mail.google.com")) {
          const warnMsg = `Token acquired but lacks gmail.send scope (scopes: ${scope})`;
          this.smtpVerified = false;
          this.smtpLastError = warnMsg;
          return { ok: false, message: warnMsg, code: "ESCOPE_MISSING" };
        }

        this.smtpVerified = true;
        this.smtpLastError = null;
        return {
          ok: true,
          message: `Gmail API authentication verified for ${this.maskEmail(this.gmailSenderEmail)} (scope: gmail.send)`,
        };
      } catch (err: any) {
        this.smtpVerified = false;
        const errMsg = err.message || String(err);
        this.smtpLastError = errMsg;
        return { ok: false, message: errMsg, code: "EGMAIL_API_AUTH_FAILED" };
      }
    }

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
    if (this.provider === "gmail-api") {
      return {
        configured: true,
        status: this.smtpLastError ? "down" : "up",
        provider: "gmail-api",
        transport: "https",
        host: "gmail.googleapis.com",
        port: 443,
        secure: true,
        sender: this.maskEmail(this.gmailSenderEmail),
        authMethod: this.gmailAuthMethod === "none" ? undefined : this.gmailAuthMethod,
        error: this.smtpLastError,
      };
    }

    if (this.provider === "resend") {
      return {
        configured: true,
        status: this.smtpLastError ? "down" : "up",
        provider: "resend",
        transport: "https",
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
        transport: "none",
      };
    }

    return {
      configured: true,
      status: this.smtpVerified ? "up" : this.smtpLastError ? "down" : "unverified",
      provider: "smtp",
      transport: "smtp",
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
      gmailApiAuth: { status: "TESTING" },
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

    // 5. HTTPS 443 (test reachability to gmail.googleapis.com)
    diagnostic.https443 = await this.testTcp("gmail.googleapis.com", 443, 3000);

    // 6. Gmail API Auth Check
    if (this.provider === "gmail-api") {
      const v = await this.verifyConnection();
      diagnostic.gmailApiAuth = {
        status: v.ok ? "PASS" : "FAIL",
        message: v.message,
        code: v.code,
      };
      diagnostic.analysis = v.ok
        ? "GMAIL_API_ACTIVE_AND_HEALTHY: Email is routed over HTTPS/443 directly to Gmail API using the official sender mailbox. Outbound SMTP port restrictions do not apply."
        : `GMAIL_API_AUTH_ISSUE: ${v.message}`;
      return diagnostic;
    }

    // SMTP Handshake / AUTH if TCP 587 or 465 passed
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
      diagnostic.analysis = "RESEND_ACTIVE: Resend HTTPS REST API is the active email provider.";
    } else if (
      diagnostic.tcp587.status === "FAIL" &&
      diagnostic.tcp465.status === "FAIL" &&
      diagnostic.https443.status === "PASS"
    ) {
      diagnostic.analysis =
        "RAILWAY_OUTBOUND_SMTP_RESTRICTION_CONFIRMED: Railway blocks direct outbound TCP connections on SMTP ports 25, 465, and 587. Standard HTTPS on port 443 is OPEN. Configure Gmail API variables to send emails via Gmail API over HTTPS.";
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
   * Sends an email via Google Gmail REST API (POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send)
   * over HTTPS port 443.
   *
   * Formats a complete, standard RFC 2822 / MIME message via nodemailer streamTransport
   * (supporting From, To, Subject, HTML, Text, attachments, inline images) and encodes
   * it as base64url for Gmail API.
   *
   * NEVER logs authorization headers, tokens, or client secrets.
   */
  private async sendViaGmailApi(
    mailOptions: nodemailer.SendMailOptions,
    logRecordId: string | undefined,
    maskedRecipient: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string; code?: string }> {
    const from = mailOptions.from || `Success MP Online <${this.gmailSenderEmail}>`;
    this.logger.log(
      `[gmail-api] send started: from="${from}" to=${maskedRecipient} subject="${String(mailOptions.subject || "")}"`,
    );

    try {
      // 1. Acquire valid access token over HTTPS/443
      const accessToken = await this.getGmailAccessToken();

      // 2. Build complete RFC 2822 MIME message using nodemailer's stream transport
      const mimeTransport = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
      });

      const mimeResult: any = await new Promise((resolve, reject) => {
        mimeTransport.sendMail(
          {
            ...mailOptions,
            from,
          },
          (err, info) => {
            if (err) return reject(err);
            resolve(info);
          },
        );
      });

      const rawMimeBuffer: Buffer = mimeResult.message;
      if (!rawMimeBuffer || rawMimeBuffer.length === 0) {
        throw new Error("Failed to generate RFC 2822 MIME message buffer");
      }

      // 3. Base64url encode the MIME message for the Gmail API payload
      const rawBase64Url = rawMimeBuffer.toString("base64url");

      // 4. POST to Gmail API https://gmail.googleapis.com/gmail/v1/users/me/messages/send
      this.logger.log(
        `[gmail-api] POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send — EXECUTING`,
      );

      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: rawBase64Url }),
        },
      );

      const status = res.status;
      const data: any = await res.json().catch(() => ({}));

      if (res.ok && data?.id) {
        const messageId = data.id;
        this.logger.log(
          `[gmail-api] send accepted: Gmail message ID=${messageId} (threadId: ${data.threadId || "none"})`,
        );

        if (logRecordId) {
          await this.prisma.notificationLog
            .update({
              where: { id: logRecordId },
              data: { status: NotificationStatus.SENT, sentAt: new Date(), error: null },
            })
            .catch(() => {});
        }

        return { success: true, messageId };
      } else {
        // Safe error logging: no secrets or auth tokens logged
        const safeError = data?.error?.message || data?.error || `Gmail API HTTP error ${status}`;
        const safeCode = data?.error?.status || `HTTP_${status}`;
        this.logger.error(
          `[gmail-api] send failed: status=${status} code=${safeCode} message="${safeError}"`,
        );

        if (logRecordId) {
          await this.prisma.notificationLog
            .update({
              where: { id: logRecordId },
              data: { status: NotificationStatus.FAILED, error: safeError },
            })
            .catch(() => {});
        }

        return { success: false, error: safeError, code: safeCode };
      }
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      this.logger.error(`[gmail-api] unexpected send error: ${errorMsg}`);

      if (logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: logRecordId },
            data: { status: NotificationStatus.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }

      return { success: false, error: errorMsg, code: "EGMAIL_SEND_ERROR" };
    }
  }

  /**
   * Dispatches email via Resend HTTPS REST API (port 443).
   * Secondary fallback if GMAIL_API is not configured.
   */
  private async sendViaResend(
    mailOptions: nodemailer.SendMailOptions,
    logRecordId: string | undefined,
    maskedRecipient: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string; code?: string }> {
    const to = Array.isArray(mailOptions.to)
      ? mailOptions.to.map((t) => String(t))
      : [String(mailOptions.to || "")];

    let resendFrom = this.resendFrom;
    if (
      mailOptions.from &&
      typeof mailOptions.from === "string" &&
      !mailOptions.from.toLowerCase().includes("gmail.com") &&
      mailOptions.from !== this.fromAddress
    ) {
      resendFrom = mailOptions.from;
    }

    let htmlContent = mailOptions.html as string | undefined;
    if (typeof htmlContent === "string" && htmlContent.includes(`cid:${LOGO_CID}`)) {
      const publicLogoUrl = this.frontendUrl
        ? `${this.frontendUrl}/logo.png`
        : "https://intelligent-determination-production-4296.up.railway.app/logo.png";
      htmlContent = htmlContent.split(`cid:${LOGO_CID}`).join(publicLogoUrl);
    }

    const payload: any = {
      from: resendFrom,
      to,
      subject: mailOptions.subject,
      html: htmlContent,
      text: mailOptions.text,
    };

    if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length > 0) {
      const realAttachments = mailOptions.attachments.filter(
        (att: any) => att.cid !== LOGO_CID && att.id !== LOGO_CID,
      );

      if (realAttachments.length > 0) {
        payload.attachments = realAttachments.map((att: any) => {
          let contentBase64 = "";
          if (Buffer.isBuffer(att.content)) {
            contentBase64 = att.content.toString("base64");
          } else if (typeof att.content === "string") {
            contentBase64 = Buffer.from(
              att.content.replace(/^data:[^;]+;base64,/, ""),
              "base64",
            ).toString("base64");
          }
          return {
            filename: att.filename || "attachment.png",
            content: contentBase64,
          };
        });
      }
    }

    this.logger.log(
      `[resend-diag] sendViaResend() CALLED — from="${resendFrom}" to=${maskedRecipient} subject="${String(mailOptions.subject || "")}"`,
    );

    const executeResendPost = async (fromAddress: string, attempt: string) => {
      payload.from = fromAddress;
      this.logger.log(
        `[resend-diag] attempt=${attempt} submitting from="${fromAddress}" to=${maskedRecipient}`,
      );
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const status = res.status;
      const data: any = await res.json().catch(() => ({}));

      const safeBody = {
        id: data?.id ?? null,
        name: data?.name ?? null,
        message: data?.message ?? null,
        statusCode: data?.statusCode ?? null,
        errorName: data?.error?.name ?? null,
        errorMessage: data?.error?.message ?? null,
      };
      this.logger.log(
        `[resend-diag] attempt=${attempt} HTTP status=${status} responseBody=${JSON.stringify(safeBody)}`,
      );
      if (data?.id) {
        this.logger.log(
          `[resend-diag] attempt=${attempt} Resend message ID=${data.id} — ACCEPTED`,
        );
      } else {
        this.logger.warn(
          `[resend-diag] attempt=${attempt} NO message ID returned — status=${status} name="${safeBody.name}" message="${safeBody.message}"`,
        );
      }

      return { res, status, data };
    };

    try {
      let { res, status, data } = await executeResendPost(resendFrom, "primary");
      this.logger.log(`[email] provider=resend response status=${status}`);

      const isDomainVerificationError =
        status === 403 ||
        ((status === 403 || status === 422) &&
          (data?.message?.toLowerCase().includes("domain") ||
            data?.message?.toLowerCase().includes("not verified") ||
            data?.name === "validation_error"));

      if (!res.ok && isDomainVerificationError && !resendFrom.includes("onboarding@resend.dev")) {
        const sandboxFrom = "Success MP Online <onboarding@resend.dev>";
        this.logger.warn(
          `[email] provider=resend domain not verified for "${resendFrom}" (HTTP ${status}). Retrying with sandbox sender "${sandboxFrom}"...`,
        );
        const retry = await executeResendPost(sandboxFrom, "sandbox-fallback");
        res = retry.res;
        status = retry.status;
        data = retry.data;
        this.logger.log(`[email] provider=resend response status=${status} (sandbox fallback)`);
      }

      if (res.ok && data?.id) {
        this.logger.log(`[email] provider=resend send accepted id=${data.id}`);

        if (logRecordId) {
          await this.prisma.notificationLog
            .update({
              where: { id: logRecordId },
              data: { status: NotificationStatus.SENT, sentAt: new Date(), error: null },
            })
            .catch(() => {});
        }

        return { success: true, messageId: data.id };
      } else {
        const safeErrorCode = data?.name || data?.error?.name || `HTTP_${status}`;
        const errorMsg =
          data?.message || data?.error?.message || `Resend API error (status ${status})`;
        this.logger.error(
          `[email] provider=resend send failed code=${safeErrorCode} status=${status} message="${errorMsg}"`,
        );

        if (logRecordId) {
          await this.prisma.notificationLog
            .update({
              where: { id: logRecordId },
              data: { status: NotificationStatus.FAILED, error: errorMsg },
            })
            .catch(() => {});
        }

        return { success: false, error: errorMsg, code: safeErrorCode };
      }
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      this.logger.error(`[email] provider=resend send failed code=ENETWORK message="${errorMsg}"`);

      if (logRecordId) {
        await this.prisma.notificationLog
          .update({
            where: { id: logRecordId },
            data: { status: NotificationStatus.FAILED, error: errorMsg },
          })
          .catch(() => {});
      }

      return { success: false, error: errorMsg, code: "ENETWORK" };
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
        ? "No valid production email credentials (Gmail API) are configured on the production server."
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

    // 1. If active provider is Gmail API (HTTPS port 443), route directly to Gmail API
    if (this.provider === "gmail-api") {
      return this.sendViaGmailApi(mailOptions, options.logRecordId, maskedRecipient);
    }

    // 2. If active provider is Resend HTTPS API, route via Resend (never touches SMTP)
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
