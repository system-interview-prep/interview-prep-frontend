'use client';

import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Eye, Loader2, LogOut, Send, X } from 'lucide-react';
import {
  interviewRuntimeApi,
  type InterviewFrozenTurn,
  type InterviewRuntimePlan,
  type InterviewTextRuntime,
} from '../services/interviewRuntime.service';
import { PracticeHeader, PracticeQuestionCard, PracticeSidebar, PracticeTurnStepper } from './PracticeRoomParts';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt, localeOf } from '@/i18n/format';
import { ProcessStatus } from '@components/shared/ProcessSteps';
import { useDialogA11y } from '@components/shared/useDialogA11y';

/** Why the room could not load; translated at render so a language switch applies. */
type LoadError = 'question_unavailable' | 'not_found' | 'network';

interface StructuredTextInterviewProps {
  sessionId: string;
  jobTitle?: string;
  onCompleted?: () => void;
  backUrl?: string;
}

function formatTime(isoString: string | null | undefined, locale: string): string {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const res = (err as { response?: { data?: { detail?: string } } }).response;
    if (typeof res?.data?.detail === 'string') {
      return res.data.detail;
    }
    if ('message' in err && typeof (err as { message?: string }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  return '';
}

function extractErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object') {
    return (err as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

export default function StructuredTextInterview({
  sessionId,
  jobTitle,
  onCompleted,
  backUrl = '/interview/select',
}: StructuredTextInterviewProps) {
  const router = useRouter();
  const { t, lang } = useLanguage();

  // Runtime and plan state
  const [runtime, setRuntime] = useState<InterviewTextRuntime | null>(null);
  const [plan, setPlan] = useState<InterviewRuntimePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LoadError | null>(null);

  // Turn management
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Exit dialog
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [exitError, setExitError] = useState<string | null>(null);
  const exitTitleId = useId();
  const closeExitDialog = useCallback(() => {
    setShowExitConfirm(false);
    setExitError(null);
  }, []);
  const exitDialogRef = useDialogA11y<HTMLDivElement>(showExitConfirm, isClosing ? undefined : closeExitDialog);
  // Bumped by "Retry" on the fatal error screen to load the room again.
  const [reloadKey, setReloadKey] = useState(0);

  // Load session plan (best-effort for agenda sidebar)
  const loadPlan = useCallback(async () => {
    try {
      const planData = await interviewRuntimeApi.getPlan(sessionId);
      setPlan(planData);
    } catch {
      // Plan fetching is auxiliary
    }
  }, [sessionId]);

  // Load text runtime and ensure current turn is ASKED
  const loadRuntime = useCallback(async () => {
    const next = await interviewRuntimeApi.getTextRuntime(sessionId);
    // If current turn is PLANNED, transition it to ASKED automatically
    if (next.currentTurn?.status === 'PLANNED') {
      await interviewRuntimeApi.askTurn(sessionId, next.currentTurn.turnId);
      return interviewRuntimeApi.getTextRuntime(sessionId);
    }
    return next;
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    Promise.all([loadRuntime(), loadPlan()])
      .then(([nextRuntime]) => {
        if (!active) return;
        setRuntime(nextRuntime);
        if (nextRuntime?.currentTurn) {
          setSelectedTurnId(nextRuntime.currentTurn.turnId);
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = extractErrorMessage(err);
        const status = extractErrorStatus(err);
        if (msg.includes('question_unavailable')) {
          setError('question_unavailable');
        } else if (status === 404) {
          setError('not_found');
        } else {
          // Raw backend text is not shown to candidates.
          setError('network');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadPlan, loadRuntime, reloadKey]);

  // Determine current active turn
  const activeTurn: InterviewFrozenTurn | null = useMemo(() => {
    if (!runtime) return null;
    if (selectedTurnId) {
      const found = runtime.turns.find((t) => t.turnId === selectedTurnId);
      if (found) return found;
    }
    return runtime.currentTurn || runtime.turns[0] || null;
  }, [runtime, selectedTurnId]);

  // Synchronize textarea when switching turns
  useEffect(() => {
    if (activeTurn?.status === 'ANSWERED') {
      setAnswerInput(activeTurn.answerText || '');
    } else {
      setAnswerInput('');
    }
    setSubmitError(null);
  }, [activeTurn?.turnId, activeTurn?.status, activeTurn?.answerText]);

  // Close the practice session once every answer is saved. Retryable from the
  // completed screen if it fails.
  const finalizePractice = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const closed = await interviewRuntimeApi.completeTextRuntime(sessionId);
      setRuntime(closed);
      onCompleted?.();
    } catch {
      // Raw backend text is not shown to candidates.
      setSubmitError(fmt(t('room.practice.finalizeError'), { detail: '' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!runtime?.currentTurn || isSubmitting) return;
    if (activeTurn?.turnId !== runtime.currentTurn.turnId) return;

    const trimmed = answerInput.trim();
    if (!trimmed) {
      setSubmitError(t('room.practice.emptyAnswer'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await interviewRuntimeApi.answerTurn(
        sessionId,
        runtime.currentTurn.turnId,
        trimmed
      );

      let next = await interviewRuntimeApi.getTextRuntime(sessionId);

      if (next.completed) {
        // Every answer is saved now; show that state even if closing the
        // session fails, so the candidate is not asked to resubmit an
        // immutable answer. The completed screen offers a retry.
        setRuntime(next);
        setSelectedTurnId(null);
        await finalizePractice();
        return;
      }

      if (next.currentTurn?.status === 'PLANNED') {
        await interviewRuntimeApi.askTurn(sessionId, next.currentTurn.turnId);
        next = await interviewRuntimeApi.getTextRuntime(sessionId);
      }

      setRuntime(next);
      if (next.currentTurn) {
        setSelectedTurnId(next.currentTurn.turnId);
      }
      setAnswerInput('');
    } catch {
      // Raw backend text is not shown to candidates.
      setSubmitError(t('room.practice.sendError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close session on confirm exit
  // Ending keeps the candidate here: the completed screen offers the report.
  const handleConfirmExit = async () => {
    setIsClosing(true);
    setExitError(null);
    try {
      await interviewRuntimeApi.close(sessionId);
    } catch {
      setExitError(t('room.practice.closeError'));
      setIsClosing(false);
      return;
    }
    setRuntime((prev) => (prev ? { ...prev, sessionStatus: 'CLOSED' } : prev));
    setSelectedTurnId(null);
    try {
      setRuntime(await interviewRuntimeApi.getTextRuntime(sessionId));
    } catch {
      // The local CLOSED state is enough to show the completed screen.
    }
    setIsClosing(false);
    setShowExitConfirm(false);
    onCompleted?.();
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[#F7F9FD] p-6 text-[#14244B]">
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-[#14244B]">{t('room.practice.loadingTitle')}</p>
          <p className="mt-1 text-sm text-[#607096]">{t('room.practice.loadingSub')}</p>
        </div>
        <ProcessStatus
          className="w-full max-w-sm"
          phases={[t('uxWs.room.phaseLoad'), t('uxWs.room.phasePlan'), t('uxWs.room.phaseOpen')]}
          activeIndex={2}
        />
      </div>
    );
  }

  // 2. Fatal Error State (e.g. 409 question_unavailable, 404, etc.)
  if (error && !runtime) {
    const isQuestionUnavailable = error === 'question_unavailable';
    return (
      <div className="flex h-dvh flex-col items-center justify-center p-6 text-center bg-[#F7F9FD]">
        <div className="max-w-md rounded-3xl bg-white p-6 ring-1 ring-[#DCE4F3]">
          <h2 className="mt-3 font-display text-xl font-semibold text-[#14244B]">
            {isQuestionUnavailable ? t('room.practice.unavailableTitle') : t('room.practice.loadErrorTitle')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#607096]">
            {isQuestionUnavailable
              ? t('room.practice.unavailableBody')
              : t(error === 'not_found' ? 'room.practice.notFound' : 'room.practice.networkError')}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white hover:bg-[#183275] transition-colors"
            >
              {t('room.common.retry')}
            </button>
            <button
              type="button"
              onClick={() => router.push(backUrl)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#F7F9FD] px-5 text-sm font-semibold text-[#14244B] hover:bg-[#EEF2FD] transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>{t('room.common.back')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!runtime) return null;

  const totalTurns = runtime.progress.total;
  const answeredTurns = runtime.progress.answered;
  const isSessionClosed = runtime.completed || runtime.sessionStatus === 'CLOSED';
  // All answers recorded but the session is not closed yet (completion failed):
  // the report cannot be generated until it is.
  const needsFinalize = runtime.completed && runtime.sessionStatus !== 'CLOSED';
  const isViewingCurrentTurn =
    !isSessionClosed &&
    runtime.currentTurn &&
    activeTurn?.turnId === runtime.currentTurn.turnId;
  const currentTurnId = runtime.currentTurn?.turnId ?? null;

  // Word & character counts
  const wordCount = answerInput.trim() ? answerInput.trim().split(/\s+/).length : 0;
  const charCount = answerInput.length;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#F7F9FD] font-body text-[#14244B]">
      <PracticeHeader
        jobTitle={jobTitle}
        isClosed={isSessionClosed}
        answered={answeredTurns}
        total={totalTurns}
        onBack={() => router.push(backUrl)}
        onEnd={() => setShowExitConfirm(true)}
      />

      {!isSessionClosed ? (
        <PracticeTurnStepper
          turns={runtime.turns}
          currentTurnId={currentTurnId}
          selectedTurnId={activeTurn?.turnId}
          onSelect={setSelectedTurnId}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {!isSessionClosed ? (
          <PracticeSidebar
            turns={runtime.turns}
            currentTurnId={currentTurnId}
            selectedTurnId={activeTurn?.turnId}
            targets={plan?.targets}
            onSelect={setSelectedTurnId}
          />
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-start">
            {isSessionClosed ? (
              /* ── COMPLETED: report CTA + read-only transcript ── */
              <div className="space-y-6">
                <section className="rounded-3xl bg-[#F0F4FC]/70 p-6 text-center">
                  <h2 className="mt-3 font-display text-2xl font-semibold text-[#14244B]">{t('room.practice.completedTitle')}</h2>
                  <p className="mt-1 text-sm text-[#607096]">
                    {fmt(t('room.practice.recorded'), { answered: answeredTurns, total: totalTurns })}
                  </p>

                  {needsFinalize && submitError ? (
                    <p
                      role="alert"
                      className="mx-auto mt-4 max-w-md rounded-2xl bg-[#FDF2F2] px-3 py-2 text-xs text-[#C43B3B]"
                    >
                      {submitError}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
                    {needsFinalize ? (
                      <button
                        type="button"
                        onClick={() => void finalizePractice()}
                        disabled={isSubmitting}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275] disabled:opacity-60 sm:w-auto"
                      >
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                        {isSubmitting ? t('room.practice.finalizing') : t('room.practice.finalize')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push(`/interview/results/${sessionId}`)}
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275] sm:w-auto"
                      >
                        {t('room.common.viewReport')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(backUrl)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#14244B] transition hover:bg-[#F7F9FD] sm:w-auto"
                    >
                      {t('room.common.back')}
                    </button>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-[12px] font-semibold text-[#204195]">
                    {fmt(t('room.practice.reviewHeading'), { n: runtime.turns.length })}
                  </h3>
                  {runtime.turns.map((turn, i) => (
                    <article key={turn.turnId} className="rounded-3xl border border-[#DCE4F3] bg-white p-5">
                      <div className="flex items-center justify-between text-xs text-[#607096]">
                        <span className="font-bold text-[#204195]">{fmt(t('room.common.questionN'), { n: i + 1 })}</span>
                        {turn.completedAt ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" aria-hidden="true" />
                            {formatTime(turn.completedAt, localeOf(lang))}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 font-semibold text-[#14244B]">{turn.question?.questionText}</p>
                      <div className="mt-3 rounded-2xl bg-[#F7F9FD] p-3.5">
                        <p className="text-xs font-bold text-[#607096]">{t('room.practice.yourAnswer')}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#14244B]">
                          {turn.answerText || t('room.practice.noAnswer')}
                        </p>
                      </div>
                    </article>
                  ))}
                </section>
              </div>
            ) : activeTurn ? (
              /* ── ACTIVE / REVIEW QUESTION PANEL ── */
              <div className="flex flex-1 flex-col space-y-4">
                {!isViewingCurrentTurn && activeTurn.status === 'ANSWERED' ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#EEF2FD] px-4 py-2.5 text-xs text-[#14244B]">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Eye className="size-3.5 text-[#204195]" aria-hidden="true" />
                      {fmt(t('room.practice.reviewing'), { n: activeTurn.turnIndex + 1 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (runtime.currentTurn) setSelectedTurnId(runtime.currentTurn.turnId);
                      }}
                      className="font-bold text-[#204195] hover:underline"
                    >
                      {t('room.practice.backToCurrent')}
                    </button>
                  </div>
                ) : null}

                <PracticeQuestionCard turn={activeTurn} total={totalTurns} />

                <section className="flex flex-1 flex-col rounded-3xl border border-[#DCE4F3] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="candidate-answer-input" className="text-sm font-bold text-[#14244B]">
                      {activeTurn.status === 'ANSWERED' ? t('room.practice.savedAnswer') : t('room.practice.yourAnswer')}
                    </label>
                    {activeTurn.status !== 'ANSWERED' ? (
                      <span className="text-xs tabular-nums text-[#607096]">
                        {fmt(t('room.practice.counts'), { words: wordCount, chars: charCount })}
                      </span>
                    ) : null}
                  </div>

                  {submitError ? (
                    <div
                      role="alert"
                      className="mt-3 flex items-start gap-2 rounded-2xl bg-[#FDF2F2] px-3 py-2.5 text-sm text-[#C43B3B]"
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <p className="flex-1">{submitError}</p>
                      <button
                        type="button"
                        onClick={() => setSubmitError(null)}
                        className="rounded-full p-0.5 hover:bg-[#FBE6E6]"
                        aria-label={t('room.common.dismiss')}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : null}

                  {activeTurn.status === 'ANSWERED' ? (
                    <div className="mt-3 flex-1 rounded-2xl bg-[#F7F9FD] p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#14244B]">
                        {activeTurn.answerText || t('room.practice.empty')}
                      </p>
                      <p className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#287A4B]">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        {t('room.practice.lockedNote')}
                      </p>
                    </div>
                  ) : (
                    <>
                      <textarea
                        id="candidate-answer-input"
                        rows={8}
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            void handleSubmitAnswer();
                          }
                        }}
                        disabled={isSubmitting}
                        placeholder={t('room.practice.placeholder')}
                        className="mt-3 min-h-40 flex-1 resize-y rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm leading-relaxed text-[#14244B] placeholder:text-[#607096]/70 focus:border-[#204195] focus:outline-hidden focus:ring-2 focus:ring-[#204195]/15 disabled:cursor-not-allowed disabled:bg-[#F7F9FD]"
                      />

                      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-[#607096]">
                          {t('room.practice.lockHint')} ·{' '}
                          <kbd className="rounded border border-[#DCE4F3] bg-[#F7F9FD] px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd> +{' '}
                          <kbd className="rounded border border-[#DCE4F3] bg-[#F7F9FD] px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> {t('room.common.toSend')}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleSubmitAnswer()}
                          disabled={isSubmitting || !answerInput.trim()}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                              <span>{t('room.practice.saving')}</span>
                            </>
                          ) : (
                            <>
                              <span>{t('room.practice.send')}</span>
                              <Send className="size-4" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* ── EXIT CONFIRMATION MODAL ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14244B]/60 p-4">
          <div
            ref={exitDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={exitTitleId}
            tabIndex={-1}
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_28px_60px_-30px_rgba(30,34,53,0.7)] ring-1 ring-[#DCE4F3] outline-none"
          >
            <h3 id={exitTitleId} className="font-display text-xl font-semibold text-[#14244B]">{t('room.practice.exitTitle')}</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#607096]">
              {t('room.practice.exitBody')}
            </p>
            {exitError ? (
              <p role="alert" className="mt-3 rounded-2xl bg-[#FDF2F2] px-3 py-2 text-xs text-[#C43B3B]">
                {exitError}
              </p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeExitDialog}
                disabled={isClosing}
                className="h-10 rounded-full bg-[#F7F9FD] px-5 text-xs font-semibold text-[#14244B] transition-colors hover:bg-[#EEF2FD]"
              >
                {t('room.practice.continue')}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmExit()}
                disabled={isClosing}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#C43B3B] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#A93232] disabled:opacity-50"
              >
                {isClosing ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                <span>{t('room.practice.endPractice')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
