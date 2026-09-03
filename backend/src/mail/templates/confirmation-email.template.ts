import { getOfficialEmailHeaderHtml } from "./assets/logo";

export interface ConfirmationEmailParams {
  applicantName: string;
  applicationNo: string;
  serviceName: string;
  submissionDate: string;
  status: string;
  trackUrl: string;
  supportPhone?: string;
  supportEmail?: string;
  portalUrl?: string;
}

export function generateConfirmationEmailHtml(params: ConfirmationEmailParams): string {
  const {
    applicantName,
    applicationNo,
    serviceName,
    submissionDate,
    status,
    trackUrl,
    supportPhone = "7415921990",
    supportEmail = "support@successmponline.in",
    portalUrl,
  } = params;

  const headerHtml = getOfficialEmailHeaderHtml({
    portalUrl,
    badgeTitle: "Application Confirmation",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Submitted Successfully - Success MP Online</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #1e293b;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      ${headerHtml}

      <div class="content">
        <div class="status-banner">
          <div class="status-icon-circle">✓</div>
          <div>
            <h2 class="status-title">Application Submitted Successfully</h2>
            <p class="status-sub">Your application is saved and queued for official processing.</p>
          </div>
        </div>

        <div class="greeting">Dear ${applicantName},</div>
        <p class="body-text">
          Thank you for choosing <strong>Success MP Online</strong>. Your application for <strong>${serviceName}</strong> has been successfully received, registered, and verified in our portal system.
        </p>

        <div class="details-card">
          <div class="details-title">Application Summary</div>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td class="detail-label" style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">Application ID</td>
              <td class="detail-value" style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">
                <span class="app-id-badge">${applicationNo}</span>
              </td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">Service Name</td>
              <td class="detail-value" style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">${serviceName}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">Submission Date & Time</td>
              <td class="detail-value" style="padding: 8px 0; border-bottom: 1px dashed #e2e8f0;">${submissionDate}</td>
            </tr>
            <tr>
              <td class="detail-label" style="padding: 8px 0;">Current Status</td>
              <td class="detail-value" style="padding: 8px 0;">
                <span class="status-pill">${status}</span>
              </td>
            </tr>
          </table>
        </div>

        <div class="security-notice">
          <div class="security-notice-title">
            🛡️ Important Security Notice
          </div>
          <p class="security-notice-text">
            Please keep your <strong>Application ID (${applicationNo})</strong> safe. You will need it to track your application status, download official receipts, or request support. Never share your account passwords or personal security pins with anyone.
          </p>
        </div>

        <div class="cta-container">
          <a href="${trackUrl}" class="cta-button" target="_blank">Track Application Status &rarr;</a>
        </div>

        <div class="support-card">
          <div class="support-title">Need Help or Have Questions?</div>
          <div class="support-item">📞 <strong>Support Phone:</strong> <a href="tel:${supportPhone}" style="color: #2563eb; text-decoration: none; font-weight: 700;">${supportPhone}</a></div>
          <div class="support-item">✉️ <strong>Email Helpdesk:</strong> <a href="mailto:${supportEmail}" style="color: #2563eb; text-decoration: none;">${supportEmail}</a></div>
          <div class="support-item">🕒 <strong>Operating Hours:</strong> Monday – Saturday (9:00 AM – 7:00 PM IST)</div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-disclaimer">
          Disclaimer: Success MP Online is a dedicated citizen service facilitation portal. This confirmation email was automatically dispatched upon your successful application submission. Please do not reply directly to this automated email.
        </div>
        <div class="footer-copy">
          &copy; 2026 Success MP Online. All rights reserved. | Madhya Pradesh Citizen Portal Services
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateConfirmationEmailText(params: ConfirmationEmailParams): string {
  const {
    applicantName,
    applicationNo,
    serviceName,
    submissionDate,
    status,
    trackUrl,
    supportPhone = "7415921990",
    supportEmail = "support@successmponline.in",
  } = params;

  return `=====================================================
SUCCESS MP ONLINE - APPLICATION SUBMITTED SUCCESSFULLY
=====================================================

Dear ${applicantName},

Thank you for choosing Success MP Online. Your application for ${serviceName} has been successfully received and registered.

APPLICATION DETAILS:
-----------------------------------------------------
• Application ID: ${applicationNo}
• Service Name:   ${serviceName}
• Date & Time:    ${submissionDate}
• Current Status: ${status}
-----------------------------------------------------

IMPORTANT SECURITY NOTICE:
Please keep your Application ID (${applicationNo}) safe. You will need it for tracking, official receipts, and support inquiries.

TRACK YOUR APPLICATION:
You can view your application status anytime at:
${trackUrl}

HELPDESK & SUPPORT:
• Support Phone: ${supportPhone}
• Support Email: ${supportEmail}
• Hours: Monday - Saturday (9:00 AM - 7:00 PM IST)

-----------------------------------------------------
Success MP Online - Citizen Services Facilitation Portal, Madhya Pradesh
© 2026 Success MP Online. All rights reserved.
`;
}
