'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock, Eye, Loader2, LogOut, Send, Sparkles, X } from 'lucide-react';
import {
  interviewRuntimeApi,
  type InterviewFrozenTurn,
  type InterviewRuntimePlan,
  type InterviewTextRuntime,
} from '../services/interviewRuntime.service';
import { PracticeHeader, PracticeQuestionCard, PracticeSidebar, PracticeTurnStepper } from './PracticeRoomParts';

interface StructuredTextInterviewProps {
  sessionId: string;
  jobTitle?: string;
  onCompleted?: () => void;
  backUrl?: string;
}

function formatTime(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString('vi-VN', {
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
  backUrl = '/practice?tab=cv-jd',
}: StructuredTextInterviewProps) {
  const router = useRouter();

  // Runtime and plan state
  const [runtime, setRuntime] = useState<InterviewTextRuntime | null>(null);
  const [plan, setPlan] = useState<InterviewRuntimePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Turn management
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Exit dialog
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
          setError(
            'question_unavailable: Phiên luyện tập chưa thể bắt đầu vì Question Bank chưa có đủ câu hỏi đã duyệt và hiệu chuẩn cho vị trí này.'
          );
        } else if (status === 404) {
          setError('Không tìm thấy phiên luyện tập hoặc bạn không có quyền truy cập.');
        } else {
          setError(msg ? msg : 'Không thể tải phòng luyện tập.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadPlan, loadRuntime]);

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
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      setSubmitError(
        `Đã lưu toàn bộ câu trả lời nhưng chưa hoàn tất được phiên${msg ? `: ${msg}` : ''}. Vui lòng thử lại.`
      );
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
      setSubmitError('Vui lòng nhập nội dung câu trả lời trước khi gửi.');
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
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      setSubmitError(
        msg ? msg : 'Không thể gửi câu trả lời. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close session on confirm exit
  const handleConfirmExit = async () => {
    setIsClosing(true);
    try {
      await interviewRuntimeApi.close(sessionId);
    } catch {
      // Best effort close
    } finally {
      setIsClosing(false);
      setShowExitConfirm(false);
      router.push(backUrl);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#F7F9FD] p-6 text-[#14244B]">
        <Loader2 className="size-10 animate-spin text-[#204195]" />
        <p className="font-headline text-base font-bold text-[#14244B]">Đang tải phòng luyện tập theo CV–JD...</p>
        <p className="text-xs text-[#607096]">Đang kết nối session và nạp danh sách câu hỏi đã khóa theo CV–JD</p>
      </div>
    );
  }

  // 2. Fatal Error State (e.g. 409 question_unavailable, 404, etc.)
  if (error && !runtime) {
    const isQuestionUnavailable = error.includes('question_unavailable');
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center bg-[#F7F9FD]">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#14244B]">
            {isQuestionUnavailable ? 'Chưa thể bắt đầu luyện tập' : 'Không thể tải phòng luyện tập'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#607096]">
            {isQuestionUnavailable
              ? 'Ngân hàng câu hỏi hiện chưa có đủ câu hỏi đã được phê duyệt và hiệu chuẩn cho vị trí này. Vui lòng quay lại chọn vị trí khác hoặc liên hệ bộ phận hỗ trợ.'
              : error}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push(backUrl)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#204195] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#183275] transition-colors"
            >
              <ArrowLeft className="size-4" />
              <span>Quay lại</span>
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F9FD] font-body text-[#14244B]">
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
                <section className="rounded-2xl border border-[#DCE4F3] bg-white p-6 text-center shadow-xs">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="size-7" aria-hidden="true" />
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-[#14244B]">Bạn đã hoàn thành phiên luyện tập</h2>
                  <p className="mt-1 text-sm text-[#607096]">
                    Đã ghi nhận câu trả lời cho {answeredTurns}/{totalTurns} câu hỏi.
                  </p>

                  {needsFinalize && submitError ? (
                    <p
                      role="alert"
                      className="mx-auto mt-4 max-w-md rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800"
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#204195] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#183273] disabled:opacity-60 sm:w-auto"
                      >
                        {isSubmitting ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Sparkles className="size-4" aria-hidden="true" />
                        )}
                        {isSubmitting ? 'Đang hoàn tất…' : 'Hoàn tất phiên để tạo báo cáo'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => router.push(`/interview/results/${sessionId}`)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#204195] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#183273] sm:w-auto"
                      >
                        <Sparkles className="size-4" aria-hidden="true" />
                        Xem báo cáo đánh giá
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(backUrl)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-5 py-2.5 text-sm font-semibold text-[#14244B] transition hover:bg-[#F7F9FD] sm:w-auto"
                    >
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      Quay lại
                    </button>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                    Xem lại câu hỏi và câu trả lời ({runtime.turns.length} câu)
                  </h3>
                  {runtime.turns.map((turn, i) => (
                    <article key={turn.turnId} className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs">
                      <div className="flex items-center justify-between text-xs text-[#607096]">
                        <span className="font-bold text-[#204195]">Câu {i + 1}</span>
                        {turn.completedAt ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" aria-hidden="true" />
                            {formatTime(turn.completedAt)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 font-semibold text-[#14244B]">{turn.question?.questionText}</p>
                      <div className="mt-3 rounded-xl bg-[#F7F9FD] p-3.5">
                        <p className="text-xs font-bold text-[#607096]">Câu trả lời của bạn</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#14244B]">
                          {turn.answerText || '(Chưa có nội dung trả lời)'}
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
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCE4F3] bg-[#EEF2FD] px-4 py-2.5 text-xs text-[#14244B]">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Eye className="size-3.5 text-[#204195]" aria-hidden="true" />
                      Đang xem lại câu {activeTurn.turnIndex + 1} (chỉ đọc)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (runtime.currentTurn) setSelectedTurnId(runtime.currentTurn.turnId);
                      }}
                      className="font-bold text-[#204195] hover:underline"
                    >
                      Về câu đang trả lời →
                    </button>
                  </div>
                ) : null}

                <PracticeQuestionCard turn={activeTurn} total={totalTurns} />

                <section className="flex flex-1 flex-col rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs sm:p-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="candidate-answer-input" className="text-sm font-bold text-[#14244B]">
                      {activeTurn.status === 'ANSWERED' ? 'Câu trả lời đã lưu' : 'Câu trả lời của bạn'}
                    </label>
                    {activeTurn.status !== 'ANSWERED' ? (
                      <span className="text-xs tabular-nums text-[#607096]">
                        {wordCount} từ · {charCount} ký tự
                      </span>
                    ) : null}
                  </div>

                  {submitError ? (
                    <div
                      role="alert"
                      className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800"
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <p className="flex-1">{submitError}</p>
                      <button
                        type="button"
                        onClick={() => setSubmitError(null)}
                        className="rounded-md p-0.5 hover:bg-rose-100"
                        aria-label="Đóng thông báo"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : null}

                  {activeTurn.status === 'ANSWERED' ? (
                    <div className="mt-3 flex-1 rounded-xl bg-[#F7F9FD] p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#14244B]">
                        {activeTurn.answerText || '(Trống)'}
                      </p>
                      <p className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        Đã ghi nhận — câu trả lời không thể sửa.
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
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            void handleSubmitAnswer();
                          }
                        }}
                        disabled={isSubmitting}
                        placeholder="Nhập câu trả lời của bạn... Nêu luận điểm rõ ràng và ví dụ thực tế."
                        className="mt-3 min-h-40 flex-1 resize-y rounded-xl border border-[#DCE4F3] bg-white p-4 text-sm leading-relaxed text-[#14244B] placeholder:text-[#607096]/70 focus:border-[#204195] focus:outline-hidden focus:ring-2 focus:ring-[#204195]/15 disabled:cursor-not-allowed disabled:bg-[#F7F9FD]"
                      />

                      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-[#607096]">
                          Câu đã gửi sẽ được khóa ·{' '}
                          <kbd className="rounded border border-[#DCE4F3] bg-[#F7F9FD] px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd> +{' '}
                          <kbd className="rounded border border-[#DCE4F3] bg-[#F7F9FD] px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> để gửi
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleSubmitAnswer()}
                          disabled={isSubmitting || !answerInput.trim()}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#204195] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#183273] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                              <span>Đang lưu...</span>
                            </>
                          ) : (
                            <>
                              <span>Gửi câu trả lời</span>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#14244B]/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#14244B]">Xác nhận kết thúc phiên luyện tập?</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#607096]">
              Phiên luyện tập sẽ được đóng lại. Các câu trả lời bạn đã gửi vẫn được lưu.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                disabled={isClosing}
                className="rounded-xl border border-[#DCE4F3] bg-white px-4 py-2 text-xs font-semibold text-[#14244B] transition-colors hover:bg-[#F7F9FD]"
              >
                Tiếp tục luyện tập
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmExit()}
                disabled={isClosing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {isClosing ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                <span>Kết thúc luyện tập</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
