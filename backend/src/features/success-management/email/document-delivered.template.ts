import { getOfficialEmailHeaderHtml } from "../../../mail/templates/assets/logo";

export interface DocumentDeliveredEmailParams {
  customerName: string;
  serviceName: string;
  applicationNo: string;
  completionDate: string;
  downloadUrl: string;
  supportPhone?: string;
  supportEmail?: string;
  portalUrl?: string;
}

export function generateDocumentDeliveredEmailHtml(
  params: DocumentDeliveredEmailParams,
): string {
  const {
    customerName,
    serviceName,
    applicationNo,
    completionDate,
    downloadUrl,
    supportPhone = "7415921990",
    supportEmail = "support@successmponline.in",
    portalUrl,
  } = params;

  const headerHtml = getOfficialEmailHeaderHtml({
    portalUrl: portalUrl || downloadUrl,
    badgeTitle: "Document Delivery",
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${serviceName} has arrived - Success MP Online</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .message { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .card { background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 8px; margin-bottom: 28px; }
    .card-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #cbd5e1; }
    .card-row:last-child { border-bottom: none; }
    .card-label { font-size: 13px; color: #64748b; font-weight: 600; }
    .card-value { font-size: 13px; color: #0f172a; font-weight: 700; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
    .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    ${headerHtml}
    <div class="content">
      <div class="greeting">Dear ${customerName},</div>
      <div class="message">
        🎉 <strong>Great news!</strong> Your official document for <strong>${serviceName}</strong> has been processed successfully and is now ready for secure download.
      </div>
      
      <div class="card">
        <div class="card-row">
          <span class="card-label">Service</span>
          <span class="card-value">${serviceName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Application ID</span>
          <span class="card-value">${applicationNo}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Completion Date</span>
          <span class="card-value">${completionDate}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Status</span>
          <span class="card-value" style="color: #16a34a;">✅ COMPLETED & DELIVERED</span>
        </div>
      </div>

      <div class="btn-container">
        <a href="${downloadUrl}" class="btn">🚀 View & Download Document</a>
      </div>

      <p class="message" style="font-size: 13px; color: #64748b;">
        If you have any questions or require further assistance, please contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a> or call us at <strong>+91 ${supportPhone}</strong>.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Success MP Online. All rights reserved.<br/>
      Madhya Pradesh Citizen Services Portal
    </div>
  </div>
</body>
</html>
  `;
}

export function generateDocumentDeliveredEmailText(
  params: DocumentDeliveredEmailParams,
): string {
  return `
Dear ${params.customerName},

Great news! Your official document for ${params.serviceName} has been processed successfully.

Application ID: ${params.applicationNo}
Service: ${params.serviceName}
Completion Date: ${params.completionDate}
Status: COMPLETED & DELIVERED

You can access and download your document securely here:
${params.downloadUrl}

Support: ${params.supportEmail || "support@successmponline.in"} | Phone: +91 ${params.supportPhone || "7415921990"}

Thank you,
Success MP Online Support Team
  `.trim();
}
