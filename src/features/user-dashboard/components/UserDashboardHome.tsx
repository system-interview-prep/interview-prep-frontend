"use client";

import Link from "next/link";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { interviewRuntimeApi } from "@features/interview/services/interviewRuntime.service";
import { interviewChatApi } from "@features/interview/services/interviewChat.service";
import { AbortConfirmationModal } from "@components/interview/AbortConfirmationModal";
import { userCvApi } from "@features/resume/services/userCv.service";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import { useSavedJobs } from "@features/user-dashboard/hooks/useSavedJobs";
import { useTargetJob } from "@features/user-dashboard/hooks/useTargetJob";
import { progressApi } from "@features/progress/services/progress.service";
import type { GapItem, PracticeProgress } from "@features/progress/services/progress.service";

async function loadAllJobProfiles(): Promise<JobProfile[]> {
  const profiles: JobProfile[] = [];
  let cursor: string | undefined;
  const seenCursors = new Set<string>();
  for (;;) {
    const { data } = await jobProfileApi.list({ limit: 100, order: "desc", cursor });
    profiles.push(...(data.items ?? []));
    const next = data.nextCursor;
    if (!next || seenCursors.has(next)) break;
    seenCursors.add(next);
    cursor = next;
  }
  return profiles;
}

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
import { hasScore, isFailedStart, sessionHref, weakestCompetency, greetingName, type StoredDashboardSession } from "./DashboardSections";

const DARK_BUTTON =
  "inline-flex min-h-10 items-center justify-center rounded-xl bg-[#204195] px-4 text-sm font-bold text-white hover:bg-[#183275] active:bg-[#122557]";
const LIGHT_BUTTON =
  "inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DCE4F3] bg-white px-4 text-sm font-semibold text-[#204195] hover:border-[#204195] hover:bg-[#F0F4FC]";

type Props = {
  onNavigate: (href: string) => void;
  onStartVideo: (jobTitle?: string) => Promise<void>;
  videoError: boolean;
  onDismissVideoError: () => void;
};

