'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  RefreshCw,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import {
  ChatMessage,
  ChatRuntimeResponse,
  EndReason,
  interviewChatApi,
} from '../services/interviewChat.service';
import InteractiveCodeSandbox from '@/components/interview/InteractiveCodeSandbox';
import { AbortConfirmationModal } from '@/components/interview/AbortConfirmationModal';

interface InterviewChatRoomProps {
  sessionId: string;
  jobTitle?: string;
  backUrl?: string;
}

function InterviewCountdownTimer({
  startedAt,
  durationMinutes = 25,
  isClosed,
}: {
  startedAt?: string | null;
  durationMinutes?: number;
  isClosed: boolean;
}) {
  const computeRemaining = useCallback(() => {
    const totalSec = durationMinutes * 60;
    if (startedAt) {
      const startMs = new Date(startedAt).getTime();
      if (!isNaN(startMs)) {
        const elapsed = Math.floor((Date.now() - startMs) / 1000);
        return Math.max(0, totalSec - elapsed);
      }
    }
    return totalSec;
  }, [startedAt, durationMinutes]);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(computeRemaining);
  const [prevTimerConfig, setPrevTimerConfig] = useState({ startedAt, durationMinutes });

  if (prevTimerConfig.startedAt !== startedAt || prevTimerConfig.durationMinutes !== durationMinutes) {
    setPrevTimerConfig({ startedAt, durationMinutes });
    setSecondsRemaining(computeRemaining());
  }

  useEffect(() => {
    if (isClosed) return;
    const timer = setInterval(() => {
      setSecondsRemaining(computeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [computeRemaining, isClosed]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const isLow = secondsRemaining <= 300 && secondsRemaining > 120; // 2 - 5 min
  const isCritical = secondsRemaining <= 120; // < 2 min

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all ${
        isClosed
          ? 'border-slate-200 bg-slate-100/70 text-slate-500'
          : isCritical
          ? 'border-rose-300 bg-rose-50 text-rose-700 animate-pulse ring-1 ring-rose-300'
          : isLow
          ? 'border-amber-300 bg-amber-50 text-amber-800 ring-1 ring-amber-200'
          : 'border-slate-200 bg-slate-50 text-slate-700'
      }`}
      title={isClosed ? 'Phiên phỏng vấn đã kết thúc' : 'Thời gian phỏng vấn còn lại'}
    >
      <Clock
        className={`size-3.5 ${
          isClosed
            ? 'text-slate-400'
            : isCritical
            ? 'text-rose-600'
            : isLow
            ? 'text-amber-600'
            : 'text-slate-500'
        }`}
      />
      <span>{formatted}</span>
      <span className="hidden md:inline font-normal text-[11px] opacity-80">còn lại</span>
    </div>
  );
}

export default function InterviewChatRoom({
  sessionId,
  jobTitle: initialJobTitle,
  backUrl = '/dashboard',
}: InterviewChatRoomProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<ChatRuntimeResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load or initialize chat runtime
  const loadChatSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewChatApi.start(sessionId);
      setRuntime(data);
      setMessages(data.messages || []);
    } catch (err: unknown) {
      const resData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      const msg =
        typeof resData?.detail === 'string'
          ? resData.detail
          : err instanceof Error
          ? err.message
          : 'Không thể khởi động phòng phỏng vấn.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      loadChatSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // Send message
  const handleSendMessage = async (customContent?: string, telemetry?: Record<string, unknown>) => {
    const rawContent = customContent !== undefined ? customContent : inputValue;
    const trimmed = rawContent.trim();
    if (!trimmed || isSending || runtime?.sessionStatus === 'CLOSED') return;

    const clientMsgId = `cli-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const tempUserMsg: ChatMessage = {
      messageId: clientMsgId,
      sessionId,
      role: 'user',
      messageType: 'CANDIDATE_ANSWER',
      turnId: runtime?.currentTurn?.turnId,
      sequence: (messages[messages.length - 1]?.sequence || 0) + 1,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    if (customContent === undefined) {
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    setIsSending(true);

    try {
      const res = await interviewChatApi.sendMessage(sessionId, {
        clientMessageId: clientMsgId,
        content: trimmed,
        telemetry,
      });

      setMessages((prev) => {
        // Replace temp msg and append assistant response
        const filtered = prev.filter((m) => m.messageId !== clientMsgId);
        const next = [...filtered, res.userMessage];
        if (res.assistantResponse) {
          next.push(res.assistantResponse);
        }
        return next;
      });

      // TRIGGER 2 (Qua chat): AI nhận diện ý định dừng và trả về CONFIRM_ABORT
      if (
        res.action === 'CONFIRM_ABORT' ||
        res.assistantResponse?.messageType === 'CONFIRM_ABORT'
      ) {
        setShowEndModal(true);
      }

      if (res.sessionStatus === 'CLOSED') {
        setRuntime((prev) => (prev ? { ...prev, sessionStatus: 'CLOSED' } : null));
      } else {
        try {
          const freshRuntime = await interviewChatApi.getRuntime(sessionId);
          setRuntime(freshRuntime);
        } catch {
          if (res.turnStatus?.turnIndex !== undefined) {
            setRuntime((prev) =>
              prev
                ? {
                    ...prev,
                    currentTurnIndex: res.turnStatus.turnIndex ?? prev.currentTurnIndex,
                  }
                : null
            );
          }
        }
      }
    } catch (err: unknown) {
      const resData = (err as { response?: { data?: { detail?: string } } })?.response?.data;
      const msg =
        typeof resData?.detail === 'string'
          ? resData.detail
          : err instanceof Error
          ? err.message
          : 'Lỗi gửi tin nhắn. Vui lòng thử lại.';
      alert(msg);
      // Remove optimistic message on hard failure
      setMessages((prev) => prev.filter((m) => m.messageId !== clientMsgId));
      if (customContent === undefined) {
        setInputValue(trimmed);
      }
    } finally {
      setIsSending(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  };

  const handleCodeSubmit = async (code: string, codeDiff: string, testPassed: boolean) => {
    const formattedCodeMsg = `Tôi đã hoàn thành việc sửa lỗi code trên Editor.\n\nKết quả test cases: ${
      testPassed ? '✅ VƯỢT QUA TẤT CẢ TEST CASES (PASSED)' : '❌ CHƯA VƯỢT QUA TEST CASES (FAILED)'
    }\n\nGiải pháp của tôi:\n\`\`\`python\n${code}\n\`\`\``;

    await handleSendMessage(formattedCodeMsg, {
      isCodingTurn: true,
      is_coding_turn: true,
      codeDiff,
      code_diff: codeDiff,
      testPassed,
      test_passed: testPassed,
      submittedCode: code,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // End interview session
  const handleEndSession = async (reason?: string) => {
    setIsEnding(true);
    const endReason: EndReason =
      reason === 'COMPLETED' || reason === 'TECHNICAL_FAILURE' ? reason : 'USER_ENDED';
    try {
      await interviewChatApi.complete(sessionId, endReason);
      setShowEndModal(false);
      setRuntime((prev) => (prev ? { ...prev, sessionStatus: 'CLOSED', endReason } : null));
      // Re-fetch latest transcript to ensure all wrap-up messages are loaded
      const updated = await interviewChatApi.getRuntime(sessionId);
      setMessages(updated.messages || []);
    } catch {
      router.push(backUrl);
    } finally {
      setIsEnding(false);
    }
  };

  const jobTitle = runtime?.jobTitle || initialJobTitle || 'Vị trí phỏng vấn';
  const isClosed = runtime?.sessionStatus === 'CLOSED';
  const totalTurns = runtime?.totalTurns || 0;
  const currentTurnIndex = runtime?.currentTurnIndex ?? 0;
  const currentTurnDisplay = Math.min(currentTurnIndex + 1, totalTurns || 1);
  const currentStage = runtime?.currentTurn?.stage;
  const currentCompetency = runtime?.currentTurn?.competency;

  const durationMinutes = runtime?.durationMinutes || 25;
  const startedAt = runtime?.startedAt;

  const stagesList = useMemo(
    () => [
      { key: 'WARM_UP', label: 'Khởi động', shortLabel: 'Khởi động' },
      { key: 'VALIDATE', label: 'Xác thực CV', shortLabel: 'Xác thực' },
      { key: 'DEEP_DIVE', label: 'Kỹ thuật', shortLabel: 'Kỹ thuật' },
      { key: 'CHALLENGE', label: 'Thử thách', shortLabel: 'Thử thách' },
      { key: 'COMPLETED', label: 'Tổng kết', shortLabel: 'Hoàn thành' },
    ],
    []
  );

  const activeStageKey = useMemo(() => {
    if (isClosed) return 'COMPLETED';
    if (currentTurnIndex === 0 || currentStage === 'WARM_UP') return 'WARM_UP';
    if (currentTurnIndex === 1 || currentStage === 'VALIDATE') return 'VALIDATE';
    if (currentStage === 'CHALLENGE') return 'CHALLENGE';
    return 'DEEP_DIVE';
  }, [isClosed, currentTurnIndex, currentStage]);

  const activeStageIndex = useMemo(() => {
    const idx = stagesList.findIndex((s) => s.key === activeStageKey);
    return idx >= 0 ? idx : 2;
  }, [stagesList, activeStageKey]);

  const stageHeaderBadge = useMemo(() => {
    if (isClosed) return 'Đã hoàn tất';
    if (currentTurnIndex === 0 || currentStage === 'WARM_UP') {
      return `Giai đoạn: Khởi động (Warm-up) • Câu 1/${totalTurns || 1}`;
    }
    if (currentTurnIndex === 1 || currentStage === 'VALIDATE') {
      return `Giai đoạn: Xác thực CV (Validate) • Câu 2/${totalTurns || 2}`;
    }
    const compLabel =
      currentCompetency && currentCompetency !== 'Chuyên môn'
        ? currentCompetency
        : 'Kỹ thuật chuyên sâu';
    return `Giai đoạn: ${compLabel} • Câu ${currentTurnDisplay}/${totalTurns}`;
  }, [isClosed, currentTurnIndex, currentStage, currentCompetency, currentTurnDisplay, totalTurns]);

  const isCodingQuestion = useMemo(() => {
    return (
      runtime?.currentTurn?.questionType === 'coding' ||
      Boolean(runtime?.currentTurn?.starterCode)
    );
  }, [runtime?.currentTurn?.questionType, runtime?.currentTurn?.starterCode]);

  const renderMessageItems = () => (
    <>
      {messages.map((msg, index) => {
        const isAsst = msg.role === 'assistant';
        const isMainQ = msg.messageType === 'MAIN_QUESTION';
        const isProbe = msg.messageType === 'PROBE' || msg.messageType === 'CLARIFY';
        const isWrapUp = msg.messageType === 'WRAP_UP';

        return (
          <div
            key={msg.messageId || index}
            className={`flex gap-3 sm:gap-4 ${
              isAsst ? 'items-start' : 'items-start flex-row-reverse'
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                isAsst
                  ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white'
                  : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-white'
              }`}
            >
              {isAsst ? <Bot className="size-4" /> : <User className="size-4" />}
            </div>

            {/* Message Bubble Container */}
            <div className={`flex flex-col max-w-[85%] sm:max-w-[78%] ${!isAsst && 'items-end'}`}>
              {/* Badges for assistant message types */}
              {isAsst && (
                <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                  {isMainQ && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
                      📌 Câu hỏi chính
                    </span>
                  )}
                  {isProbe && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                      🔍 Câu hỏi đào sâu
                    </span>
                  )}
                  {isWrapUp && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="size-3" /> Tổng kết phiên
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    {isAsst ? 'AI Interviewer' : 'Bạn'}
                  </span>
                </div>
              )}

              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  isAsst
                    ? 'bg-white text-slate-800 border border-slate-200/90 shadow-sm rounded-tl-sm'
                    : 'bg-[#204195] text-white shadow-sm rounded-tr-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing Indicator */}
      {isSending && (
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-sm">
            <Bot className="size-4" />
          </div>
          <div className="flex flex-col">
            <div className="text-[11px] text-slate-400 ml-1 mb-1">AI Interviewer</div>
            <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-4 py-3 border border-slate-200 shadow-sm text-xs text-slate-500">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-indigo-600 animate-bounce" />
              </div>
              <span>AI Interviewer đang suy nghĩ câu hỏi tiếp theo...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </>
  );

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-800">
        <div className="relative flex items-center justify-center">
          <div className="size-16 rounded-2xl bg-indigo-600/10 animate-pulse" />
          <Bot className="absolute size-8 text-indigo-600 animate-bounce" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">Đang khởi tạo phòng phỏng vấn...</h2>
          <p className="text-xs text-slate-500 mt-1">
            Đang đồng bộ hồ sơ và kết nối AI Interviewer
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-sm border border-slate-200 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
            <AlertCircle className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Không thể bắt đầu phỏng vấn</h3>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{error}</p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={loadChatSession}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
            >
              <RefreshCw className="size-4" /> Thử lại
            </button>
            <button
              onClick={() => router.push(backUrl)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 transition"
            >
              Quay về
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900">
      {/* 1. Header */}
      <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(backUrl)}
            className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            title="Quay lại"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 sm:text-base line-clamp-1">
                {jobTitle}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/50">
                <Sparkles className="size-3" /> Interview Chat
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Clock className="size-3 text-slate-400" />
                {stageHeaderBadge}
              </span>
              <span>•</span>
              <span
                className={`font-medium ${
                  isClosed ? 'text-slate-500' : 'text-emerald-600'
                }`}
              >
                {isClosed
                  ? runtime?.endReason === 'USER_ENDED'
                    ? 'Dừng theo yêu cầu'
                    : runtime?.endReason === 'TECHNICAL_FAILURE'
                    ? 'Lỗi hệ thống'
                    : 'Đã hoàn tất'
                  : 'Đang diễn ra'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <InterviewCountdownTimer
            startedAt={startedAt}
            durationMinutes={durationMinutes}
            isClosed={isClosed}
          />
          {!isClosed ? (
            <button
              onClick={() => setShowEndModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Kết thúc</span>
            </button>
          ) : (
            <button
              onClick={() => router.push(backUrl)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              Rời phòng
            </button>
          )}
        </div>
      </header>

      {/* 2. Stage Stepper Bar (Thanh tiến độ theo giai đoạn) */}
      <div className="border-b border-slate-200/80 bg-white/80 px-4 py-2 sm:px-6 backdrop-blur-xs">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-1 sm:gap-2">
          {stagesList.map((st, idx) => {
            const isPassed = isClosed || idx < activeStageIndex;
            const isCurrent = !isClosed && idx === activeStageIndex;

            return (
              <React.Fragment key={st.key}>
                {idx > 0 && (
                  <div
                    className={`h-0.5 flex-1 min-w-2 sm:min-w-6 rounded-full transition-all ${
                      idx <= activeStageIndex ? 'bg-indigo-500' : 'bg-slate-200'
                    }`}
                  />
                )}
                <div
                  className={`flex items-center gap-1 rounded-full px-2 sm:px-3 py-1 text-xs transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white font-bold shadow-xs ring-2 ring-indigo-200'
                      : isPassed
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                      : 'bg-slate-50 text-slate-400 font-medium border border-slate-200/60'
                  }`}
                  title={st.label}
                >
                  {isPassed ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <span className="flex size-2 rounded-full bg-white shrink-0 animate-ping" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-slate-300 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{st.label}</span>
                  <span className="sm:hidden">{st.shortLabel}</span>
                  {isCurrent && (
                    <span className="ml-1 rounded-full bg-white/25 px-1.5 py-0.2 text-[10px]">
                      {currentTurnDisplay}/{totalTurns}
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. Main Content: Dual-Pane Coding Sandbox or Standard 1-Column Chat */}
      {isCodingQuestion && !isClosed ? (
        <main className="flex-1 min-h-0 px-3 py-3 sm:px-6">
          <div className="grid h-full grid-cols-12 gap-4">
            {/* Left Column (col-span-12 lg:col-span-5): Conversation Pane */}
            <div className="col-span-12 lg:col-span-5 flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Bot className="size-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Hội thoại với AI Interviewer</span>
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200/60">
                  Dual-Pane Split
                </span>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {renderMessageItems()}
              </div>

              {/* Quick Chat Input */}
              <div className="border-t border-slate-200 bg-slate-50/90 p-3">
                <div className="relative flex items-end gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-2xs focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập câu trả lời hoặc trao đổi thêm với AI..."
                    rows={1}
                    disabled={isSending}
                    className="max-h-24 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-1 text-xs sm:text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isSending}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#204195] text-white hover:bg-[#183273] disabled:opacity-40 transition"
                    title="Gửi câu trả lời"
                  >
                    {isSending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-slate-400">
                  <span>Nhấn Enter để gửi chat</span>
                  <span className="text-indigo-600 font-medium">Sửa lỗi code & bấm Nộp bài trên Sandbox 👉</span>
                </div>
              </div>
            </div>

            {/* Right Column (col-span-12 lg:col-span-7): Interactive Code Sandbox */}
            <div className="col-span-12 lg:col-span-7 flex h-full min-h-[500px] flex-col">
              <InteractiveCodeSandbox
                starterCode={runtime?.currentTurn?.starterCode || ''}
                language={runtime?.currentTurn?.language || 'python'}
                testCode={runtime?.currentTurn?.testCasesCode || ''}
                onSubmit={handleCodeSubmit}
                isSubmitting={isSending}
              />
            </div>
          </div>
        </main>
      ) : (
        /* Standard 1-Column Layout */
        <>
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {renderMessageItems()}
            </div>
          </main>

          <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 sm:p-4 backdrop-blur-md">
            <div className="mx-auto max-w-3xl">
              {isClosed ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-slate-100 p-4 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        Phiên phỏng vấn đã kết thúc
                      </h4>
                      <p className="text-xs text-slate-500">
                        Bạn có thể cuộn lên để xem lại toàn bộ transcript cuộc trò chuyện.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => router.push(`/interview/results/${sessionId}`)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#204195] px-4 py-2 text-xs font-semibold text-white hover:bg-[#183273] transition shadow-xs"
                    >
                      <Sparkles className="size-3.5" /> Xem báo cáo đánh giá AI
                    </button>
                    <button
                      onClick={() => router.push(backUrl)}
                      className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Về bảng điều khiển
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="relative flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập câu trả lời của bạn... (Nhấn Enter để gửi, Shift+Enter để xuống dòng)"
                      rows={1}
                      disabled={isSending}
                      className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isSending}
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#204195] text-white hover:bg-[#183273] disabled:opacity-40 disabled:hover:bg-[#204195] transition"
                      title="Gửi câu trả lời"
                    >
                      {isSending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                    <span>Nhấn Enter để gửi câu trả lời</span>
                    <span>Tối đa 10,000 ký tự</span>
                  </div>
                </div>
              )}
            </div>
          </footer>
        </>
      )}

      {/* End Session Confirmation Modal (Dual-Trigger) */}
      <AbortConfirmationModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={handleEndSession}
        isSubmitting={isEnding}
      />
    </div>
  );
}
