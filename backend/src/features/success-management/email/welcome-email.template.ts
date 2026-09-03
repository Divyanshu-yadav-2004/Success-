/**
 * backend/src/features/success-management/email/welcome-email.template.ts
 *
 * Premium registration/welcome email for Success MP Online.
 *
 * Design highlights:
 * - Table-based layout (Gmail, Outlook, Apple Mail, Android compatible)
 * - Arial/Helvetica font stack (reliable across all email clients)
 * - Real Success MP Online logo embedded as base64 PNG (no external URL needed)
 * - Indian tricolor header accent strip
 * - Navy brand header with logo, name, tagline
 * - Clean account details card
 * - Security notice + support section
 * - Professional dark footer
 * - IST registration date/time
 * - Full mobile responsiveness via inline media queries
 */

import { LOGO_CID } from "../../../mail/templates/assets/logo";

export interface WelcomeEmailParams {
  customerName: string;
  email: string;
  mobileNumber?: string | null;
  registrationDate: string;
  dashboardUrl: string;
  supportPhone?: string;
  supportEmail?: string;
  /** Public HTTPS logo URL. Falls back to the inline CID logo when omitted. */
  logoUrl?: string;
}

const LOGO_CONTENT_ID = "success-mp-online-logo";

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHttpUrl(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

export function safeHttpsUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** CID kept for backward compatibility — base64 logo is now the primary approach */
export function getWelcomeEmailLogoContentId(): string {
  return LOGO_CONTENT_ID;
}

export function generateWelcomeEmailHtml(params: WelcomeEmailParams): string {
  const supportPhone = escapeHtml(params.supportPhone || "7415921990");
  const supportEmail = escapeHtml(params.supportEmail || "helpSuccessMPonline@gmail.com");
  const dashboardUrl = safeHttpUrl(params.dashboardUrl, "https://successmponline.in/");
  const name = escapeHtml(params.customerName || "Customer");
  const email = escapeHtml(params.email);
  const phone = escapeHtml(params.mobileNumber || "Not provided");
  const registeredOn = escapeHtml(params.registrationDate);
  const currentYear = new Date().getFullYear();

  // Prefer a public HTTPS asset when configured; CID is the email-safe fallback.
  const logoSrc = safeHttpsUrl(params.logoUrl) || `cid:${LOGO_CID}`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Welcome to Success MP Online</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f0f4f8; }
    /* Preheader hidden text */
    .preheader { display: none; max-height: 0; overflow: hidden; mso-hide: all; }

    @media only screen and (max-width: 620px) {
      .email-card { width: 100% !important; border-radius: 0 !important; }
      .content-cell { padding: 24px 18px !important; }
      .detail-label-cell, .detail-value-cell { display: block !important; width: 100% !important; }
      .detail-label-cell { padding-bottom: 3px !important; border-bottom: none !important; }
      .detail-value-cell { padding-top: 2px !important; padding-bottom: 16px !important; }
      h1.welcome-heading { font-size: 25px !important; line-height: 32px !important; }
      .cta-td { padding: 24px 18px 28px !important; }
      .footer-cell { padding: 24px 18px !important; border-radius: 0 !important; }
      .logo-img { width: 120px !important; height: 120px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: Arial, Helvetica, sans-serif;">

<!-- Preheader -->
<div class="preheader" style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  Welcome! Your Success MP Online account has been created successfully. &#8203;&#8203;&#8203;
</div>

<!-- Outer Table -->
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
  <tr>
    <td align="center" style="padding: 32px 14px;">

      <!-- Email Card -->
      <table class="email-card" role="presentation" width="620" border="0" cellspacing="0" cellpadding="0"
        style="max-width: 620px; width: 100%; background-color: #ffffff; border-radius: 14px;
               box-shadow: 0 4px 24px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.05);
               border: 1px solid #dce5f1; overflow: hidden;">

        <!-- ════════════════════════════════ -->
        <!-- HEADER: Navy + Tricolor + Logo   -->
        <!-- ════════════════════════════════ -->
        <tr>
          <td style="background-color: #0f172a; border-radius: 13px 13px 0 0; overflow: hidden;">

            <!-- Tricolor Strip -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td width="33%" style="background-color: #FF9933; height: 5px; font-size: 1px; line-height: 1px; mso-line-height-rule: exactly;">&#160;</td>
                <td width="34%" style="background-color: #FFFFFF; height: 5px; font-size: 1px; line-height: 1px; mso-line-height-rule: exactly;">&#160;</td>
                <td width="33%" style="background-color: #138808; height: 5px; font-size: 1px; line-height: 1px; mso-line-height-rule: exactly;">&#160;</td>
              </tr>
            </table>

            <!-- Header Content -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding: 28px 24px 24px; background-color: #0f172a;">

                  <!-- Gov Badge -->
                  <p style="margin: 0 0 18px 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px;
                      font-weight: 700; color: #93c5fd; letter-spacing: 0.8px; text-transform: uppercase;">
                    Government of Madhya Pradesh &#x2022; Welcome Email
                  </p>

                  <!-- Logo (public HTTPS asset or inline CID attachment) -->
                  <a href="${dashboardUrl}" target="_blank" style="text-decoration: none; display: block;">
                    <img
                      class="logo-img"
                      src="${logoSrc}"
                      alt="Success MP Online Logo"
                      width="140"
                      height="140"
                      style="display: block; margin: 0 auto; width: 140px; height: 140px; border: 0; outline: none;"
                    />
                  </a>

                  <!-- Brand Name -->
                  <p style="margin: 14px 0 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 22px;
                      font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                    <a href="${dashboardUrl}" target="_blank" style="color: #ffffff; text-decoration: none;">Success MP Online</a>
                  </p>
                  <!-- Tagline -->
                  <p style="margin: 5px 0 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px;
                      color: #94a3b8;">
                    Government Digital Services Portal &#x2022; Madhya Pradesh
                  </p>

                </td>
              </tr>
              <!-- Divider -->
              <tr>
                <td style="height: 1px; background-color: rgba(255,255,255,0.10); font-size: 1px; line-height: 1px; mso-line-height-rule: exactly;">&#160;</td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ════════════════════════════════ -->
        <!-- MAIN CONTENT                     -->
        <!-- ════════════════════════════════ -->
        <tr>
          <td class="content-cell" style="padding: 36px 40px 32px 40px;">

            <!-- Welcome Section -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding-bottom: 28px;">

                  <!-- Success Badge -->
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 50px;
                          padding: 7px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px;
                          font-weight: 700; color: #15803d;">
                        &#10003;&nbsp;&nbsp;Registration Successful
                      </td>
                    </tr>
                  </table>

                  <!-- Heading -->
                  <h1 class="welcome-heading" style="margin: 20px 0 12px 0; font-family: Arial, Helvetica, sans-serif;
                      font-size: 30px; font-weight: 700; color: #0f172a; line-height: 1.25; letter-spacing: -0.5px;">
                    Welcome to<br />Success MP Online
                  </h1>

                  <!-- Intro -->
                  <p style="margin: 0 auto; max-width: 460px; font-family: Arial, Helvetica, sans-serif;
                      font-size: 15px; line-height: 1.65; color: #475569; text-align: center;">
                    Hello <strong style="color: #0f172a;">${name}</strong>, your account has been successfully
                    created. You can now access <strong style="color: #1e3a8a;">Success MP Online</strong>
                    and use our digital services securely and conveniently.
                  </p>

                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr><td style="height: 1px; background-color: #e2e8f0; font-size: 1px; line-height: 1px;">&#160;</td></tr>
            </table>

            <!-- Account Details Card -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
              <tr>
                <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">

                  <!-- Card Header -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color: #1e3a8a; padding: 12px 20px; border-radius: 9px 9px 0 0;">
                        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px;
                            font-weight: 700; color: #ffffff; letter-spacing: 0.6px; text-transform: uppercase;">
                          Account Details
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Detail: Name -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
                    style="border-bottom: 1px solid #e2e8f0;">
                    <tr>
                      <td class="detail-label-cell" width="42%" style="padding: 14px 12px 14px 20px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: #64748b;
                          text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                        Registered Name
                      </td>
                      <td class="detail-value-cell" style="padding: 14px 20px 14px 8px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;
                          word-break: break-word;">
                        ${name}
                      </td>
                    </tr>
                  </table>

                  <!-- Detail: Mobile -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
                    style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
                    <tr>
                      <td class="detail-label-cell" width="42%" style="padding: 14px 12px 14px 20px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: #64748b;
                          text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                        Mobile Number
                      </td>
                      <td class="detail-value-cell" style="padding: 14px 20px 14px 8px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;">
                        ${phone}
                      </td>
                    </tr>
                  </table>

                  <!-- Detail: Email -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
                    style="border-bottom: 1px solid #e2e8f0;">
                    <tr>
                      <td class="detail-label-cell" width="42%" style="padding: 14px 12px 14px 20px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: #64748b;
                          text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                        Email Address
                      </td>
                      <td class="detail-value-cell" style="padding: 14px 20px 14px 8px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;
                          word-break: break-all;">
                        ${email}
                      </td>
                    </tr>
                  </table>

                  <!-- Detail: Date -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0"
                    style="background-color: #ffffff;">
                    <tr>
                      <td class="detail-label-cell" width="42%" style="padding: 14px 12px 14px 20px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: #64748b;
                          text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
                        Registration Date
                      </td>
                      <td class="detail-value-cell" style="padding: 14px 20px 14px 8px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;">
                        ${registeredOn}
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
              <tr>
                <td class="cta-td" align="center">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" bgcolor="#1e3a8a" style="border-radius: 8px; mso-padding-alt: 0;">
                        <a href="${dashboardUrl}" target="_blank"
                          style="display: inline-block; padding: 15px 40px; font-family: Arial, Helvetica, sans-serif;
                                 font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none;
                                 border-radius: 8px; letter-spacing: 0.2px; mso-padding-alt: 15px 40px;">
                          Open Success MP Online &nbsp;&rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Security Notice -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
              <tr>
                <td style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px 20px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="vertical-align: top; padding-right: 12px; width: 28px; font-size: 20px; line-height: 1.2;">
                        &#128274;
                      </td>
                      <td>
                        <p style="margin: 0 0 5px 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px;
                            font-weight: 700; color: #92400e;">Your account is secure</p>
                        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px;
                            line-height: 1.6; color: #78350f;">
                          Please never share your password, OTP or other confidential account
                          information with anyone.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Support Section -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
              <tr>
                <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px;">
                  <p style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px;
                      font-weight: 700; color: #0f172a;">Need Help?</p>
                  <p style="margin: 0 0 14px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px;
                      line-height: 1.6; color: #475569;">
                    For assistance, please contact our support team.
                  </p>
                  <p style="margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #334155;">
                    &#9993;&nbsp;&nbsp;<a href="mailto:${supportEmail}"
                      style="color: #1e3a8a; font-weight: 600; text-decoration: none;">${supportEmail}</a>
                  </p>
                  <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #334155;">
                    &#128222;&nbsp;&nbsp;<a href="tel:${supportPhone}"
                      style="color: #1e3a8a; font-weight: 600; text-decoration: none;">${supportPhone}</a>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ════════════════════════════════ -->
        <!-- FOOTER                           -->
        <!-- ════════════════════════════════ -->
        <tr>
          <td class="footer-cell" style="background-color: #0f172a; padding: 28px 40px; border-radius: 0 0 13px 13px;">

            <p style="margin: 0 0 4px 0; text-align: center; font-family: Arial, Helvetica, sans-serif;
                font-size: 15px; font-weight: 700; color: #ffffff;">
              Success MP Online
            </p>
            <p style="margin: 0 0 18px 0; text-align: center; font-family: Arial, Helvetica, sans-serif;
                font-size: 12px; color: #94a3b8; line-height: 1.5;">
              Digital services made simple, secure and accessible.
            </p>

            <!-- Divider -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr><td style="height: 1px; background-color: rgba(255,255,255,0.10); font-size: 1px; line-height: 1px;">&#160;</td></tr>
            </table>

            <p style="margin: 16px 0 0 0; text-align: center; font-family: Arial, Helvetica, sans-serif;
                font-size: 12px; color: #64748b; line-height: 1.7;">
              &copy; ${currentYear} Success MP Online. All rights reserved.<br />
              <span style="font-size: 11px; color: #475569;">
                This is an automated email. Please do not reply to this message.
              </span>
            </p>

          </td>
        </tr>

      </table>
      <!-- /Email Card -->

    </td>
  </tr>
</table>

</body>
</html>`;
}

export function generateWelcomeEmailText(params: WelcomeEmailParams): string {
  const currentYear = new Date().getFullYear();
  return `=====================================================
SUCCESS MP ONLINE - WELCOME & REGISTRATION CONFIRMED
=====================================================

Hello ${params.customerName},

Your account has been successfully created on Success MP Online.
You can now access our digital services securely and conveniently.

✓ REGISTRATION SUCCESSFUL

ACCOUNT DETAILS:
-----------------------------------------------------
• Registered Name  : ${params.customerName}
• Mobile Number    : ${params.mobileNumber || "Not provided"}
• Email Address    : ${params.email}
• Registration Date: ${params.registrationDate}
-----------------------------------------------------

OPEN PORTAL:
${params.dashboardUrl}

SECURITY NOTICE:
Please never share your password, OTP or other confidential
account information with anyone.

NEED HELP?
• Email : ${params.supportEmail || "helpSuccessMPonline@gmail.com"}
• Phone : ${params.supportPhone || "7415921990"}

-----------------------------------------------------
© ${currentYear} Success MP Online. All rights reserved.
Digital services made simple, secure and accessible.
`;
}
