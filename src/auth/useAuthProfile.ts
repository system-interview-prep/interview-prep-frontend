"use client";

import { useEffect, useMemo, useState } from "react";
import { readAuthProfile, type AuthProfile } from "./authProfile";

export function useAuthProfile() {
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  useEffect(() => {
    setProfile(readAuthProfile());

    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth.googleProfile") setProfile(readAuthProfile());
    };
    const onFocus = () => setProfile(readAuthProfile());
    const onCustom = () => setProfile(readAuthProfile());

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("authprofilechange", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("authprofilechange", onCustom as EventListener);
    };
  }, []);

  const displayName = useMemo(() => {
    const n = profile?.name?.trim();
    if (n) return n;
    const e = profile?.email?.trim();
    if (!e) return "";
    return e.split("@")[0] || "";
  }, [profile?.email, profile?.name]);

  return { profile, displayName };
}

