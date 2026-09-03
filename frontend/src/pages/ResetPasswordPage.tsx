import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

import { API_BASE_URL } from "@/lib/apiClient";


const HERO_IMAGE =
  "https://images.pexels.com/photos/7792841/pexels-photo-7792841.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

type Step = "reset-form" | "success" | "invalid-token";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [step, setStep] = useState<Step>("reset-form");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no token in URL
  useEffect(() => {
    if (!token) {
      navigate("/forgot-password", { replace: true });
    }
  }, [token, navigate]);

  const validateForm = (): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match. Please try again.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 400 = invalid/expired token, show dedicated step
        if (res.status === 400) {
          setStep("invalid-token");
          return;
        }
        setError(data?.message || "Something went wrong. Please try again.");
        return;
      }

      setStep("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
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
              alt="SUCCESS MP ONLINE"
              className="w-[68px] h-[68px] rounded-full"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-6 pb-8 pt-6">
          {step === "reset-form" && (
            <ResetForm
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
            />
          )}

          {step === "success" && (
            <SuccessStep onLogin={() => {
              // Use window.location.href to guarantee a clean navigation to the
              // React frontend login page — never the backend API endpoint.
              window.location.href = window.location.origin + "/auth";
            }} />
          )}

          {step === "invalid-token" && (
            <InvalidTokenStep
              onRequestNew={() => navigate("/forgot-password")}
            />
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-auto px-4 pb-4 sm:pb-0">
          Govt. of Madhya Pradesh authorised portal &mdash; All transactions are
          secured &amp; encrypted.
        </p>
      </div>
    </div>
  );
}

// ─── Reset Form ────────────────────────────────────────────────────────────
function ResetForm({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  error,
  onSubmit,
}: {
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;

  return (
    <div>
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create New Password</h2>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Choose a strong new password for your{" "}
          <span className="font-semibold text-slate-700">Success MP Online</span>{" "}
          account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* New Password */}
        <div>
          <label
            htmlFor="rp-password"
            className="block text-sm font-semibold text-blue-700 mb-1.5"
          >
            New Password&nbsp;<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="rp-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className={`w-full border-0 border-b-2 bg-transparent pb-2 pt-1 pr-8 text-slate-800 placeholder:text-slate-300 text-sm outline-none transition-colors ${
                passwordTooShort
                  ? "border-red-400"
                  : password.length >= 8
                  ? "border-green-500"
                  : "border-slate-200 focus:border-blue-600"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 p-1 text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {passwordTooShort && (
            <p className="text-[11px] text-red-500 mt-1">
              Password must be at least 8 characters.
            </p>
          )}
          {password.length >= 8 && (
            <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Minimum length met
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="rp-confirm-password"
            className="block text-sm font-semibold text-blue-700 mb-1.5"
          >
            Confirm New Password&nbsp;<span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="rp-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className={`w-full border-0 border-b-2 bg-transparent pb-2 pt-1 pr-8 text-slate-800 placeholder:text-slate-300 text-sm outline-none transition-colors ${
                confirmPassword.length > 0 && !passwordsMatch
                  ? "border-red-400"
                  : passwordsMatch
                  ? "border-green-500"
                  : "border-slate-200 focus:border-blue-600"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-0 top-0 p-1 text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-[11px] text-red-500 mt-1">
              Passwords do not match.
            </p>
          )}
          {passwordsMatch && (
            <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Passwords match
            </p>
          )}
        </div>

        {/* Password requirements */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Password Requirements
          </p>
          <ul className="space-y-1">
            <li
              className={`flex items-center gap-1.5 text-xs ${
                password.length >= 8 ? "text-green-600" : "text-slate-400"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Minimum 8 characters
            </li>
            <li
              className={`flex items-center gap-1.5 text-xs ${
                passwordsMatch ? "text-green-600" : "text-slate-400"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Passwords must match
            </li>
          </ul>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          id="update-password-btn"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-700/25 text-sm tracking-wide mt-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Update Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Success Step ──────────────────────────────────────────────────────────
function SuccessStep({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-green-500" strokeWidth={1.8} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        ✅ Password Updated Successfully
      </h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">
        Your password has been changed successfully. You can now log in with
        your new password.
      </p>

      <button
        id="go-to-login-btn"
        type="button"
        onClick={onLogin}
        className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-700/25 text-sm tracking-wide"
      >
        <ArrowLeft className="w-4 h-4" />
        Go to Login
      </button>
    </div>
  );
}

// ─── Invalid Token Step ────────────────────────────────────────────────────
function InvalidTokenStep({ onRequestNew }: { onRequestNew: () => void }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
          <AlertCircle className="w-9 h-9 text-red-400" strokeWidth={1.8} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h2>
      <p className="text-slate-500 text-sm leading-relaxed mb-6">
        This password reset link is invalid or has expired. Reset links are
        valid for <span className="font-semibold">15 minutes</span> only.
        <br />
        <br />
        Please request a new one.
      </p>

      <button
        id="request-new-link-btn"
        type="button"
        onClick={onRequestNew}
        className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-700/25 text-sm tracking-wide"
      >
        Request New Link
      </button>
    </div>
  );
}
