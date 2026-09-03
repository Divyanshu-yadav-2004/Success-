/**
 * backend/src/mail/templates/registration-email.template.ts
 *
 * Premium registration/welcome email for Success MP Online.
 * - Table-based layout (Gmail, Outlook, Apple Mail, Android compatible)
 * - Arial/Helvetica font stack only (reliable across all email clients)
 * - Embedded real logo via base64 (no external URL dependency)
 * - IST registration date/time
 * - Fully mobile-responsive with inline styles
 */

import { getOfficialEmailHeaderHtml } from "./assets/logo";

export interface RegistrationEmailParams {
  userName: string;
  mobileNumber: string;
  email: string;
  registrationDate: string; // Pre-formatted IST string
  portalUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export function generateRegistrationEmailHtml(params: RegistrationEmailParams): string {
  const {
    userName,
    mobileNumber,
    email,
    registrationDate,
    portalUrl = "http://localhost:5173",
    supportEmail = "helpSuccessMPonline@gmail.com",
    supportPhone = "7415921990",
  } = params;

  const currentYear = new Date().getFullYear();

  const headerHtml = getOfficialEmailHeaderHtml({
    portalUrl,
    badgeTitle: "Welcome Email",
  });

  // Escape user data to prevent XSS in email
  const escapeHtml = (str: string): string =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const safeName = escapeHtml(userName);
  const safeMobile = escapeHtml(mobileNumber);
  const safeEmail = escapeHtml(email);
  const safeDate = escapeHtml(registrationDate);
  const safePortalUrl = escapeHtml(portalUrl);
  const safeSupportEmail = escapeHtml(supportEmail);
  const safeSupportPhone = escapeHtml(supportPhone);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>Welcome to Success MP Online</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f0f4f8; }

