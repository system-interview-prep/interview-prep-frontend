'use client';

/**
 * Presentational pieces of the voice/video interview room. LiveKit state stays
 * in LiveKitInterviewRoom (useLiveKitRoom); these only render what they are
 * given, on the same workspace palette as the chat room (ChatRoomParts).
 */

import { InterviewCountdownTimer } from './ChatInterviewProgress';
import type { RuntimeProgress } from '../hooks/useRuntimeProgress';
import React, { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, ArrowLeft, Loader2, Mic, RotateCcw } from 'lucide-react';
import type { LiveKitRoomStatus, LiveKitTranscriptLine, LiveKitTurnState } from '../hooks/useLiveKitRoom';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt } from '@/i18n/format';
import { roomVi } from '@/i18n/dicts/room.dict';

const viT = (k: string) => roomVi[k] ?? k;

type StatusTone = 'ai' | 'user' | 'wait' | 'error' | 'idle';

const TONE_DOT: Record<StatusTone, string> = {
  ai: 'bg-[#204195]',
  user: 'bg-[#287A4B]',
  wait: 'bg-amber-400',
  error: 'bg-[#C43B3B]',
  idle: 'bg-[#A0AEC0]',
};

export function voiceStatus(
  status: LiveKitRoomStatus,
  agentConnected: boolean,
  t?: (key: string) => string,
  turnState: LiveKitTurnState | null = null,
): { label: string; tone: StatusTone } {
  const tr = t ?? viT;
  // Between speakers the agent's answer window says what happens next: the
  // answer is being scored, or the agent is still collecting it.
  if (status === 'connected' || status === 'waiting-agent') {
    if (turnState === 'processing') return { label: tr('room.voice.status.processing'), tone: 'wait' };
    if (turnState === 'answering') return { label: tr('room.voice.status.answering'), tone: 'user' };
  }
  switch (status) {
    case 'connecting':
      return { label: tr('room.voice.status.connecting'), tone: 'wait' };
    case 'agent-speaking':
      return { label: tr('room.voice.status.agentSpeaking'), tone: 'ai' };
    case 'user-speaking':
      return { label: tr('room.voice.status.userSpeaking'), tone: 'user' };
    case 'waiting-agent':
      return {
        label: tr(agentConnected ? 'room.voice.status.agentReady' : 'room.voice.status.waitingAgent'),
        tone: 'wait',
      };
    case 'connected':
      return { label: tr('room.voice.status.yourTurn'), tone: 'user' };
    case 'ended':
      return { label: tr('room.voice.status.ended'), tone: 'idle' };
    case 'error':
      return { label: tr('room.voice.status.failed'), tone: 'error' };
    default:
      return { label: tr('room.voice.status.idle'), tone: 'idle' };
  }
}

// ── Header ───────────────────────────────────────────────────────────────────

export function VoiceRoomHeader({
  mode,
  jobTitle,
  onBack,
  progress,
}: {
  mode: 'voice' | 'video';
  jobTitle?: string;
  /** Kept for callers; the turn status is shown once, in the call bar. */
  status?: { label: string; tone: StatusTone };
  onBack: () => void;
  /** Question counter and timer from the session runtime; omitted until loaded. */
  progress?: RuntimeProgress | null;
}) {
  const { t } = useLanguage();
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#DCE4F3] bg-white px-3 sm:px-6">
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
          <h1 className="truncate text-sm font-bold text-[#14244B] sm:text-base">{jobTitle || t('room.voice.defaultTitle')}</h1>
          <p className="truncate text-xs text-[#607096]">
            {mode === 'video' ? t('room.voice.modeVideo') : t('room.voice.modeVoice')}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
      {progress?.questionNumber != null && progress.totalQuestions > 0 ? (
        <span
          className="inline-flex rounded-full border border-[#DCE4F3] bg-[#F7F9FD] px-2.5 py-1 text-xs font-semibold tabular-nums text-[#14244B]"
          aria-label={fmt(t('room.voice.questionAria'), { n: progress.questionNumber, total: progress.totalQuestions })}
        >
          {fmt(t('room.common.questionCounter'), {
            n: Math.min(progress.questionNumber, progress.totalQuestions),
            total: progress.totalQuestions,
          })}
        </span>
      ) : null}
      {progress ? (
        <InterviewCountdownTimer
          startedAt={progress.startedAt}
          durationMinutes={progress.durationMinutes ?? undefined}
          isClosed={progress.isClosed}
        />
      ) : null}
      </div>
    </header>
  );
}

