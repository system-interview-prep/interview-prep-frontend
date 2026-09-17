"use client";

import { useEffect, useMemo, useState } from "react";
import { readAuthProfile, writeAuthProfile, type AuthProfile } from "./authProfile";
import { userApi } from "../services/api";

let hydrationToken: string | null = null;
let hydrationRequest: Promise<AuthProfile | null> | null = null;

async function hydrateAuthProfile(): Promise<AuthProfile | null> {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    hydrationToken = null;
    hydrationRequest = null;
    return readAuthProfile();
  }

  if (hydrationToken !== token) {
    hydrationToken = token;
    hydrationRequest = userApi
      .getProfile()
      .then(({ data }) => {
        const existing = readAuthProfile();
        const profile: AuthProfile = {
          email: data.email ?? existing?.email ?? null,
          name: data.name ?? existing?.name ?? null,
          picture: data.picture ?? data.avatar ?? existing?.picture ?? null,
        };
        writeAuthProfile(profile);
        return profile;
      })
      .catch(() => readAuthProfile());
  }

  return hydrationRequest ?? readAuthProfile();
}

export function useAuthProfile() {
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  useEffect(() => {
    setProfile(readAuthProfile());
    void hydrateAuthProfile().then(setProfile);

    const onStorage = (event: StorageEvent) => {
      if (event.key === "auth.googleProfile") setProfile(readAuthProfile());
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
    const name = profile?.name?.trim();
    if (name) return name;
    const email = profile?.email?.trim();
    if (!email) return "";
    return email.split("@")[0] || "";
  }, [profile?.email, profile?.name]);

  return { profile, displayName };
}