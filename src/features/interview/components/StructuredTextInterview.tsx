'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  ListOrdered,
  Loader2,
  Lock,
  LogOut,
  Send,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  interviewRuntimeApi,
  type InterviewFrozenTurn,
  type InterviewRuntimePlan,
  type InterviewTextRuntime,
} from '../services/interviewRuntime.service';

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
        next = await interviewRuntimeApi.completeTextRuntime(sessionId);
        setRuntime(next);
        setSelectedTurnId(null);
        onCompleted?.();
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
              <span>Quay lại Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!runtime) return null;

  const totalTurns = runtime.progress.total;
  const answeredTurns = runtime.progress.answered;
  const progressPercent = totalTurns > 0 ? (answeredTurns / totalTurns) * 100 : 0;
  const isSessionClosed = runtime.completed || runtime.sessionStatus === 'CLOSED';
  const isViewingCurrentTurn =
    !isSessionClosed &&
    runtime.currentTurn &&
    activeTurn?.turnId === runtime.currentTurn.turnId;

  // Word & character counts
  const wordCount = answerInput.trim() ? answerInput.trim().split(/\s+/).length : 0;
  const charCount = answerInput.length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F7F9FD] font-body text-[#14244B]">
      {/* ── HEADER ── */}
      <header className="shrink-0 border-b border-[#DCE4F3] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left: Job Title & Mode */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EEF3FC] px-2 py-0.5 text-[11px] font-bold text-[#204195]">
                <ListOrdered className="size-3.5" />
                Luyện tập theo CV–JD
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  isSessionClosed
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span className={`size-1.5 rounded-full ${isSessionClosed ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                {isSessionClosed ? 'Đã hoàn tất luyện tập' : 'Đang luyện tập'}
              </span>
            </div>
            <h1 className="mt-1 truncate text-base font-bold text-[#14244B] sm:text-lg">
              {jobTitle ? `Luyện tập theo CV–JD: ${jobTitle}` : plan?.difficulty?.seniority || 'Luyện tập theo CV–JD'}
            </h1>
          </div>

          {/* Right: Progress & Exit */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-[#607096]">Tiến độ</span>
              <span className="text-sm font-bold tabular-nums text-[#14244B]">
                {answeredTurns} / {totalTurns} câu đã trả lời
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isSessionClosed) {
                  router.push(backUrl);
                } else {
                  setShowExitConfirm(true);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#607096] hover:bg-slate-50 hover:text-[#14244B] transition-colors shadow-2xs"
            >
              <LogOut className="size-3.5" />
              <span>{isSessionClosed ? 'Đóng' : 'Rời khỏi'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#EDF1F7]">
          <div
            className="h-full rounded-full bg-[#204195] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* SIDEBAR: Turn Roadmap & Plan Agenda */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-[#DCE4F3] bg-white lg:flex">
          {/* Competency Agenda */}
          {plan?.targets && plan.targets.length > 0 && (
            <div className="border-b border-[#DCE4F3] p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#607096]">
                <Target className="size-3.5 text-[#204195]" />
                <span>Năng lực đánh giá ({plan.targets.length})</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {plan.targets.map((tgt) => (
                  <span
                    key={tgt.conceptId}
                    className="inline-flex items-center rounded-lg bg-[#F8FAFC] border border-[#DCE4F3] px-2 py-1 text-[11px] font-medium text-[#14244B]"
                    title={`Mục tiêu: ${tgt.targetQuestionCount} câu`}
                  >
                    {tgt.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Turn List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#607096]">
              <span className="flex items-center gap-1.5">
                <ListOrdered className="size-3.5 text-[#204195]" />
                <span>Danh sách câu hỏi</span>
              </span>
              <span className="tabular-nums">
                {answeredTurns}/{totalTurns}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {runtime.turns.map((turn, index) => {
                const isCurrent = turn.turnId === runtime.currentTurn?.turnId;
                const isSelected = turn.turnId === selectedTurnId;
                const isAnswered = turn.status === 'ANSWERED' || turn.status === 'EVALUATED';
                const isPlanned = turn.status === 'PLANNED';

                return (
                  <button
                    key={turn.turnId}
                    type="button"
                    disabled={isPlanned}
                    onClick={() => setSelectedTurnId(turn.turnId)}
                    className={`w-full text-left rounded-xl p-3 border transition-all text-xs ${
                      isSelected
                        ? 'border-[#204195] bg-[#EEF3FC] shadow-xs'
                        : isAnswered
                        ? 'border-[#DCE4F3] bg-white hover:border-[#204195]/40 hover:bg-[#F8FAFC]'
                        : isCurrent
                        ? 'border-[#204195]/60 bg-white ring-2 ring-[#204195]/10'
                        : 'border-[#EAEFF8] bg-[#F8FAFC] opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#14244B]">Câu {index + 1}</span>
                      {isAnswered ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Đã trả lời
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#204195]">
                          <span className="size-1.5 rounded-full bg-[#204195] animate-pulse" />
                          Đang trả lời
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#607096]">
                          <Lock className="size-3 text-[#607096]" />
                          Sắp tới
                        </span>
                      )}
                    </div>
                    {/* Confidentiality rule: do not reveal question text of planned turns */}
                    <p className="mt-1 line-clamp-2 text-[11px] text-[#607096]">
                      {isAnswered || isCurrent
                        ? turn.question?.questionText || 'Đang chờ nạp nội dung...'
                        : 'Nội dung câu hỏi sẽ hiển thị khi đến lượt.'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAIN PANEL */}
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-start">
            {isSessionClosed ? (
              /* ── COMPLETED SCREEN (Review Transcript & Mandatory P4-P6 Notice) ── */
              <div className="space-y-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-[#14244B]">
                    Phiên luyện tập câu hỏi đã hoàn tất thành công!
                  </h2>
                  <p className="mt-2 text-sm text-[#607096]">
                    Tất cả {totalTurns} câu hỏi đã được ghi nhận câu trả lời đầy đủ và lưu trữ an toàn.
                  </p>

                  {/* Evaluation Report Action Banner */}
                  <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                        <Sparkles className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-indigo-950">
                          Báo cáo đánh giá năng lực AI đã sẵn sàng
                        </h4>
                        <p className="mt-1 text-xs text-indigo-800 leading-relaxed">
                          Xem biểu đồ Radar đa giác năng lực, điểm số chi tiết từng câu hỏi bóc tách theo STAR và nhận xét chuyên môn.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/interview/results/${sessionId}`)}
                      className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#204195] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#183273] transition shadow-xs"
                    >
                      <Sparkles className="size-3.5" /> Xem báo cáo đánh giá
                    </button>
                  </div>
                </div>

                {/* Full Transcript Review */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#607096]">
                    Xem lại toàn bộ câu hỏi và câu trả lời trong phiên luyện tập ({runtime.turns.length} câu)
                  </h3>

                  {runtime.turns.map((turn, i) => (
                    <div
                      key={turn.turnId}
                      className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-xs text-[#607096]">
                        <span className="font-bold text-[#204195]">Câu {i + 1}</span>
                        {turn.completedAt && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatTime(turn.completedAt)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 font-semibold text-[#14244B]">
                        {turn.question?.questionText}
                      </p>
                      <div className="mt-4 rounded-xl border border-[#EAEFF8] bg-[#F8FAFC] p-3.5">
                        <p className="text-xs font-bold text-[#607096]">Câu trả lời của bạn:</p>
                        <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed text-[#14244B]">
                          {turn.answerText || '(Chưa có nội dung trả lời)'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#183275] transition-colors"
                  >
                    <ArrowLeft className="size-4" />
                    <span>Quay về Dashboard</span>
                  </button>
                </div>
              </div>
            ) : activeTurn ? (
              /* ── ACTIVE / REVIEW QUESTION PANEL ── */
              <div className="flex flex-1 flex-col space-y-6">
                {/* Notice when viewing previously answered turn */}
                {!isViewingCurrentTurn && activeTurn.status === 'ANSWERED' && (
                  <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs text-sky-800">
                    <span className="font-medium">
                      Đang xem lại câu {activeTurn.turnIndex + 1} (chế độ chỉ đọc)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (runtime.currentTurn) {
                          setSelectedTurnId(runtime.currentTurn.turnId);
                        }
                      }}
                      className="font-bold text-[#204195] hover:underline"
                    >
                      Quay lại câu đang trả lời →
                    </button>
                  </div>
                )}

                {/* Question Card */}
                <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#204195]">
                      Câu hỏi {activeTurn.turnIndex + 1} / {totalTurns}
                    </span>
                    {activeTurn.question?.difficulty && (
                      <span className="rounded-md bg-[#F8FAFC] border border-[#DCE4F3] px-2 py-0.5 font-medium text-[#607096]">
                        Độ khó: {activeTurn.question.difficulty}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-lg font-bold leading-relaxed text-[#14244B] sm:text-xl">
                    {activeTurn.question?.questionText || 'Đang tải câu hỏi...'}
                  </h2>

                  {activeTurn.question?.objective && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F8FAFC] p-3 text-xs text-[#607096]">
                      <HelpCircle className="mt-0.5 size-4 shrink-0 text-[#204195]" />
                      <p>
                        <strong className="text-[#14244B]">Mục tiêu:</strong> {activeTurn.question.objective}
                      </p>
                    </div>
                  )}
                </div>

                {/* Answer Area */}
                <div className="flex flex-1 flex-col rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="candidate-answer-input"
                      className="text-sm font-bold text-[#14244B]"
                    >
                      {activeTurn.status === 'ANSWERED' ? 'Câu trả lời đã lưu' : 'Câu trả lời của bạn'}
                    </label>
                    <span className="text-xs text-[#607096]">
                      {wordCount} từ · {charCount} ký tự
                    </span>
                  </div>

                  {submitError && (
                    <div
                      className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {activeTurn.status === 'ANSWERED' ? (
                    /* Read-Only Answer View */
                    <div className="mt-3 flex-1 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-[#14244B]">
                        {activeTurn.answerText || '(Trống)'}
                      </p>
                      <p className="mt-4 text-[11px] font-semibold text-emerald-700">
                        ✓ Câu trả lời đã được ghi nhận và khóa bất biến.
                      </p>
                    </div>
                  ) : (
                    /* Active Turn Input View */
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
                        placeholder="Nhập nội dung câu trả lời của bạn tại đây... Hãy trả lời rõ ràng, có luận điểm và ví dụ thực tế."
                        className="mt-3 flex-1 resize-y rounded-xl border border-[#DCE4F3] p-4 text-sm leading-relaxed text-[#14244B] placeholder:text-[#607096]/60 focus:border-[#204195] focus:ring-1 focus:ring-[#204195] focus:outline-hidden disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />

                      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs text-[#607096]">
                          Mẹo: Nhấn <kbd className="rounded border bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd> +{' '}
                          <kbd className="rounded border bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> để gửi nhanh
                        </span>

                        <button
                          type="button"
                          onClick={() => void handleSubmitAnswer()}
                          disabled={isSubmitting || !answerInput.trim()}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#204195] px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#183275] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              <span>Đang lưu câu trả lời...</span>
                            </>
                          ) : (
                            <>
                              <span>Gửi câu trả lời</span>
                              <Send className="size-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>

      {/* ── EXIT CONFIRMATION MODAL ── */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#14244B]">Xác nhận kết thúc phiên luyện tập?</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#607096]">
              Nếu rời khỏi bây giờ, phiên luyện tập sẽ được đóng lại. Các câu trả lời bạn đã gửi vẫn sẽ được bảo lưu.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                disabled={isClosing}
                className="rounded-xl border border-[#DCE4F3] bg-white px-4 py-2 text-xs font-semibold text-[#14244B] hover:bg-slate-50 transition-colors"
              >
                Tiếp tục luyện tập
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmExit()}
                disabled={isClosing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isClosing ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                <span>Rời phòng luyện tập</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
