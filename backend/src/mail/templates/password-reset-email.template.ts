// ─────────────────────────────────────────────────────────────────────────────
// Password Reset Email Template  — Success MP Online
// ─────────────────────────────────────────────────────────────────────────────

import { getOfficialEmailHeaderHtml } from "./assets/logo";

export interface PasswordResetEmailOptions {
  userName: string;
  resetUrl: string;
  supportEmail: string;
  supportPhone: string;
  portalUrl?: string;
}

export function generatePasswordResetEmailHtml(
  opts: PasswordResetEmailOptions,
): string {
  const { userName, resetUrl, supportEmail, supportPhone, portalUrl } = opts;

  const headerHtml = getOfficialEmailHeaderHtml({
    portalUrl,
    badgeTitle: "Password Reset Request",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Success MP Online Password</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: #f0f4f9; font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,64,175,0.10); }
    .body { padding: 40px 40px 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .message { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 32px; }
    .btn-wrap { text-align: center; margin-bottom: 32px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #1d4ed8, #1e40af); color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 40px; border-radius: 12px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(29,78,216,0.35); }
    .expiry-box { background: #fef9c3; border: 1px solid #fde047; border-radius: 10px; padding: 14px 20px; font-size: 13px; color: #854d0e; margin-bottom: 28px; display: flex; align-items: flex-start; gap: 8px; }
    .expiry-icon { font-size: 18px; flex-shrink: 0; }
    .ignore-note { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 20px; font-size: 13px; color: #64748b; margin-bottom: 32px; line-height: 1.6; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin-bottom: 28px; }
    .support-title { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 10px; }
    .support-item { font-size: 13px; color: #475569; margin-bottom: 6px; }
    .support-item a { color: #1d4ed8; text-decoration: none; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; text-align: center; }
    .footer-name { font-size: 13px; font-weight: 700; color: #1e3a8a; margin-bottom: 4px; }
    .footer-sub  { font-size: 11px; color: #94a3b8; }
    .footer-tricolor { display: flex; height: 3px; margin-top: 16px; border-radius: 2px; overflow: hidden; }
  </style>
</head>
<body>
  <div class="wrapper">
    ${headerHtml}

    <!-- Body -->
    <div class="body">
      <p class="greeting">Hello, ${userName}</p>
      <p class="message">
        We received a request to reset the password for your <strong>Success MP Online</strong> account.<br/><br/>
        Click the button below to create a new password:
      </p>

      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>

      <div class="expiry-box">
        <span class="expiry-icon">⏱️</span>
        <span><strong>This secure link will expire in 15 minutes</strong> for your security.</span>
      </div>

      <div class="ignore-note">
        🔒 <strong>Didn't request this?</strong><br/>
        If you didn't request a password reset, you can safely ignore this email.
        Your account remains secure and no changes have been made.
      </div>

      <hr class="divider" />

      <p class="support-title">Need Help?</p>
      <p class="support-item">📧 <a href="mailto:${supportEmail}">${supportEmail}</a></p>
      <p class="support-item">📞 ${supportPhone}</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-name">Success MP Online</p>
      <p class="footer-sub">Govt. of Madhya Pradesh — All transactions are secured &amp; encrypted</p>
      <div class="footer-tricolor">
        <div class="tricolor-saffron" style="flex:1"></div>
        <div class="tricolor-white" style="flex:1; background:#e2e8f0"></div>
        <div class="tricolor-green" style="flex:1"></div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generatePasswordResetEmailText(
  opts: PasswordResetEmailOptions,
): string {
  const { userName, resetUrl, supportEmail, supportPhone } = opts;
  return `
Success MP Online — Password Reset Request
==========================================

Hello, ${userName},

We received a request to reset the password for your Success MP Online account.

Reset your password here:
${resetUrl}

This link will expire in 15 minutes.

If you didn't request a password reset, you can safely ignore this email.
Your account remains secure.

--
Need Help?
Email: ${supportEmail}
Phone: ${supportPhone}

Success MP Online — Secure Digital Citizen Services
Govt. of Madhya Pradesh
`.trim();
}
