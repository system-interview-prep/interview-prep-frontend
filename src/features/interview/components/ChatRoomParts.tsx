'use client';

/**
 * Presentational pieces of the chat interview room. State and API calls stay
 * in InterviewChatRoom; these only render what they are given, on the
 * warm palette (#204195 primary, #14244B ink, #DCE4F3 lines). The fox is
 * the interviewer's face in the room; it never speaks here (DESIGN.md).
 */

import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  LogOut,
  Send,
  SkipForward,
  User,
  X,
} from 'lucide-react';
import InterviewerAvatar from './InterviewerAvatar';
import { CurrentQuestionCard, QuestionTimer } from './CurrentQuestionCard';
import type { CurrentQuestion } from '../hooks/useRuntimeProgress';
import type { ChatMessage } from '../services/interviewChat.service';
import {
  getEndReasonLabel,
  getStageGuide,
  getStageLabel,
  InterviewCountdownTimer,
} from './ChatInterviewProgress';
import type { EndReason } from '../services/interviewChat.service';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt, localeOf } from '@/i18n/format';

export const MAX_ANSWER_CHARS = 10_000;

/** Competency the engine uses when a turn has no specific one; not worth showing. */
export const DEFAULT_COMPETENCY = 'Chuyên môn';

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

function formatTime(iso: string, locale: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
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
  questionNumber,
  totalQuestions,
  stageLabel,
}: {
  /** Current interview stage ("Mở đầu", "Chuyên môn"…), shown next to the status. */
  stageLabel?: string | null;
  questionNumber?: number | null;
  totalQuestions?: number;
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
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#DCE4F3] bg-white px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F7F9FD] text-[#607096] transition hover:bg-[#EEF2FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]"
          aria-label={t('room.common.back')}
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-[#14244B] sm:text-base">{jobTitle}</h1>
          <p className="flex items-center gap-1.5 text-xs text-[#607096]">
            <span
              className={`size-2 shrink-0 rounded-full ${isClosed ? 'bg-[#A0AEC0]' : 'bg-[#287A4B]'}`}
              aria-hidden="true"
            />
            <span className="truncate">
              {isClosed ? getEndReasonLabel(endReason, t) : t('room.chat.live')}
              {stageLabel ? <span className="font-semibold text-[#204195]"> · {stageLabel}</span> : null}
              {' · '}
              {durationMinutes ? fmt(t('room.chat.modeDuration'), { n: durationMinutes }) : t('room.chat.mode')}
            </span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!isClosed && questionNumber != null && totalQuestions ? (
          <span className="inline-flex rounded-full border border-[#DCE4F3] bg-[#F7F9FD] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#14244B]">
            {fmt(t('room.common.questionCounter'), { n: Math.min(questionNumber, totalQuestions), total: totalQuestions })}
          </span>
        ) : null}
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
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#204195] px-4 text-xs font-semibold text-white transition hover:bg-[#183275]"
          >
            {t('room.common.leaveRoom')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onEnd}
            disabled={isEnding}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#FDF2F2] px-3.5 text-xs font-semibold text-[#C43B3B] transition hover:bg-[#FBE6E6] disabled:opacity-60"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t('room.common.end')}</span>
            <span className="sr-only sm:hidden">{t('room.common.endInterview')}</span>
          </button>
        )}
      </div>
    </header>
  );
}

// ── Side panel: where am I, what is asked, how to answer ─────────────────────

