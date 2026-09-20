"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LanguageToggleButton from "@components/shared/LanguageToggleButton";
import { UserDashboardHome } from "@features/user-dashboard/components/UserDashboardHome";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useLanguage } from "@/i18n/LanguageProvider";
import { startInterviewSession } from "@features/interview/services/interviewSession.service";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import { useNavigationLoading } from "@components/shared/NavigationLoadingProvider";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase() || "?";
}

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { profile, displayName } = useAuthProfile();
  const router = useRouter();
  const { showNavigationLoading, hideNavigationLoading } = useNavigationLoading();
  const [videoError, setVideoError] = useState(false);

  const [avatarError, setAvatarError] = useState(false);

  const navigate = (href: string) => {
    showNavigationLoading();
    router.push(href);
  };

  const startVideo = async (jobTitle?: string) => {
    setVideoError(false);
    showNavigationLoading();
    try {
      const url = await startInterviewSession({
        mode: "video",
        lang: lang === "vi" ? "vi" : "en",
        jobTitle,
      });
      router.push(url);
    } catch {
      hideNavigationLoading();
      setVideoError(true);
    }
  };

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#F8FAFC] px-4 pb-12 pt-6 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1440px]">
          <header id="user-profile" className="mb-8 grid gap-6 border-b border-[#EAEFF8] pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9D7F1] bg-white px-3.5 py-1 text-xs font-bold text-[#204195] shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FCB625]" />
                <span>{t("userDash.workspace.eyebrow")}</span>
              </div>
              <h1 className="mt-3 font-headline text-[clamp(1.85rem,2.8vw,2.5rem)] font-extrabold leading-tight tracking-[-0.03em] text-[#14244B]">
                {t("userDash.workspace.welcome")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#607096] sm:text-base">
                {t("userDash.workspace.subtitle")}
              </p>
            </div>
            <div className="flex min-w-0 items-center rounded-2xl border border-[#DCE4F3] bg-white p-1.5 shadow-xs lg:max-w-sm">
              <Link
                href="/dashboard/profile"
                className="group flex min-w-0 flex-1 items-center rounded-xl p-1 transition-all hover:bg-[#F7F9FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]"
                aria-label={t("userDash.nav.profile")}
                title={t("userDash.nav.profile")}
              >
                {profile?.picture && !avatarError ? (
                  <img
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-xl border border-[#DCE4F3] object-cover"
                    src={profile.picture}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DCE4F3] bg-[#204195] text-sm font-bold text-[#FCB625]">
                    {displayName ? initialsFromName(displayName) : "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1 px-3">
                  <p className="truncate text-sm font-bold text-[#14244B] group-hover:text-[#204195]">
                    {displayName || t("userDash.profile.guest")}
                  </p>
                  <p className="text-[11px] font-medium text-[#607096]">{t("userDash.roleFallback")}</p>
                </div>
              </Link>
              <div className="h-7 w-px shrink-0 bg-[#EAEFF8]" aria-hidden="true" />
              <LanguageToggleButton className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#204195] transition-colors hover:bg-[#F0F4FC]" />
            </div>
          </header>
          <UserDashboardHome onNavigate={navigate} onStartVideo={startVideo} videoError={videoError} onDismissVideoError={() => setVideoError(false)} />
        </div>
      </main>
    </UserDashboardShell>
  );
}
