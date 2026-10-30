'use client';

/**
 * The question being answered, pinned where the candidate looks: the centre of
 * the voice/video stage and the side panel of the chat room. Same pieces in
 * all three rooms so they read as one product.
 */

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt } from '@/i18n/format';

export type QuestionTimerPhase = 'answering' | 'wrapUp' | 'over';

/** Where an answer stands against the question's own time box (soft/hard seconds). */
export function questionTimerState(
  elapsedSeconds: number,
  softSeconds: number,
  hardSeconds: number,
): { phase: QuestionTimerPhase; fillPercent: number; softPercent: number } {
  const hard = Math.max(hardSeconds, softSeconds, 1);
  const elapsed = Math.max(0, elapsedSeconds);
  const phase: QuestionTimerPhase = elapsed > hard ? 'over' : elapsed > softSeconds ? 'wrapUp' : 'answering';
  return {
    phase,
    fillPercent: Math.min(100, (elapsed / hard) * 100),
    softPercent: Math.min(100, (softSeconds / hard) * 100),
  };
}

function clock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

const PHASE_TONE: Record<QuestionTimerPhase, { bar: string; text: { light: string; dark: string } }> = {
  answering: { bar: 'bg-[#204195]', text: { light: 'text-[#607096]', dark: 'text-white/70' } },
  wrapUp: { bar: 'bg-[#FCB625]', text: { light: 'text-[#8A5A00]', dark: 'text-[#FCD77A]' } },
  over: { bar: 'bg-[#C43B3B]', text: { light: 'text-[#C43B3B]', dark: 'text-[#F5A3A3]' } },
};

export function QuestionTimer({
  startedAt,
  softSeconds,
  hardSeconds,
  paused = false,
  variant = 'light',
}: {
  startedAt: string | null;
  softSeconds: number | null;
  hardSeconds: number | null;
  /** Stop counting (session closed). */
  paused?: boolean;
  variant?: 'light' | 'dark';
}) {
  const { t } = useLanguage();
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [paused]);

  const startMs = startedAt ? Date.parse(startedAt) : Number.NaN;
  if (!Number.isFinite(startMs) || !softSeconds) return null;
  const hard = hardSeconds ?? softSeconds;
  const elapsed = (nowMs - startMs) / 1000;
  const { phase, fillPercent, softPercent } = questionTimerState(elapsed, softSeconds, hard);
  const tone = PHASE_TONE[phase];
  const track = variant === 'dark' ? 'bg-white/15' : 'bg-[#E4EAF5]';
  const marker = variant === 'dark' ? 'bg-white/60' : 'bg-[#607096]/50';

  return (
    <div className="w-full" data-phase={phase}>
      <div className={`flex items-center justify-between text-[11px] font-semibold ${tone.text[variant]}`}>
        <span role={phase === 'answering' ? undefined : 'status'}>{t(`room.question.timer.${phase}`)}</span>
        <span className="tabular-nums">
          {fmt(t('room.question.timer.value'), { elapsed: clock(elapsed), soft: clock(softSeconds) })}
        </span>
      </div>
      <div className={`relative mt-1.5 h-1.5 overflow-hidden rounded-full ${track}`} aria-hidden="true">
        <div
          className={`h-full rounded-full ${tone.bar} transition-[width] duration-1000 ease-linear motion-reduce:transition-none`}
          style={{ width: `${fillPercent}%` }}
        />
        {softPercent < 100 ? (
          <span className={`absolute inset-y-0 w-0.5 ${marker}`} style={{ left: `${softPercent}%` }} />
        ) : null}
      </div>
    </div>
  );
}

export function CurrentQuestionCard({
  stageLabel,
  competency,
  text,
  followUpText,
  timer,
  variant = 'light',
  size = 'large',
}: {
  stageLabel: string | null;
  competency?: string | null;
  text: string | null;
  followUpText?: string | null;
  timer?: React.ReactNode;
  variant?: 'light' | 'dark';
  /** "compact" under the video tiles, "large" on the voice stage and chat panel. */
  size?: 'large' | 'compact';
}) {
  const { t } = useLanguage();
  const dark = variant === 'dark';
  // No question counter: the header shows it, and the total moves when the
  // closing Q&A turn is added.
  const eyebrow = [stageLabel, competency]
    .filter(Boolean)
    .join(' · ');

  return (
    <section
      aria-label={t('room.question.aria')}
      className={`w-full rounded-3xl ${
        dark
          ? 'border border-white/15 bg-white/[0.07] text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm'
          : 'border border-[#DCE4F3] bg-white text-[#14244B] shadow-[0_18px_40px_-32px_rgba(20,36,75,0.45)]'
      } ${size === 'compact' ? 'p-4' : 'p-5 sm:p-6'}`}
    >
      {eyebrow ? (
        <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${dark ? 'text-[#C9D6F5]' : 'text-[#204195]'}`}>
          {eyebrow}
        </p>
      ) : null}
      {text ? (
        <p
          className={`mt-2 font-display font-semibold leading-snug ${
            size === 'compact' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl lg:text-2xl'
          } ${followUpText ? (dark ? 'text-white/65' : 'text-[#607096]') : ''}`}
        >
          {text}
        </p>
      ) : (
        <p className={`mt-2 text-sm ${dark ? 'text-white/70' : 'text-[#607096]'}`}>{t('room.question.waiting')}</p>
      )}
      {followUpText ? (
        <div className={`mt-3 border-l-2 pl-3 ${dark ? 'border-[#FCB625]' : 'border-[#FCB625]'}`}>
          <p className={`text-[11px] font-semibold ${dark ? 'text-[#FCD77A]' : 'text-[#8A5A00]'}`}>
            {t('room.question.followUp')}
          </p>
          <p className={`mt-0.5 font-semibold leading-snug ${size === 'compact' ? 'text-sm' : 'text-base sm:text-lg'}`}>
            {followUpText}
          </p>
        </div>
      ) : null}
      {timer ? <div className="mt-4">{timer}</div> : null}
    </section>
  );
}
