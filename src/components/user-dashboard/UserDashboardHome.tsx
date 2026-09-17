"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobCategoryApi, type JobCategory } from "@/services/jobCategoryApi";
import { jobProfileApi, type JobProfile } from "@/services/jobProfileApi";
import { JobInterviewCvModal } from "@/components/user-dashboard/JobInterviewCvModal";
import { LearningResources, PracticeModes, RecentActivity, type StoredDashboardSession } from "./DashboardSections";

type Props = {
  onNavigate: (href: string) => void;
  onStartVideo: (jobTitle?: string) => Promise<void>;
  videoError: boolean;
  onDismissVideoError: () => void;
};

const surface = "rounded-2xl border-2 border-[#234196] bg-white shadow-[3px_3px_0_#234196]";
const interactive = "transition-[background-color,color,transform] duration-200 motion-reduce:transition-none active:translate-y-px";

function readSessions(): StoredDashboardSession[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("demo.sessions") ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredDashboardSession => {
      if (!item || typeof item !== "object") return false;
      const row = item as Partial<StoredDashboardSession>;
      return Boolean(row.roomId && row.topic && row.startedAt);
    });
  } catch {
    return [];
  }
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function practiceStreak(sessions: StoredDashboardSession[]) {
  const days = new Set(sessions.map((item) => new Date(item.startedAt)).filter((date) => !Number.isNaN(date.getTime())).map(dayKey));
  if (!days.size) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6" role="status" aria-label={label}>
      <div className="h-80 animate-pulse rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] motion-reduce:animate-none" />)}</div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function UserDashboardHome({ onNavigate, onStartVideo, videoError, onDismissVideoError }: Props) {
  const { t, lang } = useLanguage();
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [sessions, setSessions] = useState<StoredDashboardSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobProfile | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    setSessions(readSessions());
    const [profilesResult, categoriesResult] = await Promise.allSettled([
      jobProfileApi.list({ limit: 6, order: "desc" }),
      jobCategoryApi.list({ limit: 200 }),
    ]);
    if (profilesResult.status === "fulfilled") {
      setProfiles((profilesResult.value.data.items ?? []).filter((profile) => profile.status === "ACTIVE"));
    } else {
      setProfiles([]);
      setError(true);
      if (axios.isAxiosError(profilesResult.reason)) console.error("Dashboard profiles:", profilesResult.reason.message);
    }
    setCategories(categoriesResult.status === "fulfilled" ? categoriesResult.value.data.items ?? [] : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);
  useEffect(() => {
    const refresh = () => setSessions(readSessions());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, []);

  const activeJob = profiles[0];
  const categoryName = (profile: JobProfile) => profile.category?.name ?? categories.find((category) => category.id === profile.categoryId)?.name ?? t("userDash.jobProfiles.uncategorized");
  const overview = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return {
      thisWeek: sessions.filter((item) => { const time = new Date(item.startedAt).getTime(); return Number.isFinite(time) && time >= start.getTime() && time <= now.getTime(); }).length,
      streak: practiceStreak(sessions),
    };
  }, [sessions]);

  const beginRecommended = () => activeJob ? setSelectedJob(activeJob) : void onStartVideo();
  if (loading) return <DashboardSkeleton label={t("userDash.loading")} />;

  return (
    <div className="space-y-12 md:space-y-16">
      {videoError ? (
        <div className="flex items-start justify-between gap-4 rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] px-4 py-3 text-sm text-[#8F1D1D] shadow-[3px_3px_0_#D32F2F]" role="alert">
          <div className="flex gap-3"><span className="material-symbols-outlined mt-0.5 text-xl" aria-hidden="true">error</span><p><strong>{t("userDash.error.videoTitle")}</strong> {t("userDash.error.videoBody")}</p></div>
          <button type="button" onClick={onDismissVideoError} className="grid min-h-11 min-w-11 place-items-center rounded-lg hover:bg-black/5" aria-label={t("userDash.error.dismiss")}>×</button>
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] p-4 text-sm text-[#8F1D1D] shadow-[3px_3px_0_#D32F2F] sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p>{t("userDash.error.profiles")}</p><button type="button" onClick={() => void loadDashboard()} className={`min-h-11 rounded-lg border border-current px-4 font-semibold hover:bg-white ${interactive}`}>{t("userDash.error.retry")}</button>
        </div>
      ) : null}

      <section aria-labelledby="next-action-title" className="grid overflow-hidden rounded-2xl border-2 border-[#234196] bg-[#234196] text-white shadow-[7px_7px_0_#FCB625] lg:grid-cols-12">
        <div className="relative p-6 sm:p-8 lg:col-span-8 lg:p-10">
          <div aria-hidden="true" className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#FCB625]/20 blur-3xl" />
          <p className="font-metadata text-[10px] font-bold text-[#FCB625]">{t("userDash.next.label")}</p>
          <h2 id="next-action-title" className="mt-4 max-w-3xl font-headline text-3xl leading-tight sm:text-4xl lg:text-5xl">{activeJob ? t("userDash.next.titleWithRole").replace("{role}", activeJob.title) : t("userDash.next.titleFallback")}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">{t(activeJob ? "userDash.next.descWithRole" : "userDash.next.descFallback")}</p>
          <dl className="mt-7 grid gap-4 border-y border-white/15 py-5 sm:grid-cols-3">
            <div><dt className="font-metadata text-[9px] text-white/50">{t("userDash.next.role")}</dt><dd className="mt-1 text-sm font-semibold">{activeJob?.title ?? t("userDash.next.noRole")}</dd></div>
            <div><dt className="font-metadata text-[9px] text-white/50">{t("userDash.next.focus")}</dt><dd className="mt-1 text-sm font-semibold">{activeJob?.keywords?.slice(0, 2).join(" · ") || t("userDash.next.focusFallback")}</dd></div>
            <div><dt className="font-metadata text-[9px] text-white/50">{t("userDash.next.duration")}</dt><dd className="mt-1 text-sm font-semibold">{t("userDash.next.durationValue")}</dd></div>
          </dl>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={beginRecommended} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-white bg-[#FCB625] px-6 text-sm font-bold text-[#234196] shadow-[3px_3px_0_white] hover:bg-[#FFC33F] sm:w-auto ${interactive}`}><span className="material-symbols-outlined text-xl" aria-hidden="true">play_arrow</span>{sessions.length ? t("userDash.next.continue") : t("userDash.next.start")}</button>
            <button type="button" onClick={() => onNavigate("/voice")} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-white bg-white px-6 text-sm font-bold text-[#234196] shadow-[3px_3px_0_#FCB625] hover:bg-[#F0F4FC] sm:w-auto ${interactive}`}><span className="material-symbols-outlined text-xl" aria-hidden="true">bolt</span>{t("userDash.next.quick")}</button>
          </div>
        </div>
        <aside className="flex flex-col justify-between border-t border-white/15 bg-white/[0.06] p-6 sm:p-8 lg:col-span-4 lg:border-l lg:border-t-0 lg:p-10">
          <div><p className="font-metadata text-[10px] font-bold text-[#FCB625]">{t("userDash.next.activeProfile")}</p><div className="mt-6 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white bg-[#FCB625] text-[#234196]"><span className="material-symbols-outlined" aria-hidden="true">work</span></div><h3 className="mt-5 font-headline text-2xl">{activeJob?.title ?? t("userDash.next.profileEmptyTitle")}</h3><p className="mt-2 text-sm leading-6 text-white/75">{activeJob ? categoryName(activeJob) : t("userDash.next.profileEmptyBody")}</p></div>
          <button type="button" onClick={() => onNavigate(activeJob ? `/dashboard/jobs/${activeJob.id}` : "/dashboard/jobs")} className="mt-8 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold underline decoration-white/30 underline-offset-4 hover:decoration-white">{activeJob ? t("userDash.next.viewProfile") : t("userDash.next.chooseProfile")}<span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span></button>
        </aside>
      </section>

      <section aria-labelledby="overview-title">
        <div className="mb-5 flex items-end justify-between gap-4"><div><span className="sticker -rotate-1 bg-[#FCB625]">{t("userDash.overview.eyebrow")}</span><h2 id="overview-title" className="mt-4 font-headline text-3xl">{t("userDash.overview.title")}</h2></div><p className="hidden max-w-md text-right text-sm text-[#5A6B8F] sm:block">{t("userDash.overview.sourceNote")}</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className={`${surface} bg-[#F0F4FC] p-5 sm:col-span-2`}><div className="flex items-start justify-between gap-4"><div><p className="font-metadata text-[9px] text-[#5A6B8F]">{t("userDash.overview.readiness")}</p><p className="mt-4 font-headline text-3xl">—</p></div><span className="material-symbols-outlined rounded-lg border-2 border-[#234196] bg-[#FCB625] p-2 text-[#234196]" aria-hidden="true">monitoring</span></div><p className="mt-3 max-w-lg text-sm leading-6 text-[#5A6B8F]">{t("userDash.overview.readinessEmpty")}</p><button type="button" onClick={beginRecommended} className="mt-4 min-h-11 text-sm font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4">{t("userDash.overview.readinessCta")}</button></article>
          <article className={`${surface} p-5`}><span className="material-symbols-outlined text-[#2E7D32]" aria-hidden="true">calendar_today</span><p className="mt-5 font-headline text-3xl tabular-nums">{overview.thisWeek}</p><h3 className="mt-1 text-sm font-semibold">{t("userDash.overview.weekSessions")}</h3><p className="mt-2 text-xs leading-5 text-[#5A6B8F]">{t("userDash.overview.weekSessionsHelp")}</p></article>
          <article className={`${surface} bg-[#FEF9EE] p-5`}><span className="material-symbols-outlined text-[#E59E10]" aria-hidden="true">local_fire_department</span><p className="mt-5 font-headline text-3xl tabular-nums">{overview.streak}</p><h3 className="mt-1 text-sm font-semibold">{t("userDash.overview.streak")}</h3><p className="mt-2 text-xs leading-5 text-[#5A6B8F]">{t("userDash.overview.streakHelp")}</p></article>
          <article className={`${surface} p-5 sm:col-span-2 lg:col-span-4`}><div className="flex items-start gap-4"><span className="material-symbols-outlined text-[#234196]" aria-hidden="true">schedule</span><div><div className="flex flex-wrap items-baseline gap-3"><h3 className="text-sm font-semibold">{t("userDash.overview.time")}</h3><span className="font-headline text-2xl">—</span></div><p className="mt-1 text-xs leading-5 text-[#5A6B8F]">{t("userDash.overview.timeUnavailable")}</p></div></div></article>
        </div>
      </section>

      <PracticeModes onNavigate={onNavigate} onStartVideo={() => void onStartVideo(activeJob?.title)} t={t} />
      <section aria-labelledby="jobs-title">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="sticker rotate-1 bg-[#FCB625]">{t("userDash.jobs.eyebrow")}</span><h2 id="jobs-title" className="mt-4 font-headline text-3xl">{t("userDash.jobs.title")}</h2><p className="mt-2 text-sm text-[#5A6B8F]">{t("userDash.jobs.subtitle")}</p></div><Link href="/dashboard/jobs" onClick={(event) => { event.preventDefault(); onNavigate("/dashboard/jobs"); }} className="inline-flex min-h-11 items-center gap-2 self-start py-2 text-sm font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4">{t("userDash.jobProfiles.viewAll")}<span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span></Link></div>
        {profiles.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{profiles.slice(0, 3).map((profile, index) => <article key={profile.id} className={`${surface} flex min-w-0 flex-col p-5 ${index === 0 ? "bg-[#FEF9EE] shadow-[5px_5px_0_#234196]" : ""}`}><div className="flex items-center justify-between gap-3"><span className="sticker truncate bg-[#F0F4FC] text-[9px]">{categoryName(profile)}</span>{index === 0 ? <span className="sticker -rotate-2 bg-[#FCB625] text-[8px]">{t("userDash.jobs.active")}</span> : null}</div><h3 className="mt-5 font-headline text-2xl leading-tight">{profile.title}</h3><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[#5A6B8F]">{profile.keywords?.join(" · ") || t("userDash.jobs.noSkills")}</p><div className="mt-6 flex flex-wrap gap-3 border-t-2 border-[#234196] pt-4"><Link href={`/dashboard/jobs/${profile.id}`} onClick={(event) => { event.preventDefault(); onNavigate(`/dashboard/jobs/${profile.id}`); }} className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-bold hover:bg-[#F0F4FC]">{t("userDash.jobs.details")}</Link><button type="button" onClick={() => setSelectedJob(profile)} className={`chunky-primary ml-auto min-h-11 px-4 text-sm ${interactive}`}>{t("userDash.jobs.practice")}<span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span></button></div></article>)}</div> : <div className={`${surface} bg-[#F0F4FC] p-7 text-center`}><span className="material-symbols-outlined text-3xl" aria-hidden="true">work_off</span><h3 className="mt-3 font-headline text-xl">{t("userDash.jobs.emptyTitle")}</h3><p className="mx-auto mt-2 max-w-lg text-sm text-[#5A6B8F]">{t("userDash.jobs.emptyBody")}</p><button type="button" onClick={() => onNavigate("/dashboard/jobs")} className="mt-4 min-h-11 text-sm font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4">{t("userDash.jobs.browse")}</button></div>}
      </section>
      <RecentActivity sessions={sessions} lang={lang} onNavigate={onNavigate} t={t} />
      <LearningResources onNavigate={onNavigate} t={t} />
      <footer className="flex flex-col gap-2 border-t-2 border-[#234196] py-7 text-xs text-[#5A6B8F] sm:flex-row sm:items-center sm:justify-between"><span className="font-headline text-base font-semibold text-[#234196]">{t("userDash.footer.brand")}</span><span>{t("userDash.footer.copy")}</span></footer>
      <JobInterviewCvModal open={selectedJob !== null} jobTitle={selectedJob?.title ?? ""} jobProfileId={selectedJob?.id} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