export function InterviewGuidePanel({
  currentStage,
  sessionStatus,
  answeredCount,
  question,
}: {
  currentStage?: string | null;
  sessionStatus: 'OPEN' | 'CLOSED';
  answeredCount: number;
  question: CurrentQuestion | null;
}) {
  const { t } = useLanguage();
  const guide = sessionStatus === 'OPEN' ? getStageGuide(currentStage, t) : null;
  const stageLabel = getStageLabel(currentStage, t);

  // The stage list moved to the stepper above, shared with the voice and video
  // rooms; this panel keeps what matters now: the question and its time box.
  return (
    <aside className="hidden w-[22rem] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[#DCE4F3] bg-[#F7F9FD] p-5 lg:flex" aria-label={t('room.chat.guideAria')}>
      {sessionStatus === 'OPEN' ? (
        <CurrentQuestionCard
          size="compact"
          stageLabel={stageLabel}
          competency={question?.competency && question.competency !== DEFAULT_COMPETENCY ? question.competency : null}
          text={question?.text ?? null}
          followUpText={question?.followUpText}
          timer={
            question ? (
              <QuestionTimer
                startedAt={question.startedAt}
                softSeconds={question.softAnswerSeconds}
                hardSeconds={question.hardAnswerSeconds}
              />
            ) : null
          }
        />
      ) : null}

      {guide ? (
        <section className="rounded-3xl border-l-4 border-[#FCB625] bg-white p-4 text-xs leading-relaxed text-[#607096] ring-1 ring-[#DCE4F3]">
          <p className="text-[12px] font-semibold text-[#204195]">{t('room.chat.now')}</p>
          <p className="mt-1 text-sm text-[#14244B]">{guide.description}</p>
          <p className="mt-2">{guide.tip}</p>
        </section>
      ) : null}

      <section className="mt-auto rounded-3xl bg-[#EEF2FD] p-4 text-xs text-[#607096]">
        <p className="font-semibold text-[#14244B]">
          {fmt(t('room.chat.answered'), { n: answeredCount })}
        </p>
        <p className="mt-1.5 leading-relaxed">
          {sessionStatus === 'CLOSED'
            ? t('room.chat.closedNote')
            : t('room.chat.openNote')}
        </p>
      </section>
    </aside>
  );
}

// ── Messages ─────────────────────────────────────────────────────────────────

