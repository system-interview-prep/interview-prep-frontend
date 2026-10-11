'use client';

/**
 * Presentational pieces of the CV–JD practice room. State and API calls stay
 * in StructuredTextInterview; these only render what they are given, on the
 * same workspace palette as the chat room (ChatRoomParts).
 */

import React from 'react';
import { ArrowLeft, CheckCircle2, Lock, LogOut } from 'lucide-react';
import type { InterviewFrozenTurn } from '../services/interviewRuntime.service';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt } from '@/i18n/format';
import { roomVi } from '@/i18n/dicts/room.dict';

type Translate = (key: string) => string;

const viT: Translate = (k) => roomVi[k] ?? k;

export type PracticeTurnState = 'answered' | 'current' | 'locked';

export function practiceTurnState(turn: InterviewFrozenTurn, currentTurnId?: string | null): PracticeTurnState {
  if (turn.status === 'ANSWERED' || turn.status === 'EVALUATED') return 'answered';
  if (turn.turnId === currentTurnId) return 'current';
  return 'locked';
}

const DIFFICULTY_KEY: Record<string, string> = {
  foundational: 'room.practice.difficulty.foundational',
  intermediate: 'room.practice.difficulty.intermediate',
  advanced: 'room.practice.difficulty.advanced',
};

export function difficultyLabel(value?: string | null, t?: Translate): string | null {
  if (!value) return null;
  const key = DIFFICULTY_KEY[value.toLowerCase()];
  return key ? (t ?? viT)(key) : value;
}

/** Question type → dictionary id: `room.practice.type.<id>.label|tip`. */
const QUESTION_TYPE_ID: Record<string, string> = {
  technical: 'technical',
  behavioral: 'behavioral',
  validate_cv: 'validateCv',
  warm_up: 'warmUp',
};

