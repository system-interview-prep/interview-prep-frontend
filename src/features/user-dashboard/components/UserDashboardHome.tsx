"use client";

import Link from "next/link";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  FileText,
  Play,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { interviewRuntimeApi } from "@features/interview/services/interviewRuntime.service";
import { interviewChatApi } from "@features/interview/services/interviewChat.service";
import { AbortConfirmationModal } from "@components/interview/AbortConfirmationModal";
import { useFitCache } from "@features/matching/utils/fitCache";
import { userCvApi } from "@features/resume/services/userCv.service";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import { useSavedJobs } from "@features/user-dashboard/hooks/useSavedJobs";
import { progressApi } from "@features/progress/services/progress.service";

const DEMO_SESSIONS: StoredDashboardSession[] = [
  {
    sessionId: "demo-session-1",
    jobId: "demo-job-1",
    jobTitle: "Senior Frontend Engineer (React/TypeScript)",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    mode: "voice",
    status: "COMPLETED",
    overallScore: 86,
    answeredTurns: 5,
    totalTurns: 5,
    competencyScores: [
      { competency: "Kiến thức Frontend & React", score: 88 },
      { competency: "Xử lý State & Hiệu năng", score: 85 },
      { competency: "Giao tiếp & Trình bày ý tưởng", score: 85 },
    ],
  },
  {
    sessionId: "demo-session-2",
    jobId: "demo-job-2",
    jobTitle: "Fullstack Developer (Node.js & Next.js)",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    mode: "video",
    status: "COMPLETED",
    overallScore: 82,
    answeredTurns: 6,
    totalTurns: 6,
    competencyScores: [
      { competency: "Thiết kế API & Kiến trúc hệ thống", score: 84 },
      { competency: "Tối ưu Database & Caching", score: 80 },
    ],
  },
  {
    sessionId: "demo-session-3",
    jobId: "demo-job-3",
    jobTitle: "Software Engineer (System Design)",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    mode: "text",
    status: "COMPLETED",
    overallScore: 78,
    answeredTurns: 4,
    totalTurns: 4,
    competencyScores: [
      { competency: "Thuật toán & Cấu trúc dữ liệu", score: 80 },
      { competency: "Phân tích Trade-off", score: 76 },
    ],
  },
];

