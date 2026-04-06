"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import UserJobProfilesSection from "../../components/user-dashboard/UserJobProfilesSection";
import { UserDashboardShell } from "../../components/user-dashboard/UserDashboardShell";
import { useLanguage } from "../../i18n/LanguageProvider";
import { startDemoVideoInterviewRoom } from "../../utils/demoInterviewSession";
import { useAuthProfile } from "../../auth/useAuthProfile";
import { useRouter, useSearchParams } from "next/navigation";

type DemoSession = {
  roomId: string;
  topic: string;
  startedAt: string;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function initialsFromTopic(topic: string) {
  const parts = topic.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return topic.slice(0, 2).toUpperCase() || "?";
}

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const { profile, displayName } = useAuthProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageSize = 8;
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const loadFromStorage = useCallback(() => {
    setSessions(safeJsonParse<DemoSession[]>(localStorage.getItem("demo.sessions")) ?? []);
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    function onFocus() {
      loadFromStorage();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadFromStorage]);

  function persistSessions(next: DemoSession[]) {
    localStorage.setItem("demo.sessions", JSON.stringify(next));
    setSessions(next);
  }

  const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const sessionsPage = sessions.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const setPage = (p: number) => {
    const next = Math.max(1, Math.min(p, totalPages));
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("page", String(next));
    router.replace(`/dashboard?${sp.toString()}`, { scroll: false });
  };

  const welcomeTitle = displayName
    ? t("userDash.welcomeWithName").replace("{name}", displayName)
    : t("userDash.welcomeFallback");
  const roleLabel = t("userDash.roleFallback");

  return (
    <UserDashboardShell>
      <main className="min-h-screen p-6 md:p-12 bg-surface md:pb-12">
        <header
          id="user-profile"
          className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end mb-12 scroll-mt-24"
        >
          <div>
            <h2 className="font-headline font-extrabold text-on-surface text-3xl md:text-4xl tracking-tighter">
              {welcomeTitle}
            </h2>
            <p className="text-on-surface-variant mt-2 font-body text-lg">
              {t("userDash.welcomeSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 justify-between sm:justify-end">
            <LanguageToggleButton />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-headline font-bold text-on-surface">
                  {displayName || "—"}
                </p>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
                  {roleLabel}
                </p>
              </div>
              {profile?.picture ? (
                <img
                  alt=""
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10"
                  src={profile.picture}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center font-headline font-bold text-primary text-sm ring-2 ring-primary/10">
                  {displayName ? initialsFromTopic(displayName) : "?"}
                </div>
              )}
            </div>
          </div>
        </header>

        <UserJobProfilesSection />

        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">chat_bubble</span>
              </div>
              <h3 className="font-headline font-bold text-xl mb-3">{t("userDash.mode.chat.title")}</h3>
              <p className="text-on-surface-variant body-md leading-relaxed mb-8">
                {t("userDash.mode.chat.desc")}
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 text-primary font-bold group/btn"
              >
                {t("userDash.mode.chat.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </Link>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-9xl">chat_bubble</span>
              </div>
            </div>

            <div className="group relative overflow-hidden bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 rounded-xl bg-secondary-container flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">settings_voice</span>
              </div>
              <h3 className="font-headline font-bold text-xl mb-3">{t("userDash.mode.voice.title")}</h3>
              <p className="text-on-surface-variant body-md leading-relaxed mb-8">
                {t("userDash.mode.voice.desc")}
              </p>
              <Link
                href="/voice"
                className="inline-flex items-center gap-2 text-primary font-bold group/btn"
              >
                {t("userDash.mode.voice.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </Link>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-9xl">settings_voice</span>
              </div>
            </div>

            <div className="group relative overflow-hidden ai-glass-gradient p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 text-white">
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">videocam</span>
              </div>
              <h3 className="font-headline font-bold text-xl mb-3">{t("userDash.mode.video.title")}</h3>
              <p className="text-white/90 body-md leading-relaxed mb-8">
                {t("userDash.mode.video.desc")}
              </p>
              <button
                type="button"
                onClick={() => startDemoVideoInterviewRoom(lang === "vi" ? "vi" : "en")}
                className="inline-flex items-center gap-2 text-white font-bold group/btn"
              >
                {t("userDash.mode.video.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  {t("userDash.mode.video.badge")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
            <h3 className="font-headline font-bold text-2xl">{t("userDash.history.title")}</h3>
            <Link
              href="/interview-summary"
              className="text-primary text-sm font-bold flex items-center gap-1 hover:underline w-fit"
            >
              {t("userDash.history.viewArchive")}
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </Link>
          </div>
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-bold tracking-[0.2em]">
                  <th className="px-8 py-5">{t("userDash.table.candidateDate")}</th>
                  <th className="px-8 py-5">{t("userDash.table.mode")}</th>
                  <th className="px-8 py-5 text-center">{t("userDash.table.score")}</th>
                  <th className="px-8 py-5 text-right">{t("userDash.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-on-surface-variant">
                      {t("dashboard.empty")}
                    </td>
                  </tr>
                ) : (
                  sessionsPage.map((s) => (
                    <tr key={s.roomId} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-bold text-sm">
                            {initialsFromTopic(s.topic)}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{s.topic}</p>
                            <p className="text-xs text-on-surface-variant">
                              {new Date(s.startedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-on-surface-variant font-medium text-sm">
                          <span className="material-symbols-outlined text-lg">chat_bubble</span>
                          {t("userDash.table.modeChat")}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center">
                          <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold ring-1 ring-outline-variant/30">
                            —
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link
                          href={`/interview/room/${s.roomId}`}
                          className="px-4 py-2 text-primary font-bold text-sm hover:bg-primary/5 rounded-lg transition-colors inline-block"
                        >
                          {t("userDash.table.viewSummary")}
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {sessions.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-on-surface-variant">
                {Math.min((pageSafe - 1) * pageSize + 1, sessions.length)}–
                {Math.min(pageSafe * pageSize, sessions.length)} / {sessions.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(pageSafe - 1)}
                  disabled={pageSafe <= 1}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="min-w-[5rem] text-center text-sm font-semibold text-on-surface">
                  Page {pageSafe}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(pageSafe + 1)}
                  disabled={pageSafe >= totalPages}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-16">
          <div className="bg-surface-container p-8 rounded-xl flex flex-col justify-center">
            <span className="text-tertiary font-bold uppercase text-[10px] tracking-widest mb-4">
              {t("userDash.training.label")}
            </span>
            <h3 className="font-headline font-extrabold text-3xl mb-4 leading-tight">
              {t("userDash.training.title")}
            </h3>
            <p className="text-on-surface-variant mb-8 max-w-md">{t("userDash.training.desc")}</p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/practice"
                className="px-8 py-4 bg-tertiary text-white rounded-xl font-bold hover:bg-tertiary-container transition-colors shadow-lg shadow-tertiary/20 text-center"
              >
                {t("userDash.training.quiz")}
              </Link>
              <Link
                href="/resources"
                className="px-8 py-4 bg-transparent text-tertiary border-2 border-tertiary/20 rounded-xl font-bold hover:bg-tertiary/5 transition-colors text-center"
              >
                {t("userDash.training.explore")}
              </Link>
            </div>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-8">
            <div className="flex-1">
              <h4 className="font-headline font-bold text-xl mb-2">{t("userDash.progress.title")}</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tighter">
                    <span>{t("userDash.progress.bias")}</span>
                    <span>88%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "88%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tighter">
                    <span>{t("userDash.progress.semantic")}</span>
                    <span>65%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden sm:block shrink-0">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  <circle
                    className="text-surface-container"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                  <circle
                    className="text-primary"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="56"
                    stroke="currentColor"
                    strokeDasharray="351.8"
                    strokeDashoffset="88"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">75%</span>
                  <span className="text-[8px] uppercase font-bold tracking-widest text-on-surface-variant text-center">
                    {t("userDash.progress.global")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-24 w-full border-t border-[#c3c6d6]/20 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-center sm:text-left">
              <span className="font-headline font-bold text-[#191c1e] text-xl">
                {t("userDash.footer.brand")}
              </span>
              <span className="text-xs text-on-surface-variant font-inter">{t("userDash.footer.copy")}</span>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <a className="text-xs text-[#434654] font-inter hover:underline transition-colors" href="#">
                {t("userDash.footer.privacy")}
              </a>
              <a className="text-xs text-[#434654] font-inter hover:underline transition-colors" href="#">
                {t("userDash.footer.terms")}
              </a>
              <a className="text-xs text-[#434654] font-inter hover:underline transition-colors" href="#">
                {t("userDash.footer.cookies")}
              </a>
              <a className="text-xs text-[#434654] font-inter hover:underline transition-colors" href="#">
                {t("userDash.footer.security")}
              </a>
            </div>
          </div>
        </footer>
      </main>
    </UserDashboardShell>
  );
}
