/**
 * App.tsx
 *
 * Router root + auth-aware route guards + Google OAuth callback handler.
 *
 * Google Auth redirect-loop fixes applied here:
 *  A. `getStoredToken` is properly imported from apiClient (was missing → undefined call).
 *  B. GoogleOAuthCallback ONLY uses the token from the URL — it never falls back to an
 *     existing stored token. A stale stored token was causing the callback to believe
 *     login succeeded even when Google returned an error / no token.
 *  C. `refreshProfile` is awaited before calling `navigate('/')`.  Previously navigate
 *     ran inside `.finally()` which fired before the React state update triggered by
 *     refreshProfile had been committed — ProtectedRoute then saw isAuthenticated=false
 *     and redirected straight back to /auth, creating the loop.
 *  D. ProtectedRoute and PublicRoute both render the branded splash screen (not a plain
 *     spinner) while `loading === true`, so the auth state has time to initialise
 *     before any redirect decision is made.
 *  E. `authLoading` gate: if loading is still true we NEVER redirect, we always wait.
 */

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { lazy, Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  setStoredToken,
  removeStoredToken,
  getStoredToken,
} from "@/lib/apiClient";

// ── Lazy page imports ─────────────────────────────────────────────────────────
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ServiceForm = lazy(() => import("@/pages/ServiceForm"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const SupportHubWidget = lazy(() => import("@/components/SupportHubWidget"));

// ── Branded splash / loading screen ─────────────────────────────────────────
// Used while auth state is initialising so no redirect fires prematurely.
function BrandedSplash({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[#0f3460] flex flex-col items-center justify-center gap-5 px-6">
      <img
        src="/logo.png"
        alt="SUCCESS MP ONLINE"
        className="w-28 h-28 rounded-full shadow-2xl"
        style={{ objectFit: "contain" }}
      />
      <p className="text-white font-extrabold text-lg tracking-tight">SUCCESS MP ONLINE</p>
      <p className="text-blue-200 text-xs font-medium tracking-wide">Government Services Portal</p>
      <Loader2 className="w-6 h-6 animate-spin text-blue-300 mt-1" />
      {message && (
        <p className="text-blue-200 text-xs mt-1">{message}</p>
      )}
    </div>
  );
}

// ── Minimal inline spinner for Suspense boundaries ────────────────────────────
function InlineSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
    </div>
  );
}

// ── ProtectedRoute ────────────────────────────────────────────────────────────
// Rule: NEVER redirect while loading === true. Show splash instead.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // [D] Auth state not yet resolved — show branded splash, do NOT redirect
    return <BrandedSplash message="Loading your session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// ── PublicRoute ───────────────────────────────────────────────────────────────
// Rule: NEVER redirect while loading === true.
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <BrandedSplash message="Checking authentication…" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ── GoogleOAuthCallback ───────────────────────────────────────────────────────
// Handles the redirect from the NestJS backend after Google authentication:
//   Backend → /auth/callback?accessToken=...&refreshToken=...
//
// Fix summary:
//  [A] getStoredToken is now imported (was missing — caused runtime error).
//  [B] We ONLY accept the token from URL params — we do NOT fall back to
//      getStoredToken(). A stale stored token caused the callback to think
//      login succeeded when it hadn't.
//  [C] We await refreshProfile() before navigating. Previously navigate ran
//      in .finally(), which fires before React state updates settle — the
//      ProtectedRoute then saw isAuthenticated=false and looped back to /auth.
function GoogleOAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const [statusMessage, setStatusMessage] = useState("Completing sign-in…");

  const isDev = import.meta.env.DEV;
  function log(label: string, detail?: string) {
    if (isDev) console.log(`[GoogleOAuthCallback] ${label}`, detail ?? "");
  }

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      // [B] Read ONLY from URL params — never fall back to stored token
      const urlAccessToken = searchParams.get("accessToken");
      const urlRefreshToken = searchParams.get("refreshToken");
      const errorParam = searchParams.get("error");
      const message = searchParams.get("message");

      log("params", `accessToken=${urlAccessToken ? "[REDACTED]" : "null"} error=${errorParam}`);

      // ── Error returned from backend ────────────────────────────────────────
      if (errorParam) {
        log("error from backend", errorParam);
        removeStoredToken();
        localStorage.removeItem("refreshToken");
        const errorMsg = message || "Google sign-in failed. Please try again.";
        if (!cancelled) {
          navigate(`/auth?oauthError=${encodeURIComponent(errorMsg)}`, { replace: true });
        }
        return;
      }

      // ── No access token in URL ─────────────────────────────────────────────
      if (!urlAccessToken) {
        log("no accessToken in URL — redirecting to /auth with error");
        removeStoredToken();
        localStorage.removeItem("refreshToken");
        const errorMsg = message || "Google sign-in failed. No token received.";
        if (!cancelled) {
          navigate(`/auth?oauthError=${encodeURIComponent(errorMsg)}`, { replace: true });
        }
        return;
      }

      // ── Store tokens ───────────────────────────────────────────────────────
      log("storing tokens from URL");
      setStoredToken(urlAccessToken);
      if (urlRefreshToken) {
        localStorage.setItem("refreshToken", urlRefreshToken);
      }

      // ── [C] Await refreshProfile so nestUser state is set BEFORE navigate ──
      try {
        if (!cancelled) setStatusMessage("Fetching your profile…");
        log("calling refreshProfile");
        await refreshProfile();
        log("refreshProfile complete — navigating to dashboard");
        if (!cancelled) {
          navigate("/", { replace: true });
        }
      } catch (err: any) {
        log("refreshProfile failed", err?.message);
        // Profile fetch failed — clear tokens, send back to login
        removeStoredToken();
        localStorage.removeItem("refreshToken");
        if (!cancelled) {
          navigate(
            `/auth?oauthError=${encodeURIComponent("Sign-in succeeded but profile load failed. Please try again.")}`,
            { replace: true },
          );
        }
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <BrandedSplash message={statusMessage} />;
}

// ── AppRoutes ─────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<InlineSpinner />}>
      <Routes>
        {/* Public auth routes */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />

        {/* Google OAuth callback — must be PUBLIC (no auth check at all) */}
        <Route path="/auth/callback" element={<GoogleOAuthCallback />} />

        {/* Password reset — public (no auth check needed) */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <LanguageProvider>
                <Dashboard />
              </LanguageProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/:serviceId"
          element={
            <ProtectedRoute>
              <LanguageProvider>
                <ServiceForm />
              </LanguageProvider>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SupportHubWidget />
    </Suspense>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <AppRoutes />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
