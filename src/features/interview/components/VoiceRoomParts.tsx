'use client';

/**
 * Presentational pieces of the voice/video interview room. LiveKit state stays
 * in LiveKitInterviewRoom (useLiveKitRoom); these only render what they are
 * given, on the same workspace palette as the chat room (ChatRoomParts).
 */

import { InterviewCountdownTimer } from './ChatInterviewProgress';
import type { RuntimeProgress } from '../hooks/useRuntimeProgress';
import React, { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, ArrowLeft, Loader2, LogOut, Mic, RotateCcw, User } from 'lucide-react';
import InterviewerAvatar from './InterviewerAvatar';
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

export function StatusPill({ label, tone, onDark = false }: { label: string; tone: StatusTone; onDark?: boolean }) {
  return (
    // Only a connection failure is announced; the speaking/listening flips would chatter.
    <span
      role={tone === 'error' ? 'alert' : undefined}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        onDark ? 'bg-white/10 text-white' : 'border border-[#DCE4F3] bg-white text-[#14244B]'
      }`}
    >
      <span className={`size-2 rounded-full ${TONE_DOT[tone]} ${tone === 'ai' || tone === 'user' ? 'motion-safe:animate-pulse' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

export function VoiceRoomHeader({
  mode,
  jobTitle,
  status,
  isEnding,
  onBack,
  onEnd,
  progress,
}: {
  mode: 'voice' | 'video';
  jobTitle?: string;
  status: { label: string; tone: StatusTone };
  isEnding: boolean;
  onBack: () => void;
  onEnd: () => void;
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
          <p className="flex items-center gap-1.5 text-xs text-[#607096]">
            <span className={`size-2 shrink-0 rounded-full ${TONE_DOT[status.tone]}`} aria-hidden="true" />
            <span className="truncate">
              {mode === 'video' ? t('room.voice.modeVideo') : t('room.voice.modeVoice')}
            </span>
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
      <button
        type="button"
        onClick={onEnd}
        disabled={isEnding}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#FDF2F2] px-3.5 text-xs font-semibold text-[#C43B3B] transition hover:bg-[#FBE6E6] disabled:opacity-60"
      >
        <LogOut className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{t('room.common.end')}</span>
        <span className="sr-only sm:hidden">{t('room.common.endInterview')}</span>
      </button>
      </div>
    </header>
  );
}

// ── Stage ────────────────────────────────────────────────────────────────────

export function SpeakerOrb({
  label,
  role,
  active,
  icon,
}: {
  label: string;
  role: 'ai' | 'user';
  active: boolean;
  icon: ReactNode;
}) {
  const { t } = useLanguage();
  const ring = role === 'ai' ? 'border-[#8FA8E8] bg-[#8FA8E8]/20' : 'border-[#9FD3B4] bg-[#9FD3B4]/15';
  return (
    <div className="flex flex-col items-center gap-3 text-center" data-speaker={role} data-active={active}>
      <div className="relative">
        {active ? (
          <span className={`absolute -inset-3 rounded-full border ${ring} opacity-70 motion-safe:animate-ping`} aria-hidden="true" />
        ) : null}
        <div
          className={`relative flex size-24 items-center justify-center rounded-full border-2 text-white transition sm:size-28 ${
            active ? ring : 'border-white/25 bg-white/10'
          }`}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="mt-0.5 h-4 text-[11px] font-medium text-white/70">{active ? t('room.voice.speaking') : ''}</p>
      </div>
    </div>
  );
}

export function VoiceActivityBars({ agentSpeaking, userSpeaking }: { agentSpeaking: boolean; userSpeaking: boolean }) {
  const color = agentSpeaking ? 'bg-[#8FA8E8]' : userSpeaking ? 'bg-[#9FD3B4]' : 'bg-white/25';
  const moving = agentSpeaking || userSpeaking;
  return (
    <div className="flex h-12 items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: 15 }, (_, index) => (
        <span
          key={index}
          className={`w-1 rounded-full transition-all duration-150 ${color} ${moving ? 'motion-safe:animate-pulse' : ''}`}
          style={{ height: `${moving ? 14 + ((index * 17) % 34) : 8}px`, animationDelay: `${index * 60}ms` }}
        />
      ))}
    </div>
  );
}

/** The interviewer's face: a neutral "AI" badge (the fox is only the app's assistant). */
export const AI_ICON = <InterviewerAvatar size={84} />;
export const USER_ICON = <User className="size-11" aria-hidden="true" />;

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
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#14244B]/80 p-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-[#14244B] shadow-[0_28px_60px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">
              {failed ? t('room.voice.prejoin.failedTitle') : t('room.voice.prejoin.readyTitle')}
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
          ) : failed ? (
            <RotateCcw className="size-4" aria-hidden="true" />
          ) : (
            <Mic className="size-4" aria-hidden="true" />
          )}
          {connecting
            ? t('room.voice.status.connecting')
            : failed
              ? t('room.voice.prejoin.reconnect')
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
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active: boolean;
  danger?: boolean;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={danger ? undefined : active}
      title={label}
      className={`flex size-12 items-center justify-center rounded-full transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'bg-[#C43B3B] text-white hover:bg-[#A93232]'
          : active
            ? 'bg-white text-[#14244B]'
            : 'bg-white/20 text-white hover:bg-white/30'
      }`}
    >
      {icon}
    </button>
  );
}

// ── Transcript ───────────────────────────────────────────────────────────────

export function TranscriptPanel({
  lines,
  agentConnected,
  footer,
}: {
  lines: LiveKitTranscriptLine[];
  agentConnected: boolean;
  footer?: ReactNode;
}) {
  const { t } = useLanguage();
  // Scroll only the list itself; scrollIntoView would also move the page.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lines.length]);

  return (
    <aside className="flex h-[34vh] w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-[#DCE4F3] bg-white lg:h-auto lg:w-[380px]">
      <div className="flex items-center justify-between border-b border-[#DCE4F3] px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold text-[#14244B]">{t('room.voice.transcriptTitle')}</h2>
          <p className="mt-0.5 text-[11px] text-[#607096]">
            {agentConnected ? t('room.voice.agentIn') : t('room.voice.agentWaiting')}
          </p>
        </div>
        <span className="rounded-full bg-[#EEF2FD] px-2 py-0.5 text-[11px] font-semibold text-[#607096]">
          {fmt(t('room.voice.turns'), { n: lines.length })}
        </span>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F7F9FD] p-4" aria-live="polite">
        {lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#607096]">{t('room.voice.transcriptEmpty')}</p>
        ) : (
          lines.map((line) => {
            const user = line.speaker === 'user';
            return (
              <div key={line.id} data-speaker={line.speaker} className={`flex ${user ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                    user
                      ? 'rounded-tr-md bg-[#204195] text-white'
                      : 'rounded-tl-md border border-[#DCE4F3] bg-white text-[#14244B]'
                  }`}
                >
                  <p className={`mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold ${user ? 'text-white/70' : 'text-[#204195]'}`}>
                    {user ? null : <InterviewerAvatar size={18} className="ring-1" />}
                    {user ? t('room.common.you') : t('room.common.interviewer')}
                  </p>
                  {line.text}
                </div>
              </div>
            );
          })
        )}
      </div>
      {footer}
    </aside>
  );
}
