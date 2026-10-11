"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import PageHero from "@components/shared/PageHero";
import { RECOMMENDED_MODE } from "@features/interview/utils/interviewModes";

export default function InterviewSelectPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [cvs, setCvs] = useState<UserCvDto[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedCvId, setSelectedCvId] = useState("");
  const [loadingContext, setLoadingContext] = useState(true);
  // Stored as a key or the raw cause so the message follows the UI language.
  const [contextError, setContextError] = useState<{ key: string } | { cause: unknown } | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  // Which preparation phase the start-up dialog shows; null = dialog closed.
  const [startPhase, setStartPhase] = useState<number | null>(null);
  const [startFailed, setStartFailed] = useState(false);
  // Escape closes the start dialog only once it has failed; mid-start it must stay.
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
  const canStart = Boolean(selectedCvId && selectedJobId && !loadingContext);

  const startMode = async (
    mode: "chat" | "voice" | "video",
    experience?: "question_practice" | "interview_chat"
  ) => {
    if (!canStart || isStarting) {
      setContextError({ key: "picker.select.needBoth" });
      return;
    }
    setContextError(null);
    setIsStarting(true);
    setStartFailed(false);
    setStartPhase(0);
    // Phase 0 (checking the picks) is instant; the request itself is phase 1.
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
    { key: "chat", tag: t("userDash.mode.chat.short"), name: t("mode.chat.name"), desc: t("mode.chat.desc"), cta: t("userDash.mode.chat.cta"), start: goToInterviewChat },
    { key: "voice", tag: t("userDash.mode.voice.short"), name: t("mode.voice.name"), desc: t("mode.voice.desc"), cta: t("userDash.mode.voice.cta"), start: goToVoice },
    { key: "video", tag: t("userDash.mode.video.short"), name: t("mode.video.name"), desc: t("mode.video.desc"), cta: t("userDash.mode.video.cta"), start: goToRoom },
  ] as const;

  const stepsHint = loadingContext
    ? t("journey.select.hintLoading")
    : !cvs.length
      ? t("journey.select.hintNoCv")
      : canStart
        ? t("journey.select.hintReady")
        : t("journey.select.hintPick");
  const startPhases = [
    t("journey.select.phaseCheck"),
    t("journey.select.phaseCreate").replace("{job}", selectedJob?.title ?? ""),
    t("journey.select.phaseOpen"),
  ];

  const selectClass =
    "mt-1.5 h-11 w-full rounded-2xl border-0 bg-[#F8FAFC] px-3.5 text-sm text-[#14244B] outline-none ring-1 ring-[#DCE4F3] transition focus:bg-white focus:ring-2 focus:ring-[#204195] disabled:opacity-60";

  return (
    <UserDashboardShell>
      <main className="min-h-screen px-4 pb-16 pt-4 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1280px] space-y-10">
          <PageHero
            title={t("interview.select.title")}
            body={stepsHint}
            aside={
              <div className="rounded-3xl bg-white/90 p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-[#14244B]">{t("uxWs.select.step1")}</h2>
                <p className="mt-1 text-xs leading-relaxed text-[#607096]">{t("picker.select.contextHint")}</p>
                <div className="mt-4 space-y-3">
                  <label className="block text-xs font-semibold text-[#607096]">
                    {t("picker.select.cvLabel")}
                    <select value={selectedCvId} onChange={(event) => setSelectedCvId(event.target.value)} disabled={loadingContext} className={selectClass}>
                      <option value="">{t("picker.select.cvPlaceholder")}</option>
                      {cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.originalName || cv.id}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-[#607096]">
                    {t("picker.select.jobLabel")}
                    <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} disabled={loadingContext} className={selectClass}>
                      <option value="">{t("picker.select.jobPlaceholder")}</option>
                      {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
                    </select>
                  </label>
                </div>
                {!loadingContext && !cvs.length && (
                  <Link href="/dashboard/cvs" className="mt-3 inline-block text-xs font-semibold text-[#204195] underline-offset-4 hover:underline">
                    {t("journey.select.uploadCv")} →
                  </Link>
                )}
                {contextErrorText && <p className="mt-3 text-xs font-semibold text-[#C43B3B]" role="alert">{contextErrorText}</p>}
              </div>
            }
          />

          <section aria-labelledby="mode-step-title">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 id="mode-step-title" className="font-display text-2xl font-semibold text-[#14244B]">{t("uxWs.select.step2")}</h2>
              {!loadingContext && !canStart && <p className="text-sm text-[#607096]">{t("uxWs.select.step2Locked")}</p>}
            </div>
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
              {modes.map((mode) => {
                const featured = mode.key === RECOMMENDED_MODE;
                return (
                  <button
                    key={mode.key}
                    type="button"
                    onClick={mode.start}
                    disabled={!canStart || isStarting}
                    className={`group relative flex min-h-[280px] w-full flex-col rounded-3xl p-7 text-left transition-all duration-200 enabled:hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                      featured
                        ? "bg-[#14244B] text-white shadow-[0_28px_60px_-34px_rgba(20,36,75,0.95)]"
                        : "bg-white ring-1 ring-[#DCE4F3] enabled:hover:shadow-[0_22px_44px_-28px_rgba(20,36,75,0.5)]"
                    }`}
                  >
                    <span className={`flex items-center gap-2 text-[12px] font-semibold ${featured ? "text-[#FCB625]" : "text-[#204195]"}`}>
                                            {featured ? `${t("mode.recommended")} · ${mode.tag}` : mode.tag}
                    </span>
                    <h2 className={`mt-4 font-display text-[26px] font-semibold leading-tight ${featured ? "text-white" : "text-[#14244B]"}`}>
                      {mode.name}
                    </h2>
                    <p className={`mt-3 flex-1 text-sm leading-relaxed ${featured ? "text-white/75" : "text-[#607096]"}`}>{mode.desc}</p>
                    <span
                      className={`mt-7 inline-flex h-11 items-center justify-between rounded-full px-5 text-sm font-semibold transition-colors ${
                        featured ? "bg-[#FCB625] text-[#14244B] group-hover:bg-[#E5A21D]" : "bg-[#F8FAFC] text-[#14244B] group-hover:bg-[#F0F4FC]"
                      }`}
                    >
                      {mode.cta}
                      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

        </div>
      </main>

      {startPhase !== null && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#14244B]/40 p-4 backdrop-blur-[2px]">
          <div
            ref={startDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-status-title"
            tabIndex={-1}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_80px_-30px_rgba(20,36,75,0.5)] outline-none"
          >
            <div className="mb-4 flex items-center gap-3">
              <div>
                <h2 id="start-status-title" className="text-lg font-bold text-[#14244B]">
                  {startFailed ? t("journey.select.failedTitle") : t("journey.select.preparingTitle")}
                </h2>
                <p className="text-sm text-[#607096]">{selectedJob?.title}</p>
              </div>
            </div>
            <ProcessStatus
              phases={startPhases}
              activeIndex={startPhase}
              state={startFailed ? "error" : "running"}
              message={startFailed ? (contextErrorText ?? undefined) : undefined}
            />
            {startFailed && (
              <button
                type="button"
                onClick={() => setStartPhase(null)}
                className="mt-4 h-11 w-full rounded-full bg-[#204195] text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
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