function DashboardSkeleton({ label }: { label: string }) {
  const block = "animate-pulse rounded-lg bg-[#EFEFEC] motion-reduce:animate-none";
  return (
    <div className="space-y-8" role="status" aria-label={label}>
      <div className="space-y-2">
        <div className={`${block} h-7 w-40`} />
        <div className={`${block} h-4 w-72 max-w-full`} />
      </div>
      <div className={`${block} h-24`} />
      <div className="space-y-3">
        <div className={`${block} h-5 w-36`} />
        <div className={`${block} h-48`} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className={`${block} h-56`} />
        ))}
      </div>
      <div className={`${block} h-48`} />
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
 * The candidate's home page: unfinished session, a job-specific daily goal,
 * weekly measures, target jobs, recent sessions, then practice formats.
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
  const { t } = useLanguage();
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string; reaskConceptId?: string; reaskQuestionVersionId?: string } | null>(null);
  const { targetJobId } = useTargetJob();
  const { savedJobIds } = useSavedJobs();
  const [closingSession, setClosingSession] = useState<StoredDashboardSession | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(false);

  // Weekly streak from the server; the daily streak below is the fallback while it loads or fails.
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => progressApi.get().then((progress) => { if (active) setPracticeProgress(progress); }).catch(() => undefined);
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const activeJob = profiles.find((profile) => profile.id === targetJobId)
    ?? profiles.find((profile) => savedJobIds.has(profile.id))
    ?? (isGuest ? profiles[0] : undefined)
    ?? null;
  const practiced = useMemo(() => sessions.filter((item) => !isFailedStart(item)), [sessions]);
  const scoredSessions = useMemo(() => practiced.filter(hasScore), [practiced]);
  const jobSessions = useMemo(
    () => activeJob ? practiced.filter((item) => item.jobId === activeJob.id) : practiced,
    [practiced, activeJob],
  );
  const focus = useMemo(() => weakestCompetency(jobSessions), [jobSessions]);
  const dueGap: GapItem | null = activeJob
    ? (practiceProgress?.gaps?.open ?? []).find((gap) => gap.due && !gap.skillKey.startsWith("label:") && gap.lastSeen.jobId === activeJob.id) ?? null
    : null;
  const latestJobScore = scoredSessions.find((item) => activeJob && item.jobId === activeJob.id);
  const weekGoal = practiceProgress?.streak.goal ?? 2;
  const weekCount = practiceProgress?.streak.thisWeekCount ?? 0;

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
  const openAnswered =
    openSession && typeof openSession.answeredTurns === "number" && openSession.totalTurns
      ? `Đã trả lời ${openSession.answeredTurns}/${openSession.totalTurns} câu`
      : null;
  // One plain line about where the candidate is, from their own numbers.
  const statusLine = isGuest
    ? "Số liệu bên dưới là dữ liệu mẫu. Đăng nhập để lưu kết quả của bạn."
    : openSession
      ? "Bạn còn một buổi chưa xong."
      : "Tiếp tục mục tiêu công việc và luyện tập của bạn.";
  return (
    <div className="space-y-8 text-[#2A2F38]">
      {/* Alerts */}
      {videoError ? (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-[#F1D3D3] bg-[#FDF5F5] px-4 py-3 text-sm text-[#9B2C2C]" role="alert">
          <p>
            <strong>{t("userDash.error.videoTitle")}</strong> {t("userDash.error.videoBody")}
          </p>
          <button
            type="button"
            onClick={onDismissVideoError}
            className="grid min-h-8 min-w-8 place-items-center rounded-md hover:bg-white"
            aria-label={t("userDash.error.dismiss")}
          >
            ×
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex flex-col gap-3 rounded-lg border border-[#F1D3D3] bg-[#FDF5F5] px-4 py-3 text-sm text-[#9B2C2C] sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p>{t("userDash.error.profiles")}</p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-9 rounded-md border border-[#F1D3D3] bg-white px-3 font-medium hover:bg-[#FDF5F5]"
          >
            {t("userDash.error.retry")}
          </button>
        </div>
      ) : null}

      {closeError ? (
        <p className="rounded-lg border border-[#F1D3D3] bg-[#FDF5F5] px-4 py-3 text-sm text-[#9B2C2C]" role="alert">
          {t("uxWs.dash.stale.closeError")}
        </p>
      ) : null}

      {/* 1. Greeting and the main action */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[#16181D] [overflow-wrap:anywhere]">
            {isGuest ? "Xem thử trang chủ" : `Chào ${firstName || "bạn"},`}
          </h1>
          <p className="mt-1 text-[15px] text-[#4A505C]">{statusLine}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isGuest ? (
            <>
              <Link href="/login" className={DARK_BUTTON}>
                Đăng nhập để lưu tiến độ
              </Link>
              <button type="button" onClick={beginRecommended} className={LIGHT_BUTTON}>
                Luyện thử
              </button>
            </>
          ) : (
            <>
              {lastReport ? (
                <button type="button" onClick={() => onNavigate(sessionHref(lastReport))} className={LIGHT_BUTTON}>
                  Báo cáo gần nhất
                </button>
              ) : null}
            </>
          )}
          <button
            type="button"
            onClick={() => onNavigate("/dashboard/jobs")}
            className="min-h-10 px-2 text-sm font-semibold text-[#204195] underline-offset-4 hover:underline"
          >
            Xem việc làm
          </button>
        </div>
      </header>

      {/* An unfinished session comes first, as a plain row */}
      {openSession ? (
        <div className="flex flex-col gap-3 rounded-lg border border-[#F2D49B] border-l-4 border-l-[#E8912D] bg-[#FFF8EB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm">
            <p className="text-[#16181D] [overflow-wrap:anywhere]">
              <span className="mr-1.5 inline-flex rounded-md bg-[#FDE7C2] px-1.5 py-0.5 text-[13px] font-semibold text-[#8A5300]">Buổi dang dở</span>
              <strong className="font-semibold">{openSession.jobTitle || "Phiên phỏng vấn"}</strong>
            </p>
            {openAnswered ? <p className="mt-1 font-medium text-[#8A5300]">{openAnswered}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onCloseSession ? (
              <button
                type="button"
                onClick={() => setClosingSession(openSession)}
                className="min-h-10 px-2 text-sm font-medium text-[#607096] underline-offset-4 hover:text-[#204195] hover:underline"
              >
                Kết thúc buổi này
              </button>
            ) : null}
            <button type="button" onClick={() => onNavigate(sessionHref(openSession))} className={DARK_BUTTON}>
              Tiếp tục ngay
            </button>
          </div>
        </div>
      ) : null}

      {/* No CV yet: one line and a link */}
      {cvCount === 0 && !isGuest ? (
        <div className="flex flex-col gap-2 rounded-lg border border-[#CFDCF5] bg-[#EEF3FD] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[#4A505C]">
            <span className="font-semibold text-[#16181D]">Bạn chưa tải CV.</span> Có CV, câu hỏi sẽ bám theo kinh nghiệm của bạn.
          </p>
          <button
            type="button"
            onClick={() => onNavigate("/dashboard/cvs")}
            className="shrink-0 self-start text-sm font-semibold text-[#204195] underline underline-offset-4 sm:self-auto"
          >
            Tải CV lên
          </button>
        </div>
      ) : null}

      <section className="rounded-lg border border-[#E4E4E0] bg-white p-5 sm:p-6" aria-labelledby="home-overview-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#204195]">Tóm tắt nhanh</p>
            <h2 id="home-overview-title" className="mt-1 text-xl font-semibold text-[#16181D]">{activeJob?.title ?? "Chưa chọn công việc mục tiêu"}</h2>
            <p className="mt-2 text-sm text-[#4A505C]">
              {dueGap
                ? `Hôm nay ôn lại ${dueGap.skill}: ${dueGap.point}.`
                : focus
                  ? `Hôm nay phát triển kỹ năng ${focus.weakest.competency} từ câu trả lời gần nhất.`
                  : activeJob
                    ? `Bài luyện hôm nay bám theo ${activeJob.keywords?.find((item) => item.trim()) || activeJob.primaryTaxonomy?.label || "yêu cầu chính trong JD"}.`
                    : "Lưu một việc làm để nhận bài luyện theo yêu cầu cụ thể."}
            </p>
            {dueGap ? <p className="mt-1 text-sm text-[#607096]">Câu hỏi: {dueGap.lastSeen.question}</p> : null}
            {focus ? <p className="mt-1 text-sm text-[#607096]">Điểm gần nhất ở kỹ năng này: {focus.weakest.score.toFixed(1)}/10</p> : null}
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:min-w-56">
            <div className="rounded-lg bg-[#F7F9FE] p-3">
              <p className="text-xs text-[#607096]">Tiến độ tuần</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[#204195]">{weekCount}/{weekGoal} <span className="text-sm font-medium">buổi</span></p>
            </div>
            <div className="rounded-lg bg-[#F7F9FE] p-3">
              <p className="text-xs text-[#607096]">Điểm buổi gần nhất</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[#204195]">{latestJobScore ? `${latestJobScore.overallScore.toFixed(1)}/10` : "—"}</p>
            </div>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("/dashboard/progress")} className={`${DARK_BUTTON} mt-5 min-h-11`}>
          Xem tiến độ và luyện hôm nay
        </button>
        <nav aria-label="Lối tắt" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#EDEDEA] pt-4 text-sm font-semibold text-[#204195]">
          <button type="button" onClick={() => onNavigate("/dashboard/jobs")} className="underline-offset-4 hover:underline">Việc làm</button>
          <button type="button" onClick={() => onNavigate("/dashboard/cvs")} className="underline-offset-4 hover:underline">CV</button>
          <button type="button" onClick={() => onNavigate("/dashboard/history")} className="underline-offset-4 hover:underline">Lịch sử</button>
        </nav>
      </section>

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
        reaskConceptId={selectedJob?.reaskConceptId}
        reaskQuestionVersionId={selectedJob?.reaskQuestionVersionId}
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
      loadAllJobProfiles(),
      interviewRuntimeApi.list(),
      userCvApi.list(1),
    ]);
    setCvCount(cvsResult.status === "fulfilled" ? cvsResult.value.data.total : isGuest ? 0 : null);
    if (profilesResult.status === "fulfilled") {
      const items = profilesResult.value.filter((profile) => (profile.listingStatus ?? profile.status) === "ACTIVE");
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
