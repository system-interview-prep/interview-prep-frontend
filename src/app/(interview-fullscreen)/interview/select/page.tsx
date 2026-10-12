"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  MessageSquare,
  Mic,
  Sparkles,
  UploadCloud,
  Video,
} from "lucide-react";
import { ProcessStatus } from "@components/shared/ProcessSteps";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  describeStartInterviewError,
  startInterviewSession,
} from "@features/interview/services/interviewSession.service";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { userCvApi, type UserCvDto } from "@features/resume/services/userCv.service";
import { RECOMMENDED_MODE } from "@features/interview/utils/interviewModes";
import { localeOf } from "@/i18n/format";
import { cn } from "@/utils";

export default function InterviewSelectPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [cvs, setCvs] = useState<UserCvDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedCvId, setSelectedCvId] = useState("");
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState<{ key: string } | { cause: unknown } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startPhase, setStartPhase] = useState<number | null>(null);
  const [startFailed, setStartFailed] = useState(false);

  const startDialogRef = useDialogA11y<HTMLDivElement>(
    startPhase !== null,
    startFailed ? () => setStartPhase(null) : undefined,
  );

  useEffect(() => {
    let active = true;
    Promise.all([jobProfileApi.list({ limit: 50 }), userCvApi.listAll()])
      .then(([jobsResponse, cvsResponse]) => {
        if (!active) return;
        const activeJobs = (jobsResponse.data.items ?? []).filter(
          (job) => job.status === "ACTIVE" || !job.status,
        );
        const readyCvs = (cvsResponse.data.items ?? []).filter(
          (cv) => cv.status === "DONE" || !cv.status,
        );
        setJobs(activeJobs);
        setCvs(readyCvs);
        setSelectedJobId(activeJobs[0]?.id ?? "");
        setSelectedCvId(readyCvs[0]?.id ?? "");
      })
      .catch(() => {
        if (active) setContextError({ key: "picker.select.loadError" });
      })
      .finally(() => {
        if (active) setLoadingContext(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId),
    [jobs, selectedJobId],
  );
  const selectedCv = useMemo(
    () => cvs.find((cv) => cv.id === selectedCvId),
    [cvs, selectedCvId],
  );

  const canStart = Boolean(selectedCvId && selectedJobId && !loadingContext);

  const startMode = async (
    mode: "chat" | "voice" | "video",
    experience?: "question_practice" | "interview_chat",
  ) => {
    if (!canStart || isStarting) {
      setContextError({ key: "picker.select.needBoth" });
      return;
    }
    setContextError(null);
    setIsStarting(true);
    setStartFailed(false);
    setStartPhase(0);
    const phaseTimer = window.setTimeout(() => setStartPhase(1), 600);
    try {
      const url = await startInterviewSession({
        mode,
        experience,
        lang: lang === "vi" ? "vi" : "en",
        candidateId: selectedCvId,
        jobId: selectedJobId,
        jobTitle: selectedJob?.title,
      });
      window.clearTimeout(phaseTimer);
      setStartPhase(2);
      router.push(url);
    } catch (error) {
      window.clearTimeout(phaseTimer);
      setContextError({ cause: error });
      setStartFailed(true);
      setStartPhase((phase) => phase ?? 1);
      setIsStarting(false);
    }
  };

  const contextErrorText = contextError
    ? "key" in contextError
      ? t(contextError.key)
      : describeStartInterviewError(contextError.cause, t)
    : null;

  const goToInterviewChat = () => void startMode("chat", "interview_chat");
  const goToVoice = () => void startMode("voice");
  const goToRoom = () => void startMode("video");

  const modes = [
    {
      key: "video" as const,
      name: "Phỏng vấn Video AI",
      tag: t("userDash.mode.video.short"),
      desc: "Mô phỏng chân thực nhất với AI qua Webcam & Micro. Đánh giá toàn diện về phong thái, giọng nói và phản xạ.",
      duration: "15–20 phút",
      highlight: "Khuyên dùng",
      isFeatured: true,
      Icon: Video,
      color: "bg-gradient-to-br from-[#204195] to-[#14244B] text-white",
      badgeColor: "bg-[#FCB625] text-[#14244B]",
      cta: "Bắt đầu Video ngay",
      start: goToRoom,
    },
    {
      key: "voice" as const,
      name: "Phỏng vấn Giọng nói",
      tag: t("userDash.mode.voice.short"),
      desc: "Đàm thoại hai chiều tự nhiên bằng âm thanh, rèn luyện tốc độ nói, ngữ điệu và phản xạ nhanh mà không cần camera.",
      duration: "10–15 phút",
      highlight: "Luyện phản xạ",
      isFeatured: false,
      Icon: Mic,
      color: "bg-blue-50 text-[#204195] border border-blue-200",
      badgeColor: "bg-blue-100 text-[#204195]",
      cta: "Bắt đầu Voice ngay",
      start: goToVoice,
    },
    {
      key: "chat" as const,
      name: "Phỏng vấn Chat",
      tag: t("userDash.mode.chat.short"),
      desc: "Rèn luyện tư duy logic và trau chuốt cấu trúc câu trả lời bằng văn bản, giúp bạn chuẩn bị lập luận vững chắc.",
      duration: "10–15 phút",
      highlight: "Rèn cấu trúc",
      isFeatured: false,
      Icon: MessageSquare,
      color: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      badgeColor: "bg-emerald-100 text-emerald-800",
      cta: "Bắt đầu Chat ngay",
      start: goToInterviewChat,
    },
  ];

  const startPhases = [
    t("journey.select.phaseCheck"),
    t("journey.select.phaseCreate").replace("{job}", selectedJob?.title ?? ""),
    t("journey.select.phaseOpen"),
  ];

  return (
    <UserDashboardShell>
      <main className="min-h-screen px-4 pb-16 pt-4 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1280px] space-y-8 md:space-y-10">
          {/* Header Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14244B] via-[#1B3574] to-[#204195] p-6 text-white shadow-md sm:p-8 md:p-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#FCB625]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-32 h-64 w-64 rounded-full bg-[#204195]/40 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-xs">
                  <Sparkles className="size-3.5 text-[#FCB625]" />
                  <span>Khởi tạo phiên luyện tập</span>
                </div>

                <h1 className="mt-3.5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
                  {t("interview.select.title")}
                </h1>

                <p className="mt-2.5 text-sm leading-relaxed text-white/80 sm:text-base">
                  Chọn hồ sơ CV và vị trí ứng tuyển mục tiêu để AI thiết lập kịch bản phỏng vấn chuyên biệt, sát thực tế công việc nhất.
                </p>
              </div>

              <div className="hidden shrink-0 lg:block">
                <div className="flex w-60 flex-col items-center rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-md">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-white shadow-md p-1">
                    <img src="/logo.jpg" alt="Intervia AI" className="h-full w-full rounded-full object-cover" />
                  </div>
                  <span className="mt-3 text-xs font-bold text-white">Trợ lý phỏng vấn Intervia</span>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/75">
                    Sẵn sàng đặt câu hỏi chuyên môn &amp; tình huống cho bạn.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Bước 1: Chọn ngữ cảnh phỏng vấn (CV & Target Role Cards) */}
          <section className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#204195] text-[11px] font-extrabold text-white">
                    1
                  </span>
                  <span>{t("uxWs.select.step1")}</span>
                </div>
                <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-[#14244B] sm:text-2xl">
                  Chọn hồ sơ CV &amp; Vị trí ứng tuyển
                </h2>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Card 1: Chọn hồ sơ CV */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs transition-all hover:shadow-md sm:p-6">
                <div>
                  <div className="flex items-center justify-between border-b border-[#EAEFF8] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-[#204195]">
                        <FileText className="size-4" />
                      </span>
                      <h3 className="text-sm font-bold text-[#14244B]">{t("picker.select.cvLabel")}</h3>
                    </div>
                    <Link
                      href="/dashboard/cvs"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#204195] hover:underline"
                    >
                      <span>+ Quản lý CV</span>
                    </Link>
                  </div>

                  {loadingContext ? (
                    <div className="mt-4 space-y-2.5">
                      <div className="h-14 animate-pulse rounded-xl bg-[#F0F4FC]" />
                      <div className="h-14 animate-pulse rounded-xl bg-[#F0F4FC]" />
                    </div>
                  ) : cvs.length === 0 ? (
                    <div className="mt-4 flex flex-col items-center rounded-xl bg-[#F8FAFC] p-6 text-center">
                      <UploadCloud className="size-8 text-[#9AA6C2]" />
                      <p className="mt-2 text-xs font-medium text-[#607096]">{t("journey.select.hintNoCv")}</p>
                      <Link
                        href="/dashboard/cvs"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#204195] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#183275]"
                      >
                        <span>{t("journey.select.uploadCv")}</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 max-h-64 space-y-2.5 overflow-y-auto pr-1">
                      {cvs.map((cv) => {
                        const isSelected = cv.id === selectedCvId;
                        return (
                          <button
                            key={cv.id}
                            type="button"
                            onClick={() => setSelectedCvId(cv.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all",
                              isSelected
                                ? "border-[#204195] bg-[#F0F4FC]/90 shadow-xs ring-1 ring-[#204195]/30"
                                : "border-[#EAEFF8] bg-[#F8FAFC]/50 hover:border-[#204195]/30 hover:bg-white",
                            )}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span
                                className={cn(
                                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs",
                                  isSelected
                                    ? "border-[#204195] bg-[#204195] text-white"
                                    : "border-[#C9D7F1] bg-white",
                                )}
                              >
                                {isSelected && <Check className="size-3 stroke-[3]" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-[#14244B]">
                                  {cv.originalName || cv.id}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#607096]">
                                  {cv.createdAt
                                    ? `Tải lên ${new Date(cv.createdAt).toLocaleDateString(localeOf(lang))}`
                                    : "Đã sẵn sàng"}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              Sẵn sàng
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Chọn Vị trí tuyển dụng */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs transition-all hover:shadow-md sm:p-6">
                <div>
                  <div className="flex items-center justify-between border-b border-[#EAEFF8] pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
                        <Briefcase className="size-4" />
                      </span>
                      <h3 className="text-sm font-bold text-[#14244B]">{t("picker.select.jobLabel")}</h3>
                    </div>
                    <Link
                      href="/dashboard/jobs"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#204195] hover:underline"
                    >
                      <span>Khám phá việc làm →</span>
                    </Link>
                  </div>

                  {loadingContext ? (
                    <div className="mt-4 space-y-2.5">
                      <div className="h-14 animate-pulse rounded-xl bg-[#F0F4FC]" />
                      <div className="h-14 animate-pulse rounded-xl bg-[#F0F4FC]" />
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="mt-4 flex flex-col items-center rounded-xl bg-[#F8FAFC] p-6 text-center">
                      <Briefcase className="size-8 text-[#9AA6C2]" />
                      <p className="mt-2 text-xs font-medium text-[#607096]">{t("userDash.jobs.emptyTitle")}</p>
                      <Link
                        href="/dashboard/jobs"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#204195] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#183275]"
                      >
                        <span>{t("userDash.jobs.browse")}</span>
                        <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-4 max-h-64 space-y-2.5 overflow-y-auto pr-1">
                      {jobs.map((job) => {
                        const isSelected = job.id === selectedJobId;
                        return (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => setSelectedJobId(job.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all",
                              isSelected
                                ? "border-[#204195] bg-[#F0F4FC]/90 shadow-xs ring-1 ring-[#204195]/30"
                                : "border-[#EAEFF8] bg-[#F8FAFC]/50 hover:border-[#204195]/30 hover:bg-white",
                            )}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span
                                className={cn(
                                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs",
                                  isSelected
                                    ? "border-[#204195] bg-[#204195] text-white"
                                    : "border-[#C9D7F1] bg-white",
                                )}
                              >
                                {isSelected && <Check className="size-3 stroke-[3]" />}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-[#14244B]">
                                  {job.title}
                                </p>
                                <p className="mt-0.5 truncate text-[11px] text-[#607096]">
                                  {job.keywords?.length ? job.keywords.slice(0, 3).join(" · ") : "Toàn thời gian"}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#204195]">
                              Mục tiêu
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trạng thái sẵn sàng */}
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs transition-colors",
                canStart
                  ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-800"
                  : "border-amber-200/80 bg-amber-50/70 text-amber-800",
              )}
            >
              <div className="flex items-center gap-2">
                {canStart ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 text-amber-600" />
                )}
                <span className="font-medium">
                  {canStart
                    ? `Đã sẵn sàng tạo đề phỏng vấn: ${selectedJob?.title ?? ""} (dựa trên CV ${selectedCv?.originalName ?? ""})`
                    : "Vui lòng chọn đủ hồ sơ CV và vị trí ứng tuyển để kích hoạt các chế độ phỏng vấn."}
                </span>
              </div>
              {contextErrorText && (
                <span className="font-bold text-[#C43B3B]">{contextErrorText}</span>
              )}
            </div>
          </section>

          {/* Bước 2: Chọn hình thức phỏng vấn */}
          <section aria-labelledby="mode-step-title" className="space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#204195] text-[11px] font-extrabold text-white">
                  2
                </span>
                <span>{t("uxWs.select.step2")}</span>
              </div>
              <h2 id="mode-step-title" className="mt-1 font-display text-xl font-bold tracking-tight text-[#14244B] sm:text-2xl">
                Chọn phương thức đối thoại cùng AI
              </h2>
              <p className="mt-0.5 text-xs text-[#607096]">
                {t("picker.select.contextHint")}
              </p>
            </div>

            <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3">
              {modes.map((mode) => {
                const isFeatured = mode.isFeatured;
                return (
                  <article
                    key={mode.key}
                    className={cn(
                      "relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200",
                      canStart && !isStarting && "hover:-translate-y-1 hover:shadow-lg",
                      isFeatured
                        ? "border-[#204195] bg-gradient-to-b from-[#F0F4FC]/90 via-white to-white shadow-md ring-1 ring-[#204195]/20"
                        : "border-[#DCE4F3] bg-white shadow-xs hover:border-[#204195]/40",
                      (!canStart || isStarting) && "opacity-60",
                    )}
                  >
                    {mode.highlight && (
                      <span
                        className={cn(
                          "absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-xs",
                          mode.badgeColor,
                        )}
                      >
                        {mode.highlight}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-3">
                        <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", mode.color)}>
                          <mode.Icon className="size-6" />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-bold text-[#14244B]">{mode.name}</h3>
                          <span className="text-[11px] font-medium text-[#8B98B5]">{mode.duration}</span>
                        </div>
                      </div>
                      <p className="mt-3.5 text-xs leading-relaxed text-[#607096]">{mode.desc}</p>
                    </div>

                    <div className="mt-6 border-t border-[#EAEFF8] pt-4">
                      <button
                        type="button"
                        onClick={mode.start}
                        disabled={!canStart || isStarting}
                        className={cn(
                          "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all active:scale-[0.98]",
                          isFeatured
                            ? "bg-[#204195] text-white shadow-xs hover:bg-[#183275]"
                            : "border border-[#DCE4F3] bg-white text-[#14244B] hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195]",
                          (!canStart || isStarting) && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <span>{mode.cta}</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Preparation Dialog */}
      {startPhase !== null && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#14244B]/40 p-4 backdrop-blur-[2px]">
          <div
            ref={startDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-status-title"
            tabIndex={-1}
            className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-[0_30px_80px_-30px_rgba(20,36,75,0.5)] outline-none"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-[#DCE4F3] bg-[#F0F4FC] p-2">
              <img src="/logo.jpg" alt="Intervia" className="h-full w-full rounded-full object-cover" />
            </div>

            <h2 id="start-status-title" className="text-lg font-bold text-[#14244B]">
              {startFailed ? t("journey.select.failedTitle") : t("journey.select.preparingTitle")}
            </h2>
            <p className="mt-1 text-xs text-[#607096]">{selectedJob?.title}</p>

            <div className="mt-5 text-left">
              <ProcessStatus
                phases={startPhases}
                activeIndex={startPhase}
                state={startFailed ? "error" : "running"}
                message={startFailed ? (contextErrorText ?? undefined) : undefined}
              />
            </div>

            {startFailed && (
              <button
                type="button"
                onClick={() => setStartPhase(null)}
                className="mt-6 h-11 w-full rounded-full bg-[#204195] text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
              >
                {t("journey.select.close")}
              </button>
            )}
          </div>
        </div>
      )}
    </UserDashboardShell>
  );
}