export function questionTypeInfo(value?: string | null, t?: Translate): { label: string | null; tip: string } {
  const tr = t ?? viT;
  const id = value ? QUESTION_TYPE_ID[value.toLowerCase()] : undefined;
  return id
    ? { label: tr(`room.practice.type.${id}.label`), tip: tr(`room.practice.type.${id}.tip`) }
    : { label: null, tip: tr('room.practice.defaultTip') };
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
  const { t } = useLanguage();
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <header className="shrink-0 border-b border-[#DCE4F3] bg-white">
      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-6">
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
            <h1 className="truncate text-sm font-bold text-[#14244B] sm:text-base">{jobTitle || t('room.practice.defaultTitle')}</h1>
            <p className="flex items-center gap-1.5 text-xs text-[#607096]">
              <span
                className={`size-2 shrink-0 rounded-full ${isClosed ? 'bg-[#A0AEC0]' : 'bg-[#287A4B]'}`}
                aria-hidden="true"
              />
              <span className="truncate">
                {isClosed ? t('room.practice.done') : t('room.practice.active')}
                {jobTitle ? ` · ${t('room.practice.defaultTitle')}` : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right" aria-label={fmt(t('room.practice.progressAria'), { answered, total })}>
            <p className="text-[11px] font-semibold text-[#607096]">{t('room.practice.progress')}</p>
            <p className="text-sm font-bold tabular-nums text-[#14244B]">
              {answered}/{total}
              <span className="hidden font-semibold text-[#607096] sm:inline"> {t('room.practice.questionsUnit')}</span>
            </p>
          </div>
          {isClosed ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#204195] px-4 text-xs font-semibold text-white transition hover:bg-[#183275]"
            >
              {t('room.common.leaveRoom')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onEnd}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#FDF2F2] px-3.5 text-xs font-semibold text-[#C43B3B] transition hover:bg-[#FBE6E6]"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t('room.common.end')}</span>
              <span className="sr-only sm:hidden">{t('room.practice.endPractice')}</span>
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
        aria-label={t('room.practice.progressbarAria')}
      >
        <div className="h-full bg-[#204195] transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </header>
  );
}

// ── Question navigation ──────────────────────────────────────────────────────

const STATE_LABEL_KEY: Record<PracticeTurnState, string> = {
  answered: 'room.practice.state.answered',
  current: 'room.practice.state.current',
  locked: 'room.practice.state.locked',
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
  const { t } = useLanguage();
  return (
    <nav aria-label={t('room.practice.questionList')} className="border-b border-[#DCE4F3] bg-white lg:hidden">
      <ol className="relative flex gap-2 overflow-x-auto px-3 py-2.5 sm:px-6">
        {turns.map((turn, index) => {
          const state = practiceTurnState(turn, currentTurnId);
          const selected = turn.turnId === selectedTurnId;
          const tone =
            state === 'answered'
              ? 'border-[#BFDFCB] bg-[#EAF5EE] text-[#287A4B]'
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
                {fmt(t('room.common.questionN'), { n: index + 1 })}
                <span className="sr-only"> — {t(STATE_LABEL_KEY[state])}</span>
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
  const { t } = useLanguage();
  return (
    <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-r border-[#DCE4F3] bg-white lg:flex">
      <section className="border-b border-[#DCE4F3] p-4">
        <h2 className="flex items-center gap-2 text-[12px] font-semibold text-[#204195]">
          {t('room.practice.howTo')}
        </h2>
        <ol className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-[#14244B]">
          <li>{t('room.practice.howTo.step1')}</li>
          <li>{t('room.practice.howTo.step2')}</li>
          <li>{t('room.practice.howTo.step3')}</li>
        </ol>
      </section>

      {targets && targets.length > 0 ? (
        <section className="border-b border-[#DCE4F3] p-4">
          <h2 className="text-[12px] font-semibold text-[#204195]">
            {fmt(t('room.practice.targets'), { n: targets.length })}
          </h2>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {targets.map((target) => (
              <span
                key={target.conceptId}
                className="inline-flex items-center rounded-full bg-[#F7F9FD] px-2.5 py-1 text-[11px] font-medium text-[#14244B] ring-1 ring-[#DCE4F3]"
              >
                {target.label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex-1 p-4">
        <h2 className="text-[12px] font-semibold text-[#204195]">
          {t('room.practice.questionList')}
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
                  className={`w-full rounded-2xl border p-3 text-left text-xs transition ${
                    selected
                      ? 'border-[#204195] bg-[#EEF2FD]/60'
                      : state === 'locked'
                        ? 'cursor-not-allowed border-[#DCE4F3] bg-[#F7F9FD] opacity-70'
                        : 'border-[#DCE4F3] bg-white hover:border-[#204195]/40 hover:bg-[#F7F9FD]'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-bold text-[#14244B]">{fmt(t('room.common.questionN'), { n: index + 1 })}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        state === 'answered'
                          ? 'text-[#287A4B]'
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
                      {t(STATE_LABEL_KEY[state])}
                    </span>
                  </span>
                  {/* Planned questions stay hidden until their turn. */}
                  <span className="mt-1 line-clamp-2 block text-[11px] text-[#607096]">
                    {state === 'locked'
                      ? t('room.practice.lockedText')
                      : turn.question?.questionText || t('room.practice.loadingContent')}
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
  const { t } = useLanguage();
  const type = questionTypeInfo(turn.question?.questionType, t);
  const difficulty = difficultyLabel(turn.question?.difficulty, t);
  return (
    <section className="rounded-3xl border border-[#DCE4F3] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-[#204195]">
          {fmt(t('room.practice.cardTitle'), { n: turn.turnIndex + 1, total })}
        </span>
        {type.label ? (
          <span className="rounded-full bg-[#EEF2FD] px-2.5 py-0.5 font-semibold text-[#204195]">{type.label}</span>
        ) : null}
        {difficulty ? (
          <span className="rounded-full bg-[#F7F9FD] px-2.5 py-0.5 font-medium text-[#607096] ring-1 ring-[#DCE4F3]">
            {fmt(t('room.practice.difficulty'), { d: difficulty })}
          </span>
        ) : null}
      </div>

      <h2 className="mt-3 font-display text-xl font-semibold leading-snug text-[#14244B] sm:text-2xl">
        {turn.question?.questionText || t('room.practice.loadingQuestion')}
      </h2>

      {turn.question?.objective ? (
        <p className="mt-3 text-xs leading-relaxed text-[#607096]">
          <strong className="text-[#14244B]">{t('room.practice.objective')}</strong> {turn.question.objective}
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl border-l-4 border-[#FCB625] bg-[#F0F4FC]/60 p-3 text-xs leading-relaxed text-[#14244B]">
        <p>
          <strong>{t('room.practice.tip')}</strong> {type.tip}
        </p>
      </div>
    </section>
  );
}
