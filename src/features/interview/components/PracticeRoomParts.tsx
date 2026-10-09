'use client';

/**
 * Presentational pieces of the CV–JD practice room. State and API calls stay
 * in StructuredTextInterview; these only render what they are given, on the
 * same workspace palette as the chat room (ChatRoomParts).
 */

import React from 'react';
import { ArrowLeft, CheckCircle2, Lightbulb, ListOrdered, Lock, LogOut, Target } from 'lucide-react';
import type { InterviewFrozenTurn } from '../services/interviewRuntime.service';

export type PracticeTurnState = 'answered' | 'current' | 'locked';

export function practiceTurnState(turn: InterviewFrozenTurn, currentTurnId?: string | null): PracticeTurnState {
  if (turn.status === 'ANSWERED' || turn.status === 'EVALUATED') return 'answered';
  if (turn.turnId === currentTurnId) return 'current';
  return 'locked';
}

const DIFFICULTY_LABEL: Record<string, string> = {
  foundational: 'Cơ bản',
  intermediate: 'Trung bình',
  advanced: 'Nâng cao',
};

export function difficultyLabel(value?: string | null): string | null {
  if (!value) return null;
  return DIFFICULTY_LABEL[value.toLowerCase()] ?? value;
}

const QUESTION_TYPE: Record<string, { label: string; tip: string }> = {
  technical: {
    label: 'Kỹ thuật',
    tip: 'Nêu khái niệm cốt lõi → cách bạn đã áp dụng → trade-off hoặc lưu ý khi dùng.',
  },
  behavioral: {
    label: 'Hành vi',
    tip: 'Trả lời theo STAR: Bối cảnh → Nhiệm vụ → Hành động của bạn → Kết quả đo được.',
  },
  validate_cv: {
    label: 'Xác minh CV',
    tip: 'Kể cụ thể vai trò của bạn trong dự án trên CV, công nghệ đã dùng và kết quả.',
  },
  warm_up: {
    label: 'Khởi động',
    tip: 'Giới thiệu ngắn gọn kinh nghiệm liên quan nhất tới vị trí đang ứng tuyển.',
  },
};

const DEFAULT_TIP = 'Trả lời có luận điểm rõ ràng, kèm ví dụ thực tế từ kinh nghiệm của bạn.';

export function questionTypeInfo(value?: string | null): { label: string | null; tip: string } {
  const info = value ? QUESTION_TYPE[value.toLowerCase()] : undefined;
  return { label: info?.label ?? null, tip: info?.tip ?? DEFAULT_TIP };
}

// ── Header ───────────────────────────────────────────────────────────────────

export function PracticeHeader({
  jobTitle,
  isClosed,
  answered,
  total,
  onBack,
  onEnd,
}: {
  jobTitle?: string;
  isClosed: boolean;
  answered: number;
  total: number;
  onBack: () => void;
  onEnd: () => void;
}) {
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <header className="shrink-0 border-b border-[#DCE4F3] bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-6">
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
            <h1 className="truncate text-sm font-bold text-[#14244B] sm:text-base">{jobTitle || 'Luyện tập theo CV–JD'}</h1>
            <p className="flex items-center gap-1.5 text-xs text-[#607096]">
              <span
                className={`size-2 shrink-0 rounded-full ${isClosed ? 'bg-[#A0AEC0]' : 'bg-emerald-500'}`}
                aria-hidden="true"
              />
              <span className="truncate">
                {isClosed ? 'Đã hoàn tất' : 'Đang luyện tập'}
                {jobTitle ? ' · Luyện tập theo CV–JD' : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right" aria-label={`Đã trả lời ${answered} trên ${total} câu`}>
            <p className="text-[11px] font-semibold text-[#607096]">Tiến độ</p>
            <p className="text-sm font-bold tabular-nums text-[#14244B]">
              {answered}/{total}
              <span className="hidden font-semibold text-[#607096] sm:inline"> câu</span>
            </p>
          </div>
          {isClosed ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#204195] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#183273]"
            >
              Rời phòng
            </button>
          ) : (
            <button
              type="button"
              onClick={onEnd}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Kết thúc</span>
              <span className="sr-only sm:hidden">Kết thúc luyện tập</span>
            </button>
          )}
        </div>
      </div>
      <div
        className="h-1 w-full bg-[#EEF2FD]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Tiến độ luyện tập"
      >
        <div className="h-full bg-[#204195] transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </header>
  );
}

// ── Question navigation ──────────────────────────────────────────────────────

const STATE_LABEL: Record<PracticeTurnState, string> = {
  answered: 'Đã trả lời',
  current: 'Đang trả lời',
  locked: 'Sắp tới',
};