// ── Stage ────────────────────────────────────────────────────────────────────

/** Shown over the stage until the room is connected: what to expect + one CTA. */
export function PreJoinCard({
  mode,
  status,
  error,
  onConnect,
}: {
  mode: 'voice' | 'video';
  status: LiveKitRoomStatus;
  error?: string | null;
  onConnect: () => void;
}) {
  const { t } = useLanguage();
  const connecting = status === 'connecting';
  const failed = status === 'error';
  // The room dropped without the interview closing (left, reloaded): offer to rejoin.
  const dropped = status === 'ended';
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#14244B]/80 p-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-[#14244B] shadow-[0_28px_60px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-3.5 border-b border-[#EAEFF8] pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-2xs">
            <img src="/logo.jpg" alt="Intervia" className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#14244B]">
              {failed
                ? t('room.voice.prejoin.failedTitle')
                : dropped
                  ? t('room.voice.prejoin.droppedTitle')
                  : t('room.voice.prejoin.readyTitle')}
            </h2>
            <p className="text-xs text-[#607096]">
              {mode === 'video' ? t('room.voice.prejoin.videoNeeds') : t('room.voice.prejoin.voiceNeeds')}
            </p>
          </div>
        </div>

        {failed && error ? (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-2xl bg-[#FDF2F2] px-3 py-2.5 text-xs text-[#C43B3B]">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : null}

        <ol className="mt-4 space-y-2 text-sm">
          {[
            t('room.voice.prejoin.step1'),
            t('room.voice.prejoin.step2'),
            t('room.voice.prejoin.step3'),
            t('room.voice.prejoin.step4'),
          ].map((step, index) => (
            <li key={step} className="flex items-start gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#F0F4FC] text-[11px] font-bold text-[#204195]">
                {index + 1}
              </span>
              <span className="leading-snug text-[#14244B]">{step}</span>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275] disabled:opacity-70"
        >
          {connecting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : failed || dropped ? (
            <RotateCcw className="size-4" aria-hidden="true" />
          ) : (
            <Mic className="size-4" aria-hidden="true" />
          )}
          {connecting
            ? t('room.voice.status.connecting')
            : failed
              ? t('room.voice.prejoin.reconnect')
              : dropped
                ? t('room.voice.prejoin.rejoin')
                : t('room.voice.prejoin.start')}
        </button>
      </section>
    </div>
  );
}

export function ControlButton({
  label,
  onClick,
  disabled = false,
  active,
  danger = false,
  primary = false,
  icon,
  text,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active: boolean;
  danger?: boolean;
  /** The main action of the turn ("Trả lời xong"). */
  primary?: boolean;
  icon: ReactNode;
  /** Visible caption next to the icon (wide screens); the icon alone otherwise. */
  text?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      // Only the mic and camera are toggles; labelled buttons are one-shot actions.
      aria-pressed={danger || primary || text ? undefined : active}
      title={label}
      className={`flex h-11 items-center justify-center gap-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        text || danger ? 'min-w-11 px-4 sm:px-5' : 'w-11'
      } ${
        danger
          ? 'bg-[#C43B3B] text-white hover:bg-[#A93232]'
          : primary
            ? 'bg-[#204195] text-white hover:bg-[#183275]'
            : active
            ? 'bg-[#EEF2FD] text-[#14244B] hover:bg-[#E1E8FA]'
            : 'bg-[#FCEBEB] text-[#C43B3B] hover:bg-[#F8DADA]'
      }`}
    >
      {icon}
      {text ? <span className="hidden text-sm font-semibold sm:inline">{text}</span> : null}
    </button>
  );
}

// ── Presence and turn status ─────────────────────────────────────────────────

export type PresenceState = 'speaking' | 'listening' | 'thinking' | 'waiting';

/** What the interviewer is doing right now, from real room signals only. */
export function presenceState({
  agentConnected,
  agentSpeaking,
  turnState,
}: {
  agentConnected: boolean;
  agentSpeaking: boolean;
  turnState: LiveKitTurnState | null;
}): PresenceState {
  if (!agentConnected) return 'waiting';
  if (agentSpeaking) return 'speaking';
  if (turnState === 'processing') return 'thinking';
  return 'listening';
}

type SpeakerTone = 'ai' | 'user';

const AVATAR_BG: Record<SpeakerTone, string> = { ai: 'bg-[#204195]', user: 'bg-[#287A4B]' };
const ACTIVE_BORDER: Record<SpeakerTone, string> = { ai: 'border-[#204195]', user: 'border-[#287A4B]' };

/** Three small bars, shown only while that side really speaks. */
function SpeakingBars({ tone }: { tone: SpeakerTone }) {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[6, 11, 8].map((height, index) => (
        <span
          key={index}
          className={`w-[3px] rounded-full ${AVATAR_BG[tone]} motion-safe:animate-pulse`}
          style={{ height, animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );
}

/**
 * One equal tile per participant (video room), like any meeting app: a flat
 * avatar in the middle, the name in the corner, and a solid border on whoever
 * is speaking.
 */
export function SpeakerTile({
  name,
  tone,
  active,
  children,
}: {
  name: string;
  tone: SpeakerTone;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative flex aspect-[4/3] min-w-0 flex-col items-center justify-center rounded-2xl border-2 bg-[#F3F6FB] px-3 pb-8 transition-colors duration-200 ${
        active ? ACTIVE_BORDER[tone] : 'border-transparent'
      }`}
    >
      {children}
      <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-medium text-[#14244B] shadow-sm">
        {active ? <SpeakingBars tone={tone} /> : null}
        {name}
      </span>
    </div>
  );
}

function Avatar({ tone, muted = false, compact = false, children }: { tone: SpeakerTone; muted?: boolean; compact?: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${
        compact ? 'size-11 text-sm' : 'size-20 text-xl sm:size-24 sm:text-2xl'
      } ${muted ? 'bg-[#8692A8]' : AVATAR_BG[tone]}`}
    >
      {children}
    </div>
  );
}

/** The interviewer's avatar inside a video tile. */
export function InterviewerPresence({ state, size = 'large' }: { state: PresenceState; size?: 'large' | 'small' }) {
  return (
    <div className="flex flex-col items-center" data-presence={state}>
      <Avatar tone="ai" compact={size === 'small'}>IV</Avatar>
    </div>
  );
}

/**
 * A slim participant card for the voice room: the conversation is the main
 * content there, so the two speakers take one short row above it. The note
 * only appears for states the call bar does not already say (mic off, not
 * heard).
 */
export function SpeakerCard({
  name,
  tone,
  active,
  muted = false,
  note,
  alert = false,
  icon,
}: {
  name: string;
  tone: SpeakerTone;
  active: boolean;
  muted?: boolean;
  note?: string;
  alert?: boolean;
  icon: ReactNode;
}) {
  return (
    <div
      data-active={active}
      className={`flex min-w-0 items-center gap-3 rounded-2xl border-2 px-3 py-2.5 transition-colors duration-200 sm:px-4 ${
        alert ? 'border-[#F5C2C2] bg-[#FDF2F2]' : active ? `${ACTIVE_BORDER[tone]} bg-white` : 'border-transparent bg-[#F3F6FB]'
      }`}
    >
      <Avatar tone={tone} muted={muted || alert} compact>
        {icon === 'IV' ? (
          <img src="/logo.jpg" alt="AI Interviewer" className="h-full w-full rounded-full object-cover" />
        ) : (
          icon
        )}
      </Avatar>
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate text-sm font-semibold text-[#14244B]">
          {name}
          {active ? <SpeakingBars tone={tone} /> : null}
        </p>
        {note ? <p className={`truncate text-xs ${alert ? 'text-[#C43B3B]' : 'text-[#607096]'}`}>{note}</p> : null}
      </div>
    </div>
  );
}

/** Whose turn it is, as one short line with a coloured dot. */
export function TurnStatus({ status }: { status: { label: string; tone: StatusTone } }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#34496F]" aria-live="polite">
      <span className={`size-2 shrink-0 rounded-full ${TONE_DOT[status.tone]}`} aria-hidden="true" />
      <span className="truncate" role={status.tone === 'error' ? 'alert' : undefined}>{status.label}</span>
    </p>
  );
}

/**
 * A problem that stops the interview from working (the interviewer cannot
 * hear the candidate, a command failed): shown on the stage itself, where
 * the candidate is looking, never tucked into a side panel.
 */
export function StageAlert({
  title,
  message,
  action,
  onDismiss,
}: {
  title?: string;
  message: string;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-2xl border border-[#F5C2C2] bg-[#FDF2F2] px-4 py-3 text-sm text-[#7A2323]">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#C43B3B]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold text-[#C43B3B]">{title}</p> : null}
        <p className="leading-relaxed">{message}</p>
      </div>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="h-9 shrink-0 rounded-full bg-white px-4 text-sm font-semibold text-[#C43B3B] ring-1 ring-[#F5C2C2] transition-colors hover:bg-[#FCE4E4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C43B3B]"
        >
          {action.label}
        </button>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="h-9 shrink-0 rounded-full px-3 text-sm font-medium text-[#7A2323] hover:bg-[#FCE4E4]"
        >
          {t('room.common.dismiss')}
        </button>
      ) : null}
    </div>
  );
}

// ── Transcript ───────────────────────────────────────────────────────────────

export function TranscriptPanel({
  lines,
  agentConnected,
  liveText,
  embedded = false,
  footer,
}: {
  lines: LiveKitTranscriptLine[];
  agentConnected: boolean;
  /** What the candidate is saying right now, before the line is final. */
  liveText?: string;
  /** Voice room: the transcript is the stage's main content, not a side panel. */
  embedded?: boolean;
  footer?: ReactNode;
}) {
  const { t } = useLanguage();
  // Scroll only the list itself; scrollIntoView would also move the page.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lines, liveText]);

  const bubbles = (
    <>
      {lines.length === 0 && !liveText ? (
        <p className="py-6 text-center text-sm text-[#607096]">{t('room.voice.transcriptEmpty')}</p>
      ) : (
        lines.map((line) => {
          const user = line.speaker === 'user';
          return (
            <div key={line.id} data-speaker={line.speaker} className={`flex ${user ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${embedded ? 'text-[15px]' : 'text-sm'} ${
                  user
                    ? 'rounded-tr-md bg-[#204195] text-white'
                    : 'rounded-tl-md border border-[#DCE4F3] bg-white text-[#14244B]'
                }`}
              >
                <p className={`mb-0.5 text-[11px] font-semibold ${user ? 'text-white/70' : 'text-[#204195]'}`}>
                  {user ? t('room.common.you') : t('room.common.interviewer')}
                </p>
                {line.text}
              </div>
            </div>
          );
        })
      )}
      {liveText ? (
        <div data-speaker="user" data-live="true" className="flex justify-end">
          <div
            className={`max-w-[85%] rounded-2xl rounded-tr-md border border-dashed border-[#204195]/40 bg-[#EEF2FD] px-4 py-2.5 leading-relaxed text-[#14244B] ${
              embedded ? 'text-[15px]' : 'text-sm'
            }`}
          >
            <p className="mb-0.5 text-[11px] font-semibold text-[#204195]">{t('room.voice.caption')}…</p>
            {liveText}
          </div>
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6" aria-live="polite" aria-label={t('room.voice.transcriptTitle')}>
        <div className="mx-auto w-full max-w-3xl space-y-3">{bubbles}</div>
      </div>
    );
  }

  return (
    <aside className="flex h-[34vh] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white lg:h-auto lg:w-[380px]">
      <div className="border-b border-[#DCE4F3] px-5 py-3.5">
        <h2 className="text-sm font-bold text-[#14244B]">{t('room.voice.transcriptTitle')}</h2>
        <p className="mt-0.5 text-[11px] text-[#607096]">
          {agentConnected ? t('room.voice.agentIn') : t('room.voice.agentWaiting')}
        </p>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F7F9FD] p-4" aria-live="polite">
        {bubbles}
      </div>
      {footer}
    </aside>
  );
}