const TYPE_BADGE: Partial<Record<ChatMessage['messageType'], { labelKey: string; className: string }>> = {
  MAIN_QUESTION: { labelKey: 'room.chat.badge.mainQuestion', className: 'border-transparent bg-[#EEF2FD] text-[#204195]' },
  PROBE: { labelKey: 'room.chat.badge.probe', className: 'border-transparent bg-[#F0F4FC] text-[#204195]' },
  CLARIFY: { labelKey: 'room.chat.badge.clarify', className: 'border-transparent bg-[#F0F4FC] text-[#204195]' },
  WRAP_UP: { labelKey: 'room.chat.badge.wrapUp', className: 'border-transparent bg-[#EAF5EE] text-[#287A4B]' },
  CONFIRM_ABORT: { labelKey: 'room.chat.badge.confirmAbort', className: 'border-transparent bg-[#FDF2F2] text-[#C43B3B]' },
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
  const { t, lang } = useLanguage();
  const isAssistant = message.role === 'assistant';
  const isConfirmAbort = message.messageType === 'CONFIRM_ABORT';
  const badge = isAssistant ? TYPE_BADGE[message.messageType] : undefined;
  const time = formatTime(message.createdAt, localeOf(lang));

  return (
    <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`} data-role={message.role}>
      {isAssistant ? (
        <InterviewerAvatar size={36} />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EEF2FD] text-[#204195]" aria-hidden="true">
          <User className="size-4" />
        </div>
      )}

      <div className={`flex min-w-0 max-w-[85%] flex-col sm:max-w-[75%] ${isAssistant ? '' : 'items-end'}`}>
        <div className={`mb-1 flex flex-wrap items-center gap-1.5 text-[11px] ${isAssistant ? '' : 'flex-row-reverse'}`}>
          <span className="font-semibold text-[#14244B]">{isAssistant ? t('room.common.interviewer') : t('room.common.you')}</span>
          {badge ? (
            <span className={`rounded-full border px-2 py-0.5 font-semibold ${badge.className}`}>{t(badge.labelKey)}</span>
          ) : null}
          {isAssistant && stageLabel ? <span className="text-[#607096]">· {stageLabel}</span> : null}
          {time ? <span className="text-[#A0AEC0]">{time}</span> : null}
        </div>

        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAssistant
              ? `rounded-tl-md border bg-white text-[#14244B] ${
                  isConfirmAbort ? 'border-[#F5C2C2] ring-2 ring-[#FDF2F2]' : 'border-[#DCE4F3]'
                }`
              : 'rounded-tr-md bg-[#204195] text-white'
          }`}
        >
          {message.content}

          {isConfirmAbort ? (
            <div className="mt-3 border-t border-[#FDF2F2] pt-3">
              {isClosed ? (
                <p className="flex items-center gap-1.5 text-xs text-[#607096]">
                  <CheckCircle2 className="size-3.5 text-[#287A4B]" aria-hidden="true" />
                  {t('room.chat.sessionEnded')}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onConfirmAbort}
                    disabled={isEnding}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#C43B3B] px-4 text-xs font-semibold text-white transition hover:bg-[#A93232] disabled:opacity-60"
                  >
                    {isEnding ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />}
                    {t('room.chat.stopAndReport')}
                  </button>
                  <button
                    type="button"
                    onClick={onContinue}
                    disabled={isEnding || isSending}
                    className="inline-flex h-9 items-center rounded-full bg-[#F7F9FD] px-4 text-xs font-semibold text-[#14244B] transition hover:bg-[#EEF2FD] disabled:opacity-60"
                  >
                    {t('room.common.continueInterview')}
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
  const { t } = useLanguage();
  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <InterviewerAvatar size={36} />
      <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-md border border-[#DCE4F3] bg-white px-4 py-3 text-xs text-[#607096]">
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-1.5 animate-bounce rounded-full bg-[#204195] [animation-delay:-0.3s] motion-reduce:animate-none" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#204195] [animation-delay:-0.15s] motion-reduce:animate-none" />
          <span className="size-1.5 animate-bounce rounded-full bg-[#204195] motion-reduce:animate-none" />
        </span>
        {t('room.chat.typing')}
      </div>
    </div>
  );
}

/** Mobile/tablet only: the side panel is hidden below lg, so show the tip inline. */
export function StageTipBar({ currentStage }: { currentStage?: string | null }) {
  const { t } = useLanguage();
  const guide = getStageGuide(currentStage, t);
  const label = getStageLabel(currentStage, t);
  if (!guide || !label) return null;
  return (
    <div className="flex items-start gap-2.5 border-b border-[#DCE4F3] bg-[#F7F9FD] px-4 py-2.5 text-xs text-[#607096] lg:hidden">
      <p>
        <span className="font-semibold text-[#204195]">{label}: </span>
        {guide.tip}
      </p>
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="mx-auto flex max-w-3xl items-start gap-2 rounded-2xl bg-[#FDF2F2] px-4 py-2.5 text-sm text-[#C43B3B]">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      <button type="button" onClick={onDismiss} className="rounded-full p-0.5 hover:bg-[#FBE6E6]" aria-label={t('room.common.dismiss')}>
        <X className="size-4" />
      </button>
    </div>
  );
}

// ── Composer ─────────────────────────────────────────────────────────────────

/**
 * Quick replies for the chat room, each one checked against the engine's
 * intent rules (interview_engine.classify_candidate_intent /
 * classify_candidate_question):
 * - "chưa rõ ý câu hỏi…" is a CLARIFY_REQUEST: explained once per question,
 *   never graded; hidden once that question's clarification is used.
 * - In the Q&A stage, a question about the role is answered (2 at most), and
 *   "không có câu hỏi thêm" closes the interview.
 * Left out on purpose: "nhắc lại câu hỏi" (the question is on screen in
 * chat), "đổi câu hỏi" (a skip scores 0: behind a confirmed button instead),
 * "cho mình suy nghĩ / xin ví dụ" (read as an answer and graded) and
 * "không biết" (a give-up, scores 0).
 */
export function quickRepliesFor(
  stage: string | null | undefined,
  t: (key: string) => string,
  clarifyUsed = false,
): string[] {
  if (stage === 'CLOSING') return [t('room.chat.quick.roleQuestion'), t('room.chat.quick.closing')];
  if (!stage || stage === 'WARM_UP') return [];
  return clarifyUsed ? [] : [t('room.chat.quick.clarify')];
}

/** Skipping is a real decision (the question scores 0), so it is not a one-tap quick reply. */
export function canSkipQuestion(stage: string | null | undefined): boolean {
  return Boolean(stage) && stage !== 'WARM_UP' && stage !== 'CLOSING';
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
  clarifyUsed = false,
  onSkip,
}: {
  value: string;
  currentStage?: string | null;
  /** The current question already had its one clarification. */
  clarifyUsed?: boolean;
  /** Ask to skip the current question (the caller confirms first). */
  onSkip?: () => void;
  isSending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  compact?: boolean;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onQuickReply: (text: string) => void;
}) {
  const { t, lang } = useLanguage();
  const placeholder =
    currentStage === 'CLOSING'
      ? t('room.chat.placeholder.closing')
      : currentStage === 'BEHAVIORAL'
        ? t('room.chat.placeholder.behavioral')
        : t('room.chat.placeholder.default');
  return (
    <div className="flex flex-col gap-2">
      {!compact && (quickRepliesFor(currentStage, t, clarifyUsed).length || (onSkip && canSkipQuestion(currentStage))) ? (
        <div className="flex flex-wrap items-center gap-2">
          {quickRepliesFor(currentStage, t, clarifyUsed).map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => onQuickReply(text)}
              disabled={isSending}
              className="inline-flex items-center rounded-full bg-[#F7F9FD] px-3.5 py-1.5 text-xs font-medium text-[#607096] ring-1 ring-[#DCE4F3] transition hover:bg-[#EEF2FD] hover:text-[#14244B] disabled:opacity-50"
            >
              {text}
            </button>
          ))}
          {onSkip && canSkipQuestion(currentStage) ? (
            <button
              type="button"
              onClick={onSkip}
              disabled={isSending}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-[#8A98B8] transition hover:bg-[#F7F9FD] hover:text-[#C43B3B] disabled:opacity-50"
            >
              <SkipForward className="size-3.5" aria-hidden="true" />
              {t('room.chat.skip.button')}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-end gap-2 rounded-3xl border border-[#DCE4F3] bg-white p-2 transition focus-within:border-[#204195] focus-within:ring-2 focus-within:ring-[#204195]/15">
        <label htmlFor="chat-answer" className="sr-only">
          {t('room.chat.answerLabel')}
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
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#204195] text-white transition hover:bg-[#183275] disabled:opacity-40"
          aria-label={t('room.chat.sendAria')}
        >
          {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </button>
      </div>
      <div className="flex items-center justify-between px-1 text-[11px] text-[#A0AEC0]">
        <span>
          <kbd className="font-sans font-semibold text-[#607096]">Enter</kbd> {t('room.common.toSend')} ·{' '}
          <kbd className="font-sans font-semibold text-[#607096]">Shift + Enter</kbd> {t('room.chat.newLine')}
        </span>
        <span className="tabular-nums">
          {value.length.toLocaleString(localeOf(lang))}/{MAX_ANSWER_CHARS.toLocaleString(localeOf(lang))}
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
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-[#F0F4FC]/70 p-5 text-center sm:flex-row sm:text-left">
      <div className="flex-1">
        <h2 className="font-display text-lg font-semibold text-[#14244B]">{getEndReasonLabel(endReason, t)}</h2>
        <p className="mt-0.5 text-sm text-[#607096]">
          {fmt(t('room.chat.closedSummary'), { n: answeredCount })}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={onReport}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
        >
          {t('room.common.viewReport')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#14244B] transition hover:bg-[#F7F9FD]"
        >
          {t('room.common.back')}
        </button>
      </div>
    </div>
  );
}
