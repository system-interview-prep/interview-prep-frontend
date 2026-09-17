"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuthProfile } from "@/auth/useAuthProfile";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function AdminAuthBadge({
  href = "/admin/profile",
  roleLabel,
  size = "sm",
}: {
  href?: string;
  roleLabel?: string;
  size?: "sm" | "lg";
}) {
  const { profile, displayName } = useAuthProfile();
  const initials = useMemo(() => (displayName ? initialsFromName(displayName) : "?"), [displayName]);

  const box = size === "lg" ? "h-24 w-24" : "h-10 w-10";
  const textName = size === "lg" ? "text-base" : "text-sm";

  return (
    <Link href={href} className="flex items-center gap-3" aria-label="Admin profile">
      <div
        className={`${box} flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-[#234196] bg-[#FCB625] text-[#234196]`}
      >
        {profile?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="h-full w-full object-cover" alt="" src={profile.picture} />
        ) : (
          <span className="font-headline font-bold text-[#234196]">{initials}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className={`truncate font-bold text-[#234196] ${textName}`}>{displayName || "—"}</p>
        {roleLabel ? <p className="text-xs text-[#5A6B8F]">{roleLabel}</p> : null}
      </div>
    </Link>
  );
}

