import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:3000/api/v1";

const HERO_IMAGE =
  "https://images.pexels.com/photos/7792841/pexels-photo-7792841.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

type Step = "enter-email" | "email-sent";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("enter-email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        setError(
          "Too many requests. Please wait 60 seconds before trying again.",
        );
        return;
      }

      // Always move to "email sent" step — regardless of response
      // (security: never reveal whether email is registered)
      setStep("email-sent");
    } catch {
      // Network error — still show success step to avoid enumeration
      setStep("email-sent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white sm:bg-[#f0f4f9] flex items-center justify-center p-0 sm:p-4 md:p-6">
      <div className="w-full sm:max-w-md mx-auto min-h-screen sm:min-h-0 bg-white sm:rounded-3xl sm:shadow-2xl sm:shadow-slate-300/60 overflow-hidden flex flex-col justify-center">
        {/* ── Hero image section ── */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={HERO_IMAGE}
            alt="Professional handshake"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-900/50 to-transparent" />

          <div className="absolute inset-x-0 top-0 px-5 pt-5">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-blue-200 uppercase">
              Government of Madhya Pradesh
            </p>
            <h1 className="text-white font-extrabold text-[22px] leading-tight mt-0.5 drop-shadow-lg">
              SUCCESS MP ONLINE
            </h1>
            <p className="text-blue-100 text-[11px] font-medium mt-0.5 tracking-wide">
              Citizen Services Portal
            </p>
          </div>

          {/* Tricolor accent strip */}
          <div className="absolute bottom-0 inset-x-0 flex h-1">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
        </div>

        {/* ── Official logo badge ── */}
        <div className="flex justify-center -mt-9 relative z-10">
          <div className="w-[76px] h-[76px] rounded-full bg-white ring-4 ring-white shadow-xl flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Success MP Online"
              className="w-[68px] h-[68px] rounded-full"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-6 pb-8 pt-6">
          {step === "enter-email" ? (
            <EnterEmailStep
              email={email}
              setEmail={setEmail}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              onBack={() => { window.location.href = window.location.origin + "/auth"; }}
            />
          ) : (
            <EmailSentStep email={email} onBack={() => { window.location.href = window.location.origin + "/auth"; }} />
          )}
        </div>

        {/* Bottom disclaimer */}
        <p className="text-center text-[11px] text-slate-400 mt-auto px-4 pb-4 sm:pb-0">
          Govt. of Madhya Pradesh authorised portal &mdash; All transactions are
          secured &amp; encrypted.
        </p>
      </div>
    </div>
  );
}

// ─── Step 1: Enter Email ───────────────────────────────────────────────────
function EnterEmailStep({
  email,
  setEmail,
  loading,
  error,
  onSubmit,
  onBack,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Login
      </button>

      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Forgot your password?</h2>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          No worries. Enter the email address registered with your{" "}
          <span className="font-semibold text-slate-700">Success MP Online</span>{" "}
          account and we&apos;ll send you a secure password reset link.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="fp-email"
            className="block text-sm font-semibold text-blue-700 mb-1.5"
          >
            Email Address&nbsp;<span className="text-red-500">*</span>
          </label>
          <input
            id="fp-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            className="w-full border-0 border-b-2 border-slate-200 focus:border-blue-600 bg-transparent pb-2 pt-1 text-slate-800 placeholder:text-slate-300 text-sm outline-none transition-colors"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          id="send-reset-link-btn"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-700/25 text-sm tracking-wide mt-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Send Reset Link
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Step 2: Email Sent ────────────────────────────────────────────────────
function EmailSentStep({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  return (
    <div className="text-center">
      {/* Success icon */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-green-500" strokeWidth={1.8} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Check your email 📧
      </h2>

      <p className="text-slate-500 text-sm leading-relaxed mb-2">
        If an account exists for{" "}
        <span className="font-semibold text-slate-700 break-all">{email}</span>
        , we&apos;ve sent a password reset link.
      </p>

      {/* Expiry notice */}
      <div className="flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 mb-6">
        <span className="text-base">⏱️</span>
        <p className="text-xs text-amber-700 font-medium">
          The link will expire in{" "}
          <span className="font-bold">15 minutes</span> for your security.
        </p>
      </div>

      <button
        id="back-to-login-btn"
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-700/25 text-sm tracking-wide"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </button>

      <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
        Didn&apos;t receive it? Check your spam folder or{" "}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:underline font-medium"
        >
          try again
        </button>
        .
      </p>
    </div>
  );
}
