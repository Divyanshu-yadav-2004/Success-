import { jsPDF } from "jspdf";
import type { Application } from "./types";
import { SERVICE_MAP } from "./services";

// ── Load the official logo as a data-URL for embedding in PDFs ──────────────
// Fetches /logo.png once and caches it.  Falls back gracefully if unavailable.
let _cachedLogoDataUrl: string | null = null;

async function getLogoDataUrl(): Promise<string | null> {
  if (_cachedLogoDataUrl !== null) return _cachedLogoDataUrl;
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        _cachedLogoDataUrl = reader.result as string;
        resolve(_cachedLogoDataUrl);
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function formatApplicationId(appOrId: any): string {
  if (!appOrId) return "SUC-00000000";
  if (typeof appOrId === "object") {
    if (appOrId.application_no && appOrId.application_no.startsWith("SUC-")) {
      return appOrId.application_no;
    }
    appOrId = appOrId.id || "";
  }
  const str = String(appOrId);
  if (str.startsWith("SUC-")) return str;
  const short = str.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `SUC-${short}`;
}

export function generateReceiptPdf(app: Application): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ── Header band ───────────────────────────────────────────────────────────
  doc.setFillColor(13, 71, 161); // #0d47a1 navy
  doc.rect(0, 0, pageWidth, 95, "F");

  // Logo (if already cached synchronously — sync path only in PDF generation)
  if (_cachedLogoDataUrl) {
    try {
      doc.addImage(_cachedLogoDataUrl, "PNG", margin, 10, 72, 72);
    } catch {
      // logo failed — skip silently
    }
  }

  // Brand name + tagline in header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SUCCESS MP ONLINE", margin + ((_cachedLogoDataUrl) ? 80 : 0), 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Government Services Portal — Payment Receipt", margin + ((_cachedLogoDataUrl) ? 80 : 0), 58);
  doc.setFontSize(9);
  doc.text("Government of Madhya Pradesh", margin + ((_cachedLogoDataUrl) ? 80 : 0), 74);

  // Receipt title
  y = 124;
  doc.setTextColor(33, 33, 33);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PAYMENT RECEIPT", pageWidth / 2, y, { align: "center" });

  // Divider
  y += 12;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);

  // Application meta
  y += 28;
  doc.setFontSize(11);
  const service = SERVICE_MAP[app.service_type];
  const leftX = margin;
  const rightX = pageWidth - margin;

  const row = (label: string, value: string, ry: number, alignRight = false) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(label.toUpperCase(), alignRight ? rightX : leftX, ry, {
      align: alignRight ? "right" : "left",
    });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(11);
    doc.text(value, alignRight ? rightX : leftX, ry + 16, {
      align: alignRight ? "right" : "left",
    });
  };

  const applicantName = app.applicant_name || app.form_data?.applicant_name || "Applicant";
  const applicantEmail = app.applicant_email || app.form_data?.applicant_email || "";
  const applicantPhone = app.applicant_phone || app.form_data?.applicant_phone || "";
  const paymentStatus = app.payment_status || app.form_data?.payment_status || "paid";
  const amount = app.amount ?? app.form_data?.amount ?? service?.fee ?? 0;
  const paymentId = app.payment_id || app.form_data?.payment_id || "N/A";
  const detailsObj = app.details || app.form_data?.details || {};

  row("Application ID", formatApplicationId(app.id), y);
  row("Date", new Date(app.created_at).toLocaleString("en-IN"), y, true);
  y += 44;

  row("Service", service?.name || app.service_type, y);
  row("Status", app.status.replace("_", " ").toUpperCase(), y, true);
  y += 44;

  row("Applicant Name", applicantName, y);
  row("Payment Status", paymentStatus.toUpperCase(), y, true);
  y += 44;

  row("Email", applicantEmail, y);
  row("Phone", applicantPhone, y, true);
  y += 44;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // Submitted details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("SUBMITTED DETAILS", leftX, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);

  const entries = Object.entries(detailsObj);
  const colWidth = contentWidth / 2;
  entries.forEach((entry, i) => {
    const [key, value] = entry as [string, string];
    const col = i % 2;
    const r = Math.floor(i / 2);
    const x = leftX + col * colWidth;
    const ry = y + r * 34;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()),
      x,
      ry,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(String(value ?? "-"), colWidth - 20);
    doc.text(lines, x, ry + 14);
  });
  y += Math.ceil(entries.length / 2) * 34 + 10;

  // Amount box
  doc.setFillColor(240, 247, 255);
  doc.setDrawColor(13, 71, 161);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, y, contentWidth, 70, 6, 6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(13, 71, 161);
  doc.text("AMOUNT PAID", margin + 16, y + 26);
  doc.setFontSize(20);
  doc.text(`Rs. ${Number(amount).toLocaleString("en-IN")}/-`, margin + 16, y + 52);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Payment Ref: ${paymentId}`,
    pageWidth - margin - 16,
    y + 52,
    { align: "right" },
  );

  y += 96;

  // Stamp
  doc.setDrawColor(26, 143, 90);
  doc.setTextColor(26, 143, 90);
  doc.setLineWidth(2.5);
  doc.circle(pageWidth - margin - 70, y + 30, 42, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("PAID", pageWidth - margin - 70, y + 26, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Success MP Online", pageWidth - margin - 70, y + 40, {
    align: "center",
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 50;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "This is a computer-generated receipt and does not require a physical signature.",
    pageWidth / 2,
    footerY + 16,
    { align: "center" },
  );
  doc.text(
    "Success MP Online | support@successmponline.in | Support: 7415921990",
    pageWidth / 2,
    footerY + 30,
    { align: "center" },
  );

  return doc;
}

export async function downloadReceipt(app: Application) {
  // Pre-fetch logo so it is available synchronously inside generateReceiptPdf
  await getLogoDataUrl();
  const doc = generateReceiptPdf(app);
  doc.save(`${formatApplicationId(app.id)}.pdf`);
}
