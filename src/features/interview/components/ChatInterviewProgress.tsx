'use client';

import React, { useEffect, useState } from 'react';
import { Check, Circle, Clock, Minus, TriangleAlert } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt } from '@/i18n/format';
import { roomVi } from '@/i18n/dicts/room.dict';
import type {
  ChatRuntimeTurn,
  EndReason,
  InterviewStage,
} from '../services/interviewChat.service';

type Translate = (key: string) => string;

const viT: Translate = (k) => roomVi[k] ?? k;

/** Dictionary id of each stage: `room.stage.<id>.label|short|description|tip`. */
const STAGE_ID: Record<InterviewStage, string> = {
  WARM_UP: 'warmUp',
  VALIDATE: 'validate',
  DEEP_DIVE: 'deepDive',
  CHALLENGE: 'challenge',
  BEHAVIORAL: 'behavioral',
  CLOSING: 'closing',
  CLOSED: 'closed',
};

function stageLabels(key: InterviewStage, t: Translate = viT): { label: string; shortLabel: string } {
  return {
    label: t(`room.stage.${STAGE_ID[key]}.label`),
    shortLabel: t(`room.stage.${STAGE_ID[key]}.short`),
  };
}

const STAGE_ORDER: InterviewStage[] = [
  'WARM_UP',
  'VALIDATE',
  'DEEP_DIVE',
  'CHALLENGE',
  'BEHAVIORAL',
  'CLOSING',
  'CLOSED',
];

/** Stage order with Vietnamese labels; use `deriveChatStageProgress({ t })` for the UI language. */
export const CHAT_STAGE_DEFINITIONS: ReadonlyArray<{
  key: InterviewStage;
  label: string;
  shortLabel: string;
}> = STAGE_ORDER.map((key) => ({ key, ...stageLabels(key) }));

type GuidedStage = Exclude<InterviewStage, 'CLOSED'>;

function stageGuide(stage: GuidedStage, t: Translate = viT): { description: string; tip: string } {
  return {
    description: t(`room.stage.${STAGE_ID[stage]}.description`),
    tip: t(`room.stage.${STAGE_ID[stage]}.tip`),
  };
}

/** What happens in each stage and how to answer it, shown next to the chat (Vietnamese). */
export const CHAT_STAGE_GUIDE: Record<GuidedStage, { description: string; tip: string }> = {
  WARM_UP: stageGuide('WARM_UP'),
  VALIDATE: stageGuide('VALIDATE'),
  DEEP_DIVE: stageGuide('DEEP_DIVE'),
  CHALLENGE: stageGuide('CHALLENGE'),
  BEHAVIORAL: stageGuide('BEHAVIORAL'),
  CLOSING: stageGuide('CLOSING'),
};

export function getStageGuide(stage?: string | null, t?: Translate) {
  const normalized = normalizeInterviewStage(stage);
  return normalized && normalized !== 'CLOSED' ? stageGuide(normalized, t ?? viT) : null;
}

export type ChatStageState = 'completed' | 'current' | 'upcoming' | 'skipped' | 'optional';

export type ChatStageProgress = (typeof CHAT_STAGE_DEFINITIONS)[number] & {
  state: ChatStageState;
};

const KNOWN_STAGES = new Set<InterviewStage>(CHAT_STAGE_DEFINITIONS.map((stage) => stage.key));

export function normalizeInterviewStage(value?: string | null): InterviewStage | null {
  if (!value || !KNOWN_STAGES.has(value as InterviewStage)) return null;
  return value as InterviewStage;
}

export function deriveChatStageProgress({
  currentStage,
  sessionStatus,
  turns = [],
  t,
}: {
  currentStage?: string | null;
  sessionStatus: 'OPEN' | 'CLOSED';
  turns?: ChatRuntimeTurn[];
  /** Translator for stage labels; Vietnamese when omitted. */
  t?: Translate;
}): { stages: ChatStageProgress[]; currentStage: InterviewStage | null; unknownStage: string | null } {
  const normalizedStage = sessionStatus === 'CLOSED' ? 'CLOSED' : normalizeInterviewStage(currentStage);
  const presentStages = new Set<InterviewStage>();
  const visitedStages = new Set<InterviewStage>();

  for (const turn of turns) {
    const stage = normalizeInterviewStage(turn.stage);
    if (!stage || stage === 'CLOSED') continue;
    presentStages.add(stage);
    if (turn.status !== 'PLANNED') visitedStages.add(stage);
  }
  if (normalizedStage && normalizedStage !== 'CLOSED') presentStages.add(normalizedStage);

  const currentIndex = normalizedStage
    ? CHAT_STAGE_DEFINITIONS.findIndex((stage) => stage.key === normalizedStage)
    : -1;

  const stages = CHAT_STAGE_DEFINITIONS.map((stage, index): ChatStageProgress => {
    let state: ChatStageState;
    if (stage.key === normalizedStage) {
      state = 'current';
    } else if (normalizedStage === 'CLOSED') {
      state = presentStages.has(stage.key) && visitedStages.has(stage.key) ? 'completed' : 'skipped';
    } else if (currentIndex >= 0 && index < currentIndex) {
      state = presentStages.has(stage.key) ? 'completed' : 'skipped';
    } else if (stage.key === 'CLOSED' || presentStages.has(stage.key)) {
      state = 'upcoming';
    } else {
      state = 'optional';
    }
    return { ...stage, ...(t ? stageLabels(stage.key, t) : null), state };
  });

  return {
    stages,
    currentStage: normalizedStage,
    unknownStage:
      sessionStatus === 'OPEN' && currentStage && !normalizeInterviewStage(currentStage)
        ? currentStage
        : null,
  };
}

