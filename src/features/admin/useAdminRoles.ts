"use client";

import { useSyncExternalStore } from "react";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";

const subscribeNothing = () => () => {};

/**
 * The signed-in person's roles, empty until hydration: the profile lives in
 * browser storage, so reading it during the server render would make the
 * first client render differ (hydration mismatch).
 */
export function useAdminRoles(): string[] {
  const { profile } = useAuthProfile();
  const isClient = useSyncExternalStore(subscribeNothing, () => true, () => false);
  return isClient ? (profile?.roles ?? []) : [];
}
