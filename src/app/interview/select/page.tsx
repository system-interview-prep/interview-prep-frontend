"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useNavigationLoading } from "../../../components/NavigationLoadingProvider";
import LanguageToggleButton from "../../../components/LanguageToggleButton";
import { UserDashboardShell } from "../../../components/user-dashboard/UserDashboardShell";
import { DemoSessionsHistory } from "../../../components/user-dashboard/DemoSessionsHistory";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { startDemoVideoInterviewRoom } from "../../../utils/demoInterviewSession";
import { useAuthProfile } from "../../../auth/useAuthProfile";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function InterviewSelectPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { showNavigationLoading, hideNavigationLoading } = useNavigationLoading();
  const { profile, displayName } = useAuthProfile();
  const roleLabel = t("userDash.roleFallback");
  const initials = useMemo(() => (displayName ? initialsFromName(displayName) : "?"), [displayName]);

  const goToChat = () => {
    showNavigationLoading();
    router.push("/chat");
  };

  const goToVoice = () => {
    showNavigationLoading();
    router.push("/voice");
  };

  const goToRoom = async () => {
    showNavigationLoading();
    try {
      await startDemoVideoInterviewRoom(lang === "vi" ? "vi" : "en");
    } catch {
      hideNavigationLoading();
    }
  };

  return (
    <UserDashboardShell>
      <main className="paper-dots min-h-screen bg-[#FEF9EE] px-4 pb-8 pt-6 text-[#234196] sm:px-6 md:px-8 md:py-10 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 grid gap-6 border-b-2 border-[#234196] pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-2xl">
            <span className="mb-2 inline-block font-metadata text-[10px] font-bold uppercase tracking-[.18em] text-[#E59E10]">
              {t("interview.select.eyebrow")}
            </span>
            <h1 className="font-headline text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-tight tracking-[-.03em] text-[#234196]">
              {t("interview.select.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#5A6B8F] sm:text-base">
              {t("interview.select.subtitle")}
            </p>
          </div>
          <div className="flex min-w-0 items-center rounded-2xl border-2 border-[#234196] bg-white p-2 shadow-[3px_3px_0_#234196] lg:max-w-sm">
            <Link
              href="/dashboard"
              className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625]"
              aria-label={t("interview.select.backDashboard")}
              title={t("interview.select.backDashboard")}
            >
              {profile?.picture ? (
                  <img
                    alt=""
                    className="h-11 w-11 rounded-xl border-2 border-[#234196] object-cover"
                    src={profile.picture}
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] font-headline text-sm font-bold text-[#234196]">
                    {initials}
                  </div>
                )}
            </Link>
            <div className="min-w-0 flex-1 px-3">
              <p className="truncate text-sm font-bold text-[#234196]">{displayName || t("userDash.profile.guest")}</p>
              <p className="mt-0.5 font-metadata text-[8px] text-[#5A6B8F]">{roleLabel}</p>
            </div>
            <div className="h-8 w-px shrink-0 bg-[#B7C6E6]" aria-hidden="true" />
            <LanguageToggleButton className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#234196] transition-colors hover:bg-[#F0F4FC]" />
          </div>
        </header>

        <section className="mb-16" aria-label={t("interview.select.eyebrow")}>
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:gap-8">
            <button
              type="button"
              onClick={goToChat}
              className="group relative flex h-full min-h-[310px] w-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#234196] bg-white p-7 text-left shadow-[3px_3px_0_#234196] transition-all duration-200 hover:-translate-y-1.5 hover:bg-[#F8FAFF] hover:shadow-[6px_6px_0_#234196] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FCB625]/50 motion-reduce:transform-none md:p-8"
            >
              <div className="relative z-[1]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#F0F4FC] text-[#234196] transition-transform duration-200 group-hover:-rotate-2">
                  <span className="material-symbols-outlined select-none text-3xl leading-none" aria-hidden="true">chat_bubble</span>
                </div>
                <h2 className="mb-3 font-headline text-xl font-bold text-[#17244A]">
                  {t("userDash.mode.chat.title")}
                </h2>
                <p className="body-md leading-relaxed text-[#5A6B8F]">
                  {t("userDash.mode.chat.desc")}
                </p>
              </div>
              <span className="relative z-[1] mt-8 flex min-h-11 items-center justify-between gap-2 border-t-2 border-[#234196] pt-4 font-bold text-[#234196]">
                {t("userDash.mode.chat.cta")}
                <span className="material-symbols-outlined select-none text-[18px] leading-none transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  arrow_forward
                </span>
              </span>
              <span className="material-symbols-outlined pointer-events-none absolute -bottom-5 -right-4 select-none text-9xl leading-none text-[#234196] opacity-[0.04] transition-opacity group-hover:opacity-[0.08]" aria-hidden="true">chat_bubble</span>
            </button>

            <button
              type="button"
              onClick={goToVoice}
              className="group relative flex h-full min-h-[310px] w-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] p-7 text-left shadow-[3px_3px_0_#234196] transition-all duration-200 hover:-translate-y-1.5 hover:bg-[#E8EEFA] hover:shadow-[6px_6px_0_#234196] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FCB625]/50 motion-reduce:transform-none md:p-8"
            >
              <div className="relative z-[1]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#EEEAFE] text-[#6552C7] transition-transform duration-200 group-hover:-rotate-2">
                  <span className="material-symbols-outlined select-none text-3xl leading-none" aria-hidden="true">settings_voice</span>
                </div>
                <h2 className="mb-3 font-headline text-xl font-bold text-[#17244A]">
                  {t("userDash.mode.voice.title")}
                </h2>
                <p className="body-md leading-relaxed text-[#5A6B8F]">
                  {t("userDash.mode.voice.desc")}
                </p>
              </div>
              <span className="relative z-[1] mt-8 flex min-h-11 items-center justify-between gap-2 border-t-2 border-[#234196] pt-4 font-bold text-[#6552C7]">
                {t("userDash.mode.voice.cta")}
                <span className="material-symbols-outlined select-none text-[18px] leading-none transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  arrow_forward
                </span>
              </span>
              <span className="material-symbols-outlined pointer-events-none absolute -bottom-5 -right-4 select-none text-9xl leading-none text-[#6552C7] opacity-[0.04] transition-opacity group-hover:opacity-[0.08]" aria-hidden="true">settings_voice</span>
            </button>

            <button
              type="button"
              onClick={goToRoom}
              className="group relative flex h-full min-h-[310px] w-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#234196] bg-[#FEF9EE] p-7 text-left shadow-[3px_3px_0_#234196] transition-all duration-200 hover:-translate-y-1.5 hover:bg-[#FFF4D9] hover:shadow-[6px_6px_0_#234196] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FCB625]/50 motion-reduce:transform-none md:p-8"
            >
              <span className="sticker absolute right-4 top-4 z-[2] bg-[#FCB625] text-[8px]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E29000] motion-reduce:animate-none" aria-hidden="true" />
                {t("userDash.mode.video.badge")}
              </span>
              <div className="relative z-[1]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] text-[#234196] transition-transform duration-200 group-hover:-rotate-2">
                  <span className="material-symbols-outlined select-none text-3xl leading-none" aria-hidden="true">videocam</span>
                </div>
                <h2 className="mb-3 font-headline text-xl font-bold text-[#17244A]">
                  {t("userDash.mode.video.title")}
                </h2>
                <p className="body-md leading-relaxed text-[#5A6B8F]">
                  {t("userDash.mode.video.desc")}
                </p>
              </div>
              <span className="relative z-[1] mt-8 flex min-h-11 items-center justify-between gap-2 border-t-2 border-[#234196] pt-4 font-bold text-[#B76B00]">
                {t("userDash.mode.video.cta")}
                <span className="material-symbols-outlined select-none text-[18px] leading-none transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  arrow_forward
                </span>
              </span>
              <span className="material-symbols-outlined pointer-events-none absolute -bottom-5 -right-4 select-none text-9xl leading-none text-[#B76B00] opacity-[0.04] transition-opacity group-hover:opacity-[0.08]" aria-hidden="true">videocam</span>
            </button>
          </div>
        </section>

        <DemoSessionsHistory variant="full" />
        </div>
      </main>
    </UserDashboardShell>
  );
}
