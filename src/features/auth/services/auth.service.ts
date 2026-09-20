import type { AuthProfile, AuthResponse } from "../types/auth.types";
import { useUserStore } from "@/store/user.store";

export type { AuthProfile, AuthResponse };

export const AUTH_PROFILE_KEY = "auth.googleProfile";

export class AuthError extends Error {
  code: "NOT_ADMIN" | "INVALID_CREDENTIALS" | "NETWORK_ERROR" | "UNKNOWN";

  constructor(
    message: string,
    code: "NOT_ADMIN" | "INVALID_CREDENTIALS" | "NETWORK_ERROR" | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function readAuthProfile(): AuthProfile | null {
  if (typeof window === "undefined") return null;
  return safeJsonParse<AuthProfile>(localStorage.getItem(AUTH_PROFILE_KEY));
}

export function writeAuthProfile(profile: AuthProfile | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!profile) {
      localStorage.removeItem(AUTH_PROFILE_KEY);
      return;
    }
    localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(profile));
    // Force same-tab listeners to update (storage event doesn't fire in same tab)
    window.dispatchEvent(new Event("authprofilechange"));
  } catch {
    // ignore
  }
}

export function pickUserPicture(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const value = user as Record<string, unknown>;
  for (const candidate of [
    value.picture,
    value.avatar,
    value.avatarUrl,
    value.photoURL,
    value.photo_url,
    value.image,
  ]) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AuthError) {
    return error.message;
  }
  if (typeof error === "object" && error) {
    const value = error as {
      message?: string;
      code?: string;
      response?: { status?: number; data?: { message?: string; detail?: string } };
    };
    if (value.response?.data?.detail) return value.response.data.detail;
    if (value.response?.data?.message) return value.response.data.message;
    if (value.code === "ERR_NETWORK") return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.";
    return value.message || fallback;
  }
  return fallback;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAuthCookies(accessToken: string, role: "admin" | "user"): void {
  if (typeof document === "undefined") return;
  document.cookie = `access_token=${accessToken}; Path=/; SameSite=Lax; Max-Age=604800`;
  document.cookie = `role=${role}; Path=/; SameSite=Lax; Max-Age=604800`;
}

export function clearAllAuthCookies(): void {
  if (typeof document === "undefined") return;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    if (name) {
      document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    }
  }
}

/**
 * Shared session completion logic for both User and Admin logins.
 *
 * @param data AuthResponse from /auth/login or /auth/register or /auth/google
 * @param expectedRole Optional check. If "ADMIN", verifies user.role === "ADMIN".
 */
export function completeAuthSession(
  data: AuthResponse,
  expectedRole?: "ADMIN" | "USER"
): { user: AuthResponse["user"]; isAdmin: boolean } {
  const userRole = (data.user.role || "").toUpperCase();
  const isAdmin = userRole === "ADMIN";

  if (expectedRole === "ADMIN" && !isAdmin) {
    throw new AuthError(
      "Tài khoản này không có quyền truy cập hệ thống quản trị.",
      "NOT_ADMIN"
    );
  }

  const accessToken = data.access_token;
  const picture = pickUserPicture(data.user) || readAuthProfile()?.picture?.trim() || null;

  // Persist tokens and cookies
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("access_token", accessToken);
    setAuthCookies(accessToken, isAdmin ? "admin" : "user");
    writeAuthProfile({
      email: data.user.email,
      name: data.user.name,
      picture,
      role: data.user.role,
    });

    try {
      useUserStore.getState().setUser(
        {
          userId: data.user.id,
          name: data.user.name,
          email: data.user.email,
        },
        accessToken
      );
    } catch {
      // ignore
    }
  }

  return { user: data.user, isAdmin };
}

/**
 * Performs full client-side logout and redirects to specified path.
 *
 * @param redirectTo Default "/login" for user, "/admin/login" for admin.
 */
export function performClientLogout(redirectTo: string = "/login"): void {
  clearAllAuthCookies();

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("auth.googleProfile");
      localStorage.removeItem("auth.profile");
      localStorage.removeItem("user-store");
      localStorage.removeItem("demo.sessions");
      sessionStorage.clear();
      writeAuthProfile(null);
      try {
        useUserStore.getState().logout();
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }

    window.location.replace(redirectTo);
  }
}
