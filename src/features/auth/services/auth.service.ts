export type AuthProfile = {
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

export const AUTH_PROFILE_KEY = "auth.googleProfile";

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

