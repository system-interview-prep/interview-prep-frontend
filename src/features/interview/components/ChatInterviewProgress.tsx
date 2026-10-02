'use client';

import React, { useEffect, useState } from 'react';
import { Check, Circle, Clock, Minus, TriangleAlert } from 'lucide-react';
import type {
  ChatRuntimeTurn,
  EndReason,
  InterviewStage,
} from '../services/interviewChat.service';

export const CHAT_STAGE_DEFINITIONS: ReadonlyArray<{
  key: InterviewStage;
  label: string;
  shortLabel: string;
}> = [
  { key: 'WARM_UP', label: 'Mở đầu', shortLabel: 'Mở đầu' },
  { key: 'VALIDATE', label: 'CV / kinh nghiệm', shortLabel: 'CV' },
  { key: 'DEEP_DIVE', label: 'Chuyên môn', shortLabel: 'Chuyên môn' },
  { key: 'CHALLENGE', label: 'Thử thách', shortLabel: 'Thử thách' },
  { key: 'BEHAVIORAL', label: 'Hành vi', shortLabel: 'Hành vi' },
  { key: 'CLOSING', label: 'Hỏi đáp', shortLabel: 'Hỏi đáp' },
  { key: 'CLOSED', label: 'Hoàn tất', shortLabel: 'Xong' },
];

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
}: {
  currentStage?: string | null;
  sessionStatus: 'OPEN' | 'CLOSED';
  turns?: ChatRuntimeTurn[];
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
    return { ...stage, state };
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

export function getStageLabel(stage?: string | null): string | null {
  const normalized = normalizeInterviewStage(stage);
  return CHAT_STAGE_DEFINITIONS.find((item) => item.key === normalized)?.label ?? null;
}

export function getEndReasonLabel(reason?: EndReason | null): string {
  switch (reason) {
    case 'USER_ENDED':
    case 'CANDIDATE_ABORT':
      return 'Đã dừng theo yêu cầu';
    case 'HARD_TIMEOUT':
      return 'Đã kết thúc do hết thời gian';
    case 'FAST_FAIL_TECH':
    case 'FAST_FAIL_VALIDATION':
      return 'Phiên đã kết thúc sớm';
    case 'TECHNICAL_FAILURE':
      return 'Đã dừng do lỗi hệ thống';
    case 'COMPLETED':
    case 'NORMAL_COMPLETION':
    default:
      return 'Đã hoàn tất';
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

export function ChatStageStepper({
  currentStage,
  sessionStatus,
  turns,
}: {
  currentStage?: string | null;
  sessionStatus: 'OPEN' | 'CLOSED';
  turns?: ChatRuntimeTurn[];
}) {
  const progress = deriveChatStageProgress({ currentStage, sessionStatus, turns });

  return (
    <section aria-label="Tiến độ các giai đoạn phỏng vấn" className="border-b border-slate-200/80 bg-white/90">
      {progress.unknownStage && (
        <div
          role="status"
          className="mx-auto flex max-w-4xl items-center gap-2 px-4 pt-2 text-xs font-medium text-amber-700 sm:px-6"
        >
          <TriangleAlert className="size-3.5 shrink-0" />
          <span>Giai đoạn hiện tại chưa được nhận diện; hội thoại vẫn được giữ nguyên.</span>
        </div>
      )}
      <div className="mx-auto max-w-4xl overflow-x-auto px-4 py-2.5 sm:px-6">
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
                      isCompleted || isCurrent ? 'bg-indigo-400' : 'bg-slate-200'
                    }`}
                  />
                )}
                <li
                  data-stage={stage.key}
                  data-state={stage.state}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold sm:px-3 ${
                    isCurrent
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-100'
                      : isCompleted
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : isSkipped
                          ? 'border-dashed border-slate-200 bg-white text-slate-400'
                          : stage.state === 'optional'
                            ? 'border-dashed border-slate-200 bg-slate-50 text-slate-400'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                  title={
                    isSkipped
                      ? `${stage.label}: không xuất hiện trong phiên này`
                      : stage.state === 'optional'
                        ? `${stage.label}: có thể được bỏ qua tùy diễn biến phiên`
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
                    {isCurrent
                      ? ' — hiện tại'
                      : isCompleted
                        ? ' — đã qua'
                        : isSkipped
                          ? ' — không có trong phiên'
                          : stage.state === 'optional'
                            ? ' — có thể được bỏ qua'
                            : ' — chưa tới'}
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
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 px-2.5 py-1.5 text-xs font-semibold text-slate-500 sm:px-3">
        <Clock className="size-3.5" />
        <span>Đồng hồ đã dừng</span>
      </div>
    );
  }

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isLow = secondsRemaining <= 300 && secondsRemaining > 120;
  const isCritical = secondsRemaining <= 120;

  return (
    <div
      aria-label={`Thời gian dự kiến còn lại ${formatted}`}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold sm:px-3 ${
        isCritical
          ? 'border-rose-300 bg-rose-50 text-rose-700'
          : isLow
            ? 'border-amber-300 bg-amber-50 text-amber-800'
            : 'border-slate-200 bg-slate-50 text-slate-700'
      }`}
    >
      <Clock className="size-3.5" />
      <span>{formatted}</span>
      <span className="hidden font-normal opacity-80 md:inline">dự kiến còn lại</span>
    </div>
  );
}
