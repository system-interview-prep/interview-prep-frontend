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
      <main className="min-h-screen p-6 md:p-12 bg-surface md:pb-12">
        <header className="relative flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end mb-12 scroll-mt-24">
          <div className="pointer-events-none absolute -right-8 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-[80px] dark:bg-primary/10" aria-hidden />
          <div className="relative z-[1]">
            <span className="text-tertiary font-bold uppercase text-[10px] tracking-widest mb-3 inline-block">
              {t("interview.select.eyebrow")}
            </span>
            <h1 className="font-headline font-extrabold text-on-surface text-3xl md:text-4xl tracking-tighter">
              {t("interview.select.title")}
            </h1>
            <p className="text-on-surface-variant mt-2 font-body text-lg max-w-2xl">
              {t("interview.select.subtitle")}
            </p>
          </div>
          <div className="relative z-[1] flex flex-wrap items-center gap-4 justify-between sm:justify-end">
            <LanguageToggleButton />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-headline font-bold text-on-surface">{displayName || "—"}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {roleLabel}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="shrink-0 rounded-full ring-2 ring-primary/10 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label={t("interview.select.backDashboard")}
                title={t("interview.select.backDashboard")}
              >
                {profile?.picture ? (
                  <img
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                    src={profile.picture}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed font-headline text-sm font-bold text-primary">
                    {initials}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-fixed text-primary transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">chat_bubble</span>
              </div>
              <h3 className="mb-3 font-headline text-xl font-bold text-on-surface">
                {t("userDash.mode.chat.title")}
              </h3>
              <p className="mb-8 text-on-surface-variant body-md leading-relaxed">
                {t("userDash.mode.chat.desc")}
              </p>
              <button
                type="button"
                onClick={goToChat}
                className="group/btn inline-flex items-center gap-2 border-0 bg-transparent p-0 font-bold text-primary"
              >
                {t("userDash.mode.chat.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-5 transition-opacity group-hover:opacity-10">
                <span className="material-symbols-outlined text-9xl">chat_bubble</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary-container text-primary transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">settings_voice</span>
              </div>
              <h3 className="mb-3 font-headline text-xl font-bold text-on-surface">
                {t("userDash.mode.voice.title")}
              </h3>
              <p className="mb-8 text-on-surface-variant body-md leading-relaxed">
                {t("userDash.mode.voice.desc")}
              </p>
              <button
                type="button"
                onClick={goToVoice}
                className="group/btn inline-flex items-center gap-2 border-0 bg-transparent p-0 font-bold text-primary"
              >
                {t("userDash.mode.voice.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-5 transition-opacity group-hover:opacity-10">
                <span className="material-symbols-outlined text-9xl">settings_voice</span>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-xl ai-glass-gradient p-8 text-white shadow-lg transition-all duration-300 hover:shadow-2xl">
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  {t("userDash.mode.video.badge")}
                </span>
              </div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">videocam</span>
              </div>
              <h3 className="mb-3 font-headline text-xl font-bold">{t("userDash.mode.video.title")}</h3>
              <p className="mb-8 text-white/90 body-md leading-relaxed">{t("userDash.mode.video.desc")}</p>
              <button
                type="button"
                onClick={goToRoom}
                className="group/btn inline-flex items-center gap-2 font-bold text-white"
              >
                {t("userDash.mode.video.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="pointer-events-none absolute -bottom-4 -right-4 text-white opacity-[0.07] transition-opacity group-hover:opacity-[0.12]">
                <span className="material-symbols-outlined text-9xl">videocam</span>
              </div>
            </div>
          </div>
        </section>

        <DemoSessionsHistory variant="full" />
      </main>
    </UserDashboardShell>
  );
}
