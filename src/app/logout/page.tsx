"use client";

import { useEffect } from "react";
import { writeAuthProfile } from "@/auth/authProfile";
import { useUserStore } from "@/store/user.store";

export function performClientLogout() {
  if (typeof document !== "undefined") {
    // Clear all existing cookies
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
      } catch {}
    } catch {}

    // Hard redirect to login page with clean cache
    window.location.replace("/login");
  }
}

export default function LogoutPage() {
  useEffect(() => {
    performClientLogout();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        <p className="text-sm font-medium text-slate-600">Đang đăng xuất...</p>
      </div>
    </div>
  );
}
