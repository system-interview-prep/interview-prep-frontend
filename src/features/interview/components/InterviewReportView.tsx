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
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flag,
  MessageSquareText,
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
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide ${LEVEL_TONE[level]}`}>
      {prefix}
      {t(LEVEL_LABEL_KEY[level])}
    </span>
  );
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
    <div className="space-y-2">
      <ol className="space-y-1.5">
        {rendered.map(({ line, segments }) => (
          <li
            key={line.messageId}
            className={`grid gap-1 rounded-lg px-3 py-2 text-[13px] leading-6 sm:grid-cols-[110px_1fr] ${
              line.speaker === 'candidate' ? 'bg-white border border-[#DCE4F3]' : 'bg-[#F7F9FD]'
            }`}
          >
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide ${
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
                        className="rounded-sm bg-amber-100 px-0.5 text-[#14244B] underline decoration-amber-500 decoration-2 underline-offset-2"
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
        <p className="flex items-center gap-1.5 text-[11px] text-[#607096]">
          <mark className="rounded-sm bg-amber-100 px-1 text-[#14244B] underline decoration-amber-500">
            {t('report.exchange.legendMark')}
          </mark>
          {t('report.exchange.legendText')}
        </p>
      )}
      {missing.length > 0 && (
        <div className="rounded-lg border border-[#DCE4F3] bg-[#F7F9FD] p-2.5 text-xs text-[#607096]">
          <p className="font-semibold text-[#14244B]">
            {fmt(t('report.exchange.unmatchedTitle'), { n: missing.length })}
          </p>
          <p className="mt-0.5">{t('report.exchange.unmatchedBody')}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 italic">
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

  const competencyScores = rawCompetencies.map((c) => ({
    competency: c.competency,
    score: typeof c.score === 'number' ? c.score : parseFloat(String(c.score || 0)),
    summary: c.summary,
  }));

  const transcript = useMemo(() => (messages ? transcriptByTurn(messages) : new Map<string, TranscriptLine[]>()), [messages]);
  const ratableTurns = useMemo(
    () =>
      rawTurns
        .map((turn) => ({
          turnId: turnIdOf(turn),
          score: Number(turn.score),
          question: turn.question_text ?? turn.questionText ?? '',
        }))
        .filter((turn) => turn.turnId && Number.isFinite(turn.score)),
    [rawTurns]
  );

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
    // PUT replaces both fields, so resend the ratings already given.
    const ok = await onSaveReflection({ selfRatings: ratings, takeaway: takeaway.trim() || null });
    setTakeawayState(ok ? 'saved' : 'error');
  };

  const calibration = useMemo(() => calibrate(ratings, ratableTurns), [ratings, ratableTurns]);

  // ---- Per-question cards are collapsed; the weakest answer starts open.
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
  // Closed <details> hide their content on paper, so open every card while printing.
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    // flushSync: the print layout is taken before a normal re-render would land.
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

  // Text-only intro from the fox. It never reveals the verdict while the
  // reflection gate is still asking the candidate to rate themselves.
  const heroBody = gateOpen
    ? t('uxInterview.report.heroGate')
    : overallLevel
      ? t(LEVEL_MEANING_KEY[overallLevel])
      : t('uxInterview.report.heroDone');

  return (
    <div className="mx-auto max-w-[1240px] space-y-8 p-4 font-sans sm:p-6 lg:px-8 lg:py-10 print:max-w-none print:space-y-4 print:p-0">
      {/* 1. Summary first: score, meaning and session facts are visible in one scan. */}
      <section className="anim-rise overflow-hidden rounded-[28px] border border-[#DCE4F3] bg-white shadow-[0_16px_45px_-38px_rgba(20,36,75,0.35)] print:hidden">
        <div className={`grid gap-6 p-6 sm:p-8 ${!gateOpen ? 'lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center' : ''}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF2FD] px-3 py-1.5 text-xs font-bold text-[#3156AA]">
                <span className="size-1.5 rounded-full bg-[#3D73E6]" />
                {t('report.page.badge')}
              </div>
              {onBack && (
                <button type="button" onClick={onBack} className="text-xs font-semibold text-[#607096] underline-offset-4 hover:text-[#204195] hover:underline">
                  {t('report.page.backAria')}
                </button>
              )}
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-tight tracking-[-0.025em] text-[#14244B]">
              {t('report.title')}
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#607096]">{heroBody}</p>

            <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-[#E8EDF7] pt-5 sm:grid-cols-3">
              {contextItems.map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A99B8]">{label}</dt>
                  <dd className="mt-1 truncate text-sm font-semibold text-[#26395F]" title={value}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {!gateOpen && (
            <div className="rounded-3xl border border-[#D8E2F6] bg-[#F6F8FE] p-5 text-center">
              {overallScore != null && overallLevel ? (
                <>
                  <div
                    className="mx-auto grid size-36 place-items-center rounded-full p-2"
                    style={{ background: `conic-gradient(#315BC0 ${Math.min(100, Math.max(0, overallScore * 10))}%, #DCE4F3 0)` }}
                  >
                    <div className="grid size-full place-items-center rounded-full bg-white">
                      <div><div className="font-display text-4xl font-semibold tracking-tight text-[#204195]">{overallScore.toFixed(1)}</div><div className="text-xs font-semibold text-[#8A99B8]">/ 10</div></div>
                    </div>
                  </div>
                  <div className="mt-4"><LevelChip level={overallLevel} prefix={t('report.levelPrefix')} /></div>
                </>
              ) : (
                <p className="py-8 text-sm font-semibold text-[#607096]">{t('report.noOverall')}</p>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="hidden rounded-3xl border border-[#DCE4F3] bg-white p-6 print:block print:break-inside-avoid">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#14244B]">{t('report.title')}</h1>
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#607096]">
          {contextItems.map(([label, value]) => (
            <div key={label} className="flex gap-1"><dt>{label}:</dt><dd className="font-semibold text-[#14244B]">{value}</dd></div>
          ))}
        </dl>
        {overallScore != null && <p className="mt-4 font-display text-3xl font-semibold text-[#204195]">{overallScore.toFixed(1)} / 10</p>}
      </div>

      <p className="-mt-4 flex items-start gap-2 px-2 text-[11px] leading-5 text-[#7C8BAA] print:mt-0 print:px-0"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#4B70C6]" />{t('report.disclaimer')}</p>

      {/* 2. Reflection gate */}
      {gateOpen ? (
        <section className="rounded-[28px] border border-[#C9D5F2] bg-white p-5 shadow-[0_18px_50px_-38px_rgba(32,65,149,0.45)] sm:p-8 print:break-inside-avoid">
          <div className="flex gap-4">
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF2FD] text-[#204195] sm:flex"><Target className="size-6" /></div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#14244B]">{t('report.gate.title')}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#607096]">{t('report.gate.body')}</p>
            </div>
          </div>
          <ol className="mt-6 grid gap-3 lg:grid-cols-2">
            {ratableTurns.map((turn, index) => (
              <li key={turn.turnId} className="rounded-2xl border border-[#DCE4F3] bg-[#FBFCFF] p-4 transition hover:border-[#B9C9EE]">
                <p className="text-sm text-[#14244B]">
                  <span className="font-semibold">{fmt(t('report.questionN'), { n: index + 1 })}.</span>{' '}
                  {turn.question || t('report.questionEmpty')}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={fmt(t('report.gate.rateAria'), { n: index + 1 })}>
                  {([1, 2, 3, 4] as DebriefLevel[]).map((level) => {
                    const active = draftRatings[turn.turnId] === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setDraftRatings((prev) => ({ ...prev, [turn.turnId]: level }))}
                        className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                          active
                            ? 'border-[#204195] bg-[#204195] text-white'
                            : 'border-[#DCE4F3] bg-white text-[#607096] hover:border-[#CBD5E1]'
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
              className="rounded-full bg-[#204195] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#183275] disabled:opacity-50"
            >
              {savingRatings ? t('report.saving') : t('report.gate.reveal')}
            </button>
            <button
              type="button"
              onClick={() => setSkipped(true)}
              className="rounded-full border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#607096] hover:bg-[#F7F9FD]"
            >
              {t('report.gate.skip')}
            </button>
            <span className="text-xs text-[#607096]">{t('report.gate.scale')}</span>
          </div>
        </section>
      ) : (
        <>
          {saveFailed && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
              {t('report.gate.saveFailed')}
            </p>
          )}

          {/* 3. Overall feedback + what to study next */}
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
            <div className="relative overflow-hidden rounded-[28px] border border-[#DCE4F3] bg-white p-6 shadow-[0_18px_45px_-38px_rgba(20,36,75,0.35)] sm:p-8 print:shadow-none print:break-inside-avoid">
              <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[#204195] to-[#7190DC]" />
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-[#EEF2FD] text-[#204195]"><MessageSquareText className="size-5" /></span>
                <h3 className="font-display text-xl font-semibold text-[#14244B]">{t('report.feedback.title')}</h3>
              </div>
              <p className="mt-5 whitespace-pre-line text-[15px] leading-7 text-[#334468]">
                {candidateFeedback || t('report.feedback.empty')}
              </p>
            </div>
            <div className="rounded-[28px] border border-[#CFE5D7] bg-gradient-to-br from-white to-[#F0F8F3] p-6 sm:p-7 print:shadow-none print:break-inside-avoid">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-[#DDF1E4] text-[#287A4B]"><BookOpen className="size-5" /></span>
                <h3 className="font-display text-xl font-semibold text-[#14244B]">{t('report.next.title')}</h3>
              </div>
              {nextRoundTopics.length > 0 ? (
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[#334468]">
                  {nextRoundTopics.map((topic, idx) => (
                    <li key={idx} className="flex gap-2.5"><CheckCircle2 className="mt-1 size-4 shrink-0 text-[#3D9661]" /><span>{topic}</span></li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#607096]">{t('report.next.empty')}</p>
              )}
            </div>
          </section>

          {/* 4. Self vs system calibration */}
          {calibration.length > 0 && (
            <section className="rounded-[28px] border border-[#DCE4F3] bg-white p-6 sm:p-8 print:shadow-none print:break-inside-avoid">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#FFF3D6] text-[#9A6500]"><TrendingUp className="size-5" /></span><h2 className="font-display text-xl font-semibold text-[#14244B]">{t('report.calib.title')}</h2></div>
              <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
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
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
                        Math.abs(row.gap) >= 2 ? 'border-amber-200 bg-amber-50' : 'border-[#E5EBF7] bg-[#F8FAFE]'
                      }`}
                    >
                      <a href={`#turn-${row.turnId}`} onClick={() => setTurnOpen(row.turnId, true)} className="font-medium text-[#14244B] hover:underline">
                        {fmt(t('report.questionN'), { n: index + 1 })} · {note}
                      </a>
                      <span className="flex gap-1.5">
                        <LevelChip level={row.self} prefix={t('report.calib.you')} />
                        <LevelChip level={row.system} prefix={t('report.calib.system')} />
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-[#607096]">{t('report.calib.note')}</p>
            </section>
          )}

          {/* 5. Competencies */}
          <section className="overflow-hidden rounded-[30px] border border-[#DCE4F3] bg-white shadow-[0_20px_55px_-45px_rgba(20,36,75,0.4)] print:shadow-none print:break-inside-avoid">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EDF7] px-6 py-5 sm:px-8">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-[#EEF2FD] text-[#204195]"><Target className="size-5" /></span>
                <h3 className="font-display text-xl font-semibold text-[#14244B]">{t('report.comp.title')}</h3>
              </div>
              <span className="rounded-full bg-[#F4F6FB] px-3 py-1.5 text-xs font-semibold text-[#7180A0]">{t('report.comp.scale')}</span>
            </div>
            <div className="p-5 sm:p-7">
              <div className="mb-2">
                <h3 className="font-display text-lg font-semibold text-[#14244B]">{t('report.comp.scores')}</h3>
                <p className="mt-1 text-sm leading-6 text-[#607096]">{t('report.comp.description')}</p>
              </div>
              {competencyScores.length ? (
                <div style={{ height: Math.max(250, competencyScores.length * 58 + 56) }} className="w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={competencyScores}
                      layout="vertical"
                      margin={{ top: 12, right: 42, bottom: 8, left: 8 }}
                      barCategoryGap="34%"
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
                        width={170}
                        tick={{ fill: '#14244B', fontSize: 12, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)} / 10`, t('report.comp.radarName')]}
                        cursor={{ fill: '#F4F6FB' }}
                      />
                      <Bar dataKey="score" fill="#4169C8" radius={[0, 8, 8, 0]} maxBarSize={28}>
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
                <div className="flex min-h-56 items-center justify-center px-6 text-center text-sm text-[#7180A0]">
                  {t('report.comp.none')}
                </div>
              )}
              {competencyScores.some((item) => item.summary) ? (
                <ul className="mt-5 grid gap-3 border-t border-[#E8EDF7] pt-4 md:grid-cols-2">
                  {competencyScores.filter((item) => item.summary).map((item, index) => (
                    <li key={`${item.competency}-${index}`} className="text-sm leading-6 text-[#607096]">
                      <span className="font-semibold text-[#14244B]">{item.competency}: </span>{item.summary}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>


          {redFlags.length > 0 && (
            <section className="rounded-[28px] border border-amber-200 bg-gradient-to-r from-[#FFF9EA] to-[#FFFDF8] p-6 sm:p-7 print:break-inside-avoid">
              <div className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Flag className="size-5" /></span>
                <div><h3 className="font-display text-lg font-semibold text-amber-950">{t('report.warnings.title')}</h3>
                <p className="mt-1 text-xs leading-5 text-amber-800">{t('report.warnings.note')}</p></div>
              </div>
              <ul className="mt-4 grid gap-2 pl-14 text-sm text-amber-950 md:grid-cols-2">
                {redFlags.map((warning, idx) => (
                  <li key={idx} className="rounded-xl border border-amber-200/70 bg-white/60 px-3 py-2.5">{warning}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 6. Per question */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5671B4]"><Sparkles className="size-4" /> {t('report.page.badge')}</div>
                <h3 className="font-display text-2xl font-semibold tracking-tight text-[#14244B] sm:text-3xl">{t('report.turns.title')}</h3>
              </div>
              <span className="rounded-full border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#607096]">
                {fmt(t('report.questionsGraded'), { n: rawTurns.length })}
              </span>
            </div>
            <p className="text-sm text-[#607096] print:hidden">{t('uxWs.report.turnsHint')}</p>

            {rawTurns.map((turn: TurnEvaluation, idx: number) => {
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
              const showStar = stage != null && STAR_STAGES.has(stage);
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
                  className="group scroll-mt-20 overflow-hidden rounded-[24px] border border-[#DCE4F3] bg-white shadow-[0_14px_35px_-32px_rgba(20,36,75,0.5)] transition hover:border-[#C6D3EE] print:shadow-none print:break-inside-avoid"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 transition hover:bg-[#FAFBFE] sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#204195] px-3 py-1 text-xs font-bold text-white">
                        {fmt(t('report.questionN'), { n: idx + 1 })}
                      </span>
                      {stageLabel && <span className="text-xs font-semibold text-[#14244B]">{stageLabel}</span>}
                      {turn.competency && <span className="text-xs text-[#607096]">· {turn.competency}</span>}
                      {seconds != null && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#A0AEC0]">
                          <Clock className="size-3" /> {formatDuration(t, seconds)}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-2">
                      {level && <LevelChip level={level} />}
                      <span className="text-sm font-extrabold text-[#204195]">
                        {Number.isFinite(score) ? `${score.toFixed(1)} / 10` : t('report.turn.ungraded')}
                      </span>
                      <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-[#F4F6FB] text-[#7180A0] transition-transform group-open:rotate-180 print:hidden"><ChevronDown className="size-4" /></span>
                    </span>
                    {questionText && (
                      <p className="line-clamp-1 basis-full text-sm text-[#607096] group-open:hidden">{questionText}</p>
                    )}
                  </summary>
                  <div className="space-y-4 border-t border-[#EEF2FD] bg-[#FCFDFF] px-5 pb-6 pt-5 sm:px-6">

                  {lines.length > 0 ? (
                    <TurnExchange lines={lines} quotes={evidence} />
                  ) : (
                    <>
                      {questionText && (
                        <p className="rounded-lg border border-[#EEF2FD] bg-[#F7F9FD] p-2.5 text-sm font-medium text-[#14244B]">
                          {questionText}
                        </p>
                      )}
                      {evidence.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
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

                  {showStar && (
                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
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
                          className={`rounded-xl border p-2.5 ${
                            value ? 'border-[#DCE4F3] bg-[#F7F9FD]/70' : 'border-dashed border-[#F5C2C2] bg-[#FDF2F2]/40'
                          }`}
                        >
                          <strong className="block text-[#14244B]">{label}</strong>
                          <span className="text-[#607096]">{value || t('report.star.missing')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(strengths.length > 0 || weaknesses.length > 0) && (
                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      {strengths.length > 0 && (
                        <div className="rounded-xl border border-[#BFDFCB] bg-[#EAF5EE]/60 p-3">
                          <p className="font-bold text-[#1F5E3A]">{t('report.turn.strengths')}</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[#1F5E3A]">
                            {strengths.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {weaknesses.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                          <p className="font-bold text-amber-800">{t('report.turn.weaknesses')}</p>
                          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-amber-900">
                            {weaknesses.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {turn.feedback && (
                    <p className="rounded-xl border border-[#EEF2FD] bg-[#F7F9FD]/50 p-3 text-xs leading-5 text-[#607096]">
                      <strong className="text-[#14244B]">{t('report.turn.feedback')}</strong>
                      {turn.feedback}
                    </p>
                  )}
                  </div>
                </details>
              );
            })}
          </div>

          {/* 7. Closing: one takeaway, then a clear way out of the report. */}
          <section className="relative overflow-hidden rounded-[30px] border border-[#C9D5F2] bg-gradient-to-br from-white to-[#F2F5FC] p-6 sm:p-8 print:hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#DCE6FF]/70 blur-2xl" />
            <div className="relative flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#204195] text-white"><CheckCircle2 className="size-5" /></span><h3 className="font-display text-xl font-semibold text-[#14244B]">{t('uxWs.report.closingTitle')}</h3></div>
            {onSaveReflection && (
              <div className="relative mt-5">
                <label htmlFor="debrief-takeaway" className="mt-1 block text-sm text-[#607096]">
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
                  className="mt-2 w-full rounded-2xl border border-[#D3DDF0] bg-white p-4 text-sm leading-6 text-[#14244B] shadow-sm transition focus:border-[#204195] focus:outline-none focus:ring-4 focus:ring-[#204195]/10"
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void saveTakeaway()}
                    disabled={takeawayState === 'saving'}
                    className="rounded-full bg-[#204195] px-4 py-2 text-xs font-semibold text-white hover:bg-[#183275] disabled:opacity-50"
                  >
                    {takeawayState === 'saving' ? t('report.saving') : t('report.save')}
                  </button>
                  {takeawayState === 'saved' && <span className="text-xs text-[#287A4B]">{t('report.saved')}</span>}
                  {takeawayState === 'error' && <span className="text-xs text-[#C43B3B]">{t('report.saveError')}</span>}
                </div>
              </div>
            )}
            <div className="relative mt-6 flex flex-wrap items-center gap-3 border-t border-[#DCE4F3] pt-5 text-sm">
              <Link href="/interview/select" className="inline-flex items-center gap-2 rounded-full bg-[#204195] px-5 py-2.5 font-semibold text-white transition hover:bg-[#183275]">
                {t('uxInterview.report.next.practice')} <ArrowRight className="size-4" />
              </Link>
              <Link href="/dashboard/history" className="inline-flex items-center gap-2 rounded-full border border-[#C9D5F2] bg-white px-5 py-2.5 font-semibold text-[#204195] transition hover:bg-[#EEF2FD]">
                {t('uxInterview.report.next.history')} <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        </>
      )}
      <p className="hidden border-t border-[#DCE4F3] pt-3 text-[10px] text-[#607096] print:block">
        INTERVIA · {new Date().toLocaleDateString(localeOf(lang))} · {t('report.printFooter')}
      </p>
    </div>
  );
};

export default InterviewReportView;
