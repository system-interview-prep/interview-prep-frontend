"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LanguageToggleButton from "../../../components/LanguageToggleButton";
import { UserDashboardShell } from "../../../components/user-dashboard/UserDashboardShell";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { startDemoVideoInterviewRoom } from "../../../utils/demoInterviewSession";

type GoogleProfile = {
  email?: string | null;
  name?: string | null;
  picture?: string | null;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function InterviewSelectPage() {
  const { t, lang } = useLanguage();
  const [profile, setProfile] = useState<GoogleProfile | null>(null);

  const loadProfile = useCallback(() => {
    setProfile(safeJsonParse<GoogleProfile>(localStorage.getItem("auth.googleProfile")));
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    function onFocus() {
      loadProfile();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadProfile]);

  const displayName = profile?.name?.trim() || profile?.email?.split("@")[0] || "";
  const roleLabel = t("userDash.roleFallback");

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
                    {displayName ? initialsFromName(displayName) : "?"}
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
              <Link
                href="/chat"
                className="group/btn inline-flex items-center gap-2 font-bold text-primary"
              >
                {t("userDash.mode.chat.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </Link>
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
              <Link
                href="/voice"
                className="group/btn inline-flex items-center gap-2 font-bold text-primary"
              >
                {t("userDash.mode.voice.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </Link>
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
                onClick={() => startDemoVideoInterviewRoom(lang === "vi" ? "vi" : "en")}
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

        <section className="mb-16 border-t border-outline-variant/20 pt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-headline text-2xl font-bold text-on-surface">{t("userDash.history.title")}</h3>
            <Link
              href="/interview-summary"
              className="flex w-fit items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              {t("userDash.history.viewArchive")}
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </Link>
          </div>
        </section>
      </main>
    </UserDashboardShell>
  );
}
