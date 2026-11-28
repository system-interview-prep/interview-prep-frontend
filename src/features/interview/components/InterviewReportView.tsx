'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Link from 'next/link';
import { ProgressComparisonCard } from '@features/progress/components/ProgressComparisonCard';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flag,
  Layers,
  LayoutDashboard,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import type { EvaluationReport, TurnEvaluation } from '../services/interviewReport.service';
import type { ChatMessage } from '../services/interviewChat.service';
import type { InterviewRuntimeSession } from '../services/interviewRuntime.service';
import { endReasonKey, getStageLabel } from './ChatInterviewProgress';
import {
  LEVEL_LABEL_KEY,
  calibrate,
  locateQuotes,
  scoreToLevel,
  transcriptByTurn,
  turnDurationSeconds,
  type DebriefLevel,
  type TranscriptLine,
} from '../utils/debrief';
import { MODE_NAME_KEY, modeKeyFromRuntime } from '../utils/interviewModes';
import { useLanguage } from '@/i18n/LanguageProvider';
import { fmt, localeOf } from '@/i18n/format';

export interface ReflectionState {
  selfRatings: Record<string, number>;
  takeaway: string | null;
  submitted: boolean;
}

export interface InterviewReportViewProps {
  report: EvaluationReport;
  onBack?: () => void;
  /** Session context (job, mode, dates, end reason). Optional: the report still renders without it. */
  session?: (InterviewRuntimeSession & { endReason?: string | null }) | null;
  /** Full chat transcript; enables the per-question exchange view. */
  messages?: ChatMessage[] | null;
  /** Saved reflection; `null` while unknown or unavailable. */
  reflection?: ReflectionState | null;
  /** Persists the reflection. Must not throw: failures are reported via the returned boolean. */
  onSaveReflection?: (reflection: { selfRatings: Record<string, number>; takeaway: string | null }) => Promise<boolean>;
}

type Translate = (key: string) => string;

const LEVEL_MEANING_KEY: Record<DebriefLevel, string> = {
  1: 'report.levelMeaning.1',
  2: 'report.levelMeaning.2',
  3: 'report.levelMeaning.3',
  4: 'report.levelMeaning.4',
};

const LEVEL_TONE: Record<DebriefLevel, string> = {
  1: 'bg-[#FDF2F2] text-[#C43B3B] border-[#F5C2C2]',
  2: 'bg-[#FFF8E6] text-[#8A5A00] border-[#F6DFA3]',
  3: 'bg-[#EEF2FD] text-[#204195] border-[#C9D5F2]',
  4: 'bg-[#EAF5EE] text-[#287A4B] border-[#BFDFCB]',
};

const KIND_LABEL_KEY: Record<string, string> = {
  MAIN_QUESTION: 'report.kind.MAIN_QUESTION',
  PROBE: 'report.kind.PROBE',
  CLARIFY: 'report.kind.CLARIFY',
  CANDIDATE_ANSWER: 'report.kind.CANDIDATE_ANSWER',
  CANDIDATE_QUESTION: 'report.kind.CANDIDATE_QUESTION',
};

// STAR is only extracted by the backend for these stages.
const STAR_STAGES = new Set(['VALIDATE', 'BEHAVIORAL']);

function turnIdOf(t: TurnEvaluation): string {
  return t.turn_id || t.turnId || t.id || '';
}

function formatDuration(t: Translate, seconds: number): string {
  if (seconds < 60) return fmt(t('report.duration.seconds'), { n: seconds });
  return fmt(t('common.minutes'), { n: Math.round(seconds / 60) });
}