const DEMO_PROFILES: JobProfile[] = [
  {
    id: "demo-p-1",
    title: "Senior Frontend Engineer",
    company: { name: "VNG Corporation", verified: true },
    location: "TP. Hồ Chí Minh",
    workMode: "hybrid",
    employmentType: "full_time",
    seniority: "senior",
    experience: { minYears: 3 },
    salary: { min: 35000000, max: 55000000, currency: "VND", period: "month" },
    primaryTaxonomy: { conceptId: "frontend", label: "Frontend Development" },
    source: null,
    postedAt: new Date().toISOString(),
    listingStatus: "ACTIVE",
    processingStatus: "DONE",
    status: "ACTIVE",
    keywords: ["React", "TypeScript", "Next.js", "Performance"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-p-2",
    title: "Fullstack Developer",
    company: { name: "MoMo Fintech", verified: true },
    location: "Hà Nội / Remote",
    workMode: "remote",
    employmentType: "full_time",
    seniority: "mid",
    experience: { minYears: 2 },
    salary: { min: 25000000, max: 40000000, currency: "VND", period: "month" },
    primaryTaxonomy: { conceptId: "fullstack", label: "Fullstack Engineering" },
    source: null,
    postedAt: new Date().toISOString(),
    listingStatus: "ACTIVE",
    processingStatus: "DONE",
    status: "ACTIVE",
    keywords: ["Node.js", "React", "PostgreSQL", "Docker"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-p-3",
    title: "AI Engineer / LLM Specialist",
    company: { name: "FPT Software", verified: true },
    location: "Đà Nẵng",
    workMode: "hybrid",
    employmentType: "full_time",
    seniority: "senior",
    experience: { minYears: 2 },
    salary: { min: 40000000, max: 65000000, currency: "VND", period: "month" },
    primaryTaxonomy: { conceptId: "ai", label: "Artificial Intelligence" },
    source: null,
    postedAt: new Date().toISOString(),
    listingStatus: "ACTIVE",
    processingStatus: "DONE",
    status: "ACTIVE",
    keywords: ["Python", "PyTorch", "LLM", "RAG", "Agent"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
import {
  ImprovementFocus,
  OverviewMetrics,
  PracticeModes,
  RecentActivity,
  SuggestedJobs,
  hasScore,
  isFailedStart,
  practiceDays,
  practiceStreak,
  sessionHref,
  weakestCompetency,
  weekStart,
  greetingName,
  type StoredDashboardSession,
} from "./DashboardSections";

type Props = {
  onNavigate: (href: string) => void;
  onStartVideo: (jobTitle?: string) => Promise<void>;
  videoError: boolean;
  onDismissVideoError: () => void;
};

function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-7 md:space-y-9" role="status" aria-label={label}>
      {/* Hero skeleton */}
      <div className="h-56 animate-pulse rounded-2xl bg-[#14244B]/10 motion-reduce:animate-none sm:h-64" />

      {/* 4 Metrics skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl border border-[#DCE4F3]/70 bg-white motion-reduce:animate-none"
          />
        ))}
      </div>

      {/* 3 Modes skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-44 animate-pulse rounded-lg bg-[#DCE4F3]/70 motion-reduce:animate-none" />
        <div className="grid gap-5 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-2xl border border-[#DCE4F3]/70 bg-white motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>

      {/* Jobs skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-52 animate-pulse rounded-lg bg-[#DCE4F3]/70 motion-reduce:animate-none" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl border border-[#DCE4F3]/70 bg-white motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>

      {/* Recent activity skeleton */}
      <div className="h-52 animate-pulse rounded-2xl border border-[#DCE4F3]/70 bg-white motion-reduce:animate-none" />

      <span className="sr-only">{label}</span>
    </div>
  );
}

export type DashboardOverviewProps = Props & {
  userName?: string | null;
  isGuest?: boolean;
  profiles: JobProfile[];
  sessions: StoredDashboardSession[];
  cvCount: number | null;
  error: boolean;
  onRetry: () => void;
  onCloseSession?: (session: StoredDashboardSession, reason: "USER_ENDED" | "TECHNICAL_FAILURE") => Promise<boolean>;
};

/**
 * Modern, intuitive, and action-oriented Dashboard Overview:
 * 1. Warm Hero Banner with clear Quick Start CTAs
 * 2. 4 Key Metrics (Score, Sessions, Streak, Time)
 * 3. Compact AI Insight for improvement (if available)
 * 4. 3 Practice Modes (Video, Voice, Chat)
 * 5. Suggested Target Jobs
 * 6. Recent Practice Activity
 */
export function DashboardOverview({
  onNavigate,
  onStartVideo,
  videoError,
  onDismissVideoError,
  userName,
  isGuest = false,
  profiles,
  sessions,
  cvCount,
  error,
  onRetry,
  onCloseSession,
}: DashboardOverviewProps) {
  const { t, lang } = useLanguage();
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string } | null>(null);
  const { savedJobIds, toggleSave } = useSavedJobs();
  const fits = useFitCache();
  const [closingSession, setClosingSession] = useState<StoredDashboardSession | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(false);

  const [now] = useState(() => Date.now());
  // Weekly streak from the server; the daily streak below is the fallback while it loads or fails.
  const [weeklyStreak, setWeeklyStreak] = useState<{ weeks: number; goal: number; thisWeekCount: number } | null>(null);
  useEffect(() => {
    let active = true;
    progressApi
      .get()
      .then((progress) => {
        if (active) setWeeklyStreak(progress.streak);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const activeJob = profiles.find((profile) => savedJobIds.has(profile.id)) ?? profiles[0];
  const practiced = useMemo(() => sessions.filter((item) => !isFailedStart(item)), [sessions]);
  const scoredSessions = useMemo(() => practiced.filter(hasScore), [practiced]);
  const days = useMemo(() => practiceDays(practiced), [practiced]);
  const focus = useMemo(() => weakestCompetency(practiced), [practiced]);

  const week = useMemo(() => {
    const start = weekStart(new Date(now)).getTime();
    const thisWeek = practiced.filter((item) => {
      const time = new Date(item.startedAt).getTime();
      return Number.isFinite(time) && time >= start && time <= now;
    });
    const minutes = thisWeek.reduce((total, item) => {
      if (!item.endedAt) return total;
      const span = (new Date(item.endedAt).getTime() - new Date(item.startedAt).getTime()) / 60000;
      return Number.isFinite(span) && span > 0 ? total + span : total;
    }, 0);
    return { sessions: thisWeek.length, streak: practiceStreak(days, now), minutes: Math.round(minutes) };
  }, [practiced, days, now]);

  const beginRecommended = () => (activeJob ? setSelectedJob(activeJob) : void onStartVideo());

  const openSession = practiced.find((item) => item.status !== "CLOSED");
  const lastReport = practiced.find((item) => item.status === "CLOSED");

  const confirmClose = async (reason: "USER_ENDED" | "TECHNICAL_FAILURE") => {
    if (!closingSession || !onCloseSession) return;
    setClosing(true);
    setCloseError(false);
    const ok = await onCloseSession(closingSession, reason);
    setClosing(false);
    if (!ok) {
      setCloseError(true);
      return;
    }
    const target = closingSession;
    setClosingSession(null);
    if ((target.answeredTurns ?? 0) > 0) onNavigate(`/interview/results/${target.sessionId}`);
    else onRetry();
  };

  const firstName = greetingName(userName);

  return (
    <div className="space-y-7 md:space-y-9">
      {/* Alerts */}
      {videoError ? (
        <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#FDF2F2] px-5 py-3.5 text-sm text-[#C43B3B]" role="alert">
          <p>
            <strong>{t("userDash.error.videoTitle")}</strong> {t("userDash.error.videoBody")}
          </p>
          <button
            type="button"
            onClick={onDismissVideoError}
            className="grid min-h-8 min-w-8 place-items-center rounded-full hover:bg-white/60"
            aria-label={t("userDash.error.dismiss")}
          >
            ×
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-[#FDF2F2] px-5 py-4 text-sm text-[#C43B3B] sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p>{t("userDash.error.profiles")}</p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-9 rounded-full bg-white px-4 font-semibold text-[#C43B3B] transition-colors hover:bg-white/70"
          >
            {t("userDash.error.retry")}
          </button>
        </div>
      ) : null}

      {closeError ? (
        <p className="rounded-2xl bg-[#FDF2F2] px-5 py-3 text-sm text-[#C43B3B]" role="alert">
          {t("uxWs.dash.stale.closeError")}
        </p>
      ) : null}

      {/* Guest Mode Notice */}
      {isGuest && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#204195]/20 bg-gradient-to-r from-[#EEF2FD] via-white to-[#FFF9E6] px-5 py-3.5 text-sm text-[#14244B] shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#204195] text-white shadow-xs">
              <Sparkles className="size-4 text-[#FCB625]" />
            </span>
            <div>
              <p className="font-semibold text-[#14244B]">Bạn đang xem Dashboard ở chế độ dùng thử (Khách)</p>
              <p className="text-xs text-[#607096]">Số liệu và phiên phỏng vấn bên dưới là dữ liệu mẫu. Hãy đăng nhập để lưu kết quả và nhận lộ trình tối ưu cho riêng bạn.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#204195] px-4 h-9 text-xs font-bold text-white shadow-xs transition hover:bg-[#183275]"
          >
            <span>Đăng nhập ngay</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* 1. Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14244B] via-[#1B3574] to-[#204195] p-5 text-white shadow-md sm:p-7">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#FCB625]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-32 h-64 w-64 rounded-full bg-[#204195]/40 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 max-w-3xl flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-xs">
              <Sparkles className="size-3.5 text-[#FCB625]" />
              <span>Nền tảng luyện phỏng vấn AI thông minh</span>
            </div>

            <h1 className="mt-3 font-display text-xl font-black tracking-tight text-white [overflow-wrap:anywhere] sm:text-2xl">
              {isGuest
                ? "Chào mừng bạn đến với Intervia 👋"
                : `Chào ${firstName || "bạn"}, sẵn sàng bứt phá hôm nay? 👋`}
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-white/80">
              {isGuest
                ? "Khám phá giao diện Dashboard luyện phỏng vấn AI. Đăng nhập để lưu tiến độ thực chiến và mở khóa toàn bộ tính năng."
                : "Rèn luyện phản xạ đối thoại thực chiến, nhận nhận xét đa chiều tức thì và tự tin chinh phục nhà tuyển dụng hàng đầu."}
            </p>

            {/* In-progress session notice if any */}
            {openSession && (
              <div className="mt-4.5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#FCB625]/30 bg-[#FCB625]/10 px-4 py-2.5 backdrop-blur-xs">
                <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-white">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FCB625] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FCB625]" />
                  </span>
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    Buổi dang dở: <strong>{openSession.jobTitle || "Phiên phỏng vấn"}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(sessionHref(openSession))}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-[#FCB625] hover:underline"
                >
                  <span>Tiếp tục ngay</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            )}

            {/* Quick CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isGuest ? (
                <>
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FCB625] px-6 text-sm font-bold text-[#14244B] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#ffc54a] active:translate-y-0"
                  >
                    <span>Đăng nhập lưu tiến độ</span>
                    <ArrowRight className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={beginRecommended}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-xs transition-all hover:bg-white/20 active:translate-y-0"
                  >
                    <Play className="size-4 fill-current" />
                    <span>Luyện phỏng vấn thử</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate("/dashboard/jobs")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-xs transition-all hover:bg-white/20 active:translate-y-0"
                  >
                    <Briefcase className="size-4" />
                    <span>Khám phá việc làm</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={beginRecommended}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FCB625] px-6 text-sm font-bold text-[#14244B] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#ffc54a] active:translate-y-0"
                  >
                    <Play className="size-4 fill-current" />
                    <span>Bắt đầu phỏng vấn ngay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate("/dashboard/jobs")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-xs transition-all hover:bg-white/20 active:translate-y-0"
                  >
                    <Briefcase className="size-4" />
                    <span>Khám phá việc làm</span>
                  </button>

                  {lastReport && (
                    <button
                      type="button"
                      onClick={() => onNavigate(sessionHref(lastReport))}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-xs transition-all hover:bg-white/20 active:translate-y-0"
                    >
                      <span>Xem báo cáo gần nhất</span>
                      <ArrowUpRight className="size-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Mascot card (Desktop) */}
          <div className="hidden shrink-0 lg:block">
            <div className="flex w-64 flex-col items-center rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-md">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-white shadow-md p-1">
                <img src="/logo.jpg" alt="Intervia AI" className="h-full w-full rounded-full object-cover" />
              </div>
              <span className="mt-3 text-xs font-bold text-white">Bạn đồng hành Intervia</span>
              <p className="mt-1 text-[11.5px] leading-relaxed text-white/75">
                Mỗi buổi luyện tập giúp bạn tự tin hơn 30% khi đối mặt với nhà tuyển dụng thật!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gentle CV onboarding notice when user has 0 CVs */}
      {cvCount === 0 ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-[#204195]/20 bg-gradient-to-r from-[#F0F4FC] via-white to-[#F0F4FC] p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#204195]/10 text-[#204195]">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#14244B]">Bạn chưa tải hồ sơ CV nào</h3>
              <p className="mt-0.5 text-xs text-[#607096]">
                Tải CV lên để AI phân tích độ tương thích và tối ưu bộ câu hỏi phỏng vấn sát nhất với năng lực của bạn.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/dashboard/cvs")}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#204195] px-4 h-9 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#183275]"
          >
            <span>Tải CV ngay</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : null}

      {/* 2. 4 Key Metrics Overview */}
      <OverviewMetrics
        latestScore={scoredSessions[0]?.overallScore ?? null}
        prevScore={scoredSessions[1]?.overallScore ?? null}
        weekSessions={week.sessions}
        totalSessions={practiced.length}
        streak={week.streak}
        weeklyStreak={weeklyStreak}
        minutes={week.minutes}
        t={t}
      />

      {/* 3. Compact AI Insight for improvement (if available) */}
      {focus ? (
        <ImprovementFocus
          focus={focus}
          onPractice={(job) => setSelectedJob(job)}
        />
      ) : null}

      {/* 4. 3 Practice Modes */}
      <PracticeModes
        onSelectMode={(mode) => onNavigate(`/interview/select?mode=${mode}`)}
        onStartVideo={beginRecommended}
        t={t}
      />

      {/* 5. Suggested Target Jobs */}
      <SuggestedJobs
        profiles={profiles}
        savedJobIds={savedJobIds}
        fits={fits}
        onToggleSave={toggleSave}
        onNavigate={onNavigate}
        onPractice={setSelectedJob}
        t={t}
      />

      {/* 6. Recent Activity */}
      <RecentActivity
        sessions={sessions}
        lang={lang}
        onNavigate={onNavigate}
        t={t}
      />

      {/* Modals */}
      <AbortConfirmationModal
        isOpen={closingSession !== null}
        onClose={() => !closing && setClosingSession(null)}
        onConfirm={(reason) => void confirmClose(reason)}
        isSubmitting={closing}
      />
      <JobInterviewCvModal
        open={selectedJob !== null}
        jobTitle={selectedJob?.title ?? ""}
        jobProfileId={selectedJob?.id}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}

/** Loads the overview's data, then renders `DashboardOverview`. */
export function UserDashboardHome(props: Props) {
  const { t } = useLanguage();
  const { profile } = useAuthProfile();
  const isGuest = !profile;
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [sessions, setSessions] = useState<StoredDashboardSession[]>([]);
  const [cvCount, setCvCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    const [profilesResult, sessionsResult, cvsResult] = await Promise.allSettled([
      jobProfileApi.list({ limit: 6, order: "desc" }),
      interviewRuntimeApi.list(),
      userCvApi.list(1),
    ]);
    setCvCount(cvsResult.status === "fulfilled" ? cvsResult.value.data.total : isGuest ? 0 : null);
    if (profilesResult.status === "fulfilled") {
      const items = (profilesResult.value.data.items ?? []).filter((profile) => profile.status === "ACTIVE");
      setProfiles(items.length > 0 ? items : isGuest ? DEMO_PROFILES : []);
    } else {
      setProfiles(isGuest ? DEMO_PROFILES : []);
      if (!isGuest) setError(true);
      if (axios.isAxiosError(profilesResult.reason)) console.error("Dashboard profiles:", profilesResult.reason.message);
    }
    if (sessionsResult.status === "fulfilled") {
      setSessions(
        sessionsResult.value
          .map((session) => ({
            sessionId: session.sessionId,
            jobId: session.jobId,
            jobTitle: session.jobTitle ?? undefined,
            startedAt: session.startedAt,
            mode: session.mode,
            status: session.status,
            experienceType: session.experienceType,
            endedAt: session.endedAt,
            endReason: session.endReason ?? null,
            overallScore: session.overallScore ?? null,
            answeredTurns: session.answeredTurns,
            totalTurns: session.totalTurns,
            competencyScores: session.competencyScores ?? [],
          }))
          .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
      );
    } else {
      setSessions(isGuest ? DEMO_SESSIONS : []);
      if (!isGuest) setError(true);
    }
    setLoading(false);
  }, [isGuest]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);
  useEffect(() => {
    const refresh = () => void loadDashboard(true);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [loadDashboard]);

  const closeSession = async (session: StoredDashboardSession, reason: "USER_ENDED" | "TECHNICAL_FAILURE") => {
    try {
      if (session.mode === "text" && session.experienceType !== "question_practice") {
        await interviewChatApi.complete(session.sessionId, reason);
      } else {
        await interviewRuntimeApi.close(session.sessionId, reason);
      }
      return true;
    } catch {
      return false;
    }
  };

  if (loading) return <DashboardSkeleton label={t("userDash.loading")} />;
  return (
    <DashboardOverview
      {...props}
      userName={profile?.name}
      isGuest={isGuest}
      profiles={profiles}
      sessions={sessions}
      cvCount={cvCount}
      error={error}
      onRetry={() => void loadDashboard()}
      onCloseSession={closeSession}
    />
  );
}
