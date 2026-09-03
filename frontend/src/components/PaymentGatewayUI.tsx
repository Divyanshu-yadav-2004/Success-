import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  QrCode,
  Smartphone,
  AtSign,
  Shield,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Info,
} from "lucide-react";
import { BrandLogo } from "@/features/success-management/branding/BrandLogo";
import { formatApplicationId } from "@/lib/receipt";
import type { Application } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PaymentMethod = "upi_id" | "upi_apps" | "qr_code";

type PaymentState =
  | "idle"
  | "loading_sdk"
  | "creating_order"
  | "awaiting_user"
  | "verifying"
  | "success"
  | "cancelled"
  | "failed"
  | "pending";

interface PaymentGatewayUIProps {
  service: {
    id: string;
    name: string;
    fee: number;
    description?: string;
  };
  application: Application;
  userEmail: string;
  submitting: boolean;
  error: string | null;
  onPay: () => void;
  onBack?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const PaymentGatewayUI: React.FC<PaymentGatewayUIProps> = ({
  service,
  application,
  userEmail,
  submitting,
  error,
  onPay,
  onBack,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("upi_id");
  const [paymentState, setPaymentState] = useState<PaymentState>(
    submitting ? "loading_sdk" : "idle"
  );

  const formattedAppId = formatApplicationId(application.id);

  // Derive display state from props + local state
  const isProcessing = submitting;
  const hasFailed = !submitting && !!error;
  const isCancelled = !submitting && !!error && error.toLowerCase().includes("cancel");

  const handlePay = () => {
    setPaymentState("loading_sdk");
    onPay();
  };

  const METHODS = [
    {
      key: "upi_id" as PaymentMethod,
      icon: AtSign,
      label: "UPI ID",
      sublabel: "Pay via VPA",
    },
    {
      key: "upi_apps" as PaymentMethod,
      icon: Smartphone,
      label: "UPI Apps",
      sublabel: "GPay, PhonePe…",
    },
    {
      key: "qr_code" as PaymentMethod,
      icon: QrCode,
      label: "QR Code",
      sublabel: "Scan & Pay",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-5">

        {/* ── LEFT PANEL: Dark Visual + Branding ───────────────────────── */}
        <div className="lg:col-span-2 bg-[#0d1117] relative flex flex-col justify-between p-7 sm:p-8 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 min-h-[360px] lg:min-h-0">

          {/* Ambient light effect */}
          <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 bg-blue-700/20 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 bg-indigo-800/20 rounded-full blur-3xl" />

          {/* Branding */}
          <div className="relative z-10">
            <BrandLogo variant="dark" showTagline={true} />
            <div className="mt-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
                Live Payment Gateway
              </span>
            </div>
          </div>

          {/* Dynamic Illustration — changes per method */}
          <div
            key={selectedMethod}
            className="relative z-10 my-6 flex items-center justify-center animate-fade-in-scale"
          >
            {selectedMethod === "upi_id" && <UpiIdArtwork fee={service.fee} />}
            {selectedMethod === "upi_apps" && <UpiAppsArtwork />}
            {selectedMethod === "qr_code" && <QrCodeArtwork fee={service.fee} />}
          </div>

          {/* Security badges */}
          <div className="relative z-10 border-t border-slate-800 pt-4 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>256-bit SSL · Payments powered by Razorpay</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>PCI-DSS Compliant · Your data is never stored</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Payment Form ─────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col p-7 sm:p-9 gap-7">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Payment Details
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Complete your payment to submit the application.
              </p>
            </div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 shrink-0 ml-4"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Method Selector — exactly 3 */}
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
              Select Payment Method
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {METHODS.map(({ key, icon: Icon, label, sublabel }) => (
                <button
                  key={key}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setSelectedMethod(key)}
                  className={`relative flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-2xl border text-center transition-all duration-200 cursor-pointer disabled:cursor-not-allowed ${
                    selectedMethod === key
                      ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/20 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {selectedMethod === key && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600" />
                  )}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      selectedMethod === key
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span
                    className={`text-xs font-bold leading-none ${
                      selectedMethod === key ? "text-blue-900" : "text-slate-700"
                    }`}
                  >
                    {label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{sublabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            {selectedMethod === "upi_id" && (
              <div className="animate-fade-in-scale space-y-2">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-blue-600" />
                  Pay via UPI ID / VPA
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click <strong>Pay ₹{service.fee}</strong> below. The Razorpay checkout will open where you can enter your UPI ID (e.g. <span className="font-mono">name@upi</span>), verify it live, and authorise the payment with your UPI PIN.
                </p>
                <div className="flex items-start gap-1.5 mt-1 p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-blue-700">
                    UPI ID verification and payment are handled securely by Razorpay. No credentials are stored on our servers.
                  </span>
                </div>
              </div>
            )}
            {selectedMethod === "upi_apps" && (
              <div className="animate-fade-in-scale space-y-2">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  Pay via UPI App
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click <strong>Pay ₹{service.fee}</strong> below. In the Razorpay checkout, select your preferred UPI app — Google Pay, PhonePe, Paytm, BHIM, or others supported by your bank.
                </p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {["Google Pay", "PhonePe", "Paytm", "BHIM", "Amazon Pay"].map((app) => (
                    <span
                      key={app}
                      className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full"
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedMethod === "qr_code" && (
              <div className="animate-fade-in-scale space-y-2">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  Pay via QR Code
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click <strong>Pay ₹{service.fee}</strong> below. The Razorpay checkout will generate a live UPI QR code for your order. Open any UPI app, tap <em>Scan QR</em>, and authorise with your PIN.
                </p>
                <div className="flex items-start gap-1.5 mt-1 p-2 bg-amber-50 rounded-lg border border-amber-100">
                  <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-amber-700">
                    The QR code is unique to your order and expires after 10 minutes. Do not share it.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                Payment Summary
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Govt. Portal Rate
              </span>
            </div>
            <div className="p-4 space-y-2.5 text-xs">
              <SummaryRow label="Service" value={service.name} />
              <SummaryRow
                label="Application ID"
                value={formattedAppId}
                mono
              />
              <SummaryRow
                label="Applicant"
                value={
                  application.applicant_name ||
                  application.form_data?.applicant_name ||
                  "—"
                }
              />
              <SummaryRow label="Application Fee" value={`₹${service.fee}.00`} />
              <SummaryRow
                label="Convenience Fee"
                value="₹0"
                valueClassName="text-emerald-600 font-semibold"
              />
            </div>
            {/* Total Highlighted Row */}
            <div className="bg-slate-900 px-4 py-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">
                  Total Amount
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  All taxes & fees included
                </span>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                ₹{service.fee}
              </span>
            </div>
          </div>

          {/* Payment State Feedback Area */}
          {isProcessing && (
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-bold text-blue-900">
                  Processing your payment…
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Please complete the payment in the Razorpay window. Do not close or refresh this page.
                </p>
              </div>
            </div>
          )}

          {!isProcessing && isCancelled && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">Payment Cancelled</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You cancelled the payment. Your application is saved — you can retry anytime.
                </p>
              </div>
            </div>
          )}

          {!isProcessing && hasFailed && !isCancelled && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900">Payment Failed</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className={`w-full flex items-center justify-center gap-2.5 font-extrabold text-sm py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg cursor-pointer disabled:cursor-not-allowed ${
                isProcessing
                  ? "bg-slate-200 text-slate-500 shadow-none"
                  : hasFailed || isCancelled
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-300/40 hover:-translate-y-0.5 active:translate-y-0"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Awaiting Payment…</span>
                </>
              ) : hasFailed || isCancelled ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Payment — ₹{service.fee}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-blue-200" />
                  <span>Pay ₹{service.fee} Securely</span>
                  <ArrowRight className="w-4 h-4 text-blue-200 ml-0.5" />
                </>
              )}
            </button>

            {/* Subtle Security note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Secure Payment · Verified by Razorpay</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ─── Shared Row Component ─────────────────────────────────────────────────────

const SummaryRow: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  valueClassName?: string;
}> = ({ label, value, mono = false, valueClassName }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-slate-500 shrink-0">{label}</span>
    <span
      className={`font-semibold text-slate-900 text-right truncate ${
        mono ? "font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200" : ""
      } ${valueClassName ?? ""}`}
    >
      {value}
    </span>
  </div>
);

// ─── Illustration 1: UPI ID — Premium Card Stack ──────────────────────────────

const UpiIdArtwork: React.FC<{ fee: number }> = ({ fee }) => (
  <div className="w-full flex flex-col items-center gap-4 py-2">
    <div className="relative w-56 h-36 select-none">
      {/* Back card */}
      <div className="absolute top-5 left-6 w-48 h-28 rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-900 opacity-60 shadow-xl -rotate-6" />
      {/* Middle card */}
      <div className="absolute top-3 left-3 w-48 h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 opacity-80 shadow-xl -rotate-3" />
      {/* Front card */}
      <div className="absolute top-0 left-0 w-48 h-28 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 shadow-2xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-[9px] font-black text-blue-300 tracking-widest uppercase">Digital UPI</span>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded-full font-bold">
            ✓ Verified
          </span>
        </div>
        <div>
          <div className="text-[10px] font-mono text-blue-300/70 mb-0.5">Virtual Payment Address</div>
          <div className="text-xs font-bold text-white/90 font-mono">yourname@okaxis</div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-400">Government Services Portal</span>
          <span className="text-sm font-black text-white">₹{fee}</span>
        </div>
      </div>
    </div>
    <p className="text-xs text-slate-400 text-center max-w-[200px] leading-relaxed">
      Enter your UPI VPA in the checkout to authorise instantly.
    </p>
  </div>
);

// ─── Illustration 2: UPI Apps — Smartphone Mockup ────────────────────────────

const UpiAppsArtwork: React.FC = () => {
  const apps = [
    { name: "GPay", bg: "bg-emerald-600", opacity: "opacity-100" },
    { name: "PhonePe", bg: "bg-purple-600", opacity: "opacity-80" },
    { name: "Paytm", bg: "bg-cyan-600", opacity: "opacity-70" },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-4 py-2">
      <div className="relative select-none">
        {/* Smartphone frame */}
        <div className="w-28 h-48 bg-slate-900 rounded-[22px] border-2 border-slate-700 shadow-2xl p-2 flex flex-col gap-1.5 relative overflow-hidden">
          {/* Status bar */}
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-1" />

          {/* App tiles */}
          {apps.map((app) => (
            <div
              key={app.name}
              className={`w-full py-2 rounded-xl ${app.bg} ${app.opacity} flex items-center justify-between px-3`}
            >
              <span className="text-[10px] font-bold text-white">{app.name}</span>
              <span className="text-[9px] text-white/80">UPI</span>
            </div>
          ))}

          {/* Shimmer overlay on first app */}
          <div className="absolute top-12 left-2 right-2 h-8 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse-glow rounded-xl pointer-events-none" />

          {/* Home bar */}
          <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mt-auto" />
        </div>

        {/* Floating "Tap to Pay" badge */}
        <div className="absolute -right-8 top-8 bg-blue-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-float-slow whitespace-nowrap">
          1-Tap Pay →
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center max-w-[200px] leading-relaxed">
        Pick your preferred UPI app in the checkout to complete payment.
      </p>
    </div>
  );
};

// ─── Illustration 3: QR Code — Scanner Artwork ───────────────────────────────

const QrCodeArtwork: React.FC<{ fee: number }> = ({ fee }) => (
  <div className="w-full flex flex-col items-center gap-4 py-2">
    <div className="relative select-none">
      {/* QR Code panel */}
      <div className="w-36 h-36 bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-2xl p-2.5 relative overflow-hidden">
        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

        {/* Laser scan line */}
        <div className="absolute left-3 right-3 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scanline shadow-[0_0_8px_#22d3ee]" />

        {/* QR matrix (decorative SVG) */}
        <div className="w-full h-full bg-white rounded-xl flex items-center justify-center relative">
          <svg viewBox="0 0 80 80" className="w-24 h-24 text-slate-900">
            {/* Finder patterns */}
            <rect x="0" y="0" width="22" height="22" rx="3" fill="currentColor" />
            <rect x="3" y="3" width="16" height="16" rx="2" fill="white" />
            <rect x="6" y="6" width="10" height="10" rx="1" fill="currentColor" />

            <rect x="58" y="0" width="22" height="22" rx="3" fill="currentColor" />
            <rect x="61" y="3" width="16" height="16" rx="2" fill="white" />
            <rect x="64" y="6" width="10" height="10" rx="1" fill="currentColor" />

            <rect x="0" y="58" width="22" height="22" rx="3" fill="currentColor" />
            <rect x="3" y="61" width="16" height="16" rx="2" fill="white" />
            <rect x="6" y="64" width="10" height="10" rx="1" fill="currentColor" />

            {/* Data modules */}
            <rect x="28" y="4" width="6" height="6" fill="currentColor" />
            <rect x="38" y="8" width="6" height="6" fill="currentColor" />
            <rect x="48" y="4" width="6" height="6" fill="currentColor" />
            <rect x="4" y="28" width="6" height="6" fill="currentColor" />
            <rect x="8" y="38" width="6" height="6" fill="currentColor" />
            <rect x="28" y="28" width="24" height="24" rx="3" fill="currentColor" />
            <rect x="58" y="28" width="6" height="6" fill="currentColor" />
            <rect x="58" y="58" width="18" height="18" rx="2" fill="currentColor" />
            <rect x="28" y="58" width="6" height="6" fill="currentColor" />
            <rect x="38" y="66" width="6" height="6" fill="currentColor" />
          </svg>

          {/* Center shield badge */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-lg bg-blue-600 border-2 border-white shadow flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating amount badge */}
      <div className="absolute -right-10 -bottom-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg animate-float-slow whitespace-nowrap">
        ₹{fee} Due
      </div>
    </div>

    <p className="text-xs text-slate-400 text-center max-w-[200px] leading-relaxed">
      A live QR code will appear in the checkout. Scan with any UPI app.
    </p>
  </div>
);
