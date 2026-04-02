"use client";

export default function LogoutPage() {
  // Clear demo auth cookie then bounce to home.
  // Cookie is non-HttpOnly (set from client) so this works for the demo.
  if (typeof document !== "undefined") {
    document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("auth.googleProfile");
      localStorage.removeItem("demo.sessions");
    } catch {}
    window.location.replace("/");
  }
  return null;
}

