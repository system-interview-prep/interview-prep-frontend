"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Play,
  Zap,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Calendar,
  Flame,
  Clock,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobCategoryApi, type JobCategory } from "@features/admin/services/jobCategory.service";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import { LearningResources, PracticeModes, RecentActivity, type StoredDashboardSession } from "./DashboardSections";

type Props = {
  onNavigate: (href: string) => void;
  onStartVideo: (jobTitle?: string) => Promise<void>;
  videoError: boolean;
  onDismissVideoError: () => void;
};

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
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-xs" role="alert">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
            <p><strong>{t("userDash.error.videoTitle")}</strong> {t("userDash.error.videoBody")}</p>
          </div>
          <button type="button" onClick={onDismissVideoError} className="grid min-h-8 min-w-8 place-items-center rounded-lg text-red-600 hover:bg-red-100/60" aria-label={t("userDash.error.dismiss")}>×</button>
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 shadow-xs sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p>{t("userDash.error.profiles")}</p>
          <button type="button" onClick={() => void loadDashboard()} className="min-h-9 rounded-xl border border-red-300 bg-white px-4 font-semibold text-red-700 shadow-xs transition-colors hover:bg-red-50">
            {t("userDash.error.retry")}
          </button>
        </div>
      ) : null}

      <section aria-labelledby="next-action-title" className="relative grid overflow-hidden rounded-3xl border border-[#204195]/30 bg-gradient-to-br from-[#14244B] via-[#204195] to-[#183275] text-white shadow-[0_12px_40px_rgba(20,36,75,0.12)] lg:grid-cols-12">
        <div className="relative p-6 sm:p-8 lg:col-span-8 lg:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#FCB625]/15 blur-3xl" />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3.5 py-1 text-xs font-bold text-[#FCB625]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FCB625]" />
            <span>{t("userDash.next.label")}</span>
          </div>
          <h2 id="next-action-title" className="mt-4 max-w-3xl font-headline text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl text-white">
            {activeJob ? t("userDash.next.titleWithRole").replace("{role}", activeJob.title) : t("userDash.next.titleFallback")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
            {t(activeJob ? "userDash.next.descWithRole" : "userDash.next.descFallback")}
          </p>
          <dl className="mt-6 grid gap-4 border-y border-white/15 py-4 sm:grid-cols-3">
            <div><dt className="text-[11px] font-medium text-white/60">{t("userDash.next.role")}</dt><dd className="mt-1 text-sm font-bold text-white">{activeJob?.title ?? t("userDash.next.noRole")}</dd></div>
            <div><dt className="text-[11px] font-medium text-white/60">{t("userDash.next.focus")}</dt><dd className="mt-1 text-sm font-bold text-white">{activeJob?.keywords?.slice(0, 2).join(" · ") || t("userDash.next.focusFallback")}</dd></div>
            <div><dt className="text-[11px] font-medium text-white/60">{t("userDash.next.duration")}</dt><dd className="mt-1 text-sm font-bold text-white">{t("userDash.next.durationValue")}</dd></div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={beginRecommended} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FCB625] hover:bg-[#E5A21D] px-6 text-sm font-extrabold text-[#14244B] shadow-[0_4px_14px_rgba(252,182,37,0.35)] transition-all active:scale-[0.99] sm:w-auto cursor-pointer">
              <Play className="size-4 fill-current" aria-hidden="true" />
              <span>{sessions.length ? t("userDash.next.continue") : t("userDash.next.start")}</span>
            </button>
            <button type="button" onClick={() => onNavigate("/voice")} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 backdrop-blur-sm px-6 text-sm font-extrabold text-white transition-all active:scale-[0.99] sm:w-auto cursor-pointer">
              <Zap className="size-4 text-[#FCB625]" aria-hidden="true" />
              <span>{t("userDash.next.quick")}</span>
            </button>
          </div>
        </div>
        <aside className="flex flex-col justify-between border-t border-white/15 bg-white/[0.04] backdrop-blur-xs p-6 sm:p-8 lg:col-span-4 lg:border-l lg:border-t-0 lg:p-10">
          <div>
            <p className="text-xs font-bold text-[#FCB625] uppercase tracking-wider">{t("userDash.next.activeProfile")}</p>
            <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-[#FCB625]">
              <Briefcase className="size-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-headline text-xl font-bold text-white">{activeJob?.title ?? t("userDash.next.profileEmptyTitle")}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/75">{activeJob ? categoryName(activeJob) : t("userDash.next.profileEmptyBody")}</p>
          </div>
          <button type="button" onClick={() => onNavigate(activeJob ? `/dashboard/jobs/${activeJob.id}` : "/dashboard/jobs")} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white hover:underline underline-offset-4 cursor-pointer">
            <span>{activeJob ? t("userDash.next.viewProfile") : t("userDash.next.chooseProfile")}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </aside>
      </section>

      <section aria-labelledby="overview-title">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9D7F1] bg-white px-3.5 py-1 text-xs font-bold text-[#204195] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FCB625]" />
              <span>{t("userDash.overview.eyebrow")}</span>
            </div>
            <h2 id="overview-title" className="mt-3 font-headline text-2xl font-extrabold text-[#14244B] tracking-tight">{t("userDash.overview.title")}</h2>
          </div>
          <p className="hidden max-w-md text-right text-xs text-[#607096] sm:block">{t("userDash.overview.sourceNote")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:shadow-sm transition-all sm:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#607096] uppercase tracking-wider">{t("userDash.overview.readiness")}</p>
                <p className="mt-2 font-headline text-3xl font-extrabold text-[#14244B]">—</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#204195]/10 text-[#204195]" aria-hidden="true">
                <TrendingUp className="size-5" />
              </span>
            </div>
            <p className="mt-3 max-w-lg text-sm text-[#607096]">{t("userDash.overview.readinessEmpty")}</p>
            <button type="button" onClick={beginRecommended} className="mt-4 text-sm font-bold text-[#204195] hover:underline cursor-pointer">
              {t("userDash.overview.readinessCta")} →
            </button>
          </article>
          <article className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#287A4B]/10 text-[#287A4B]">
                <Calendar className="size-5" />
              </span>
            </div>
            <p className="mt-4 font-headline text-3xl font-extrabold text-[#14244B] tabular-nums">{overview.thisWeek}</p>
            <h3 className="mt-1 text-sm font-bold text-[#14244B]">{t("userDash.overview.weekSessions")}</h3>
            <p className="mt-1 text-xs text-[#607096]">{t("userDash.overview.weekSessionsHelp")}</p>
          </article>
          <article className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FCB625]/20 text-[#E59E10]">
                <Flame className="size-5 fill-current" />
              </span>
            </div>
            <p className="mt-4 font-headline text-3xl font-extrabold text-[#14244B] tabular-nums">{overview.streak}</p>
            <h3 className="mt-1 text-sm font-bold text-[#14244B]">{t("userDash.overview.streak")}</h3>
            <p className="mt-1 text-xs text-[#607096]">{t("userDash.overview.streakHelp")}</p>
          </article>
          <article className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:shadow-sm transition-all sm:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#204195]/10 text-[#204195]">
                <Clock className="size-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <h3 className="text-sm font-bold text-[#14244B]">{t("userDash.overview.time")}</h3>
                  <span className="font-headline text-xl font-extrabold text-[#14244B]">—</span>
                </div>
                <p className="text-xs text-[#607096]">{t("userDash.overview.timeUnavailable")}</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <PracticeModes onNavigate={onNavigate} onStartVideo={() => void onStartVideo(activeJob?.title)} t={t} />
      <section aria-labelledby="jobs-title">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9D7F1] bg-white px-3.5 py-1 text-xs font-bold text-[#204195] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FCB625]" />
              <span>{t("userDash.jobs.eyebrow")}</span>
            </div>
            <h2 id="jobs-title" className="mt-3 font-headline text-2xl font-extrabold text-[#14244B] tracking-tight">{t("userDash.jobs.title")}</h2>
            <p className="mt-1 text-sm text-[#607096]">{t("userDash.jobs.subtitle")}</p>
          </div>
          <Link href="/dashboard/jobs" onClick={(event) => { event.preventDefault(); onNavigate("/dashboard/jobs"); }} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#204195] hover:underline">
            <span>{t("userDash.jobProfiles.viewAll")}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {profiles.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {profiles.slice(0, 3).map((profile) => (
              <article key={profile.id} className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-lg bg-[#F0F4FC] text-[#204195] font-semibold text-xs px-2.5 py-1 truncate">
                    {categoryName(profile)}
                  </span>
                </div>
                <h3 className="mt-4 font-headline text-xl font-bold text-[#14244B] leading-snug">{profile.title}</h3>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-[#607096]">
                  {profile.keywords?.join(" · ") || t("userDash.jobs.noSkills")}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-[#EAEFF8] pt-4">
                  <Link
                    href={`/dashboard/jobs/${profile.id}`}
                    onClick={(event) => { event.preventDefault(); onNavigate(`/dashboard/jobs/${profile.id}`); }}
                    className="text-xs font-bold text-[#607096] hover:text-[#204195] transition-colors"
                  >
                    {t("userDash.jobs.details")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedJob(profile)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#204195] hover:bg-[#183275] text-white font-extrabold px-3.5 py-2 text-xs shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>{t("userDash.jobs.practice")}</span>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#DCE4F3] bg-white p-8 text-center shadow-xs">
            <Briefcase className="mx-auto size-8 text-[#204195]" aria-hidden="true" />
            <h3 className="mt-3 font-headline text-lg font-bold text-[#14244B]">{t("userDash.jobs.emptyTitle")}</h3>
            <p className="mx-auto mt-1 max-w-lg text-sm text-[#607096]">{t("userDash.jobs.emptyBody")}</p>
            <button type="button" onClick={() => onNavigate("/dashboard/jobs")} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#204195] hover:underline cursor-pointer">
              {t("userDash.jobs.browse")} →
            </button>
          </div>
        )}
      </section>
      <RecentActivity sessions={sessions} lang={lang} onNavigate={onNavigate} t={t} />
      <LearningResources onNavigate={onNavigate} t={t} />
      <footer className="flex flex-col gap-2 border-t border-[#EAEFF8] py-6 text-xs text-[#607096] sm:flex-row sm:items-center sm:justify-between">
        <span className="font-headline text-sm font-bold text-[#14244B]">{t("userDash.footer.brand")}</span>
        <span>{t("userDash.footer.copy")}</span>
      </footer>
      <JobInterviewCvModal open={selectedJob !== null} jobTitle={selectedJob?.title ?? ""} jobProfileId={selectedJob?.id} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