export function getStageLabel(stage?: string | null, t?: Translate): string | null {
  const normalized = normalizeInterviewStage(stage);
  return normalized ? stageLabels(normalized, t ?? viT).label : null;
}

/** i18n key for an end reason; pair with `t()` from useLanguage. */
export function endReasonKey(reason?: string | null): string {
  switch (reason) {
    case 'USER_ENDED':
    case 'CANDIDATE_ABORT':
      return 'endReason.userEnded';
    case 'HARD_TIMEOUT':
      return 'endReason.timeout';
    case 'FAST_FAIL_TECH':
    case 'FAST_FAIL_VALIDATION':
      return 'endReason.early';
    case 'TECHNICAL_FAILURE':
      return 'endReason.technical';
    case 'CANDIDATE_LEFT':
      return 'endReason.candidateLeft';
    default:
      return 'endReason.completed';
  }
}

export function getEndReasonLabel(reason?: EndReason | null, t?: Translate): string {
  const tr = t ?? viT;
  switch (reason) {
    case 'USER_ENDED':
    case 'CANDIDATE_ABORT':
      return tr('room.endReason.userEnded');
    case 'HARD_TIMEOUT':
      return tr('room.endReason.timeout');
    case 'FAST_FAIL_TECH':
    case 'FAST_FAIL_VALIDATION':
      return tr('room.endReason.early');
    case 'TECHNICAL_FAILURE':
      return tr('room.endReason.technical');
    case 'CANDIDATE_LEFT':
      return tr('room.endReason.candidateLeft');
    case 'COMPLETED':
    case 'NORMAL_COMPLETION':
    default:
      return tr('room.endReason.completed');
  }
}

export function calculateRemainingSeconds({
  serverRemainingSeconds,
  snapshotAtMs,
  startedAt,
  durationMinutes,
  nowMs,
}: {
  serverRemainingSeconds?: number;
  snapshotAtMs: number;
  startedAt?: string | null;
  durationMinutes?: number;
  nowMs: number;
}): number | null {
  if (Number.isFinite(serverRemainingSeconds) && (serverRemainingSeconds as number) >= 0) {
    const elapsedSinceSnapshot = Math.max(0, Math.floor((nowMs - snapshotAtMs) / 1000));
    return Math.max(0, Math.floor(serverRemainingSeconds as number) - elapsedSinceSnapshot);
  }

  if (!Number.isFinite(durationMinutes) || (durationMinutes as number) <= 0 || !startedAt) {
    return null;
  }
  const startMs = Date.parse(startedAt);
  if (!Number.isFinite(startMs)) return null;
  const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  return Math.max(0, Math.floor((durationMinutes as number) * 60) - elapsed);
}

export type TimerTone = 'normal' | 'low' | 'critical';

export function getTimerTone(secondsRemaining: number, durationMinutes?: number): TimerTone {
  const total = Number.isFinite(durationMinutes) && (durationMinutes as number) > 0
    ? (durationMinutes as number) * 60
    : null;
  if (total === null) {
    if (secondsRemaining <= 120) return 'critical';
    return secondsRemaining <= 300 ? 'low' : 'normal';
  }
  if (secondsRemaining <= total * 0.1) return 'critical';
  return secondsRemaining <= total * 0.25 ? 'low' : 'normal';
}