function LevelChip({ level, prefix }: { level: DebriefLevel; prefix?: string }) {
  const { t } = useLanguage();
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-bold tracking-wide ${LEVEL_TONE[level]}`}>
      {prefix}
      {t(LEVEL_LABEL_KEY[level])}
    </span>
  );
}

function getScoreColor(score: number): string {
  if (score >= 7.5) return '#287A4B'; // Green
  if (score >= 5.0) return '#204195'; // Blue
  if (score >= 3.0) return '#D97706'; // Amber/Yellow
  return '#C43B3B'; // Red
}

/** Candidate lines with evidence quotes highlighted; reports quotes found nowhere. */
function TurnExchange({ lines, quotes }: { lines: TranscriptLine[]; quotes: string[] }) {
  const { t } = useLanguage();
  const found = new Set<string>();
  const rendered = lines.map((line) => {
    if (line.speaker !== 'candidate') return { line, segments: null };
    const { segments, unmatched } = locateQuotes(line.content, quotes);
    quotes.forEach((quote) => {
      if (!unmatched.includes(quote)) found.add(quote);
    });
    return { line, segments };
  });
  const missing = quotes.filter((quote) => quote.trim().length >= 3 && !found.has(quote));

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {rendered.map(({ line, segments }) => (
          <li
            key={line.messageId}
            className={`grid gap-1.5 rounded-2xl px-4 py-3 text-[13px] leading-6 sm:grid-cols-[115px_1fr] ${
              line.speaker === 'candidate'
                ? 'border border-[#DCE4F3] bg-white shadow-xs'
                : 'border border-[#EBF0FA] bg-[#F7F9FD]'
            }`}
          >
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                line.speaker === 'candidate' ? 'text-[#607096]' : 'text-[#204195]'
              }`}
            >
              {KIND_LABEL_KEY[line.kind] ? t(KIND_LABEL_KEY[line.kind]) : line.kind}
            </span>
            <span className="min-w-0 whitespace-pre-wrap break-words text-[#14244B]">
              {segments
                ? segments.map((segment, index) =>
                    segment.quoted ? (
                      <mark
                        key={index}
                        className="rounded-sm bg-amber-100/90 px-1 py-0.5 text-[#14244B] underline decoration-amber-500 decoration-2 underline-offset-2"
                        title={t('report.exchange.evidenceTitle')}
                      >
                        {segment.text}
                      </mark>
                    ) : (
                      <React.Fragment key={index}>{segment.text}</React.Fragment>
                    )
                  )
                : line.content}
            </span>
          </li>
        ))}
      </ol>
      {quotes.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-[#607096]">
          <mark className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-[#14244B] underline decoration-amber-500">
            {t('report.exchange.legendMark')}
          </mark>
          <span>{t('report.exchange.legendText')}</span>
        </p>
      )}
      {missing.length > 0 && (
        <div className="rounded-2xl border border-[#DCE4F3] bg-[#F7F9FD] p-3 text-xs text-[#607096]">
          <p className="font-semibold text-[#14244B]">
            {fmt(t('report.exchange.unmatchedTitle'), { n: missing.length })}
          </p>
          <p className="mt-0.5">{t('report.exchange.unmatchedBody')}</p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 italic">
            {missing.map((quote) => (
              <li key={quote}>&ldquo;{quote}&rdquo;</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const InterviewReportView: React.FC<InterviewReportViewProps> = ({
  report,
  onBack,
  session,
  messages,
  reflection,
  onSaveReflection,
}) => {
  const { t, lang } = useLanguage();
  const overallRaw = report.overall_score ?? report.overallScore;
  const overallScore = typeof overallRaw === 'number' ? overallRaw : null;
  const candidateFeedback = report.candidate_feedback ?? report.candidateFeedback ?? '';
  const nextRoundTopics = report.next_round_topics ?? report.nextRoundTopics ?? [];
  const redFlags = report.red_flags ?? report.redFlags ?? [];
  const rawCompetencies = report.competency_scores ?? report.competencyScores ?? [];
  const rawTurns = useMemo(() => report.turn_evaluations ?? report.turnEvaluations ?? [], [report]);

  const competencyScores = useMemo(() => {
    return rawCompetencies.map((c) => ({
      competency: c.competency,
      score: typeof c.score === 'number' ? c.score : parseFloat(String(c.score || 0)),
      summary: c.summary,
    }));
  }, [rawCompetencies]);

  const transcript = useMemo(() => (messages ? transcriptByTurn(messages) : new Map<string, TranscriptLine[]>()), [messages]);
  const ratableTurns = useMemo(
    () =>
      rawTurns
        // A not-gradable turn has no system score to calibrate against.
        .filter((turn) => turn.outcome !== 'NOT_GRADABLE')
        .map((turn) => ({
          turnId: turnIdOf(turn),
          score: Number(turn.score),
          question: turn.question_text ?? turn.questionText ?? '',
        }))
        .filter((turn) => turn.turnId && Number.isFinite(turn.score)),
    [rawTurns]
  );

  // ---- Tabs & Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'competencies' | 'questions'>('overview');
  const [questionFilter, setQuestionFilter] = useState<'all' | 'needsImprovement' | 'good'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ---- Reflection gate: rate before the scores are revealed (skippable).
  const [draftRatings, setDraftRatings] = useState<Record<string, number>>({});
  const [skipped, setSkipped] = useState(false);
  const [revealedNow, setRevealedNow] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [savingRatings, setSavingRatings] = useState(false);
  const savedRatings = reflection?.selfRatings ?? {};
  const ratings = reflection?.submitted ? savedRatings : draftRatings;
  const gateOpen =
    Boolean(onSaveReflection) && ratableTurns.length > 0 && reflection != null && !reflection.submitted && !skipped && !revealedNow;
  const allRated = ratableTurns.every((turn) => draftRatings[turn.turnId]);

  const reveal = async () => {
    setSavingRatings(true);
    const ok = onSaveReflection
      ? await onSaveReflection({ selfRatings: draftRatings, takeaway: reflection?.takeaway ?? null })
      : false;
    setSavingRatings(false);
    setRevealedNow(true);
    if (!ok) setSaveFailed(true);
  };

  // ---- Takeaway
  const [takeaway, setTakeaway] = useState(reflection?.takeaway ?? '');
  const [takeawayState, setTakeawayState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTakeaway = async () => {
    if (!onSaveReflection) return;
    setTakeawayState('saving');
    const ok = await onSaveReflection({ selfRatings: ratings, takeaway: takeaway.trim() || null });
    setTakeawayState(ok ? 'saved' : 'error');
  };

  const calibration = useMemo(() => calibrate(ratings, ratableTurns), [ratings, ratableTurns]);

  // ---- Per-question cards state: weakest starts open
  const weakestTurnId = useMemo(
    () =>
      ratableTurns.reduce<{ id: string; score: number } | null>(
        (low, turn) => (low == null || turn.score < low.score ? { id: turn.turnId, score: turn.score } : low),
        null
      )?.id ?? null,
    [ratableTurns]
  );
  const [openTurns, setOpenTurns] = useState<Set<string> | null>(null);
  const isTurnOpen = (id: string) => (openTurns ? openTurns.has(id) : id === weakestTurnId);
  const setTurnOpen = (id: string, open: boolean) =>
    setOpenTurns((prev) => {
      const next = new Set(prev ?? (weakestTurnId ? [weakestTurnId] : []));
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });

  const expandAllTurns = () => {
    setOpenTurns(new Set(rawTurns.map(turnIdOf)));
  };
  const collapseAllTurns = () => {
    setOpenTurns(new Set());
  };

  // Printing support: open every card and render all tabs during print
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => flushSync(() => setPrinting(false));
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  const answeredCount = rawTurns.length;
  const startedAt = session?.startedAt ? new Date(session.startedAt) : null;
  const endedAt = session?.endedAt ? new Date(session.endedAt) : null;
  const elapsedSeconds =
    startedAt && endedAt ? Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)) : null;
  const overallLevel = overallScore != null ? scoreToLevel(overallScore) : null;

  const contextItems = [
    session?.jobTitle ? [t('report.ctx.position'), session.jobTitle] : null,
    session?.mode ? [t('report.ctx.mode'), t(MODE_NAME_KEY[modeKeyFromRuntime(session.mode)])] : null,
    startedAt ? [t('report.ctx.date'), startedAt.toLocaleDateString(localeOf(lang))] : null,
    elapsedSeconds != null ? [t('report.ctx.duration'), formatDuration(t, elapsedSeconds)] : null,
    [t('report.ctx.graded'), String(answeredCount)],
    session ? [t('report.ctx.ended'), t(endReasonKey(session.endReason))] : null,
  ].filter((item): item is string[] => item != null);

  const heroBody = gateOpen
    ? t('uxInterview.report.heroGate')
    : overallLevel
      ? t(LEVEL_MEANING_KEY[overallLevel])
      : t('uxInterview.report.heroDone');

  // Filtered turns for Questions tab
  const filteredTurns = useMemo(() => {
    return rawTurns.filter((turn) => {
      const score = typeof turn.score === 'number' ? turn.score : parseFloat(String(turn.score ?? ''));
      const level = Number.isFinite(score) ? scoreToLevel(score) : null;
      if (questionFilter === 'needsImprovement' && (level === 3 || level === 4)) return false;
      if (questionFilter === 'good' && (level === 1 || level === 2)) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const text = (turn.question_text ?? turn.questionText ?? '').toLowerCase();
        const comp = (turn.competency ?? '').toLowerCase();
        const feedback = (turn.feedback ?? '').toLowerCase();
        if (!text.includes(query) && !comp.includes(query) && !feedback.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [rawTurns, questionFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 p-4 font-sans sm:p-6 lg:px-8 lg:py-8 print:max-w-none print:space-y-6 print:p-0">
      {/* =========================================================================
          1. HERO HEADER SECTION
         ========================================================================= */}
      <section className="anim-rise relative overflow-hidden rounded-2xl border border-[#DCE4F3] bg-gradient-to-br from-white via-[#FAFBFD] to-[#F1F5FD] p-5 shadow-[0_20px_50px_-35px_rgba(20,36,75,0.28)] sm:p-7 print:hidden">
        {/* Decorative soft backdrop glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-[#E3ECFD]/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 size-64 rounded-full bg-[#FCB625]/10 blur-3xl" />

        <div className={`relative grid gap-6 ${!gateOpen ? 'lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center' : ''}`}>
          <div className="min-w-0">
            {/* Top metadata tags */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9D5F2] bg-[#EEF2FD] px-3.5 py-1 text-xs font-bold text-[#204195]">
                <span className="size-2 rounded-full bg-[#204195] animate-pulse" />
                {t('report.page.badge')}
              </div>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs font-semibold text-[#607096] underline-offset-4 hover:text-[#204195] hover:underline"
                >
                  {t('report.page.backAria')}
                </button>
              )}
            </div>

            {/* Title & meaning */}
            <h1 className="mt-3 max-w-3xl font-display text-xl font-black leading-tight tracking-tight text-[#14244B] sm:text-2xl">
              {t('report.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607096]">{heroBody}</p>

            {/* Context chips */}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-[#E8EDF7] pt-4">
              {contextItems.map(([label, value]) => (
                <div
                  key={label}
                  className="inline-flex min-w-0 max-w-full items-baseline gap-1.5 rounded-xl border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs shadow-xs"
                >
                  <span className="shrink-0 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-[#8A99B8]">{label}:</span>
                  <span className="min-w-0 font-semibold text-[#14244B] [overflow-wrap:anywhere]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Overall score gauge card */}
          {!gateOpen && (
            <div className="relative flex flex-col items-center justify-center rounded-2xl border border-[#D3DDF0] bg-white/95 p-5 text-center shadow-[0_12px_35px_-25px_rgba(32,65,149,0.3)] backdrop-blur-sm sm:p-7">
              {overallScore != null && overallLevel ? (
                <>
                  <div className="relative grid size-32 place-items-center sm:size-40">
                    <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="stroke-[#EBF0FA]"
                        strokeWidth="9"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke={getScoreColor(overallScore)}
                        strokeWidth="9"
                        strokeDasharray={263.89}
                        strokeDashoffset={263.89 - (263.89 * Math.min(10, Math.max(0, overallScore))) / 10}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="font-display text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl">
                        {overallScore.toFixed(1)}
                      </span>
                      <span className="text-[11px] font-bold text-[#8A99B8]">/ 10</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-1.5">
                    <LevelChip level={overallLevel} prefix={t('report.levelPrefix')} />
                    <span className="text-[11px] font-medium text-[#8A99B8]">{t('report.hero.overallRating')}</span>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold text-[#607096]">{t('report.noOverall')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Print-only simplified header */}
      <div className="hidden rounded-2xl border border-[#DCE4F3] bg-white p-6 print:block print:break-inside-avoid">
        <h1 className="font-display text-xl font-black tracking-tight text-[#14244B] sm:text-2xl">{t('report.title')}</h1>
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#607096]">
          {contextItems.map(([label, value]) => (
            <div key={label} className="flex gap-1">
              <dt>{label}:</dt>
              <dd className="font-semibold text-[#14244B]">{value}</dd>
            </div>
          ))}
        </dl>
        {overallScore != null && (
          <p className="mt-4 font-display text-3xl font-semibold text-[#204195]">
            {overallScore.toFixed(1)} / 10
          </p>
        )}
      </div>

      <p className="-mt-4 flex items-start gap-2 px-2 text-[11px] leading-5 text-[#7C8BAA] print:mt-0 print:px-0">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#4B70C6]" />
        {t('report.disclaimer')}
      </p>

      {/* =========================================================================
          2. REFLECTION GATE (If user hasn't self-rated yet)
         ========================================================================= */}
      {gateOpen ? (
        <section className="rounded-2xl border border-[#C9D5F2] bg-white p-5 shadow-[0_20px_50px_-38px_rgba(32,65,149,0.35)] sm:p-6 print:break-inside-avoid">
          <div className="flex gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FD] text-[#204195] sm:flex">
              <Target className="size-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-[#14244B]">{t('report.gate.title')}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#607096]">{t('report.gate.body')}</p>
            </div>
          </div>
          <ol className="mt-6 grid gap-3 lg:grid-cols-2">
            {ratableTurns.map((turn, index) => (
              <li
                key={turn.turnId}
                className="rounded-2xl border border-[#DCE4F3] bg-[#FBFCFF] p-4.5 transition hover:border-[#B9C9EE]"
              >
                <p className="text-sm font-medium text-[#14244B] [overflow-wrap:anywhere]">
                  <span className="font-bold text-[#204195]">{fmt(t('report.questionN'), { n: index + 1 })}.</span>{' '}
                  {turn.question || t('report.questionEmpty')}
                </p>
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label={fmt(t('report.gate.rateAria'), { n: index + 1 })}
                >
                  {([1, 2, 3, 4] as DebriefLevel[]).map((level) => {
                    const active = draftRatings[turn.turnId] === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDraftRatings((prev) => ({ ...prev, [turn.turnId]: level }))}
                        className={`inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold transition ${
                          active
                            ? 'border-[#204195] bg-[#204195] text-white shadow-xs'
                            : 'border-[#DCE4F3] bg-white text-[#607096] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {t(LEVEL_LABEL_KEY[level])}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#EEF2FD] pt-5">
            <button
              type="button"
              onClick={() => void reveal()}
              disabled={!allRated || savingRatings}
              className="inline-flex h-10 items-center rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#183275] disabled:opacity-50"
            >
              {savingRatings ? t('report.saving') : t('report.gate.reveal')}
            </button>
            <button
              type="button"
              onClick={() => setSkipped(true)}
              className="inline-flex h-10 items-center rounded-xl border border-[#DCE4F3] bg-white px-5 text-sm font-semibold text-[#607096] transition hover:bg-[#F7F9FD]"
            >
              {t('report.gate.skip')}
            </button>
            <span className="text-xs text-[#607096]">{t('report.gate.scale')}</span>
          </div>
        </section>
      ) : (
        <>
          {saveFailed && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900">
              {t('report.gate.saveFailed')}
            </p>
          )}

          {/* =========================================================================
              3. TABS NAVIGATION BAR (Overview / Competencies / Questions)
             ========================================================================= */}
          <nav
            aria-label="Report sections"
            className="sticky top-18 z-20 rounded-2xl border border-[#DCE4F3] bg-white/95 p-1.5 shadow-sm backdrop-blur-md print:hidden"
          >
            <div className="grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-center text-xs font-bold leading-tight transition sm:gap-2 sm:px-4 ${
                  activeTab === 'overview'
                    ? 'bg-[#204195] text-white shadow-xs'
                    : 'text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]'
                }`}
              >
                <LayoutDashboard className="hidden size-4 shrink-0 sm:block" />
                {t('report.tabs.overview')}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('competencies')}
                className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-center text-xs font-bold leading-tight transition sm:gap-2 sm:px-4 ${
                  activeTab === 'competencies'
                    ? 'bg-[#204195] text-white shadow-xs'
                    : 'text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]'
                }`}
              >
                <Target className="hidden size-4 shrink-0 sm:block" />
                {t('report.tabs.competencies')}
                {competencyScores.length > 0 && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${
                      activeTab === 'competencies' ? 'bg-white/20 text-white' : 'bg-[#EBF0FA] text-[#204195]'
                    }`}
                  >
                    {competencyScores.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-center text-xs font-bold leading-tight transition sm:gap-2 sm:px-4 ${
                  activeTab === 'questions'
                    ? 'bg-[#204195] text-white shadow-xs'
                    : 'text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]'
                }`}
              >
                <MessageSquareText className="hidden size-4 shrink-0 sm:block" />
                {t('report.tabs.questions')}
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${
                    activeTab === 'questions' ? 'bg-white/20 text-white' : 'bg-[#EBF0FA] text-[#204195]'
                  }`}
                >
                  {rawTurns.length}
                </span>
              </button>
            </div>
          </nav>

          {/* =========================================================================
              4. TAB 1: OVERVIEW (Tổng quan)
             ========================================================================= */}
          <div className={`${activeTab === 'overview' || printing ? 'space-y-6' : 'hidden'}`}>
            {(session?.sessionId || report.session_id || report.sessionId) && (
              <ProgressComparisonCard sessionId={String(session?.sessionId || report.session_id || report.sessionId)} />
            )}
            {/* Feedback & Next Topics */}
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.85fr)]">
              <div className="relative min-w-0 overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-[0_16px_40px_-32px_rgba(20,36,75,0.25)] sm:p-6 print:shadow-none print:break-inside-avoid">
                <div className="absolute inset-y-0 left-0 w-1.5 bg-[#204195]" />
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-[#EEF2FD] text-[#204195]">
                    <MessageSquareText className="size-5" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#14244B]">{t('report.feedback.title')}</h3>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#26395F] [overflow-wrap:anywhere] sm:text-[15px]">
                  {candidateFeedback || t('report.feedback.empty')}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-[#CFE5D7] bg-gradient-to-br from-white to-[#F0F8F3] p-5 shadow-[0_16px_40px_-32px_rgba(40,122,75,0.2)] sm:p-6 print:shadow-none print:break-inside-avoid">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-[#DDF1E4] text-[#287A4B]">
                    <BookOpen className="size-5" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#14244B]">{t('report.next.title')}</h3>
                </div>
                {nextRoundTopics.length > 0 ? (
                  <ul className="mt-4 space-y-2.5 text-sm leading-6 text-[#26395F] [overflow-wrap:anywhere]">
                    {nextRoundTopics.map((topic, idx) => (
                      <li key={idx} className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 border border-[#DCEBE2]">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#287A4B]" />
                        <span className="min-w-0 font-medium text-[#14244B]">{topic}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-[#607096]">{t('report.next.empty')}</p>
                )}
              </div>
            </section>

            {/* Red Flags / Assessment Warnings */}
            {redFlags.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-[#FFF9EA] to-[#FFFDF8] p-5 sm:p-6 print:break-inside-avoid">
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                    <Flag className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-amber-950">{t('report.warnings.title')}</h3>
                    <p className="mt-1 text-xs leading-5 text-amber-800">{t('report.warnings.note')}</p>
                  </div>
                </div>
                <ul className="mt-4 grid gap-2.5 [overflow-wrap:anywhere] sm:grid-cols-2">
                  {redFlags.map((warning, idx) => (
                    <li
                      key={idx}
                      className="rounded-2xl border border-amber-200/80 bg-white/70 px-4 py-3 text-xs font-medium text-amber-950"
                    >
                      {warning}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Self vs System Calibration */}
            {calibration.length > 0 && (
              <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-[0_16px_40px_-32px_rgba(20,36,75,0.2)] sm:p-6 print:shadow-none print:break-inside-avoid">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-[#FFF3D6] text-[#9A6500]">
                    <TrendingUp className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#14244B]">{t('report.calib.title')}</h2>
                    <p className="text-xs text-[#607096]">{t('report.calib.note')}</p>
                  </div>
                </div>
                <ul className="mt-5 grid gap-3 md:grid-cols-2">
                  {calibration.map((row) => {
                    const index = ratableTurns.findIndex((turn) => turn.turnId === row.turnId);
                    const note =
                      row.gap === 0
                        ? t('report.calib.match')
                        : row.gap > 0
                          ? fmt(t('report.calib.higher'), { n: row.gap })
                          : fmt(t('report.calib.lower'), { n: -row.gap });
                    return (
                      <li
                        key={row.turnId}
                        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm transition ${
                          Math.abs(row.gap) >= 2
                            ? 'border-amber-200 bg-amber-50/70'
                            : 'border-[#E5EBF7] bg-[#F8FAFE] hover:border-[#D0DBEE]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('questions');
                            setTurnOpen(row.turnId, true);
                          }}
                          className="min-w-0 text-left font-semibold text-[#14244B] hover:text-[#204195] hover:underline"
                        >
                          {fmt(t('report.questionN'), { n: index + 1 })} · <span className="font-normal">{note}</span>
                        </button>
                        <span className="flex flex-wrap items-center gap-2">
                          <LevelChip level={row.self} prefix={t('report.calib.you')} />
                          <LevelChip level={row.system} prefix={t('report.calib.system')} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Quick Teaser / Link to Competencies & Questions */}
            <div className="grid gap-4 sm:grid-cols-2 print:hidden">
              <button
                type="button"
                onClick={() => setActiveTab('competencies')}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-left shadow-xs transition hover:border-[#204195] hover:shadow-md sm:p-5"
              >
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
                    <Target className="size-4" /> {t('report.tabs.competencies')}
                  </span>
                  <p className="mt-1 font-display text-lg font-bold text-[#14244B]">
                    {fmt(t('report.hero.stat.competencies'), { n: competencyScores.length })}
                  </p>
                  <p className="mt-0.5 text-xs text-[#607096]">{t('report.comp.description')}</p>
                </div>
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EEF2FD] text-[#204195] transition group-hover:translate-x-1">
                  <ArrowRight className="size-5" />
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 text-left shadow-xs transition hover:border-[#204195] hover:shadow-md sm:p-5"
              >
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
                    <MessageSquareText className="size-4" /> {t('report.tabs.questions')}
                  </span>
                  <p className="mt-1 font-display text-lg font-bold text-[#14244B]">
                    {fmt(t('report.questionsGraded'), { n: rawTurns.length })}
                  </p>
                  <p className="mt-0.5 text-xs text-[#607096]">{t('report.turns.title')}</p>
                </div>
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#EEF2FD] text-[#204195] transition group-hover:translate-x-1">
                  <ArrowRight className="size-5" />
                </div>
              </button>
            </div>
          </div>

          {/* =========================================================================
              5. TAB 2: COMPETENCIES (Đánh giá năng lực)
             ========================================================================= */}
          <div className={`${activeTab === 'competencies' || printing ? 'space-y-6' : 'hidden'}`}>
            <section className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-[0_20px_50px_-35px_rgba(20,36,75,0.3)] print:shadow-none print:break-inside-avoid">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EDF7] px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-[#EEF2FD] text-[#204195]">
                    <Target className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#14244B]">{t('report.comp.title')}</h2>
                    <p className="text-xs text-[#607096]">{t('report.comp.description')}</p>
                  </div>
                </div>

                <span className="rounded-full bg-[#F4F6FB] px-3.5 py-1.5 text-xs font-semibold text-[#7180A0]">
                  {t('report.comp.scale')}
                </span>
              </div>

              <div className="p-4 sm:p-6">
                {competencyScores.length > 0 ? (
                  <div style={{ height: Math.max(260, competencyScores.length * 56 + 50) }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={competencyScores}
                          layout="vertical"
                          margin={{ top: 10, right: 50, bottom: 8, left: 10 }}
                          barCategoryGap="30%"
                        >
                          <CartesianGrid horizontal={false} stroke="#E8EDF7" strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            domain={[0, 10]}
                            ticks={[0, 2, 4, 6, 8, 10]}
                            tick={{ fill: '#7180A0', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="competency"
                            width={160}
                            tick={{ fill: '#14244B', fontSize: 12, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={(value) => [`${Number(value).toFixed(1)} / 10`, t('report.comp.radarName')]}
                            cursor={{ fill: '#F4F6FB' }}
                          />
                          <Bar dataKey="score" fill="#3D73E6" radius={[0, 8, 8, 0]} maxBarSize={28}>
                            <LabelList
                              dataKey="score"
                              position="right"
                              formatter={(value) => Number(value).toFixed(1)}
                              fill="#204195"
                              fontSize={12}
                              fontWeight={700}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                ) : (
                  <div className="flex min-h-56 items-center justify-center text-center text-sm text-[#7180A0]">
                    {t('report.comp.none')}
                  </div>
                )}

                {/* Individual Competency Detailed Cards */}
                {competencyScores.length > 0 && (
                  <div className="mt-8 border-t border-[#E8EDF7] pt-6">
                    <h3 className="font-display text-lg font-bold text-[#14244B]">{t('report.comp.scores')}</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {competencyScores.map((c, index) => {
                        const level = scoreToLevel(c.score);
                        return (
                          <div
                            key={`${c.competency}-${index}`}
                            className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-[#FAFBFD] p-4 shadow-xs transition hover:border-[#BCCFEF]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <h4 className="min-w-0 font-bold text-[#14244B] [overflow-wrap:anywhere]">{c.competency}</h4>
                              <span className="shrink-0 font-display text-lg font-extrabold text-[#204195]">
                                {c.score.toFixed(1)} <span className="text-xs font-normal text-[#8A99B8]">/ 10</span>
                              </span>
                            </div>
                            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#E5EBF7]">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${Math.min(100, Math.max(0, c.score * 10))}%`,
                                  backgroundColor: getScoreColor(c.score),
                                }}
                              />
                            </div>
                            <div className="mt-2.5 flex items-center justify-between text-xs">
                              <LevelChip level={level} />
                            </div>
                            {c.summary && <p className="mt-3 text-xs leading-5 text-[#607096]">{c.summary}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* =========================================================================
              6. TAB 3: QUESTIONS & ANSWERS (Từng câu hỏi chi tiết)
             ========================================================================= */}
          <div className={`${activeTab === 'questions' || printing ? 'space-y-6' : 'hidden'}`}>
            {/* Header + Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#204195]">
                  <Sparkles className="size-4" /> {t('report.turns.title')}
                </div>
                <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-[#14244B] sm:text-xl">
                  {fmt(t('report.questionsGraded'), { n: rawTurns.length })}
                </h2>
              </div>

              {/* Action Buttons: Expand all / Collapse all */}
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={expandAllTurns}
                  className="inline-flex h-9 items-center rounded-xl border border-[#DCE4F3] bg-white px-3.5 text-xs font-semibold text-[#607096] shadow-xs transition hover:bg-[#F8FAFC] hover:text-[#14244B]"
                >
                  {t('report.questions.expandAll')}
                </button>
                <button
                  type="button"
                  onClick={collapseAllTurns}
                  className="inline-flex h-9 items-center rounded-xl border border-[#DCE4F3] bg-white px-3.5 text-xs font-semibold text-[#607096] shadow-xs transition hover:bg-[#F8FAFC] hover:text-[#14244B]"
                >
                  {t('report.questions.collapseAll')}
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-2.5 shadow-xs print:hidden">
              {/* Quick filter pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuestionFilter('all')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    questionFilter === 'all'
                      ? 'bg-[#204195] text-white'
                      : 'text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]'
                  }`}
                >
                  {t('report.questions.filter.all')} ({rawTurns.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('needsImprovement')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    questionFilter === 'needsImprovement'
                      ? 'bg-[#8A5A00] text-white'
                      : 'text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]'
                  }`}
                >
                  {t('report.questions.filter.needsImprovement')}
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('good')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    questionFilter === 'good'
                      ? 'bg-[#287A4B] text-white'
                      : 'text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]'
                  }`}
                >
                  {t('report.questions.filter.good')}
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[200px] sm:max-w-xs sm:flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8A99B8]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('report.questions.searchPlaceholder')}
                  className="h-9 w-full rounded-xl border border-[#DCE4F3] bg-[#FAFBFD] pl-8 pr-3 text-xs text-[#14244B] placeholder-[#8A99B8] focus:border-[#204195] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Questions list */}
            {filteredTurns.length === 0 ? (
              <div className="rounded-2xl border border-[#DCE4F3] bg-white p-8 text-center text-sm text-[#607096]">
                {t('report.questions.emptyFilter')}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTurns.map((turn: TurnEvaluation, idx: number) => {
                  const turnId = turnIdOf(turn);
                  const stage = turn.stage ?? null;
                  const stageLabel = getStageLabel(stage, t);
                  const score = typeof turn.score === 'number' ? turn.score : parseFloat(String(turn.score ?? ''));
                  const level = Number.isFinite(score) ? scoreToLevel(score) : null;
                  const star = turn.star_analysis ?? turn.starAnalysis ?? {};
                  const evidence = turn.evidence_quotes ?? turn.evidenceQuotes ?? [];
                  const questionText = turn.question_text ?? turn.questionText;
                  const lines = transcript.get(turnId) ?? [];
                  const seconds = turnDurationSeconds(lines);
                  const skipped = turn.outcome === 'SKIPPED';
                  const notGradable = turn.outcome === 'NOT_GRADABLE';
                  const showStar = !skipped && !notGradable && stage != null && STAR_STAGES.has(stage);
                  const strengths = turn.strengths ?? [];
                  const weaknesses = turn.weaknesses ?? [];

                  return (
                    <details
                      key={turnId || idx}
                      id={turnId ? `turn-${turnId}` : undefined}
                      open={printing || isTurnOpen(turnId)}
                      onToggle={(event) => {
                        if (!printing) setTurnOpen(turnId, event.currentTarget.open);
                      }}
                      className="group scroll-mt-24 overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-[0_12px_32px_-28px_rgba(20,36,75,0.4)] transition hover:border-[#BCCFEF] print:shadow-none print:break-inside-avoid"
                    >
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-[#FAFBFE] sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#204195] px-3 py-1 text-xs font-bold text-white shadow-xs">
                            {fmt(t('report.questionN'), { n: idx + 1 })}
                          </span>
                          {stageLabel && (
                            <span className="rounded-full border border-[#DCE4F3] bg-[#F7F9FD] px-2.5 py-0.5 text-xs font-semibold text-[#14244B]">
                              {stageLabel}
                            </span>
                          )}
                          {turn.competency && (
                            <span className="min-w-0 text-xs font-medium text-[#607096] [overflow-wrap:anywhere]">· {turn.competency}</span>
                          )}
                          {seconds != null && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-[#8A99B8]">
                              <Clock className="size-3" /> {formatDuration(t, seconds)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {skipped || notGradable ? (
                            <span className="rounded-full border border-[#DCE4F3] bg-[#F4F6FB] px-3 py-1 text-xs font-semibold text-[#607096]">
                              {t(notGradable ? 'report.turn.notGradable' : 'report.turn.skipped')}
                            </span>
                          ) : (
                            level && <LevelChip level={level} />
                          )}
                          {!notGradable && (
                            <span className="font-display text-base font-extrabold text-[#204195]">
                              {Number.isFinite(score) ? `${score.toFixed(1)} / 10` : t('report.turn.ungraded')}
                            </span>
                          )}
                          <span
                            aria-hidden="true"
                            className="grid size-8 place-items-center rounded-full bg-[#F4F6FB] text-[#7180A0] transition-transform duration-200 group-open:rotate-180 print:hidden"
                          >
                            <ChevronDown className="size-4" />
                          </span>
                        </div>

                        {questionText && (
                          <p className="line-clamp-1 basis-full text-sm text-[#607096] group-open:hidden">
                            {questionText}
                          </p>
                        )}
                      </summary>

                      <div className="space-y-4 border-t border-[#EEF2FD] bg-[#FCFDFF] px-4 pb-5 pt-4 [overflow-wrap:anywhere] sm:px-6">
                        {/* Conversation dialogue with highlights */}
                        {lines.length > 0 ? (
                          <TurnExchange lines={lines} quotes={evidence} />
                        ) : (
                          <>
                            {questionText && (
                              <p className="rounded-2xl border border-[#EEF2FD] bg-[#F7F9FD] p-3 text-sm font-medium text-[#14244B]">
                                {questionText}
                              </p>
                            )}
                            {evidence.length > 0 && (
                              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
                                <div className="font-bold">{t('report.turn.evidence')}</div>
                                <ul className="mt-1.5 list-disc space-y-1 pl-4 italic text-amber-950">
                                  {evidence.map((q, qIdx) => (
                                    <li key={qIdx}>&ldquo;{q}&rdquo;</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        )}

                        {/* STAR Framework Breakdown */}
                        {showStar && (
                          <div className="rounded-2xl border border-[#E3EBF7] bg-[#F8FAFD] p-4">
                            <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#204195]">
                              {t('report.star.title')}
                            </h4>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                              {(
                                [
                                  [t('report.star.s'), star.situation],
                                  [t('report.star.t'), star.task],
                                  [t('report.star.a'), star.action],
                                  [t('report.star.r'), star.result],
                                ] as const
                              ).map(([label, value]) => (
                                <div
                                  key={label}
                                  className={`rounded-xl border p-3 text-xs ${
                                    value
                                      ? 'border-[#DCE4F3] bg-white shadow-2xs'
                                      : 'border-dashed border-[#F5C2C2] bg-[#FDF2F2]/50'
                                  }`}
                                >
                                  <strong className="block font-bold text-[#14244B]">{label}</strong>
                                  <span className="mt-1 block text-[#607096] leading-relaxed">
                                    {value || t('report.star.missing')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Strengths & Weaknesses */}
                        {(strengths.length > 0 || weaknesses.length > 0) && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {strengths.length > 0 && (
                              <div className="rounded-2xl border border-[#BFDFCB] bg-[#EAF5EE]/60 p-4">
                                <p className="font-bold text-[#1F5E3A]">{t('report.turn.strengths')}</p>
                                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-[#1F5E3A]">
                                  {strengths.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {weaknesses.length > 0 && (
                              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                                <p className="font-bold text-amber-800">{t('report.turn.weaknesses')}</p>
                                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-900">
                                  {weaknesses.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* AI Feedback */}
                        {turn.feedback && (
                          <div className="rounded-2xl border border-[#EEF2FD] bg-[#F7F9FD]/60 p-4 text-xs leading-6 text-[#26395F]">
                            <strong className="text-[#14244B]">{t('report.turn.feedback')}</strong>
                            {turn.feedback}
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>

          {/* =========================================================================
              7. CLOSING & TAKEAWAY REFLECTION
             ========================================================================= */}
          <section className="relative overflow-hidden rounded-2xl border border-[#C9D5F2] bg-gradient-to-br from-white via-[#FAFBFD] to-[#F2F5FC] p-5 shadow-sm sm:p-6 print:hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#DCE6FF]/60 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#204195] text-white">
                <CheckCircle2 className="size-5" />
              </span>
              <h3 className="font-display text-lg font-bold text-[#14244B]">{t('uxWs.report.closingTitle')}</h3>
            </div>
            {onSaveReflection && (
              <div className="relative mt-5">
                <label htmlFor="debrief-takeaway" className="mt-1 block text-sm font-medium text-[#607096]">
                  {t('report.takeaway.label')}
                </label>
                <textarea
                  id="debrief-takeaway"
                  value={takeaway}
                  onChange={(e) => {
                    setTakeaway(e.target.value);
                    setTakeawayState('idle');
                  }}
                  maxLength={1000}
                  rows={3}
                  placeholder={t('report.takeaway.placeholder')}
                  className="mt-2 w-full rounded-2xl border border-[#D3DDF0] bg-white p-4 text-sm leading-6 text-[#14244B] shadow-2xs transition focus:border-[#204195] focus:outline-none focus:ring-4 focus:ring-[#204195]/10"
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void saveTakeaway()}
                    disabled={takeawayState === 'saving'}
                    className="inline-flex h-9 items-center rounded-xl bg-[#204195] px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#183275] disabled:opacity-50"
                  >
                    {takeawayState === 'saving' ? t('report.saving') : t('report.save')}
                  </button>
                  {takeawayState === 'saved' && <span className="text-xs font-medium text-[#287A4B]">{t('report.saved')}</span>}
                  {takeawayState === 'error' && <span className="text-xs font-medium text-[#C43B3B]">{t('report.saveError')}</span>}
                </div>
              </div>
            )}
            <div className="relative mt-5 flex flex-wrap items-center gap-3 border-t border-[#DCE4F3] pt-4 text-sm">
              <Link
                href="/interview/select"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#204195] px-5 font-semibold text-white shadow-xs transition hover:bg-[#183275]"
              >
                {t('uxInterview.report.next.practice')} <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/dashboard/history"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#C9D5F2] bg-white px-5 font-semibold text-[#204195] shadow-2xs transition hover:bg-[#EEF2FD]"
              >
                {t('uxInterview.report.next.history')} <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        </>
      )}

      {/* Print footer */}
      <p className="hidden border-t border-[#DCE4F3] pt-3 text-[10px] text-[#607096] print:block">
        INTERVIA · {new Date().toLocaleDateString(localeOf(lang))} · {t('report.printFooter')}
      </p>
    </div>
  );
};

export default InterviewReportView;
