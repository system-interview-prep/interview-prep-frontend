'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import Link from 'next/link';
import { Clock } from 'lucide-react';
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
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${LEVEL_TONE[level]}`}>
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
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8 font-sans print:max-w-none print:space-y-4 print:p-0">
      <section className="anim-rise rounded-3xl bg-[#F0F4FC] p-5 sm:p-7 print:hidden">
        <div className="relative min-w-0 rounded-3xl bg-white p-5 ring-1 ring-[#DCE4F3] sm:p-6">
          <h1 className="font-display text-[clamp(1.5rem,2.4vw,2.1rem)] font-semibold leading-tight text-[#14244B]">{t('report.title')}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#607096]">{heroBody}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href="/interview/select"
            className="inline-flex h-11 items-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
          >
            {t('report.page.continue')}
          </Link>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 items-center rounded-full bg-[#F7F9FD] px-5 text-sm font-semibold text-[#14244B] transition hover:bg-[#EEF2FD]"
            >
              {t('report.page.backAria')}
            </button>
          )}
          </div>
        </div>
      </section>

      {/* 1. Session context + overall score (the page title prints from here). */}
      <div className="rounded-3xl border border-[#DCE4F3] bg-white p-6 print:break-inside-avoid">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="hidden font-display text-2xl font-semibold tracking-tight text-[#14244B] print:block">{t('report.title')}</h1>
            <dl className="flex print:mt-3 flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#607096]">
              {contextItems.map(([label, value]) => (
                <div key={label} className="flex gap-1">
                  <dt className="text-[#A0AEC0]">{label}:</dt>
                  <dd className="font-semibold text-[#14244B]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {!gateOpen && (
            <div className="shrink-0 text-left md:text-right">
              {overallScore != null && overallLevel ? (
                <>
                  <div className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[#204195]">
                    {overallScore.toFixed(1)} <span className="text-base font-normal text-[#A0AEC0]">/ 10</span>
                  </div>
                  <div className="mt-1.5">
                    <LevelChip level={overallLevel} prefix={t('report.levelPrefix')} />
                  </div>
                  <p className="mt-1.5 max-w-xs text-xs leading-5 text-[#607096]">{t(LEVEL_MEANING_KEY[overallLevel])}</p>
                </>
              ) : (
                <p className="text-sm font-semibold text-[#607096]">{t('report.noOverall')}</p>
              )}
            </div>
          )}
        </div>
        <p className="mt-4 border-t border-[#EEF2FD] pt-3 text-[11px] leading-5 text-[#A0AEC0]">
          {t('report.disclaimer')}
        </p>
      </div>

      {/* 2. Reflection gate */}
      {gateOpen ? (
        <section className="rounded-3xl border border-[#204195]/30 bg-white p-6 print:break-inside-avoid">
          <h2 className="font-display text-xl font-semibold text-[#14244B]">{t('report.gate.title')}</h2>
          <p className="mt-1 text-sm leading-6 text-[#607096]">{t('report.gate.body')}</p>
          <ol className="mt-4 space-y-3">
            {ratableTurns.map((turn, index) => (
              <li key={turn.turnId} className="rounded-xl border border-[#DCE4F3] p-3">
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
          <div className="mt-4 flex flex-wrap items-center gap-3">
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
          <section className="grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="rounded-3xl border border-[#DCE4F3] bg-white p-6 print:shadow-none print:break-inside-avoid">
              <h3 className="font-display text-lg font-semibold text-[#14244B]">{t('report.feedback.title')}</h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#14244B]">
                {candidateFeedback || t('report.feedback.empty')}
              </p>
            </div>
            <div className="rounded-3xl border border-[#DCE4F3] bg-white p-6 print:shadow-none print:break-inside-avoid">
              <h3 className="font-display text-lg font-semibold text-[#14244B]">{t('report.next.title')}</h3>
              {nextRoundTopics.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#14244B]">
                  {nextRoundTopics.map((topic, idx) => (
                    <li key={idx}>{topic}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#607096]">{t('report.next.empty')}</p>
              )}
            </div>
          </section>

          {/* 4. Self vs system calibration */}
          {calibration.length > 0 && (
            <section className="rounded-3xl border border-[#DCE4F3] bg-white p-6 print:shadow-none print:break-inside-avoid">
              <h2 className="font-display text-lg font-semibold text-[#14244B]">{t('report.calib.title')}</h2>
              <ul className="mt-3 space-y-1.5">
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
                      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                        Math.abs(row.gap) >= 2 ? 'bg-amber-50' : 'bg-[#F7F9FD]'
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-3xl border border-[#DCE4F3] bg-white p-6 print:shadow-none print:break-inside-avoid">
              <div className="mb-2 flex w-full items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-[#14244B]">{t('report.comp.title')}</h3>
                <span className="text-xs font-medium text-[#A0AEC0]">{t('report.comp.scale')}</span>
              </div>
              <div className="h-72 w-full">
                {competencyScores.length > 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={competencyScores}>
                      <PolarGrid stroke="#DCE4F3" strokeDasharray="3 3" />
                      <PolarAngleAxis dataKey="competency" tick={{ fill: '#14244B', fontSize: 11, fontWeight: 500 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#A0AEC0" />
                      <Radar name={t('report.comp.radarName')} dataKey="score" stroke="#204195" fill="#204195" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-xs text-[#A0AEC0]">
                    {competencyScores.length === 0
                      ? t('report.comp.none')
                      : t('report.comp.tooFew')}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3.5 rounded-3xl border border-[#DCE4F3] bg-white p-6 print:shadow-none print:break-inside-avoid">
              <h3 className="font-display text-lg font-semibold text-[#14244B]">{t('report.comp.scores')}</h3>
              <div className="space-y-3">
                {competencyScores.map((c, i) => (
                  <div key={i} className="flex flex-col border-b border-[#EEF2FD] pb-2.5 last:border-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#14244B]">{c.competency || '—'}</span>
                      <span className="font-bold text-[#204195]">{c.score.toFixed(1)} / 10</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF2FD]">
                      <div
                        className="h-full rounded-full bg-[#204195]"
                        style={{ width: `${Math.min(100, Math.max(0, (c.score / 10) * 100))}%` }}
                      />
                    </div>
                    {c.summary && <p className="mt-1 text-xs text-[#607096]">{c.summary}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>


          {redFlags.length > 0 && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 print:break-inside-avoid">
              <h3 className="font-display text-lg font-semibold text-amber-950">{t('report.warnings.title')}</h3>
              <p className="mt-1 text-xs text-amber-800">{t('report.warnings.note')}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-amber-950">
                {redFlags.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </section>
          )}

          {/* 6. Per question */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-[#14244B]">{t('report.turns.title')}</h3>
              <span className="text-xs font-medium text-[#607096]">
                {fmt(t('report.questionsGraded'), { n: rawTurns.length })}
              </span>
            </div>
            <p className="-mt-2 text-sm text-[#607096] print:hidden">{t('uxWs.report.turnsHint')}</p>

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
                  className="group scroll-mt-20 rounded-3xl border border-[#DCE4F3] bg-white print:shadow-none print:break-inside-avoid"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 p-5 [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#EEF2FD] px-2.5 py-0.5 text-xs font-semibold text-[#204195]">
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
                      <span aria-hidden="true" className="text-[#A0AEC0] transition-transform group-open:rotate-180 print:hidden">
                        ▾
                      </span>
                    </span>
                    {questionText && (
                      <p className="line-clamp-1 basis-full text-sm text-[#607096] group-open:hidden">{questionText}</p>
                    )}
                  </summary>
                  <div className="space-y-3 border-t border-[#EEF2FD] px-5 pb-5 pt-3">

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
          <section className="rounded-3xl border border-[#DCE4F3] bg-white p-6 print:hidden">
            <h3 className="font-display text-lg font-semibold text-[#14244B]">{t('uxWs.report.closingTitle')}</h3>
            {onSaveReflection && (
              <>
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
                  className="mt-2 w-full rounded-xl border border-[#DCE4F3] bg-[#F7F9FD] p-3 text-sm text-[#14244B] focus:border-[#204195] focus:outline-none"
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
              </>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#EEF2FD] pt-4 text-sm">
              <Link href="/interview/select" className="font-semibold text-[#204195] underline-offset-4 hover:underline">
                {t('uxInterview.report.next.practice')} →
              </Link>
              <Link href="/dashboard/history" className="font-semibold text-[#204195] underline-offset-4 hover:underline">
                {t('uxInterview.report.next.history')} →
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
