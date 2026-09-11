"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import { UserDashboardHome } from "../../components/user-dashboard/UserDashboardHome";
import { UserDashboardShell } from "../../components/user-dashboard/UserDashboardShell";
import { useLanguage } from "../../i18n/LanguageProvider";
import { startDemoVideoInterviewRoom } from "../../utils/demoInterviewSession";
import { useAuthProfile } from "../../auth/useAuthProfile";
import { useNavigationLoading } from "../../components/NavigationLoadingProvider";

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
      await startDemoVideoInterviewRoom(lang === "vi" ? "vi" : "en", jobTitle);
    } catch {
      hideNavigationLoading();
      setVideoError(true);
    }
  };

  return (
    <UserDashboardShell>
      <main className="paper-dots min-h-screen bg-[#FEF9EE] px-4 pb-8 pt-6 text-[#234196] sm:px-6 md:px-8 md:py-10 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1440px]">
          <header id="user-profile" className="mb-8 grid gap-6 border-b-2 border-[#234196] pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="font-metadata text-[10px] font-bold tracking-[.18em] text-[#E59E10]">{t("userDash.workspace.eyebrow")}</p>
              <h1 className="mt-2 font-headline text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-tight tracking-[-.03em]">{t("userDash.workspace.welcome")}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#5A6B8F] sm:text-base">{t("userDash.workspace.subtitle")}</p>
            </div>
            <div className="flex min-w-0 items-center rounded-2xl border-2 border-[#234196] bg-white p-2 shadow-[3px_3px_0_#234196] lg:max-w-sm">
              <Link
                href="/dashboard/profile"
                className="group flex min-w-0 flex-1 items-center rounded-xl p-0.5 transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625]"
                aria-label={t("userDash.nav.profile")}
                title={t("userDash.nav.profile")}
              >
                {profile?.picture && !avatarError ? (
                  <img
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-xl border-2 border-[#234196] object-cover"
                    src={profile.picture}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] text-sm font-bold text-[#234196]">
                    {displayName ? initialsFromName(displayName) : "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1 px-3">
                  <p className="truncate text-sm font-bold text-[#234196] group-hover:underline decoration-[#FCB625] decoration-2 underline-offset-2">
                    {displayName || t("userDash.profile.guest")}
                  </p>
                  <p className="mt-0.5 font-metadata text-[8px] text-[#5A6B8F]">{t("userDash.roleFallback")}</p>
                </div>
              </Link>
              <div className="h-8 w-px shrink-0 bg-[#B7C6E6]" aria-hidden="true" />
              <LanguageToggleButton className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#234196] transition-colors hover:bg-[#F0F4FC]" />
            </div>
          </header>
          <UserDashboardHome onNavigate={navigate} onStartVideo={startVideo} videoError={videoError} onDismissVideoError={() => setVideoError(false)} />
        </div>
      </main>
    </UserDashboardShell>
  );
}