export function ChatStageStepper({
  currentStage,
  sessionStatus,
  turns,
}: {
  currentStage?: string | null;
  sessionStatus: 'OPEN' | 'CLOSED';
  turns?: ChatRuntimeTurn[];
}) {
  const { t } = useLanguage();
  const progress = deriveChatStageProgress({ currentStage, sessionStatus, turns, t });

  return (
    <section aria-label={t('room.stage.progressAria')} className="border-b border-[#DCE4F3] bg-white">
      {progress.unknownStage && (
        <div
          role="status"
          className="mx-auto flex max-w-4xl items-center gap-2 px-4 pt-2 text-xs font-medium text-amber-700 sm:px-6"
        >
          <TriangleAlert className="size-3.5 shrink-0" />
          <span>{t('room.stage.unknown')}</span>
        </div>
      )}
      {/* relative: the sr-only labels are absolutely positioned; without a
          positioned scroller their containing block is the viewport, so they
          escape the overflow clip and widen the mobile layout viewport. */}
      <div className="relative mx-auto max-w-4xl overflow-x-auto px-4 py-2.5 sm:px-6">
        <ol className="flex min-w-max items-center" role="list">
          {progress.stages.map((stage, index) => {
            const isCurrent = stage.state === 'current';
            const isCompleted = stage.state === 'completed';
            const isSkipped = stage.state === 'skipped';
            return (
              <React.Fragment key={stage.key}>
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className={`h-0.5 w-5 sm:w-8 ${
                      isCompleted || isCurrent ? 'bg-[#204195]/40' : 'bg-[#DCE4F3]'
                    }`}
                  />
                )}
                <li
                  data-stage={stage.key}
                  data-state={stage.state}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold sm:px-3 ${
                    isCurrent
                      ? 'border-[#204195] bg-[#204195] text-white shadow-sm ring-2 ring-[#204195]/15'
                      : isCompleted
                        ? 'border-[#BFDFCB] bg-[#EAF5EE] text-[#287A4B]'
                        : isSkipped
                          ? 'border-dashed border-[#DCE4F3] bg-white text-[#A0AEC0]'
                          : stage.state === 'optional'
                            ? 'border-dashed border-[#DCE4F3] bg-[#F7F9FD] text-[#A0AEC0]'
                            : 'border-[#DCE4F3] bg-[#F7F9FD] text-[#607096]'
                  }`}
                  title={
                    isSkipped
                      ? fmt(t('room.stage.skippedTitle'), { label: stage.label })
                      : stage.state === 'optional'
                        ? fmt(t('room.stage.optionalTitle'), { label: stage.label })
                        : stage.label
                  }
                >
                  {isCompleted ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : isSkipped ? (
                    <Minus className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Circle className={`size-2.5 ${isCurrent ? 'fill-current' : ''}`} aria-hidden="true" />
                  )}
                  <span>{stage.shortLabel}</span>
                  <span className="sr-only">
                    {' — '}
                    {t(
                      isCurrent
                        ? 'room.stage.sr.current'
                        : isCompleted
                          ? 'room.stage.sr.completed'
                          : isSkipped
                            ? 'room.stage.sr.skipped'
                            : stage.state === 'optional'
                              ? 'room.stage.sr.optional'
                              : 'room.stage.sr.upcoming'
                    )}
                  </span>
                </li>
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function InterviewCountdownTimer({
  serverRemainingSeconds,
  startedAt,
  durationMinutes,
  isClosed,
}: {
  serverRemainingSeconds?: number;
  startedAt?: string | null;
  durationMinutes?: number;
  isClosed: boolean;
}) {
  const { t } = useLanguage();
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    Number.isFinite(serverRemainingSeconds) && (serverRemainingSeconds as number) >= 0
      ? Math.floor(serverRemainingSeconds as number)
      : null
  );

  useEffect(() => {
    const snapshotAtMs = Date.now();
    const updateRemaining = () => {
      setSecondsRemaining(
        calculateRemainingSeconds({
          serverRemainingSeconds,
          snapshotAtMs,
          startedAt,
          durationMinutes,
          nowMs: Date.now(),
        })
      );
    };
    const initialUpdate = window.setTimeout(updateRemaining, 0);
    const timer = isClosed ? undefined : window.setInterval(updateRemaining, 1000);
    return () => {
      window.clearTimeout(initialUpdate);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [durationMinutes, isClosed, serverRemainingSeconds, startedAt]);

  if (secondsRemaining === null) return null;
  if (isClosed) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE4F3] bg-[#F7F9FD] px-2.5 py-1.5 text-xs font-semibold text-[#607096] sm:px-3">
        <Clock className="size-3.5" />
        <span>{t('room.timer.stopped')}</span>
      </div>
    );
  }

  // A session keeps going past its nominal time to finish its stages (Core
  // demo_mode); a frozen 00:00 or a warning colour next to a live interviewer
  // only adds pressure, so say calmly that it is wrapping up.
  if (secondsRemaining === 0) {
    return (
      <div
        role="status"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#DCE4F3] bg-[#F7F9FD] px-2.5 py-1.5 text-xs font-semibold text-[#607096] sm:px-3"
      >
        <Clock className="size-3.5" />
        <span>{t('room.timer.overtime')}</span>
      </div>
    );
  }

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const tone = getTimerTone(secondsRemaining, durationMinutes);
  const isLow = tone === 'low';
  const isCritical = tone === 'critical';

  return (
    <div
      aria-label={fmt(t('room.timer.remainingAria'), { time: formatted })}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold sm:px-3 ${
        isCritical
          ? 'border-[#F5C2C2] bg-[#FDF2F2] text-[#C43B3B]'
          : isLow
            ? 'border-[#F6DFA3] bg-[#FFF8E6] text-[#8A5A00]'
            : 'border-[#DCE4F3] bg-[#F7F9FD] text-[#14244B]'
      }`}
    >
      <Clock className="size-3.5" />
      <span className="tabular-nums">{formatted}</span>
      <span className="hidden font-normal opacity-80 md:inline">{t('room.timer.remaining')}</span>
    </div>
  );
}
