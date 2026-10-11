"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import FoxAvatar from "@features/mascot/components/FoxAvatar";
import { ProcessStatus } from "@components/shared/ProcessSteps";
import {
  interviewReportApi,
  type EvaluationReport,
} from "@/features/interview/services/interviewReport.service";
import { interviewChatApi, type ChatMessage } from "@/features/interview/services/interviewChat.service";
import {
  interviewRuntimeApi,
  type InterviewRuntimeSession,
} from "@/features/interview/services/interviewRuntime.service";
import InterviewReportView, { type ReflectionState } from "@/features/interview/components/InterviewReportView";
import { useLanguage } from "@/i18n/LanguageProvider";

type PageState =
  | { kind: "loading" }
  | { kind: "evaluating" }
  | { kind: "ready" }
  // title/body are i18n keys, translated at render time.
  | { kind: "no-report"; title: string; body: string }
  | { kind: "error"; title: string; body: string; code: ErrorCode };

type ErrorCode = "notFound" | "notEnded" | "busy" | "auth" | "generic" | "missingId";

function statusOf(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

function errorKeys(name: ErrorCode): { title: string; body: string; code: ErrorCode } {
  return { title: `report.page.err.${name}.title`, body: `report.page.err.${name}.body`, code: name };
}

/** Turn backend/network failures into a sentence the candidate can act on (as i18n keys). */
function friendlyError(err: unknown): { title: string; body: string; code: ErrorCode } {
  const status = statusOf(err);
  if (status === 404) return errorKeys("notFound");
  if (status === 409) return errorKeys("notEnded");
  if (status === 503) return errorKeys("busy");
  if (status === 401) return errorKeys("auth");
  return errorKeys("generic");
}

export default function InterviewResultsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const sessionId = (routeParams?.id as string) || searchParams.get("sessionId")?.trim() || "";

  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [session, setSession] = useState<InterviewRuntimeSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [reflection, setReflection] = useState<ReflectionState | null>(null);

  const evaluate = useCallback(async () => {
    setState({ kind: "evaluating" });
    try {
      setReport(await interviewReportApi.evaluateSession(sessionId));
      setState({ kind: "ready" });
    } catch (err) {
      setState({ kind: "error", ...friendlyError(err) });
    }
  }, [sessionId]);

  const load = useCallback(async () => {
    if (!sessionId) {
      setState({ kind: "error", ...errorKeys("missingId") });
      return;
    }
    setState({ kind: "loading" });

    // Side data never blocks the report: each failure only hides its block.
    const [sessionResult, runtimeResult, reflectionResult, reportResult] = await Promise.allSettled([
      interviewRuntimeApi.get(sessionId),
      interviewChatApi.getRuntime(sessionId),
      interviewReportApi.getReflection(sessionId),
      interviewReportApi.getEvaluation(sessionId),
    ]);
    const loadedSession = sessionResult.status === "fulfilled" ? sessionResult.value : null;
    const loadedRuntime = runtimeResult.status === "fulfilled" ? runtimeResult.value : null;
    const loadedMessages = loadedRuntime?.messages ?? null;
    setSession(loadedSession);
    setMessages(loadedMessages);
    setReflection(reflectionResult.status === "fulfilled" ? reflectionResult.value : null);

    if (reportResult.status === "fulfilled") {
      setReport(reportResult.value);
      setState({ kind: "ready" });
      return;
    }
    if (statusOf(reportResult.reason) !== 404) {
      setState({ kind: "error", ...friendlyError(reportResult.reason) });
      return;
    }

    // No report yet: only generate one when there is something to grade.
    const stageByTurn = new Map(
      (loadedRuntime?.turns ?? []).map((turn) => [turn.turnId, turn.stage ?? ""])
    );
    const scorableAnswers =
      loadedMessages?.filter((message) => {
        if (message.role !== "user" || message.messageType !== "CANDIDATE_ANSWER" || !message.turnId) {
          return false;
        }
        const stage = stageByTurn.get(message.turnId);
        return stage !== "WARM_UP" && stage !== "CLOSING";
      }).length ?? 0;
    // A session closed as "technical problem" can still hold real answers: only
    // treat it as a failed start when there is nothing to grade.
    if (loadedSession?.endReason === "TECHNICAL_FAILURE" && scorableAnswers === 0) {
      setState({
        kind: "no-report",
        title: "report.page.noReport.failedStart.title",
        body: "report.page.noReport.failedStart.body",
      });
      return;
    }
    if (loadedSession && !loadedSession.endedAt) {
      setState({
        kind: "no-report",
        title: "report.page.err.notEnded.title",
        body: "report.page.noReport.notEnded.body",
      });
      return;
    }
    if (!loadedRuntime) {
      setState({ kind: "error", ...friendlyError(runtimeResult.status === "rejected" ? runtimeResult.reason : null) });
      return;
    }
    if (scorableAnswers === 0) {
      setState({
        kind: "no-report",
        title: "report.page.noReport.noAnswers.title",
        body: "report.page.noReport.noAnswers.body",
      });
      return;
    }
    await evaluate();
  }, [evaluate, sessionId]);

  // Grading is one request, so these phases are time-based captions, not real progress.
  const [evalStage, setEvalStage] = useState(0);
  useEffect(() => {
    if (state.kind !== "evaluating") return;
    const timers = [
      window.setTimeout(() => setEvalStage(1), 4000),
      window.setTimeout(() => setEvalStage(2), 12000),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      setEvalStage(0);
    };
  }, [state.kind]);

  useEffect(() => {
    // Data fetch on mount; state updates happen after awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const saveReflection = useCallback(
    async (next: { selfRatings: Record<string, number>; takeaway: string | null }) => {
      try {
        setReflection(await interviewReportApi.saveReflection(sessionId, next));
        return true;
      } catch {
        return false;
      }
    },
    [sessionId]
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9FD] font-sans text-[#14244B] print:min-h-0 print:bg-white">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#DCE4F3] bg-[#F7F9FD] px-4 sm:px-8 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex size-9 items-center justify-center rounded-full bg-white text-[#607096] ring-1 ring-[#DCE4F3] transition hover:bg-[#EEF2FD] hover:text-[#14244B]"
            title={t("report.page.backAria")}
            aria-label={t("report.page.backAria")}
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="flex items-center gap-2">
            <FoxAvatar size={30} className="rounded-full bg-[#F0F4FC]" />
            <span className="font-display text-lg font-semibold text-[#14244B]">Intervia</span>
          </span>
          <span className="hidden text-sm text-[#607096] sm:inline">· {t("report.page.badge")}</span>
        </div>

        <div className="flex items-center gap-2">
          {state.kind === "ready" ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center rounded-full bg-white px-4 text-xs font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] transition hover:bg-[#EEF2FD]"
            >
              {t("report.page.print")}
            </button>
          ) : (
            <Link
              href="/interview/select"
              className="inline-flex h-9 items-center rounded-full bg-[#204195] px-4 text-xs font-semibold text-white transition hover:bg-[#183275]"
            >
              {t("report.page.continue")}
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 py-8 print:py-0">
        {state.kind === "loading" || state.kind === "evaluating" ? (
          <div className="mx-auto max-w-md px-4 py-24 text-center" role="status" aria-live="polite">
            <h2 className="mt-5 font-display text-2xl font-semibold text-[#14244B]">
              {state.kind === "evaluating" ? t("report.page.evaluating") : t("report.page.loading")}
            </h2>
            {state.kind === "evaluating" && (
              <>
                <p className="mt-2 text-sm leading-relaxed text-[#607096]">{t("report.page.evaluatingBody")}</p>
                <ProcessStatus
                  className="mt-6 text-left"
                  phases={["step1", "step2", "step3"].map((step) => t(`uxInterview.report.eval.${step}`))}
                  activeIndex={evalStage}
                  message={t("uxInterview.report.eval.note")}
                />
              </>
            )}
          </div>
        ) : state.kind === "error" || state.kind === "no-report" ? (
          <div className="mx-auto my-16 max-w-lg space-y-4 rounded-3xl bg-white p-6 text-center ring-1 ring-[#DCE4F3]">
            <h3 className="font-display text-xl font-semibold text-[#14244B]">{t(state.title)}</h3>
            <p className="text-sm leading-relaxed text-[#607096]">{t(state.body)}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {state.kind === "error" && (state.code === "generic" || state.code === "busy") && (
                <>
                  <button
                    type="button"
                    onClick={() => void evaluate()}
                    className="inline-flex h-11 items-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
                  >
                    {t("report.page.regrade")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="inline-flex h-11 items-center rounded-full bg-[#F7F9FD] px-5 text-sm font-semibold text-[#14244B] transition hover:bg-[#EEF2FD]"
                  >
                    {t("report.page.reload")}
                  </button>
                </>
              )}
              {state.kind === "error" && state.code === "notEnded" && (
                <button
                  type="button"
                  onClick={() => void load()}
                  className="inline-flex h-11 items-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
                >
                  {t("report.page.reload")}
                </button>
              )}
              {state.kind === "error" && state.code === "auth" && (
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
                >
                  {t("room.results.login")}
                </Link>
              )}
              {state.kind === "error" && (state.code === "notFound" || state.code === "missingId") && (
                <Link
                  href="/dashboard/history"
                  className="inline-flex h-11 items-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
                >
                  {t("room.results.history")}
                </Link>
              )}
              {state.kind === "no-report" && session && !session.endedAt && (
                <Link
                  href={`/interview/room/${encodeURIComponent(sessionId)}`}
                  className="inline-flex h-11 items-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white hover:bg-[#183275]"
                >
                  {t("report.page.backToRoom")}
                </Link>
              )}
              <Link
                href="/interview/select"
                className="inline-flex h-11 items-center rounded-full bg-[#F7F9FD] px-5 text-sm font-semibold text-[#14244B] hover:bg-[#EEF2FD]"
              >
                {t("report.page.newSession")}
              </Link>
            </div>
          </div>
        ) : report ? (
          <InterviewReportView
            report={report}
            onBack={() => router.push("/dashboard")}
            session={session}
            messages={messages}
            reflection={reflection}
            onSaveReflection={saveReflection}
          />
        ) : null}
      </main>
    </div>
  );
}
