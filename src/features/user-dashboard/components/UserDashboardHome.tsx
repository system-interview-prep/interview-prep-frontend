"use client";

import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, FileText, MessageCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { interviewRuntimeApi } from "@features/interview/services/interviewRuntime.service";
import { interviewChatApi } from "@features/interview/services/interviewChat.service";
import { interviewReportApi } from "@features/interview/services/interviewReport.service";
import { AbortConfirmationModal } from "@components/interview/AbortConfirmationModal";
import { userCvApi } from "@features/resume/services/userCv.service";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import { useSavedJobs } from "@features/user-dashboard/hooks/useSavedJobs";
import { useTargetJob } from "@features/user-dashboard/hooks/useTargetJob";
import { progressApi } from "@features/progress/services/progress.service";
import type { GapItem, PracticeProgress } from "@features/progress/services/progress.service";
import { buildAIReview, type AIReview } from "../utils/aiReview";

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
import { hasScore, isFailedStart, JobPreparationBoard, RecentActivity, SuggestedJobs, sessionHref, weakestCompetency, greetingName, type StoredDashboardSession } from "./DashboardSections";
import { jobPreparations } from "../utils/targetJobs";
import { useFitHistory } from "@features/matching/utils/fitHistory";

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
  sessionsAvailable?: boolean;
  onRetry: () => void;
  onCloseSession?: (session: StoredDashboardSession, reason: "USER_ENDED" | "TECHNICAL_FAILURE") => Promise<boolean>;
};

