'use client';

/**
 * Presentational pieces of the chat interview room. State and API calls stay
 * in InterviewChatRoom; these only render what they are given, on the
 * workspace palette (#204195 primary, #14244B ink, #DCE4F3 borders).
 */

import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  CircleHelp,
  FileText,
  Lightbulb,
  Loader2,
  LogOut,
  MessageSquareText,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import type { ChatMessage, ChatRuntimeTurn } from '../services/interviewChat.service';
import {
  deriveChatStageProgress,
  getEndReasonLabel,
  getStageGuide,
  getStageLabel,
  InterviewCountdownTimer,
} from './ChatInterviewProgress';
import type { EndReason } from '../services/interviewChat.service';

export const MAX_ANSWER_CHARS = 10_000;

/** Backend chat errors read "CODE: message"; show the message part only. */
export function chatErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { detail?: unknown; message?: unknown } } })?.response?.data;
  const raw =
    typeof data?.detail === 'string'
      ? data.detail
      : typeof data?.message === 'string'
        ? data.message
        : err instanceof Error
          ? err.message
          : '';
  const text = raw.replace(/^[A-Z_]{3,}:\s*/, '').trim();
  return text || fallback;
}

function formatTime(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// ── Header ───────────────────────────────────────────────────────────────────

export function ChatRoomHeader({
  jobTitle,
  durationMinutes,
  isClosed,
  endReason,
  serverRemainingSeconds,
  startedAt,
  isEnding,
  onBack,
  onEnd,
  onLeave,
}: {
  jobTitle: string;
  durationMinutes?: number;
  isClosed: boolean;
  endReason?: EndReason | null;
  serverRemainingSeconds?: number;
  startedAt?: string | null;
  isEnding: boolean;
  onBack: () => void;
  onEnd: () => void;
  onLeave: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#DCE4F3] bg-white/95 px-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#DCE4F3] text-[#607096] transition hover:bg-[#F7F9FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]"
          aria-label="Quay lại"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-[#14244B] sm:text-base">{jobTitle}</h1>
          <p className="flex items-center gap-1.5 text-xs text-[#607096]">
            <span
              className={`size-2 shrink-0 rounded-full ${isClosed ? 'bg-[#A0AEC0]' : 'bg-emerald-500'}`}
              aria-hidden="true"
            />
            <span className="truncate">
              {isClosed ? getEndReasonLabel(endReason) : 'Đang phỏng vấn'}
              {durationMinutes ? ` · Phỏng vấn chat ${durationMinutes} phút` : ' · Phỏng vấn chat'}
            </span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <InterviewCountdownTimer
          serverRemainingSeconds={serverRemainingSeconds}
          startedAt={startedAt}
          durationMinutes={durationMinutes}
          isClosed={isClosed}
        />
        {isClosed ? (
          <button
            type="button"
            onClick={onLeave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#204195] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#183273]"
          >
            Rời phòng
          </button>
        ) : (
          <button
            type="button"
            onClick={onEnd}
            disabled={isEnding}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Kết thúc</span>
            <span className="sr-only sm:hidden">Kết thúc phỏng vấn</span>
          </button>
        )}
      </div>
    </header>
  );
}

// ── Side panel: where am I, what is asked, how to answer ─────────────────────

export function InterviewGuidePanel({
  currentStage,
  competency,
  sessionStatus,
  turns,
  answeredCount,
}: {
  currentStage?: string | null;
  competency?: string | null;
  sessionStatus: 'OPEN' | 'CLOSED';
  turns?: ChatRuntimeTurn[];
  answeredCount: number;
}) {
  const progress = deriveChatStageProgress({ currentStage, sessionStatus, turns });
  const guide = sessionStatus === 'OPEN' ? getStageGuide(currentStage) : null;
  const stageLabel = getStageLabel(currentStage);
  const visibleStages = progress.stages.filter((stage) => stage.key !== 'CLOSED');

  return (
    <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#DCE4F3] bg-white p-5 lg:flex" aria-label="Hướng dẫn phỏng vấn">
      {guide && stageLabel ? (
        <section className="rounded-2xl border border-[#204195]/15 bg-[#EEF2FD] p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#204195]">Bây giờ</p>
          <h2 className="mt-1 text-base font-bold text-[#14244B]">
            {stageLabel}
            {competency && competency !== 'Chuyên môn' ? (
              <span className="font-semibold text-[#204195]"> · {competency}</span>
            ) : null}
          </h2>
          <p className="mt-1 text-sm text-[#425176]">{guide.description}</p>
          <div className="mt-3 flex gap-2 rounded-xl bg-white p-3 text-xs leading-relaxed text-[#425176]">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
            <span>{guide.tip}</span>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#607096]">Các giai đoạn</h2>
        <ol className="space-y-1" role="list">
          {visibleStages.map((stage) => {
            const isCurrent = stage.state === 'current';
            const isDone = stage.state === 'completed';
            const isSkipped = stage.state === 'skipped';
            // optional = not planned yet but may still happen (CLOSING is inserted later).
            const isOptional = stage.state === 'optional';
            return (
              <li
                key={stage.key}
                data-stage={stage.key}
                data-state={stage.state}
                aria-current={isCurrent ? 'step' : undefined}
                className={`flex items-start gap-3 rounded-xl px-3 py-2 ${isCurrent ? 'bg-[#EEF2FD]' : ''}`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                        ? 'bg-[#204195] text-white ring-4 ring-[#204195]/15'
                        : 'border border-[#DCE4F3] bg-white text-[#A0AEC0]'
                  }`}
                  aria-hidden="true"
                >
                  {isDone ? <CheckCircle2 className="size-3.5" /> : null}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      isCurrent ? 'text-[#204195]' : isSkipped || isOptional ? 'text-[#A0AEC0]' : 'text-[#14244B]'
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className={`block text-xs ${isSkipped || isOptional ? 'text-[#A0AEC0]' : 'text-[#607096]'}`}>
                    {isSkipped
                      ? sessionStatus === 'CLOSED'
                        ? 'Chưa diễn ra'
                        : 'Không có trong phiên này'
                      : isOptional
                        ? 'Tùy diễn biến phiên'
                        : getStageGuide(stage.key)?.description}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-auto rounded-2xl border border-[#DCE4F3] bg-[#F7F9FD] p-4 text-xs text-[#607096]">
        <p className="flex items-center gap-2 font-semibold text-[#14244B]">
          <MessageSquareText className="size-4 text-[#204195]" aria-hidden="true" />
          Đã trả lời {answeredCount} lượt
        </p>
        <p className="mt-1.5 leading-relaxed">
          {sessionStatus === 'CLOSED'
            ? 'Phiên đã kết thúc. Báo cáo đánh giá dựa trên các câu trả lời trong cuộc trò chuyện.'
            : 'AI có thể hỏi thêm để đào sâu câu trả lời. Bấm “Kết thúc” bất cứ lúc nào để dừng và nhận báo cáo.'}
        </p>
      </section>
    </aside>
  );
}

// ── Messages ─────────────────────────────────────────────────────────────────

const TYPE_BADGE: Partial<Record<ChatMessage['messageType'], { label: string; className: string }>> = {
  MAIN_QUESTION: { label: 'Câu hỏi', className: 'border-[#204195]/20 bg-[#EEF2FD] text-[#204195]' },
  PROBE: { label: 'Hỏi đào sâu', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  CLARIFY: { label: 'Làm rõ', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  WRAP_UP: { label: 'Tổng kết', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  CONFIRM_ABORT: { label: 'Xác nhận dừng', className: 'border-rose-200 bg-rose-50 text-rose-700' },
};

export function MessageBubble({
  message,
  stageLabel,
  isClosed,
  isEnding,
  isSending,
  onConfirmAbort,
  onContinue,
}: {
  message: ChatMessage;
  stageLabel?: string | null;
  isClosed: boolean;
  isEnding: boolean;
  isSending: boolean;
  onConfirmAbort: () => void;
  onContinue: () => void;
}) {
  const isAssistant = message.role === 'assistant';
  const isConfirmAbort = message.messageType === 'CONFIRM_ABORT';
  const badge = isAssistant ? TYPE_BADGE[message.messageType] : undefined;
  const time = formatTime(message.createdAt);

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`} data-role={message.role}>
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          isAssistant ? 'bg-[#204195] text-white' : 'bg-[#EEF2FD] text-[#204195]'
        }`}
        aria-hidden="true"
      >
        {isAssistant ? <Bot className="size-4" /> : <User className="size-4" />}
      </div>

      <div className={`flex min-w-0 max-w-[85%] flex-col sm:max-w-[75%] ${isAssistant ? '' : 'items-end'}`}>
        <div className={`mb-1 flex flex-wrap items-center gap-1.5 text-[11px] ${isAssistant ? '' : 'flex-row-reverse'}`}>
          <span className="font-semibold text-[#14244B]">{isAssistant ? 'AI Interviewer' : 'Bạn'}</span>
          {badge ? (
            <span className={`rounded-md border px-1.5 py-0.5 font-semibold ${badge.className}`}>{badge.label}</span>
          ) : null}
          {isAssistant && stageLabel ? <span className="text-[#607096]">· {stageLabel}</span> : null}
          {time ? <span className="text-[#A0AEC0]">{time}</span> : null}
        </div>

        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAssistant
              ? `rounded-tl-sm border bg-white text-[#14244B] shadow-xs ${
                  isConfirmAbort ? 'border-rose-200 ring-2 ring-rose-100' : 'border-[#DCE4F3]'
                }`
              : 'rounded-tr-sm bg-[#204195] text-white shadow-xs'
          }`}
        >
          {message.content}

          {isConfirmAbort ? (
            <div className="mt-3 border-t border-rose-100 pt-3">
              {isClosed ? (
                <p className="flex items-center gap-1.5 text-xs text-[#607096]">
                  <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
                  Phiên phỏng vấn đã kết thúc.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onConfirmAbort}
                    disabled={isEnding}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                  >
                    {isEnding ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                    Dừng và nhận báo cáo
                  </button>
                  <button
                    type="button"
                    onClick={onContinue}
                    disabled={isEnding || isSending}
                    className="inline-flex items-center rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] transition hover:bg-[#F7F9FD] disabled:opacity-60"
                  >
                    Tiếp tục phỏng vấn
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#204195] text-white" aria-hidden="true">
        <Bot className="size-4" />
      </div>
      <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[#DCE4F3] bg-white px-4 py-3 text-xs text-[#607096] shadow-xs">
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-1.5 animate-bounce rounded-full bg-[#204195] [animation-delay:-0.3s] motion-reduce:animate-none" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#204195] [animation-delay:-0.15s] motion-reduce:animate-none" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#204195] motion-reduce:animate-none" />
        </span>
        AI Interviewer đang đọc câu trả lời của bạn…
      </div>
    </div>
  );
}

/** Mobile/tablet only: the side panel is hidden below lg, so show the tip inline. */
export function StageTipBar({ currentStage }: { currentStage?: string | null }) {
  const guide = getStageGuide(currentStage);
  const label = getStageLabel(currentStage);
  if (!guide || !label) return null;
  return (
    <div className="flex gap-2 border-b border-[#DCE4F3] bg-[#EEF2FD] px-4 py-2.5 text-xs text-[#425176] lg:hidden">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
      <p>
        <span className="font-semibold text-[#204195]">{label}: </span>
        {guide.tip}
      </p>
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-3xl items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      <button type="button" onClick={onDismiss} className="rounded-md p-0.5 hover:bg-rose-100" aria-label="Đóng thông báo">
        <X className="size-4" />
      </button>
    </div>
  );
}

// ── Composer ─────────────────────────────────────────────────────────────────

/** Quick replies whose exact text the engine routes as intended (verified
 *  against interview_engine patterns: CLARIFY, and the CLOSING farewell). */
function quickRepliesFor(stage?: string | null): string[] {
  if (stage === 'CLOSING') return ['Tôi không có câu hỏi nào thêm, cảm ơn anh/chị.'];
  return ['Bạn có thể nhắc lại câu hỏi không?'];
}

export function ChatComposer({
  value,
  currentStage,
  isSending,
  textareaRef,
  compact = false,
  onChange,
  onKeyDown,
  onSend,
  onQuickReply,
}: {
  value: string;
  currentStage?: string | null;
  isSending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  compact?: boolean;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onQuickReply: (text: string) => void;
}) {
  const placeholder =
    currentStage === 'CLOSING'
      ? 'Đặt câu hỏi cho nhà tuyển dụng…'
      : currentStage === 'BEHAVIORAL'
        ? 'Kể lại tình huống: Bối cảnh → Nhiệm vụ → Hành động → Kết quả…'
        : 'Nhập câu trả lời của bạn…';
  return (
    <div className="flex flex-col gap-2">
      {!compact ? (
        <div className="flex flex-wrap gap-2">
          {quickRepliesFor(currentStage).map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onQuickReply(text)}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs font-medium text-[#425176] transition hover:border-[#204195]/40 hover:text-[#204195] disabled:opacity-50"
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
              {text}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-2 rounded-2xl border border-[#DCE4F3] bg-white p-2 shadow-xs transition focus-within:border-[#204195] focus-within:ring-2 focus-within:ring-[#204195]/15">
        <label htmlFor="chat-answer" className="sr-only">
          Câu trả lời
        </label>
        <textarea
          id="chat-answer"
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          maxLength={MAX_ANSWER_CHARS}
          disabled={isSending}
          className={`min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-[#14244B] outline-none placeholder:text-[#A0AEC0] disabled:opacity-60 ${
            compact ? 'max-h-24' : 'max-h-40'
          }`}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || isSending}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#204195] text-white transition hover:bg-[#183273] disabled:opacity-40"
          aria-label="Gửi câu trả lời"
        >
          {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
      <div className="flex items-center justify-between px-1 text-[11px] text-[#A0AEC0]">
        <span>
          <kbd className="font-sans font-semibold text-[#607096]">Enter</kbd> để gửi ·{' '}
          <kbd className="font-sans font-semibold text-[#607096]">Shift + Enter</kbd> xuống dòng
        </span>
        <span className="tabular-nums">
          {value.length.toLocaleString('vi-VN')}/{MAX_ANSWER_CHARS.toLocaleString('vi-VN')}
        </span>
      </div>
    </div>
  );
}

// ── Finished ─────────────────────────────────────────────────────────────────

export function ChatClosedFooter({
  endReason,
  answeredCount,
  onReport,
  onBack,
}: {
  endReason?: EndReason | null;
  answeredCount: number;
  onReport: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#DCE4F3] bg-white p-5 text-center shadow-xs sm:flex-row sm:text-left">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </div>
      <div className="flex-1">
        <h2 className="text-base font-bold text-[#14244B]">{getEndReasonLabel(endReason)}</h2>
        <p className="mt-0.5 text-sm text-[#607096]">
          Bạn đã trả lời {answeredCount} lượt. Báo cáo đánh giá được tạo từ toàn bộ cuộc trò chuyện bên trên.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={onReport}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#204195] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#183273]"
        >
          <Sparkles className="size-4" aria-hidden="true" /> Xem báo cáo đánh giá
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-white px-4 py-2.5 text-sm font-semibold text-[#14244B] transition hover:bg-[#F7F9FD]"
        >
          <FileText className="size-4" aria-hidden="true" /> Quay lại
        </button>
      </div>
    </div>
  );
}
