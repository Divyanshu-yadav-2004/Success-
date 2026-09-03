/**
 * apiClient.ts
 *
 * Production-safe HTTP client for the NestJS backend.
 *
 * Token refresh rules:
 *   • Only protected endpoints (non-auth) trigger the 401 refresh flow.
 *   • Auth endpoints (/auth/google, /auth/login, /auth/register, /auth/refresh,
 *     /auth/logout) are excluded — a 401 on these means the credentials are
 *     genuinely invalid and we must not enter a refresh loop.
 *   • Refresh is attempted exactly ONCE. If the refresh request itself fails
 *     or returns a non-2xx, local tokens are cleared (clean logout state).
 *   • 400, 403, 404, and 500 errors NEVER trigger a refresh attempt.
 */

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api/v1";

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ── Auth endpoints that must NEVER trigger an automatic refresh ──────────────
const AUTH_REFRESH_EXCLUSIONS = [
  "/auth/google",
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/account",
  "/auth/forgot-password",
  "/auth/reset-password",
];

const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;
let refreshInFlight: Promise<string | null> | null = null;

function isAuthExcluded(endpoint: string): boolean {
  return AUTH_REFRESH_EXCLUSIONS.some((exc) => endpoint.includes(exc));
}

// ── Token storage ────────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function setStoredToken(token: string) {
  localStorage.setItem("accessToken", token);
}

export function removeStoredToken() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

// ── Internal: attempt a single token refresh ─────────────────────────────────
async function attemptTokenRefresh(): Promise<string | null> {
  // Many components may receive the same expired-token response together.
  // Share one refresh instead of creating a refresh-request storm.
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    return null;
  }

  try {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      // Refresh failed (expired, revoked, invalid) — clear tokens
      removeStoredToken();
      return null;
    }

    const tokens = await refreshRes.json();
    if (!tokens?.accessToken) {
      removeStoredToken();
      return null;
    }

    setStoredToken(tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem("refreshToken", tokens.refreshToken);
    }
    return tokens.accessToken;
  } catch {
    // Network error during refresh — clear tokens to prevent infinite loops
    removeStoredToken();
    return null;
  }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: options.signal || controller.signal });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error("The request timed out. Please check your connection and try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

// ── Main request function ─────────────────────────────────────────────────────

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let res = await fetchWithTimeout(url, {
    ...options,
    headers,
  });

  // ── Automatic single-retry on 401 for protected endpoints only ───
  if (
    res.status === 401 &&
    !isAuthExcluded(endpoint)
  ) {
    const newToken = await attemptTokenRefresh();
    if (newToken) {
      // Retry original request exactly once with the new access token
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetchWithTimeout(url, {
        ...options,
        headers,
      });
      // If this retry also returns 401, fall through to the error handler below.
      // Do NOT retry again — that would create an infinite loop.
    }
    // If refresh failed (newToken is null), res is still the original 401 response.
    // Fall through to the error handler which will throw.
  }

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errorMsg;
    } catch {
      // fallback to status message
    }
    throw new Error(errorMsg);
  }

  // Handle binary PDF streams
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/pdf")) {
    return (await res.blob()) as unknown as T;
  }

  return (await res.json()) as T;
}
