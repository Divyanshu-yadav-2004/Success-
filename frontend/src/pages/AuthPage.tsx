import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  User,
  UserCog,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Tab = "user" | "staff";
type Mode = "login" | "signup";

const HERO_IMAGE =
  "https://images.pexels.com/photos/7792841/pexels-photo-7792841.jpeg?auto=compress&cs=tinysrgb&h=650&w=940";

/** Mobile splash / loading screen shown while auth initialises */
export function SplashScreen() {
  return (
    <div className="min-h-screen bg-[#0f3460] flex flex-col items-center justify-center gap-5 px-6">
      <img
        src="/logo.png"
        alt="Success MP Online"
        className="w-32 h-32 rounded-full shadow-2xl"
        style={{ objectFit: "contain" }}
      />
      <p className="text-xl font-extrabold tracking-tight text-white">SUCCESS MP ONLINE</p>
      <p className="text-xs font-medium tracking-wide text-blue-200">Government Services Portal</p>
      <Loader2 className="mt-2 text-blue-300 w-7 h-7 animate-spin" />
    </div>
  );
}

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("user");
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for OAuth error passed back from the /auth/callback route
    const oauthError = searchParams.get("oauthError");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      // Clean the URL so the error param doesn't persist on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Staff tab is strictly login-only
    const effectiveMode = tab === "staff" ? "login" : mode;

    if (effectiveMode === "login") {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        setError(error);
        return;
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      setLoading(false);
      if (error) {
        setError(error);
        return;
      }
    }
    navigate("/");
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await signInWithGoogle();
    setGoogleLoading(false);
    if (error) {
      setError(error);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setEmail("");
    setPassword("");
    setFullName("");
    if (t === "staff") {
      setMode("login");
    }
  };

  const isUser = tab === "user";
  const isLogin = isUser ? mode === "login" : true; // Staff portal is ALWAYS login only

  return (
    <div className="min-h-screen bg-white sm:bg-[#f0f4f9] flex items-center justify-center p-0 sm:p-4 md:p-6 select-none">
      <div className="flex flex-col justify-center w-full min-h-screen mx-auto overflow-hidden bg-white sm:max-w-md sm:min-h-0 sm:rounded-3xl sm:shadow-2xl sm:shadow-slate-300/60">
        {/* ── Hero image section ── */}
        <div className="relative overflow-hidden h-52">
          <img
            src={HERO_IMAGE}
            alt="Professional handshake"
            className="object-cover object-center w-full h-full"
          />
          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/70 via-blue-900/50 to-transparent" />

          {/* Branding text */}
          <div className="absolute inset-x-0 top-0 px-5 pt-5">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-blue-200 uppercase">
              Government of Madhya Pradesh
            </p>
            <h1 className="text-white font-extrabold text-[22px] leading-tight mt-0.5 drop-shadow-lg">
              SUCCESS MP ONLINE
            </h1>
            <p className="text-blue-100 text-[11px] font-medium mt-0.5 tracking-wide">
              {isUser ? "Citizen Services Portal" : "Staff &amp; Operations Management"}
            </p>
          </div>

          {/* Tricolor accent strip */}
          <div className="absolute inset-x-0 bottom-0 flex h-1">
            <div className="flex-1 bg-[#FF9933]" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-[#138808]" />
          </div>
        </div>

        {/* ── Official logo badge ── */}
        <div className="relative z-10 flex justify-center -mt-9">
          <div className="w-[76px] h-[76px] rounded-full bg-white ring-4 ring-white shadow-xl flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Success MP Online"
              className="w-[68px] h-[68px] rounded-full"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* ── Form area ── */}
        <div className="px-6 pt-4 pb-8">
          {/* Portal tabs */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
            <TabButton
              active={isUser}
              icon={<User className="w-4 h-4" />}
              label="User Portal"
              sub="Citizen Services"
              onClick={() => switchTab("user")}
            />
            <TabButton
              active={!isUser}
              icon={<UserCog className="w-4 h-4" />}
              label="Staff Portal"
              sub="Staff / Admin"
              onClick={() => switchTab("staff")}
            />
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              {isUser ? (
                isLogin ? "Citizen Login" : "Create Account"
              ) : (
                <>
                  <Lock className="inline-block w-5 h-5 text-blue-700" />
                  Staff & Admin Portal
                </>
              )}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5 font-medium">
              {isUser
                ? isLogin
                  ? "Sign in to access citizen services"
                  : "Register as a new citizen user"
                : "Authorized personnel only — Confidential Operations Access"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name field (Citizen Sign Up only) */}
            {isUser && !isLogin && (
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-1.5">
                  Full Name&nbsp;
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pt-1 pb-2 text-sm transition-colors bg-transparent border-0 border-b-2 outline-none border-slate-200 focus:border-blue-600 text-slate-800 placeholder:text-slate-300"
                />
              </div>
            )}

            {/* Email / Employee ID */}
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1.5">
                {isUser ? "Email Address" : "Email Address / Staff ID"}&nbsp;
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isUser ? "Enter your email" : "admin@gov.in or staff@gov.in"}
                className="w-full pt-1 pb-2 text-sm transition-colors bg-transparent border-0 border-b-2 outline-none border-slate-200 focus:border-blue-600 text-slate-800 placeholder:text-slate-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1.5">
                Password&nbsp;
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pt-1 pb-2 pr-8 text-sm transition-colors bg-transparent border-0 border-b-2 outline-none border-slate-200 focus:border-blue-600 text-slate-800 placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-0 right-0 p-1 transition text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Demo Fill Helper */}
            <div className="flex items-center justify-between px-3 pt-1 pb-1 text-xs text-blue-800 border border-blue-100 bg-blue-50/80 rounded-xl">
              <span className="font-medium">Demo Acc: {isUser ? "Citizen" : "Super Admin"}</span>
              <button
                type="button"
                onClick={() => {
                  if (isUser) {
                    setEmail("applicant@citizen.in");
                    setPassword("Citizen@123456");
                  } else {
                    setEmail("admin@gov.in");
                    setPassword("Admin@123456");
                  }
                  setError(null);
                }}
                className="ml-2 font-bold text-blue-700 underline cursor-pointer hover:text-blue-900"
              >
                Auto-fill
              </button>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 text-xs text-red-600 border border-red-200 rounded-xl bg-red-50">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-700/25 text-sm tracking-wide mt-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isUser ? (isLogin ? "Login to Citizen Portal" : "Create Account") : "Sign In to Admin Panel"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Citizen-only Social Sign-In & Registration options */}
          {isUser && (
            <>
              {/* Divider */}
              <div className="relative flex items-center justify-center my-5">
                <div className="w-full border-t border-slate-200" />
                <span className="absolute px-3 text-xs font-medium tracking-wider uppercase bg-white text-slate-400">
                  Or
                </span>
              </div>

              {/* Google Sign-in */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="flex items-center justify-center w-full gap-3 py-3 text-sm font-semibold transition-all bg-white border shadow-sm cursor-pointer border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              {/* Switch mode */}
              <p className="mt-5 text-xs text-center text-slate-400">
                {isLogin ? "New to the portal? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(isLogin ? "signup" : "login");
                    setError(null);
                  }}
                  className="font-semibold text-blue-600 cursor-pointer hover:underline"
                >
                  {isLogin ? "Register here" : "Sign in"}
                </button>
              </p>
            </>
          )}

          {/* Staff notice */}
          {!isUser && (
            <p className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Staff credentials are issued by your department administrator
            </p>
          )}
        </div>

        {/* Bottom disclaimer */}
        <p className="text-center text-[11px] text-slate-400 mt-2 px-4 pb-4 sm:pb-4">
          Govt. of Madhya Pradesh authorised portal &mdash; All transactions are
          secured &amp; encrypted.
        </p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  sub,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
        active
          ? "bg-blue-700 text-white shadow-lg shadow-blue-700/30"
          : "text-slate-500 hover:bg-slate-200"
      }`}
    >
      <span
        className={`flex items-center gap-1.5 font-bold text-sm ${
          active ? "text-white" : "text-slate-700"
        }`}
      >
        {icon}
        {label}
      </span>
      <span
        className={`text-[11px] font-medium ${
          active ? "text-blue-200" : "text-slate-400"
        }`}
      >
        {sub}
      </span>
    </button>
  );
}
