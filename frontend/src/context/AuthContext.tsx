/**
 * AuthContext.tsx
 *
 * Handles two auth paths — both go through NestJS:
 *   1. Email/password  → POST /api/v1/auth/login or /auth/register
 *   2. Google OAuth    → GET /api/v1/auth/google (backend redirect flow)
 *                        → Google → GET /api/v1/auth/google/callback
 *                        → Backend redirects to /auth/callback?accessToken=...&refreshToken=...
 *                        → This context reads the tokens from URL on that route
 *
 * Architecture:
 *   • NO Supabase dependency whatsoever.
 *   • NestJS JWT is the single application auth token.
 *   • All user profile data comes from NestJS /api/v1/auth/me (Prisma/PostgreSQL).
 *   • Tokens stored in localStorage.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Profile } from "@/lib/types";
import {
  apiRequest,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  API_BASE_URL,
} from "@/lib/apiClient";

// ─────────────────────────────────────────────
// Dev-only logger — NEVER logs secrets/tokens
// ─────────────────────────────────────────────
const isDev = import.meta.env.DEV;
function log(label: string, ...args: unknown[]) {
  if (isDev) {
    const safeArgs = args.map((a) =>
      typeof a === "string" && a.length > 40 ? "[REDACTED]" : a,
    );
    console.log(`[Auth] ${label}`, ...safeArgs);
  }
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface NestUser {
  id: string;
  email: string;
  phone?: string;
  role: string;
  profile: any;
}

interface AuthContextValue {
  nestUser: NestUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<Profile>,
  ) => Promise<{ error: string | null }>;
  refreshProfile: (tokenOverride?: string) => Promise<boolean>;
  // Legacy shape compatibility
  session: { user: NestUser } | null;
  user: NestUser | null;
}

// ─────────────────────────────────────────────
// URL Token Extraction Helper
// Reads accessToken / refreshToken from query string or hash fragment
// ─────────────────────────────────────────────
export function extractTokensFromUrl(): {
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
  message: string | null;
} {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashString = window.location.hash.startsWith("#")
      ? window.location.hash.substring(1)
      : "";
    const hashParams = new URLSearchParams(hashString);

    const accessToken =
      searchParams.get("accessToken") ||
      searchParams.get("access_token") ||
      hashParams.get("accessToken") ||
      hashParams.get("access_token");

    const refreshToken =
      searchParams.get("refreshToken") ||
      searchParams.get("refresh_token") ||
      hashParams.get("refreshToken") ||
      hashParams.get("refresh_token");

    const error = searchParams.get("error") || hashParams.get("error");
    const message = searchParams.get("message") || hashParams.get("message");

    return {
      accessToken:
        accessToken &&
        accessToken.trim() !== "" &&
        accessToken !== "undefined" &&
        accessToken !== "null"
          ? accessToken.trim()
          : null,
      refreshToken:
        refreshToken &&
        refreshToken.trim() !== "" &&
        refreshToken !== "undefined" &&
        refreshToken !== "null"
          ? refreshToken.trim()
          : null,
      error: error && error.trim() !== "" ? error.trim() : null,
      message: message && message.trim() !== "" ? message.trim() : null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, error: null, message: null };
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [nestUser, setNestUser] = useState<NestUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const initialised = useRef(false);

  const resolveLoading = () => {
    if (!initialised.current) {
      initialised.current = true;
      setLoading(false);
      log("resolveLoading", "loading resolved");
    }
  };

  const applyNestUser = (data: NestUser) => {
    setNestUser(data);
    setProfile({
      id: data.id,
      full_name:
        data.profile?.fullName || data.email?.split("@")[0] || "User",
      phone: data.phone || "",
      address: data.profile?.address || "",
      role:
        data.role === "ADMIN" || data.role === "SUPER_ADMIN"
          ? "admin"
          : "user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  };

  // ─────────────────────────────────────────────
  // Fetch NestJS profile with stored or provided JWT
  // Source of truth: NestJS /auth/me → Prisma/PostgreSQL
  // ─────────────────────────────────────────────
  const fetchNestUserProfile = async (tokenOverride?: string): Promise<boolean> => {
    const token = tokenOverride || getStoredToken();
    if (!token) {
      log("fetchNestUserProfile", "no stored token");
      setNestUser(null);
      setProfile(null);
      return false;
    }

    try {
      log("fetchNestUserProfile", "calling /auth/me …");
      const data = await apiRequest<NestUser>("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data?.id) {
        log("fetchNestUserProfile", "✓ user loaded, role=", data.role);
        applyNestUser(data);
        return true;
      }

      log("fetchNestUserProfile", "unexpected shape — clearing token");
      removeStoredToken();
      setNestUser(null);
      setProfile(null);
      return false;
    } catch (err) {
      log("fetchNestUserProfile", "✗ error —", (err as Error).message);
      removeStoredToken();
      setNestUser(null);
      setProfile(null);
      return false;
    }
  };

  // ─────────────────────────────────────────────
  // On mount: restore session.
  //
  // Check for tokens in the URL first (Google OAuth callback redirect).
  // If present, store them immediately BEFORE firing any network calls
  // to prevent race conditions or calling /auth/me with stale tokens.
  // ─────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      log("init", "checking url parameters and stored token");

      const { accessToken: urlAccessToken, refreshToken: urlRefreshToken, error: urlError } =
        extractTokensFromUrl();

      if (urlError) {
        log("init", "OAuth error in URL — clearing tokens");
        removeStoredToken();
      } else if (urlAccessToken) {
        log("init", "found OAuth tokens in URL — storing immediately before any API call");
        setStoredToken(urlAccessToken);
        if (urlRefreshToken) {
          localStorage.setItem("refreshToken", urlRefreshToken);
        }

        if (isMounted) {
          const ok = await fetchNestUserProfile(urlAccessToken);
          log("init", "fetchNestUserProfile with url token =", ok);
        }
      } else {
        const stored = getStoredToken();
        if (stored && isMounted) {
          const ok = await fetchNestUserProfile(stored);
          log("init", "fetchNestUserProfile with stored token =", ok);
        } else {
          log("init", "no stored token — unauthenticated");
        }
      }

      if (isMounted) {
        resolveLoading();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────
  // signIn — email/password via NestJS
  // ─────────────────────────────────────────────
  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null }> => {
    try {
      log("signIn", "→ email/password login, email=", email);
      const res = await apiRequest<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res?.accessToken) {
        return { error: "Login failed: no access token returned" };
      }

      setStoredToken(res.accessToken);
      if (res.refreshToken) {
        localStorage.setItem("refreshToken", res.refreshToken);
      }
      applyNestUser(res.user);
      log("signIn", "✓ token stored, user role=", res.user?.role);
      return { error: null };
    } catch (err: any) {
      log("signIn", "✗ error —", err.message);
      return { error: err.message || "Invalid credentials" };
    }
  };

  // ─────────────────────────────────────────────
  // signUp — email/password via NestJS
  // ─────────────────────────────────────────────
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
  ): Promise<{ error: string | null }> => {
    try {
      log("signUp", "email=", email);
      const res = await apiRequest<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          fullName,
          address: "Madhya Pradesh",
        }),
      });

      if (!res?.accessToken) {
        return { error: "Registration failed" };
      }

      setStoredToken(res.accessToken);
      if (res.refreshToken) {
        localStorage.setItem("refreshToken", res.refreshToken);
      }

      // Registration returns the new account profile; welcome email delivery
      // continues in the backend without holding this transition open.
      applyNestUser(res.user);
      log("signUp", "success");
      return { error: null };
    } catch (err: any) {
      log("signUp", "error —", err.message);
      return { error: err.message || "Registration failed" };
    }
  };

  // ─────────────────────────────────────────────
  // signInWithGoogle — Backend OAuth redirect (no Supabase)
  //
  // Redirects the browser to the NestJS Google OAuth endpoint.
  // NestJS handles: Google redirect → callback → find/create user →
  //   issue JWT → redirect to frontend /auth/callback?accessToken=...
  // ─────────────────────────────────────────────
  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    try {
      log("signInWithGoogle", "→ redirecting browser to backend Google OAuth");
      // Full-page redirect — browser goes to NestJS Passport Google endpoint.
      // NestJS handles: Google consent → callback → find/create user → JWT →
      //   redirect to /auth/callback?accessToken=...&refreshToken=...
      const originParam = encodeURIComponent(window.location.origin);
      window.location.href = `${API_BASE_URL}/auth/google?origin=${originParam}`;
      return { error: null };
    } catch (err: any) {
      log("signInWithGoogle", "✗ exception —", err?.message);
      return {
        error: err?.message || "An error occurred during Google sign-in.",
      };
    }
  };

  // ─────────────────────────────────────────────
  // signOut — clear tokens cleanly
  // ─────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    log("signOut", "clearing tokens and auth state");
    removeStoredToken();
    setNestUser(null);
    setProfile(null);
    log("signOut", "✓ done");
  };

  // ─────────────────────────────────────────────
  // updateProfile — updates via NestJS (Prisma/PostgreSQL)
  // ─────────────────────────────────────────────
  const updateProfile = async (
    updates: Partial<Profile>,
  ): Promise<{ error: string | null }> => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
    return { error: null };
  };

  const refreshProfile = async (tokenOverride?: string): Promise<boolean> => {
    return await fetchNestUserProfile(tokenOverride);
  };

  const isAdmin = profile?.role === "admin";
  const isAuthenticated = nestUser !== null;
  const session = nestUser ? { user: nestUser } : null;

  return (
    <AuthContext.Provider
      value={{
        nestUser,
        profile,
        isAdmin,
        loading,
        isAuthenticated,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile,
        session,
        user: nestUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