    /* Mobile styles */
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .content-cell { padding: 24px 20px !important; }
      .detail-row td { display: block !important; width: 100% !important; box-sizing: border-box; }
      .detail-label-cell { padding-bottom: 2px !important; border-bottom: none !important; }
      .detail-value-cell { padding-top: 2px !important; padding-bottom: 14px !important; }
      .cta-button { width: 90% !important; padding: 15px 20px !important; }
      h1.main-heading { font-size: 26px !important; }
      .footer-cell { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f4f8; font-family: Arial, Helvetica, sans-serif;">

<!-- Outer wrapper -->
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f0f4f8;">
  <tr>
    <td align="center" style="padding: 32px 16px;">

      <!-- Email Card (max 620px) -->
      <table class="email-container" role="presentation" width="620" border="0" cellspacing="0" cellpadding="0"
        style="max-width: 620px; width: 100%; background-color: #ffffff; border-radius: 14px; overflow: hidden;
               box-shadow: 0 4px 24px rgba(0,0,0,0.09), 0 1px 6px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">

        <!-- ═══════════════════════════════════════ -->
        <!-- HEADER (logo injected from logo.ts)     -->
        <!-- ═══════════════════════════════════════ -->
        <tr>
          <td>
            ${headerHtml}
          </td>
        </tr>

        <!-- ═══════════════════════════════════════ -->
        <!-- MAIN CONTENT                            -->
        <!-- ═══════════════════════════════════════ -->
        <tr>
          <td class="content-cell" style="padding: 36px 40px 28px 40px;">

            <!-- ── Welcome Section ── -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">

                  <!-- Success Badge -->
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 50px;
                          padding: 8px 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700;
                          color: #15803d; letter-spacing: 0.3px;">
                        &#10003;&nbsp;&nbsp;Registration Successful
                      </td>
                    </tr>
                  </table>

                  <!-- Main Heading -->
                  <h1 class="main-heading" style="margin: 20px 0 12px 0; font-family: Arial, Helvetica, sans-serif;
                      font-size: 30px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; line-height: 1.25;">
                    Welcome to<br />Success MP Online
                  </h1>

                  <!-- Welcome Paragraph -->
                  <p style="margin: 0 auto; max-width: 480px; font-family: Arial, Helvetica, sans-serif;
                      font-size: 15px; line-height: 1.65; color: #475569; text-align: center;">
                    Your account has been successfully created. You can now access
                    <strong style="color: #1e3a8a;">Success MP Online</strong> and use our digital
                    services securely and conveniently.
                  </p>

                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr><td style="height: 1px; background-color: #e2e8f0; font-size: 1px; line-height: 1px;">&#160;</td></tr>
            </table>

            <!-- ── Account Details Card ── -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
              <tr>
                <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">

                  <!-- Card Header -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background-color: #1e3a8a; padding: 12px 20px; border-radius: 9px 9px 0 0;">
                        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700;
                            color: #ffffff; letter-spacing: 0.5px; text-transform: uppercase;">
                          Account Details
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Detail Rows -->
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">

                    <!-- Row 1: Registered Name -->
                    <tr class="detail-row" style="border-bottom: 1px solid #e2e8f0;">
                      <td class="detail-label-cell" style="padding: 14px 20px 14px 20px; width: 40%; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color: #64748b;
                          text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;">
                        Registered Name
                      </td>
                      <td class="detail-value-cell" style="padding: 14px 20px 14px 8px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;
                          word-break: break-word;">
                        ${safeName}
                      </td>
                    </tr>

                    <!-- Row 2: Mobile Number -->
                    <tr class="detail-row" style="border-bottom: 1px solid #e2e8f0; background-color: #ffffff;">
                      <td class="detail-label-cell" style="padding: 14px 20px 14px 20px; width: 40%; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color: #64748b;
                          text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;">
                        Mobile Number
                      </td>
                      <td class="detail-value-cell" style="padding: 14px 20px 14px 8px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;">
                        ${safeMobile}
                      </td>
                    </tr>

                    <!-- Row 3: Email Address -->
                    <tr class="detail-row" style="border-bottom: 1px solid #e2e8f0;">
                      <td class="detail-label-cell" style="padding: 14px 20px 14px 20px; width: 40%; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color: #64748b;
                          text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;">
                        Email Address
                      </td>
                      <td class="detail-value-cell" style="padding: 14px 20px 14px 8px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;
                          word-break: break-all;">
                        ${safeEmail}
                      </td>
                    </tr>

                    <!-- Row 4: Registration Date -->
                    <tr class="detail-row" style="background-color: #ffffff;">
                      <td class="detail-label-cell" style="padding: 14px 20px 14px 20px; width: 40%; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color: #64748b;
                          text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;">
                        Registration Date
                      </td>
                      <td class="detail-value-cell" style="padding: 14px 20px 14px 8px; vertical-align: top;
                          font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 600; color: #0f172a;">
                        ${safeDate}
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>

            <!-- ── Primary CTA Button ── -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
              <tr>
                <td align="center">
                  <a class="cta-button" href="${safePortalUrl}" target="_blank"
                    style="display: inline-block; background-color: #1e3a8a; color: #ffffff;
                           font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 700;
                           text-decoration: none; padding: 15px 40px; border-radius: 8px;
                           letter-spacing: 0.2px; mso-padding-alt: 15px 40px;">
                    Open Success MP Online &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- ── Security Notice ── -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
              <tr>
                <td style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px 20px;">
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="vertical-align: top; padding-right: 12px; width: 24px; font-size: 18px; line-height: 1;">
                        &#128274;
                      </td>
                      <td>
                        <p style="margin: 0 0 4px 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px;
                            font-weight: 700; color: #92400e;">Your account is secure</p>
                        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px;
                            line-height: 1.55; color: #78350f;">
                          Please never share your password, OTP or other confidential account
                          information with anyone.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ── Support Section ── -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 28px;">
              <tr>
                <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px;">
                  <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px;
                      font-weight: 700; color: #0f172a;">Need Help?</p>
                  <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px;
                      line-height: 1.55; color: #475569;">
                    For assistance, please contact our support team.
                  </p>
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding-bottom: 8px;">
                        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #334155;">
                          &#9993;&nbsp;&nbsp;
                          <a href="mailto:${safeSupportEmail}"
                            style="color: #1e3a8a; font-weight: 600; text-decoration: none;">
                            ${safeSupportEmail}
                          </a>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #334155;">
                          &#128222;&nbsp;&nbsp;
                          <a href="tel:${safeSupportPhone}"
                            style="color: #1e3a8a; font-weight: 600; text-decoration: none;">
                            ${safeSupportPhone}
                          </a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

          </td><!-- /content-cell -->
        </tr>

        <!-- ═══════════════════════════════════════ -->
        <!-- FOOTER                                  -->
        <!-- ═══════════════════════════════════════ -->
        <tr>
          <td class="footer-cell" style="background-color: #0f172a; padding: 28px 40px; border-radius: 0 0 14px 14px;">

            <!-- Brand Name in Footer -->
            <p style="margin: 0 0 4px 0; text-align: center; font-family: Arial, Helvetica, sans-serif;
                font-size: 15px; font-weight: 700; color: #ffffff;">
              Success MP Online
            </p>
            <!-- Tagline -->
            <p style="margin: 0 0 16px 0; text-align: center; font-family: Arial, Helvetica, sans-serif;
                font-size: 12px; color: #94a3b8; line-height: 1.5;">
              Digital services made simple, secure and accessible.
            </p>

            <!-- Divider -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr><td style="height: 1px; background-color: rgba(255,255,255,0.10); font-size: 1px; line-height: 1px;">&#160;</td></tr>
            </table>

            <!-- Copyright -->
            <p style="margin: 16px 0 0 0; text-align: center; font-family: Arial, Helvetica, sans-serif;
                font-size: 12px; color: #64748b; line-height: 1.6;">
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
<!-- /Outer wrapper -->

</body>
</html>`;
}

export function generateRegistrationEmailText(params: RegistrationEmailParams): string {
  const {
    userName,
    mobileNumber,
    email,
    registrationDate,
    portalUrl = "http://localhost:5173",
    supportEmail = "helpSuccessMPonline@gmail.com",
    supportPhone = "7415921990",
  } = params;

  const currentYear = new Date().getFullYear();

  return `=====================================================
SUCCESS MP ONLINE - WELCOME & REGISTRATION CONFIRMED
=====================================================

Dear ${userName},

Your account has been successfully created on Success MP Online.
You can now access our digital services securely and conveniently.

✓ REGISTRATION SUCCESSFUL

ACCOUNT DETAILS:
-----------------------------------------------------
• Registered Name  : ${userName}
• Mobile Number    : ${mobileNumber}
• Email Address    : ${email}
• Registration Date: ${registrationDate}
-----------------------------------------------------

OPEN PORTAL:
${portalUrl}

SECURITY NOTICE:
Please never share your password, OTP or other confidential
account information with anyone.

NEED HELP?
• Email  : ${supportEmail}
• Phone  : ${supportPhone}

-----------------------------------------------------
© ${currentYear} Success MP Online. All rights reserved.
Digital services made simple, secure and accessible.
`;
}
