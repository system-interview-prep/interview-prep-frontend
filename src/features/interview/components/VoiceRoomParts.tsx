'use client';

/**
 * Presentational pieces of the voice/video interview room. LiveKit state stays
 * in LiveKitInterviewRoom (useLiveKitRoom); these only render what they are
 * given, on the same workspace palette as the chat room (ChatRoomParts).
 */

import React, { useEffect, useRef, type ReactNode } from 'react';
import { AlertCircle, ArrowLeft, Bot, Headphones, Loader2, LogOut, Mic, RotateCcw, User } from 'lucide-react';
import type { LiveKitRoomStatus, LiveKitTranscriptLine } from '../hooks/useLiveKitRoom';

type StatusTone = 'ai' | 'user' | 'wait' | 'error' | 'idle';

const TONE_DOT: Record<StatusTone, string> = {
  ai: 'bg-[#204195]',
  user: 'bg-emerald-500',
  wait: 'bg-amber-400',
  error: 'bg-rose-500',
  idle: 'bg-[#A0AEC0]',
};

export function voiceStatus(status: LiveKitRoomStatus, agentConnected: boolean): { label: string; tone: StatusTone } {
  switch (status) {
    case 'connecting':
      return { label: 'Đang kết nối...', tone: 'wait' };
    case 'agent-speaking':
      return { label: 'AI đang nói — hãy lắng nghe', tone: 'ai' };
    case 'user-speaking':
      return { label: 'Bạn đang nói', tone: 'user' };
    case 'waiting-agent':
      return { label: agentConnected ? 'Đã kết nối — chờ AI đặt câu hỏi' : 'Đang chờ AI vào phòng', tone: 'wait' };
    case 'connected':
      return { label: 'Đến lượt bạn — hãy trả lời', tone: 'user' };
    case 'ended':
      return { label: 'Đã kết thúc', tone: 'idle' };
    case 'error':
      return { label: 'Kết nối thất bại', tone: 'error' };
    default:
      return { label: 'Chưa kết nối', tone: 'idle' };
  }
}

export function StatusPill({ label, tone, onDark = false }: { label: string; tone: StatusTone; onDark?: boolean }) {
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
        onDark ? 'bg-white/10 text-white backdrop-blur' : 'border border-[#DCE4F3] bg-white text-[#14244B]'
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
}: {
  mode: 'voice' | 'video';
  jobTitle?: string;
  status: { label: string; tone: StatusTone };
  isEnding: boolean;
  onBack: () => void;
  onEnd: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#DCE4F3] bg-white/95 px-3 backdrop-blur-md sm:px-6">
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
          <h1 className="truncate text-sm font-bold text-[#14244B] sm:text-base">{jobTitle || 'Phòng phỏng vấn'}</h1>
          <p className="flex items-center gap-1.5 text-xs text-[#607096]">
            <span className={`size-2 shrink-0 rounded-full ${TONE_DOT[status.tone]}`} aria-hidden="true" />
            <span className="truncate">
              {mode === 'video' ? 'Phỏng vấn giọng nói + camera' : 'Phỏng vấn giọng nói'}
            </span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onEnd}
        disabled={isEnding}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
      >
        <LogOut className="size-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Kết thúc</span>
        <span className="sr-only sm:hidden">Kết thúc phỏng vấn</span>
      </button>
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
  const ring = role === 'ai' ? 'border-[#8FA8E8] bg-[#8FA8E8]/20' : 'border-emerald-300 bg-emerald-300/15';
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
        <p className="mt-0.5 h-4 text-[11px] font-medium text-white/70">{active ? 'Đang nói' : ''}</p>
      </div>
    </div>
  );
}

export function VoiceActivityBars({ agentSpeaking, userSpeaking }: { agentSpeaking: boolean; userSpeaking: boolean }) {
  const color = agentSpeaking ? 'bg-[#8FA8E8]' : userSpeaking ? 'bg-emerald-300' : 'bg-white/25';
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

export const AI_ICON = <Bot className="size-11" aria-hidden="true" />;
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
  const connecting = status === 'connecting';
  const failed = status === 'error';
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#14244B]/70 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-2xl border border-[#DCE4F3] bg-white p-6 text-[#14244B] shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195]">
            <Headphones className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold">
              {failed ? 'Chưa kết nối được phòng' : 'Sẵn sàng phỏng vấn giọng nói'}
            </h2>
            <p className="text-xs text-[#607096]">
              {mode === 'video' ? 'Micro + camera · AI phỏng vấn bằng giọng nói' : 'Chỉ cần micro · AI phỏng vấn bằng giọng nói'}
            </p>
          </div>
        </div>

        {failed && error ? (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : null}

        <ol className="mt-4 space-y-2 text-sm">
          {[
            'Dùng tai nghe nếu có, ngồi ở nơi yên tĩnh.',
            'Bấm “Bắt đầu” và cho phép trình duyệt dùng micro.',
            'Chờ AI hỏi xong rồi trả lời tự nhiên; có thể nhờ AI nhắc lại câu hỏi.',
            'Bấm “Kết thúc” khi xong để nhận báo cáo đánh giá.',
          ].map((step, index) => (
            <li key={step} className="flex items-start gap-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EEF2FD] text-[11px] font-bold text-[#204195]">
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
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#204195] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#183273] disabled:opacity-70"
        >
          {connecting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : failed ? (
            <RotateCcw className="size-4" aria-hidden="true" />
          ) : (
            <Mic className="size-4" aria-hidden="true" />
          )}
          {connecting ? 'Đang kết nối...' : failed ? 'Thử kết nối lại' : 'Bắt đầu phỏng vấn'}
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
          ? 'bg-rose-600 text-white hover:bg-rose-700'
          : active
            ? 'bg-white text-[#204195]'
            : 'bg-rose-500/90 text-white'
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
  // Scroll only the list itself; scrollIntoView would also move the page.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lines.length]);

  return (
    <aside className="flex h-[34vh] w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white lg:h-auto lg:w-[380px]">
      <div className="flex items-center justify-between border-b border-[#DCE4F3] px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold text-[#14244B]">Bản ghi hội thoại</h2>
          <p className="mt-0.5 text-[11px] text-[#607096]">
            {agentConnected ? 'AI đang ở trong phòng' : 'Đang chờ AI tham gia'}
          </p>
        </div>
        <span className="rounded-full bg-[#EEF2FD] px-2 py-0.5 text-[11px] font-semibold text-[#204195]">
          {lines.length} lượt
        </span>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F7F9FD] p-4" aria-live="polite">
        {lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#607096]">Lời thoại sẽ hiện ở đây khi cuộc trò chuyện bắt đầu.</p>
        ) : (
          lines.map((line) => {
            const user = line.speaker === 'user';
            return (
              <div key={line.id} data-speaker={line.speaker} className={`flex ${user ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                    user
                      ? 'rounded-tr-sm bg-[#204195] text-white'
                      : 'rounded-tl-sm border border-[#DCE4F3] bg-white text-[#14244B]'
                  }`}
                >
                  <p className={`mb-0.5 text-[10px] font-bold uppercase tracking-wider ${user ? 'text-white/70' : 'text-[#204195]'}`}>
                    {user ? 'Bạn' : 'AI Interviewer'}
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