/** Compact Câu 1…N strip shown below lg, where the sidebar is hidden. */
export function PracticeTurnStepper({
  turns,
  currentTurnId,
  selectedTurnId,
  onSelect,
}: {
  turns: InterviewFrozenTurn[];
  currentTurnId?: string | null;
  selectedTurnId?: string | null;
  onSelect: (turnId: string) => void;
}) {
  return (
    <nav aria-label="Danh sách câu hỏi" className="border-b border-[#DCE4F3] bg-white lg:hidden">
      <ol className="relative flex gap-2 overflow-x-auto px-3 py-2.5 sm:px-6">
        {turns.map((turn, index) => {
          const state = practiceTurnState(turn, currentTurnId);
          const selected = turn.turnId === selectedTurnId;
          const tone =
            state === 'answered'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : state === 'current'
                ? 'border-[#204195] bg-[#EEF2FD] text-[#204195]'
                : 'border-[#DCE4F3] bg-[#F7F9FD] text-[#A0AEC0]';
          return (
            <li key={turn.turnId} className="shrink-0">
              <button
                type="button"
                data-state={state}
                disabled={state === 'locked'}
                onClick={() => onSelect(turn.turnId)}
                aria-current={selected ? 'step' : undefined}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition disabled:cursor-not-allowed ${tone} ${selected ? 'ring-2 ring-[#204195]/30' : ''}`}
              >
                {state === 'answered' ? <CheckCircle2 className="size-3" aria-hidden="true" /> : null}
                {state === 'locked' ? <Lock className="size-3" aria-hidden="true" /> : null}
                Câu {index + 1}
                <span className="sr-only"> — {STATE_LABEL[state]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function PracticeSidebar({
  turns,
  currentTurnId,
  selectedTurnId,
  targets,
  onSelect,
}: {
  turns: InterviewFrozenTurn[];
  currentTurnId?: string | null;
  selectedTurnId?: string | null;
  targets?: Array<{ conceptId: string; label: string; targetQuestionCount?: number }>;
  onSelect: (turnId: string) => void;
}) {
  return (
    <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-r border-[#DCE4F3] bg-white lg:flex">
      <section className="border-b border-[#DCE4F3] p-4">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#607096]">
          <Lightbulb className="size-3.5 text-[#204195]" aria-hidden="true" />
          Cách luyện tập
        </h2>
        <ol className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-[#14244B]">
          <li>1. Đọc câu hỏi và gợi ý cách trả lời.</li>
          <li>2. Viết câu trả lời, bấm “Gửi” (hoặc Ctrl + Enter).</li>
          <li>3. Câu đã gửi được khóa; trả lời hết để nhận báo cáo.</li>
        </ol>
      </section>

      {targets && targets.length > 0 ? (
        <section className="border-b border-[#DCE4F3] p-4">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#607096]">
            <Target className="size-3.5 text-[#204195]" aria-hidden="true" />
            Năng lực đánh giá ({targets.length})
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {targets.map((target) => (
              <span
                key={target.conceptId}
                className="inline-flex items-center rounded-lg border border-[#DCE4F3] bg-[#F7F9FD] px-2 py-1 text-[11px] font-medium text-[#14244B]"
              >
                {target.label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex-1 p-4">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#607096]">
          <ListOrdered className="size-3.5 text-[#204195]" aria-hidden="true" />
          Danh sách câu hỏi
        </h2>
        <ol className="mt-3 space-y-2">
          {turns.map((turn, index) => {
            const state = practiceTurnState(turn, currentTurnId);
            const selected = turn.turnId === selectedTurnId;
            return (
              <li key={turn.turnId}>
                <button
                  type="button"
                  data-state={state}
                  disabled={state === 'locked'}
                  onClick={() => onSelect(turn.turnId)}
                  aria-current={selected ? 'step' : undefined}
                  className={`w-full rounded-xl border p-3 text-left text-xs transition ${
                    selected
                      ? 'border-[#204195] bg-[#EEF2FD]'
                      : state === 'locked'
                        ? 'cursor-not-allowed border-[#DCE4F3] bg-[#F7F9FD] opacity-70'
                        : 'border-[#DCE4F3] bg-white hover:border-[#204195]/40 hover:bg-[#F7F9FD]'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-bold text-[#14244B]">Câu {index + 1}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        state === 'answered'
                          ? 'text-emerald-700'
                          : state === 'current'
                            ? 'text-[#204195]'
                            : 'font-medium text-[#607096]'
                      }`}
                    >
                      {state === 'answered' ? <CheckCircle2 className="size-3" aria-hidden="true" /> : null}
                      {state === 'current' ? (
                        <span className="size-1.5 rounded-full bg-[#204195] motion-safe:animate-pulse" aria-hidden="true" />
                      ) : null}
                      {state === 'locked' ? <Lock className="size-3" aria-hidden="true" /> : null}
                      {STATE_LABEL[state]}
                    </span>
                  </span>
                  {/* Planned questions stay hidden until their turn. */}
                  <span className="mt-1 line-clamp-2 block text-[11px] text-[#607096]">
                    {state === 'locked'
                      ? 'Nội dung câu hỏi sẽ hiển thị khi đến lượt.'
                      : turn.question?.questionText || 'Đang chờ nạp nội dung...'}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </aside>
  );
}

// ── Question card ────────────────────────────────────────────────────────────

export function PracticeQuestionCard({ turn, total }: { turn: InterviewFrozenTurn; total: number }) {
  const type = questionTypeInfo(turn.question?.questionType);
  const difficulty = difficultyLabel(turn.question?.difficulty);
  return (
    <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold uppercase tracking-wider text-[#204195]">
          Câu hỏi {turn.turnIndex + 1} / {total}
        </span>
        {type.label ? (
          <span className="rounded-md bg-[#EEF2FD] px-2 py-0.5 font-semibold text-[#204195]">{type.label}</span>
        ) : null}
        {difficulty ? (
          <span className="rounded-md border border-[#DCE4F3] bg-[#F7F9FD] px-2 py-0.5 font-medium text-[#607096]">
            Độ khó: {difficulty}
          </span>
        ) : null}
      </div>

      <h2 className="mt-3 text-lg font-bold leading-relaxed text-[#14244B] sm:text-xl">
        {turn.question?.questionText || 'Đang tải câu hỏi...'}
      </h2>

      {turn.question?.objective ? (
        <p className="mt-3 text-xs leading-relaxed text-[#607096]">
          <strong className="text-[#14244B]">Mục tiêu:</strong> {turn.question.objective}
        </p>
      ) : null}

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F7F9FD] p-3 text-xs leading-relaxed text-[#14244B]">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#204195]" aria-hidden="true" />
        <p>
          <strong>Gợi ý trả lời:</strong> {type.tip}
        </p>
      </div>
    </section>
  );
}
