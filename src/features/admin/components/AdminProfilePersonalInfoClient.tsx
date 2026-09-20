"use client";

import { useMemo } from "react";
import { Camera, BadgeCheck } from "lucide-react";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";

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
      <div className="flex items-center gap-6 pb-8 border-b border-[#EAEFF8]">
        <div className="relative group">
          <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-[#EEF2FD] bg-[#EEF2FD] flex items-center justify-center">
            {profile?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="w-full h-full object-cover" alt="" src={profile.picture} />
            ) : (
              <span className="font-headline text-2xl font-black text-[#204195]">{initials}</span>
            )}
          </div>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#204195] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[#183377] transition-colors"
            aria-label={avatarTitle}
          >
            <Camera className="size-3.5" />
          </button>
        </div>
        <div>
          <h4 className="font-bold text-[#14244B] text-base">{avatarTitle}</h4>
          {avatarHint ? <p className="mt-1 text-xs text-[#607096]">{avatarHint}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#607096] uppercase tracking-wider">
            {fullNameLabel}
          </label>
          <input
            className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-4 py-2.5 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-colors"
            type="text"
            defaultValue={displayName || ""}
            placeholder="—"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#607096] uppercase tracking-wider">
            {emailLabel}
          </label>
          <input
            className="w-full cursor-not-allowed rounded-xl border border-[#EAEFF8] bg-[#F8FAFC]/60 px-4 py-2.5 text-xs font-medium text-[#607096]"
            type="email"
            defaultValue={email || ""}
            placeholder="—"
            disabled
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#607096] uppercase tracking-wider">
            {roleLabel}
          </label>
          <div className="w-full rounded-xl border border-[#EAEFF8] bg-[#F8FAFC]/60 px-4 py-2.5 text-xs font-semibold text-[#204195] flex items-center gap-2 cursor-not-allowed">
            <BadgeCheck className="size-4 text-[#204195]" />
            {roleValue}
          </div>
        </div>
      </div>
    </div>
  );
}

