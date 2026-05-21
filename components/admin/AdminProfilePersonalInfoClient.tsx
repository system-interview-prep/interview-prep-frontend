"use client";

import { useMemo } from "react";
import { useAuthProfile } from "@/auth/useAuthProfile";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function AdminProfilePersonalInfoClient({
  avatarTitle,
  avatarHint,
  fullNameLabel,
  emailLabel,
  roleLabel,
  roleValue,
}: {
  avatarTitle: string;
  avatarHint: string;
  fullNameLabel: string;
  emailLabel: string;
  roleLabel: string;
  roleValue: string;
}) {
  const { profile, displayName } = useAuthProfile();
  const email = profile?.email?.trim() || "";
  const initials = useMemo(() => (displayName ? initialsFromName(displayName) : "?"), [displayName]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 pb-8 border-b border-outline-variant/10">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-surface-container bg-primary-container flex items-center justify-center">
            {profile?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="w-full h-full object-cover" alt="" src={profile.picture} />
            ) : (
              <span className="font-headline text-2xl font-black text-primary">{initials}</span>
            )}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
            aria-label={avatarTitle}
          >
            <span className="material-symbols-outlined text-sm" data-icon="photo_camera">
              photo_camera
            </span>
          </button>
        </div>
        <div>
          <h4 className="font-bold text-on-surface">{avatarTitle}</h4>
          {avatarHint ? <p className="mt-1 text-xs text-on-surface-variant">{avatarHint}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            {fullNameLabel}
          </label>
          <input
            className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-surface-tint/20 transition-all"
            type="text"
            defaultValue={displayName || ""}
            placeholder="—"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            {emailLabel}
          </label>
          <input
            className="w-full cursor-not-allowed bg-surface-dim/30 border-none rounded-lg px-4 py-3 text-sm text-on-surface-variant"
            type="email"
            defaultValue={email || ""}
            placeholder="—"
            disabled
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            {roleLabel}
          </label>
          <div className="w-full bg-surface-dim/30 border-none rounded-lg px-4 py-3 text-sm text-on-surface-variant flex items-center gap-2 cursor-not-allowed">
            <span className="material-symbols-outlined text-sm" data-icon="verified">
              verified
            </span>
            {roleValue}
          </div>
        </div>
      </div>
    </div>
  );
}