/**
 * The candidate's home page: resume an unfinished session, choose a target,
 * see the next job-specific action, then scan saved job preparation.
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
  sessionsAvailable = true,
  onRetry,
  onCloseSession,
}: DashboardOverviewProps) {
  const { t, lang } = useLanguage();
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string; reaskConceptId?: string; reaskQuestionVersionId?: string } | null>(null);
  const { targetJobId, selectTargetJob } = useTargetJob();
  const { savedJobIds, toggleSave } = useSavedJobs();
  const fits = useFitHistory(!isGuest);
  const [closingSession, setClosingSession] = useState<StoredDashboardSession | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(false);

  // The practice API supplies job-specific gaps for today's recommendation.
  const [practiceProgress, setPracticeProgress] = useState<PracticeProgress | null>(null);
  const [aiReviewState, setAIReviewState] = useState<{ key: string; reviews: AIReview[]; failed: boolean } | null>(null);
  const [aiReviewRetry, setAIReviewRetry] = useState(0);
  const refreshPracticeProgress = useCallback(() => {
    void progressApi.get()
      .then(setPracticeProgress)
      .catch(() => setPracticeProgress(null));
  }, []);
  useEffect(() => {
    refreshPracticeProgress();
    window.addEventListener("focus", refreshPracticeProgress);
    return () => {
      window.removeEventListener("focus", refreshPracticeProgress);
    };
  }, [refreshPracticeProgress]);

  const activeJob = profiles.find((profile) => profile.id === targetJobId && (isGuest || savedJobIds.has(profile.id)))
    ?? (isGuest ? profiles[0] : undefined)
    ?? null;
  const attendedSessions = useMemo(
    () => sessions.filter((item) => (item.answeredTurns ?? 0) > 0),
    [sessions],
  );
  const aiReviewSessions = useMemo(
    () => attendedSessions.filter((item): item is StoredDashboardSession & { overallScore: number } => item.status === "CLOSED" && hasScore(item)).slice(0, 3),
    [attendedSessions],
  );
  const aiReviewRequestKey = `${aiReviewSessions.map((session) => session.sessionId).join("|")}:${aiReviewRetry}`;
  const aiReviews = aiReviewState?.key === aiReviewRequestKey ? aiReviewState.reviews : [];
  const aiReviewLoading = !isGuest && aiReviewSessions.length > 0 && aiReviewState?.key !== aiReviewRequestKey;
  const aiReviewFailed = aiReviewState?.key === aiReviewRequestKey && aiReviewState.failed;
  useEffect(() => {
    let current = true;
    if (isGuest || aiReviewSessions.length === 0) {
      return () => { current = false; };
    }

    void Promise.allSettled(aiReviewSessions.map(async (session) => {
      const report = await interviewReportApi.getEvaluation(session.sessionId);
      return buildAIReview(session, report);
    })).then((results) => {
      if (!current) return;
      const reviews = results.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
      setAIReviewState({
        key: aiReviewRequestKey,
        reviews,
        failed: results.every((result) => result.status === "rejected"),
      });
    });

    return () => { current = false; };
  }, [aiReviewSessions, aiReviewRequestKey, isGuest]);
  const practiced = useMemo(() => sessions.filter((item) => !isFailedStart(item)), [sessions]);
  const jobSessions = useMemo(
    () => activeJob ? practiced.filter((item) => item.jobId === activeJob.id) : [],
    [practiced, activeJob],
  );
  const focus = useMemo(() => weakestCompetency(jobSessions), [jobSessions]);
  const dueGap: GapItem | null = activeJob
    ? (practiceProgress?.gaps?.open ?? []).find((gap) => gap.due && !gap.skillKey.startsWith("label:") && gap.lastSeen.jobId === activeJob.id) ?? null
    : null;
  const preparationItems = useMemo(
    () => jobPreparations(
      profiles,
      savedJobIds,
      practiced,
      practiceProgress?.gaps?.open ?? [],
      sessionsAvailable,
    ),
    [profiles, savedJobIds, practiced, practiceProgress?.gaps?.open, sessionsAvailable],
  );

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
      : activeJob
        ? `Bài luyện hôm nay được cá nhân hóa theo ${activeJob.title}.`
        : savedJobIds.size
          ? "Bạn đã lưu việc làm. Chọn một công việc mục tiêu để xem bài luyện phù hợp."
          : "Chọn hoặc lưu một công việc mục tiêu để bắt đầu luyện theo JD.";
  return (
    <div className="space-y-5 text-[#2A2F38] sm:space-y-6 lg:space-y-7">
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

      {!sessionsAvailable ? (
        <div className="flex flex-col gap-2 rounded-lg border border-[#F1D3D3] bg-[#FDF5F5] px-4 py-3 text-sm text-[#9B2C2C] sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p>Chưa tải được lịch sử luyện tập nên trạng thái các công việc chưa thể xác định.</p>
          <button type="button" onClick={onRetry} className="self-start font-semibold underline sm:self-auto">Thử tải lại</button>
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
        {isGuest ? (
          <div className="flex flex-wrap items-center gap-2">
            <>
              <Link href="/login" className={DARK_BUTTON}>
                Đăng nhập để lưu tiến độ
              </Link>
              <button type="button" onClick={beginRecommended} className={LIGHT_BUTTON}>
                Luyện thử
              </button>
            </>
          </div>
        ) : null}
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
            <button
              type="button"
              onClick={() => {
                if (openSession.jobId) selectTargetJob(openSession.jobId);
                onNavigate(sessionHref(openSession));
              }}
              className={DARK_BUTTON}
            >
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

      <section aria-labelledby="home-banner-title" className="relative isolate min-h-[160px] overflow-hidden rounded-[18px] border border-[#DCE7FA] bg-[#EAF3FF] shadow-sm sm:min-h-[185px] lg:min-h-[190px]">
        <Image src="/img/banner.png" alt="" fill priority sizes="(max-width: 640px) 100vw, 1400px" className="object-cover object-[64%_50%] sm:object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-white/5 sm:from-white/90 sm:via-white/60 sm:to-transparent" />
        <div className="relative z-10 flex min-h-[160px] max-w-2xl flex-col justify-center px-5 py-5 sm:min-h-[185px] sm:px-8 lg:min-h-[190px] lg:px-10">
          <span className="mb-2.5 w-fit rounded-full bg-[#1768E5] px-3.5 py-1 text-xs font-bold tracking-wide text-white sm:mb-3 sm:text-sm">INTERVIA</span>
          <h2 id="home-banner-title" className="text-2xl font-black leading-tight tracking-tight text-[#14244B] sm:text-3xl lg:text-[40px]">
            Luyện phỏng vấn <span className="text-[#1768E5]">thông minh</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm font-medium text-[#263B62] sm:text-base lg:text-lg">
            Bám sát JD · Thực hành như thật · Cải thiện kỹ năng ứng tuyển
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-[#E4E4E0] bg-white p-5 sm:p-6" aria-labelledby="home-overview-title">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#204195]">Bài tập tiếp theo</p>
            <h2 id="home-overview-title" className="mt-1 text-xl font-semibold text-[#16181D]">
              {dueGap
                ? `Ôn câu đến hạn · ${dueGap.skill}`
                : focus
                  ? `Củng cố ${focus.weakest.competency}`
                  : activeJob
                    ? `Bắt đầu luyện cho ${activeJob.title}`
                    : "Chưa chọn công việc mục tiêu"}
            </h2>
            <p className="mt-2 text-sm text-[#4A505C]">
              {dueGap
                ? `Câu này đến hạn ôn lại. Lần trước còn thiếu: ${dueGap.point}.`
                : focus
                  ? `Dựa trên buổi gần nhất cho vị trí này: ${focus.weakest.score.toFixed(1)}/10 ở kỹ năng ${focus.weakest.competency}.`
                  : activeJob
                    ? `Bắt đầu với yêu cầu nổi bật: ${activeJob.keywords?.find((item) => item.trim()) || activeJob.primaryTaxonomy?.label || "kinh nghiệm liên quan trong tin tuyển dụng"}.`
                    : savedJobIds.size
                      ? "Chọn công việc mục tiêu trong Tiến độ để xem bài luyện riêng cho vị trí đó."
                      : "Lưu một việc làm để tạo bài luyện gắn với yêu cầu cụ thể."}
            </p>
            {dueGap ? <p className="mt-1 text-sm text-[#607096]">Câu hỏi cần trả lời lại: {dueGap.lastSeen.question}</p> : null}
            {focus ? <p className="mt-1 text-xs text-[#607096]">Nguồn gợi ý: buổi {new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(focus.latest.endedAt ?? focus.latest.startedAt))} · {focus.latest.mode === "text" ? "Phòng Chat" : focus.latest.mode === "voice" ? "Phòng Voice" : "Phòng Video"}</p> : null}
          </div>
            <div aria-hidden="true" className="relative hidden h-32 w-36 shrink-0 sm:block lg:h-36 lg:w-44">
              <Image src="/img/JD_Checklist_Icons.png" alt="" fill sizes="176px" className="object-contain" />
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:min-w-56">
            <div className="rounded-lg bg-[#F7F9FE] p-3">
              <p className="text-xs font-semibold text-[#607096]">Tổng số buổi đã tham gia</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[#204195]">
                {!sessionsAvailable
                  ? "Không tải được"
                  : attendedSessions.length > 0
                    ? <>{attendedSessions.length} <span className="text-sm font-medium">buổi</span></>
                    : "Chưa có buổi nào"}
              </p>
              <p className="mt-1 text-xs leading-snug text-[#607096]">Cộng dồn trên mọi công việc và phòng luyện.</p>
              <button type="button" onClick={() => onNavigate("/dashboard/job-results")} className="mt-1.5 text-xs font-semibold text-[#204195] underline-offset-4 hover:underline">
                Xem tổng quan →
              </button>
            </div>
            <div className="rounded-lg bg-[#F7F9FE] p-3">
              <p className="text-xs text-[#607096]">Buổi luyện gần nhất</p>
              {lastReport ? (
                <>
                  <p className="mt-1 text-xl font-bold tabular-nums text-[#204195]">
                    {hasScore(lastReport) ? `${lastReport.overallScore.toFixed(1)}/10` : "Chưa có điểm"}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-[#607096]">
                    {lastReport.jobTitle || "Phỏng vấn chung"} · {new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(lastReport.endedAt ?? lastReport.startedAt))} · {lastReport.mode === "text" ? "Phòng Chat" : lastReport.mode === "voice" ? "Phòng Voice" : "Phòng Video"}
                  </p>
                  <button type="button" onClick={() => onNavigate(sessionHref(lastReport))} className="mt-1.5 text-xs font-semibold text-[#204195] underline-offset-4 hover:underline">
                    Xem báo cáo →
                  </button>
                </>
              ) : (
                <p className="mt-1 text-sm font-semibold text-[#204195]">Chưa có buổi hoàn thành</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate(activeJob || isGuest || savedJobIds.size ? "/dashboard/progress" : "/dashboard/jobs")}
            className={`${DARK_BUTTON} min-h-11`}
          >
              {activeJob || isGuest ? "Xem bài luyện hôm nay" : savedJobIds.size ? "Chọn công việc mục tiêu" : "Chọn việc làm"}
          </button>
          {!activeJob && !isGuest ? (
            <button type="button" onClick={() => void onStartVideo()} className={LIGHT_BUTTON}>
              Luyện phỏng vấn chung
            </button>
          ) : null}
        </div>
      </section>

      {!isGuest ? (
        <JobPreparationBoard
          items={preparationItems}
          onBrowseJobs={() => onNavigate("/dashboard/jobs")}
          onAction={(item) => {
            if (item.status === "in_progress" && item.openSession) {
              selectTargetJob(item.job.id);
              onNavigate(sessionHref(item.openSession));
              return;
            }
            if (item.status === "due" && item.dueGap) {
              selectTargetJob(item.job.id);
              setSelectedJob({
                id: item.job.id,
                title: item.job.title,
                reaskConceptId: item.dueGap.skillKey,
                reaskQuestionVersionId: item.dueGap.lastSeen.questionVersionId ?? undefined,
              });
              return;
            }
            selectTargetJob(item.job.id);
            onNavigate("/dashboard/progress");
          }}
        />
      ) : null}

      {!isGuest ? (
        <SuggestedJobs
          profiles={profiles}
          savedJobIds={savedJobIds}
          fits={fits}
          onToggleSave={toggleSave}
          onNavigate={onNavigate}
          t={t}
          title="Gợi ý công việc nên thử"
          subtitle="Mở công việc gợi ý nên thử phỏng vấn để xem bài luyện."
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2" aria-label="Tổng hợp kỹ năng và hoạt động">
        <section className="rounded-2xl border border-[#DCE6F6] bg-white p-4 shadow-sm sm:p-5" aria-labelledby="home-skill-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="home-skill-title" className="font-display text-lg font-bold text-[#14244B]">Điểm kỹ năng gần nhất</h2>
              <p className="mt-1 text-sm text-[#607096]">
                {focus
                  ? `${activeJob?.title ?? "Vị trí đã luyện"} · buổi ${new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(focus.latest.endedAt ?? focus.latest.startedAt))} · ${focus.latest.mode === "text" ? "Chat" : focus.latest.mode === "voice" ? "Voice" : "Video"}`
                  : activeJob ? `Chưa có buổi được chấm cho ${activeJob.title}.` : "Chọn công việc mục tiêu để xem kỹ năng theo vị trí."}
              </p>
            </div>
            <button type="button" onClick={() => onNavigate("/dashboard/progress")} className="shrink-0 text-sm font-semibold text-[#204195] hover:underline">Xem Tiến độ →</button>
          </div>
          {focus ? (
            <ul className="mt-4 space-y-3">
              {focus.items.slice(0, 5).map((item, index) => (
                <li key={`${item.competency}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(90px,1.4fr)_3.5rem] items-center gap-3 text-sm">
                  <span className="truncate text-[#33415C]" title={item.competency}>{item.competency}</span>
                  <span
                    role="meter"
                    aria-label={`Điểm ${item.competency}`}
                    aria-valuemin={0}
                    aria-valuemax={10}
                    aria-valuenow={item.score}
                    className="h-2 overflow-hidden rounded-full bg-[#E8EEF8]"
                  >
                    <span className={`block h-full rounded-full ${item.score >= 7 ? "bg-[#26A269]" : item.score >= 5.5 ? "bg-[#E6A23C]" : "bg-[#E45858]"}`} style={{ width: `${Math.max(0, Math.min(100, item.score * 10))}%` }} />
                  </span>
                  <span className="text-right font-semibold tabular-nums text-[#14244B]">{item.score.toFixed(1)}/10</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-xl bg-[#F6F8FC] p-4 text-sm text-[#52627D]">
              Điểm kỹ năng sẽ xuất hiện sau buổi được chấm. Buổi chưa có điểm không được hiển thị thành 0.
            </p>
          )}
        </section>
        <RecentActivity sessions={attendedSessions} lang={lang} onNavigate={onNavigate} t={t} />
      </section>

      {!isGuest ? (
        <section aria-labelledby="home-ai-review-title" className="space-y-3">
          <div>
            <h2 id="home-ai-review-title" className="font-display text-lg font-bold text-[#14244B]">Nhận xét từ AI</h2>
            <p className="mt-1 text-sm text-[#607096]">Điểm mạnh, nội dung cần cải thiện và gợi ý luyện tiếp từ báo cáo đã chấm.</p>
          </div>
          {aiReviewLoading ? (
            <p role="status" className="rounded-2xl border border-[#DCE6F6] bg-white p-5 text-sm text-[#607096]">Đang tải nhận xét từ báo cáo…</p>
          ) : aiReviewFailed ? (
            <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-[#F1D3D3] bg-white p-5 text-sm text-[#9B2C2C] sm:flex-row sm:items-center sm:justify-between">
              <p>Chưa tải được nhận xét từ các báo cáo AI.</p>
              <button type="button" onClick={() => setAIReviewRetry((value) => value + 1)} className="self-start font-semibold underline sm:self-auto">Thử tải lại</button>
            </div>
          ) : aiReviews.length === 0 ? (
            <p className="rounded-2xl border border-[#DCE6F6] bg-white p-5 text-sm text-[#607096]">
              {aiReviewSessions.length === 0
                ? "Nhận xét sẽ xuất hiện sau khi có buổi được AI chấm điểm."
                : "Báo cáo gần đây chưa có mục Điểm mạnh, Cần cải thiện hoặc Nên luyện tiếp."}
            </p>
          ) : (
            <div className="grid gap-3 xl:grid-cols-3">
              {aiReviews.map((review) => {
                const date = new Date(review.session.endedAt ?? review.session.startedAt);
                const dateLabel = Number.isNaN(date.getTime()) ? "Ngày chưa rõ" : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
                const room = review.session.mode === "text" ? "Chat" : review.session.mode === "voice" ? "Voice" : "Video";
                return (
                  <article key={review.session.sessionId} className="rounded-2xl border border-[#DCE6F6] bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-medium text-[#64748B]">
                      {review.session.jobTitle || "Phỏng vấn chung"} · {dateLabel} · Phòng {room}
                    </p>
                    {review.strengths.length > 0 ? (
                      <div className="mt-3">
                        <h3 className="text-sm font-bold text-[#247044]">Điểm mạnh</h3>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-relaxed text-[#33415C]">{review.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    ) : null}
                    {review.weaknesses.length > 0 ? (
                      <div className="mt-3">
                        <h3 className="text-sm font-bold text-[#A3440A]">Cần cải thiện</h3>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-relaxed text-[#33415C]">{review.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    ) : null}
                    {review.nextTopics.length > 0 ? (
                      <div className="mt-3">
                        <h3 className="text-sm font-bold text-[#14244B]">Nên luyện tiếp</h3>
                        <ul className="mt-1 list-inside list-disc space-y-1 text-sm leading-relaxed text-[#33415C]">{review.nextTopics.map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                    ) : null}
                    <Link href={`/interview/results/${review.session.sessionId}`} className="mt-4 inline-flex min-h-9 items-center text-sm font-semibold text-[#204195] hover:underline">Xem báo cáo gốc →</Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      <section aria-labelledby="home-resources-title" className="space-y-3">
        <div>
          <h2 id="home-resources-title" className="font-display text-lg font-bold text-[#14244B]">Hỗ trợ và tài nguyên hữu ích</h2>
          <p className="mt-1 text-sm text-[#607096]">Hướng dẫn và kiến thức giúp bạn chuẩn bị phỏng vấn hiệu quả hơn.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/dashboard/help" className="group rounded-2xl border border-[#DCE6F6] bg-white p-4 shadow-sm transition hover:border-[#AFC7F4] hover:shadow-md sm:p-5">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#2463D2]"><BookOpen className="size-5" aria-hidden="true" /></span>
            <h3 className="mt-3 font-semibold text-[#14244B]">Hướng dẫn sử dụng</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#607096]">Tìm hiểu cách luyện phỏng vấn và sử dụng các tính năng.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#204195]">Xem hướng dẫn <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
          </Link>
          <Link href="/resources?topic=interview" className="group rounded-2xl border border-[#DCE6F6] bg-white p-4 shadow-sm transition hover:border-[#AFC7F4] hover:shadow-md sm:p-5">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#2463D2]"><MessageCircle className="size-5" aria-hidden="true" /></span>
            <h3 className="mt-3 font-semibold text-[#14244B]">Mẹo phỏng vấn</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#607096]">Tham khảo cách trả lời STAR và chuẩn bị cho các câu hỏi thường gặp.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#204195]">Xem mẹo <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
          </Link>
          <Link href="/resources" className="group rounded-2xl border border-[#DCE6F6] bg-white p-4 shadow-sm transition hover:border-[#AFC7F4] hover:shadow-md sm:p-5">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#2463D2]"><FileText className="size-5" aria-hidden="true" /></span>
            <h3 className="mt-3 font-semibold text-[#14244B]">Tài liệu tham khảo</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#607096]">Khám phá tài liệu về CV, kỹ năng phỏng vấn và định hướng nghề nghiệp.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#204195]">Khám phá tài liệu <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
          </Link>
        </div>
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
  const [sessionsAvailable, setSessionsAvailable] = useState(true);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    const [profilesResult, sessionsResult, cvsResult] = await Promise.allSettled([
      loadAllJobProfiles(),
      interviewRuntimeApi.listAll(),
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
      setSessionsAvailable(true);
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
      setSessionsAvailable(false);
      setSessions(isGuest ? DEMO_SESSIONS : []);
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
      sessionsAvailable={sessionsAvailable}
      onRetry={() => void loadDashboard()}
      onCloseSession={closeSession}
    />
  );
}
