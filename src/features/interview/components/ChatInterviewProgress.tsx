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

/** What happens in each stage and how to answer it, shown next to the chat. */
export const CHAT_STAGE_GUIDE: Record<
  Exclude<InterviewStage, 'CLOSED'>,
  { description: string; tip: string }
> = {
  WARM_UP: {
    description: 'Làm quen và giới thiệu ngắn về bản thân.',
    tip: 'Giới thiệu 3–4 câu: bạn là ai, kinh nghiệm gần nhất, vì sao quan tâm vị trí này.',
  },
  VALIDATE: {
    description: 'Xác thực một dự án hoặc kinh nghiệm có trong CV.',
    tip: 'Nói rõ vai trò của bạn, công nghệ đã dùng và kết quả đo được.',
  },
  DEEP_DIVE: {
    description: 'Câu hỏi chuyên môn theo kỹ năng JD yêu cầu.',
    tip: 'Giải thích khái niệm, đưa ví dụ thực tế và nêu đánh đổi (trade-off).',
  },
  CHALLENGE: {
    description: 'Câu hỏi khó hơn hoặc tình huống kỹ thuật.',
    tip: 'Nghĩ thành tiếng: nêu giả định, hướng giải quyết rồi mới đi vào chi tiết.',
  },
  BEHAVIORAL: {
    description: 'Tình huống thực tế trong công việc.',
    tip: 'Trả lời theo STAR: Bối cảnh → Nhiệm vụ → Hành động → Kết quả.',
  },
  CLOSING: {
    description: 'Bạn đặt câu hỏi cho nhà tuyển dụng.',
    tip: 'Hỏi tối đa 2 câu về công việc, đội ngũ hoặc công ty. Không có câu hỏi thì gửi "Tôi không có câu hỏi nào".',
  },
};

export function getStageGuide(stage?: string | null) {
  const normalized = normalizeInterviewStage(stage);
  return normalized && normalized !== 'CLOSED' ? CHAT_STAGE_GUIDE[normalized] : null;
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
  const progress = deriveChatStageProgress({ currentStage, sessionStatus, turns });

  return (
    <section aria-label="Tiến độ các giai đoạn phỏng vấn" className="border-b border-[#DCE4F3] bg-white">
      {progress.unknownStage && (
        <div
          role="status"
          className="mx-auto flex max-w-4xl items-center gap-2 px-4 pt-2 text-xs font-medium text-amber-700 sm:px-6"
        >
          <TriangleAlert className="size-3.5 shrink-0" />
          <span>Giai đoạn hiện tại chưa được nhận diện; hội thoại vẫn được giữ nguyên.</span>
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
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : isSkipped
                          ? 'border-dashed border-[#DCE4F3] bg-white text-[#A0AEC0]'
                          : stage.state === 'optional'
                            ? 'border-dashed border-[#DCE4F3] bg-[#F7F9FD] text-[#A0AEC0]'
                            : 'border-[#DCE4F3] bg-[#F7F9FD] text-[#607096]'
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
      <div className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-[#F7F9FD] px-2.5 py-1.5 text-xs font-semibold text-[#607096] sm:px-3">
        <Clock className="size-3.5" />
        <span>Đồng hồ đã dừng</span>
      </div>
    );
  }

  // A demo session keeps going past its nominal time to finish its stages
  // (Core demo_mode); a frozen red 00:00 next to a live interviewer misleads.
  if (secondsRemaining === 0) {
    return (
      <div
        role="status"
        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 sm:px-3"
      >
        <Clock className="size-3.5" />
        <span>Quá giờ dự kiến</span>
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
      aria-label={`Thời gian dự kiến còn lại ${formatted}`}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold sm:px-3 ${
        isCritical
          ? 'border-rose-300 bg-rose-50 text-rose-700'
          : isLow
            ? 'border-amber-300 bg-amber-50 text-amber-800'
            : 'border-[#DCE4F3] bg-[#F7F9FD] text-[#14244B]'
      }`}
    >
      <Clock className="size-3.5" />
      <span className="tabular-nums">{formatted}</span>
      <span className="hidden font-normal opacity-80 md:inline">dự kiến còn lại</span>
    </div>
  );
}
