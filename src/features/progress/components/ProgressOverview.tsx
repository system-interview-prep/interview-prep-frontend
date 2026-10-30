"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Trophy } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localeOf } from "@/i18n/format";
import { cn } from "@/utils";
import type {
  GapItem,
  JobReadiness,
  MatchedPoint,
  PracticeProgress,
  RoundReadiness,
  TimelineEntry,
  TimelineRecord,
} from "../services/progress.service";
import { fill, shortDate, tierLabel } from "../utils/progressFormat";
import {
  adviceRoundOf,
  dueOf,
  FOCUSABLE_AREAS,
  LADDER_BASIC,
  LADDER_SOLID,
  LADDER_SOLID_RUN,
  ladderFloor,
  lastResumeFor,
  matchedSkillOf,
  practiceHref,
  readyCountOf,
  lastRoundScore,
  recentRecords,
  strengthsOf,
} from "../utils/progressModel";

/*
 * Progress page v2 (research 24/10, PROGRESS_TRACKING_PATTERNS): a headline
 * that only moves when a round changes level (Khan mastery), "Tuần này" with
 * one state and one advice (Garmin), the ladder of each round with its
 * written rules, points due for review (Anki), records (Strava PRs), and what
 * changed after each session against the candidate's usual level (Oura
 * baseline). Every number on this page has a sentence saying what moves it.
 */

type Translate = (key: string) => string;

const panel = "min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6 [overflow-wrap:anywhere]";
const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white hover:bg-[#183275]";

/** The drawn width of a chart, so its labels keep their size on a phone (no scaled-down viewBox). */
function useChartWidth(fallback: number) {
  const ref = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

function levelName(level: number, t: Translate): string {
  return t(`practiceProgress.ladder.level.${level}`);
}

function areaName(area: string | undefined, t: Translate): string {
  return t(`practiceProgress.area.${area ?? "other"}`);
}

export function recordText(record: TimelineRecord, t: Translate): string {
  if (record.kind === "best_round") {
    return fill(t("practiceProgress.records.best_round"), {
      round: areaName(record.area, t),
      tier: tierLabel(record.tier, t),
      score: record.score?.toFixed(1) ?? "—",
    });
  }
  return t(`practiceProgress.compare.first.${record.kind.replace("first_", "")}`);
}

/** The rule that moves a round up, with the progress already made. */
export function ladderRule(round: RoundReadiness, t: Translate): string {
  if ((round.series?.length ?? 0) === 0) return t("practiceProgress.ladder.unseen");
  const next = round.next ?? { kind: "reach" as const, score: LADDER_BASIC, have: 0, need: 1 };
  const line = fill(t(`practiceProgress.ladder.next.${next.kind}`), {
    score: next.score.toFixed(1),
    have: next.have,
    need: next.need,
  });
  const last = round.series?.[round.series.length - 1];
  return last && next.kind !== "top"
    ? `${line} · ${fill(t("practiceProgress.ladder.last"), { score: last.score.toFixed(1) })}`
    : line;
}

/** "2/5 phần đạt Vững trở lên" and a staircase of that number by week. */
export function ReadyHeadline({ job }: { job: JobReadiness }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const ready = readyCountOf(job);
  const total = job.rounds.length;
  const history = job.readyHistory ?? [];
  const values = history.map((week) => week.ready);
  const top = Math.max(1, total, ...values);
  const [chartRef, chartWidth] = useChartWidth(480);
  const x0 = 30;
  const x1 = chartWidth - 10;
  const yOf = (value: number) => 100 - (value / top) * 80;
  const xOf = (index: number) => (values.length <= 1 ? x1 : x0 + ((x1 - x0) * index) / (values.length - 1));
  const path = values
    .map((value, index) => (index === 0 ? `M${x0} ${yOf(value)}` : `H${xOf(index)} V${yOf(value)}`))
    .join(" ");
  const ticks = top <= 5 ? Array.from({ length: top + 1 }, (_, i) => i) : [0, top];
  return (
    <section className={cn(panel, "flex-[3_1_460px]")}>
      <p className="text-xs font-bold text-[#607096]">{fill(t("practiceProgress.headline.for"), { job: job.jobTitle ?? job.jobId })}</p>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5">
        <span className="font-display text-4xl font-extrabold leading-none tabular-nums text-[#14244B] sm:text-[44px]">
          {ready}/{total}
        </span>
        <span className="text-base font-bold text-[#14244B]">{t("practiceProgress.headline.unit")}</span>
      </p>
      {values.length >= 2 && (
        <svg
          ref={chartRef}
          viewBox={`0 0 ${chartWidth} 122`}
          className="mt-3 block h-[122px] w-full"
          role="img"
          aria-label={fill(t("practiceProgress.headline.aria"), { values: values.join(", ") })}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={x0} x2={x1} y1={yOf(tick)} y2={yOf(tick)} stroke={tick === 0 ? "#E3E8F2" : "#EEF2F8"} strokeDasharray={tick === 0 ? undefined : "3 4"} />
              <text x={x0 - 8} y={yOf(tick) + 4} fontSize="11" fill="#607096" textAnchor="end">
                {tick}
              </text>
            </g>
          ))}
          <path d={path} fill="none" stroke="#204195" strokeWidth="3" strokeLinejoin="round" />
          {values.map((value, index) =>
            index > 0 && value > values[index - 1] ? (
              <circle key={history[index].weekStart} cx={xOf(index)} cy={yOf(value)} r="5.5" fill="#2E8B57" />
            ) : null,
          )}
          <text x={x0} y="118" fontSize="11" fill="#607096">
            {shortDate(history[0].weekStart, locale)}
          </text>
          <text x={x1} y="118" fontSize="11" fill="#607096" textAnchor="end">
            {t("practiceProgress.headline.thisWeek")}
          </text>
        </svg>
      )}
      <p className="mt-2 text-sm text-[#33415F]">{t("practiceProgress.headline.note")}</p>
    </section>
  );
}

/** "Tuần này": one state, one sentence, the plan and one advice with its button. */
export function WeekCard({ progress, job }: { progress: PracticeProgress; job: JobReadiness }) {
  const { t } = useLanguage();
  const week = progress.week;
  if (!week) return null;
  const ups = week.levelUps.filter(
    (up, index, all) => all.findIndex((other) => other.area === up.area && other.to >= up.to) === index,
  );
  // Only good news earns a sentence: a part that moved up this week.
  const sentence = ups.length
    ? ups.map((up) => fill(t("practiceProgress.week.levelUp"), { round: areaName(up.area, t), level: levelName(up.to, t) })).join(" · ")
    : null;
  const advice = adviceRoundOf(job);
  const adviceText = advice
    ? fill(t(advice.reason === "risk" ? "practiceProgress.week.nextRisk" : "practiceProgress.week.next"), {
        round: areaName(advice.round.area, t),
      })
    : t("practiceProgress.week.nextTop");
  const href = practiceHref(job.jobId, lastResumeFor(progress, job.jobId), advice?.round.area);
  const segments = Math.max(1, week.goal);
  return (
    <section className={cn(panel, "flex flex-[2_1_320px] flex-col gap-3")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold text-[#607096]">{t("practiceProgress.week.title")}</h2>
        <span
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold",
            week.status === "improving" && "bg-[#E7F5EC] text-[#1F5C3A]",
            week.status === "start" && "bg-[#FFF4E0] text-[#8A5A0B]",
            week.status === "keep_going" && "bg-[#EEF3FF] text-[#204195]",
          )}
        >
          {t(`practiceProgress.week.status.${week.status}`)}
        </span>
      </div>
      {sentence && <p className="text-sm font-semibold text-[#1F5C3A]">{sentence}</p>}
      <div>
        <div className="flex gap-1.5" role="img" aria-label={fill(t("practiceProgress.week.planAria"), { n: week.sessions, goal: week.goal })}>
          {Array.from({ length: segments }, (_, i) => (
            <span key={i} className={cn("h-2.5 flex-1 rounded-full", i < week.sessions ? "bg-[#204195]" : "bg-[#E3E8F2]")} />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-[#33415F]">{fill(t("practiceProgress.week.count"), { n: week.sessions, goal: week.goal })}</p>
      </div>
      <p className="text-sm font-semibold text-[#14244B]">{adviceText}</p>
      <Link href={href} className={cn(primaryButton, "mt-auto self-start")}>
        {week.sessions < week.goal ? fill(t("practiceProgress.week.cta"), { n: week.sessions + 1 }) : t("practiceProgress.week.ctaMore")}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

/** Covered key points of one skill at one tier, answer after answer (Strava matched runs). */
export function MatchedChart({ skill, history }: { skill: string; history: MatchedPoint[] }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [chartRef, chartWidth] = useChartWidth(640);
  if (history.length === 0) return null;
  const share = (point: MatchedPoint) => (point.total > 0 ? point.covered / point.total : 0);
  const x0 = 60;
  const x1 = chartWidth - 30;
  const xOf = (index: number) => (history.length === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * index) / (history.length - 1));
  const yOf = (value: number) => 140 - value * 105;
  const last = history[history.length - 1];
  const earlier = history.slice(0, -1);
  const best = earlier.length > 0 && earlier.every((point) => share(last) > share(point));
  const before = earlier[earlier.length - 1];
  const tick = (value: number) => `${Math.round(value * 100)}%`;
  return (
    <div>
      <h3 className="text-sm font-bold text-[#14244B]">{t("practiceProgress.ladder.matched")}</h3>
      <p className="mt-0.5 text-xs text-[#607096]">
        {fill(t("practiceProgress.ladder.matchedDesc"), { skill, tier: tierLabel(last.tier, t) })}
      </p>
      <svg
        ref={chartRef}
        viewBox={`0 0 ${chartWidth} 172`}
        className="mt-2 block h-[172px] w-full"
        role="img"
        aria-label={fill(t("practiceProgress.ladder.matchedAria"), {
          skill,
          values: history.map((point) => `${point.covered}/${point.total}`).join(", "),
        })}
      >
        {[0, 0.5, 1].map((value) => (
          <g key={value}>
            <line x1={x0 - 20} x2={x1 + 10} y1={yOf(value)} y2={yOf(value)} stroke={value === 0 ? "#E3E8F2" : "#EEF2F8"} strokeDasharray={value === 0 ? undefined : "3 4"} />
            <text x={x0 - 26} y={yOf(value) + 4} fontSize="11" fill="#607096" textAnchor="end">
              {tick(value)}
            </text>
          </g>
        ))}
        {history.length > 1 && (
          <polyline points={history.map((point, i) => `${xOf(i)},${yOf(share(point))}`).join(" ")} fill="none" stroke="#9AA9C7" strokeWidth="2" />
        )}
        {history.map((point, i) => {
          const isLast = i === history.length - 1;
          return (
            <g key={`${point.sessionId}-${i}`}>
              <circle
                cx={xOf(i)}
                cy={yOf(share(point))}
                r={isLast ? 8 : 5.5}
                fill={isLast ? (best ? "#D99A19" : "#204195") : "#9AA9C7"}
                stroke="#fff"
                strokeWidth={isLast ? 2 : 0}
              />
              <text x={xOf(i)} y={yOf(share(point)) - 12} fontSize="11" fill="#33415F" textAnchor="middle" fontWeight={isLast ? 700 : 400}>
                {point.covered}/{point.total}
              </text>
            </g>
          );
        })}
        <text x={xOf(0)} y="166" fontSize="11" fill="#607096" textAnchor={history.length === 1 ? "middle" : "start"}>
          {shortDate(history[0].date, locale)}
        </text>
        {history.length > 1 && (
          <text x={x1} y="166" fontSize="11" fill="#607096" textAnchor="end">
            {shortDate(last.date, locale)}
          </text>
        )}
      </svg>
      <p className="mt-1 text-sm text-[#14244B]">
        {before
          ? fill(t("practiceProgress.ladder.matchedNow"), { covered: last.covered, total: last.total, before: `${before.covered}/${before.total}` })
          : fill(t("practiceProgress.ladder.matchedOne"), { covered: last.covered, total: last.total })}{" "}
        {best && <strong className="text-[#7A4E00]">{t("practiceProgress.ladder.matchedBest")}</strong>}
      </p>
      {last.sameQuestion && <p className="mt-1 text-xs text-[#607096]">{t("practiceProgress.ladder.sameQuestion")}</p>}
    </div>
  );
}

const QUESTIONS_SHOWN = 4;

/** The opened row: the rules, the matched chart, the skills and the questions asked. */
function RoundDetail({ progress, job, round }: { progress: PracticeProgress; job: JobReadiness; round: RoundReadiness }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const level = round.level ?? 0;
  const matched = matchedSkillOf(round);
  const ids = new Set(round.skills.map((skill) => skill.conceptId));
  const questions = progress.skills
    .filter((skill) => ids.has(skill.conceptId))
    .flatMap((skill) => (skill.recentQuestions ?? []).map((question) => ({ ...question, skill: skill.label })))
    // One answer can count for two skills of the round (FastAPI and Python): list it once.
    .filter((item, index, all) => all.findIndex((other) => other.sessionId === item.sessionId && other.question === item.question) === index)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, QUESTIONS_SHOWN);
  const focusable = FOCUSABLE_AREAS.includes(round.area);
  return (
    <div className="space-y-5 rounded-2xl bg-[#F8FAFC] p-4 ring-1 ring-[#EAEFF8] sm:p-5">
      <p className="text-sm font-semibold text-[#14244B]">
        {round.atRisk ? fill(t("practiceProgress.ladder.atRisk"), { score: ladderFloor(level).toFixed(1) }) : ladderRule(round, t)}
      </p>
      <div>
        <h3 className="text-sm font-bold text-[#14244B]">{t("practiceProgress.ladder.rules")}</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#33415F]">
          <li className={cn(level === 0 && "font-semibold text-[#14244B]")}>
            {fill(t("practiceProgress.ladder.rule.basic"), { score: LADDER_BASIC.toFixed(1) })}
          </li>
          <li className={cn(level === 1 && "font-semibold text-[#14244B]")}>
            {fill(t("practiceProgress.ladder.rule.solid"), { score: LADDER_SOLID.toFixed(1), need: LADDER_SOLID_RUN })}
          </li>
          <li className={cn(level === 2 && "font-semibold text-[#14244B]")}>
            {fill(t("practiceProgress.ladder.rule.mastered"), { score: LADDER_SOLID.toFixed(1) })}
          </li>
          <li>{t("practiceProgress.ladder.rule.down")}</li>
        </ul>
      </div>
      {matched?.history && <MatchedChart skill={matched.label} history={matched.history} />}
      {round.skills.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#14244B]">{t("practiceProgress.ladder.skills")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {round.skills.map((skill) => (
              <li key={skill.conceptId} className="rounded-full bg-white px-3 py-1 text-xs text-[#14244B] ring-1 ring-[#DCE4F3]">
                {skill.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {questions.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#14244B]">{t("practiceProgress.ladder.questions")}</h3>
          <ol className="mt-2 space-y-2.5">
            {questions.map((item) => (
              <li key={`${item.sessionId}-${item.question}`} className="rounded-xl bg-white p-3 text-sm ring-1 ring-[#EAEFF8]">
                <div className="flex items-start gap-3">
                  <span className="w-12 shrink-0 text-xs text-[#607096]">{shortDate(item.date, locale)}</span>
                  <p className="min-w-0 flex-1 text-[#14244B]">{item.question || t("practiceProgress.skills.questionUnknown")}</p>
                  <span className="shrink-0 font-bold tabular-nums text-[#14244B]">{item.score.toFixed(1)}</span>
                </div>
                {item.missing.length > 0 ? (
                  <ul className="mt-1.5 space-y-0.5 pl-[60px] text-xs text-[#8A5A0B]">
                    {item.missing.map((miss) => (
                      <li key={miss.point}>○ {miss.point}</li>
                    ))}
                  </ul>
                ) : item.checked ? (
                  <p className="mt-1.5 pl-[60px] text-xs text-[#1F5C3A]">✓ {t("practiceProgress.skills.missingNone")}</p>
                ) : null}
                <Link href={`/interview/results/${item.sessionId}`} className="mt-1 inline-block pl-[60px] text-xs font-semibold hover:underline">
                  {fill(t("practiceProgress.skills.openReport"), { date: shortDate(item.date, locale) })}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
      {focusable && (
        <Link href={practiceHref(job.jobId, lastResumeFor(progress, job.jobId), round.area)} className={primaryButton}>
          {t("practiceProgress.ladder.practice")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

/** One part in the strengths card: level, what moves it, the point it misses; opens its detail in place. */
function StrengthRow({
  progress,
  job,
  round,
  strong,
  habits,
  open,
  onToggle,
}: {
  progress: PracticeProgress;
  job: JobReadiness;
  round: RoundReadiness;
  strong: boolean;
  habits: Set<string>;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  const level = round.level ?? 0;
  const gap = !strong && round.topGap && !habits.has(round.topGap.point) ? round.topGap.point : null;
  const last = lastRoundScore(round);
  return (
    <li className="border-t border-[#EEF2F8] first:border-t-0">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-start gap-3 py-3 text-left">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-bold text-[#14244B]">{areaName(round.area, t)}</span>
            <span
              className={cn(
                "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold",
                strong && !round.atRisk ? "bg-[#E7F5EC] text-[#1F5C3A]" : "bg-[#FFF4E0] text-[#8A5A0B]",
              )}
            >
              {levelName(level, t)}
            </span>
            {round.atRisk && <span className="text-[11px] font-semibold text-[#8A5A0B]">{t("practiceProgress.strengths.atRisk")}</span>}
          </span>
          {gap && <span className="mt-0.5 block text-xs text-[#8A5A0B]">{fill(t("practiceProgress.strengths.missed"), { point: gap })}</span>}
        </span>
        {last !== null && (
          <span className="mt-0.5 shrink-0 text-sm font-bold tabular-nums text-[#14244B]" title={t("practiceProgress.strengths.lastTitle")}>
            {last.toFixed(1)}
          </span>
        )}
        <ChevronDown className={cn("mt-1 size-4 shrink-0 text-[#204195] transition-transform", open && "rotate-180")} aria-hidden="true" />
        <span className="sr-only">{t(open ? "practiceProgress.ladder.close" : "practiceProgress.ladder.open")}</span>
      </button>
      {open && (
        <div className="pb-4">
          <RoundDetail progress={progress} job={job} round={round} />
        </div>
      )}
    </li>
  );
}

/**
 * "Mạnh ở đâu, yếu ở đâu": every part of the position on one scale (the ladder
 * level, moved by whole sessions), weak parts first with what moves them up.
 * A point missed in several parts is shown once, as an answering habit.
 */
export function StrengthsCard({ progress, job }: { progress: PracticeProgress; job: JobReadiness }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState<string | null>(null);
  const split = strengthsOf(job);
  const habits = new Set(split.habits.map((habit) => habit.point));
  const column = (strong: boolean) => {
    const rounds = strong ? split.strong : split.weak;
    return (
      <div className="min-w-0">
        <h3 className={cn("text-sm font-bold", strong ? "text-[#1F5C3A]" : "text-[#8A5A0B]")}>
          {fill(t(strong ? "practiceProgress.strengths.strong" : "practiceProgress.strengths.weak"), { n: rounds.length })}
        </h3>
        {rounds.length === 0 ? (
          <p className="mt-2 text-sm text-[#607096]">
            {strong
              ? t("practiceProgress.strengths.strongEmpty")
              : t("practiceProgress.strengths.weakEmpty")}
          </p>
        ) : (
          <ul className="mt-1">
            {rounds.map((round) => (
              <StrengthRow
                key={round.area}
                progress={progress}
                job={job}
                round={round}
                strong={strong}
                habits={habits}
                open={open === round.area}
                onToggle={() => setOpen(open === round.area ? null : round.area)}
              />
            ))}
          </ul>
        )}
      </div>
    );
  };
  return (
    <section className={cn(panel, "flex-[3_1_520px]")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-lg font-bold text-[#14244B] sm:text-xl">{t("practiceProgress.strengths.title")}</h2>
        <p className="text-sm font-bold tabular-nums text-[#14244B]">
          {fill(t("practiceProgress.strengths.ready"), { ready: readyCountOf(job), total: job.rounds.length })}
        </p>
      </div>
      <div className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-2">
        {column(false)}
        {column(true)}
      </div>
      {split.habits.length > 0 && (
        <p className="mt-4 rounded-xl bg-[#FFF8EC] px-3 py-2 text-sm text-[#5C3D06]">
          {fill(t("practiceProgress.strengths.habit"), { point: split.habits[0].point, n: split.habits[0].rounds })}
        </p>
      )}
      {split.unseen.length > 0 && (
        <p className="mt-3 text-xs text-[#607096]">
          {fill(t("practiceProgress.strengths.unseen"), { rounds: split.unseen.map((round) => areaName(round.area, t)).join(", ") })}
        </p>
      )}
    </section>
  );
}

const DUE_SHOWN = 3;

/** "Đến hạn ôn": points missed before and due again; read the point, then practise it in a new question. */
export function DueCard({ progress, gaps }: { progress: PracticeProgress; gaps: GapItem[] }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [open, setOpen] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const { due, nextAt } = dueOf(gaps);
  const shown = all ? due : due.slice(0, DUE_SHOWN);
  return (
    <section className={cn(panel, "flex-[1_1_420px]")} id="due">
      <h2 className="font-display text-lg font-bold text-[#14244B] sm:text-xl">{fill(t("practiceProgress.due.title"), { n: due.length })}</h2>
      {due.length === 0 ? (
        <p className="mt-4 text-sm text-[#33415F]">
          {t("practiceProgress.due.none")}{" "}
          {nextAt && fill(t("practiceProgress.due.nextAt"), { date: shortDate(nextAt, locale) })}
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {shown.map((gap) => {
            const key = `${gap.skillKey}-${gap.point}`;
            const isOpen = open === key;
            const resumeId = gap.lastSeen.resumeId ?? (gap.lastSeen.jobId ? lastResumeFor(progress, gap.lastSeen.jobId) : null);
            return (
              <li key={key} className="rounded-2xl border border-[#DCE4F3] p-3 sm:p-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="min-w-0 flex-[1_1_200px]">
                    <span className="block text-[15px] font-bold text-[#14244B]">{gap.point}</span>
                    <span className="block text-xs text-[#607096]">
                      {fill(t("practiceProgress.due.where"), { skill: gap.skill, n: gap.timesMissed })}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="inline-flex h-10 shrink-0 items-center rounded-xl bg-[#EEF3FF] px-3.5 text-sm font-bold text-[#204195] hover:bg-[#E2EAFD]"
                  >
                    {t(isOpen ? "practiceProgress.due.hide" : "practiceProgress.due.review")}
                  </button>
                </div>
                {isOpen && (
                  <div className="mt-3 space-y-2 rounded-xl bg-[#F8FAFC] p-3 text-sm text-[#33415F] ring-1 ring-[#EAEFF8]">
                    <p className="font-bold text-[#14244B]">{t("practiceProgress.due.readTitle")}</p>
                    <p>{fill(t("practiceProgress.due.readPoint"), { point: gap.point })}</p>
                    {gap.lastSeen.question && (
                      <p className="text-[#8A5A0B]">
                        {fill(t("practiceProgress.due.readQuestion"), {
                          date: shortDate(gap.lastSeen.date, locale),
                          question: gap.lastSeen.question,
                        })}
                      </p>
                    )}
                    <p className="text-xs text-[#607096]">{t("practiceProgress.due.readHint")}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                      <Link
                        href={practiceHref(gap.lastSeen.jobId, resumeId, gap.area, { conceptId: gap.skillKey, skill: gap.skill })}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#204195] px-4 text-sm font-semibold text-white hover:bg-[#183275]"
                      >
                        {t("practiceProgress.due.reask")}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                      <Link href={`/interview/results/${gap.lastSeen.sessionId}`} className="text-xs font-semibold hover:underline">
                        {fill(t("practiceProgress.due.report"), { date: shortDate(gap.lastSeen.date, locale) })}
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {due.length > DUE_SHOWN && (
        <button type="button" onClick={() => setAll((value) => !value)} className="mt-3 text-xs font-semibold text-[#204195] hover:underline">
          {all ? t("practiceProgress.ladder.close") : fill(t("practiceProgress.due.more"), { n: due.length - DUE_SHOWN })}
        </button>
      )}
    </section>
  );
}

/** "Kỷ lục gần đây": things done for the first time, and a round's best score at a tier. */
export function RecordsCard({ timeline, jobId }: { timeline: TimelineEntry[]; jobId: string | null }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const records = recentRecords(timeline, jobId);
  return (
    <section className={cn(panel, "flex-[1_1_360px]")}>
      <h2 className="font-display text-lg font-bold text-[#14244B] sm:text-xl">{t("practiceProgress.records.title")}</h2>
      {records.length === 0 ? (
        <p className="mt-3 text-sm text-[#607096]">{t("practiceProgress.records.empty")}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {records.map((record, index) => (
            <li key={`${record.sessionId}-${record.kind}-${index}`} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#FFF3D6]" aria-hidden="true">
                <Trophy className="size-4 text-[#A86B00]" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[#14244B]">{recordText(record, t)}</span>
                {record.quote && <span className="mt-0.5 block text-xs italic text-[#33415F]">“…{record.quote}”</span>}
                <Link href={`/interview/results/${record.sessionId}`} className="mt-0.5 block text-xs text-[#607096] hover:underline">
                  {shortDate(record.date, locale)}
                  {record.kind === "best_round" ? "" : record.area ? ` · ${areaName(record.area, t)}` : ""}
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const CHIP = {
  up: "bg-[#E7F5EC] text-[#1F5C3A]",
  same: "bg-[#F1F4FA] text-[#33415F]",
  down: "bg-[#FFF1DC] text-[#8A5A0B]",
  best: "bg-[#FFF3D6] text-[#7A4E00]",
};

/** The chips of one session: level changes, rounds kept, records, a first session at a harder tier. */
export function timelineChips(
  entry: TimelineEntry,
  older: TimelineEntry[],
  t: Translate,
): { text: string; tone: keyof typeof CHIP }[] {
  const chips: { text: string; tone: keyof typeof CHIP }[] = [];
  for (const change of entry.levelChanges) {
    const key = change.to > change.from ? "practiceProgress.timeline.up" : "practiceProgress.timeline.down";
    chips.push({
      text: fill(t(key), { round: areaName(change.area, t), level: levelName(change.to, t) }),
      tone: change.to > change.from ? "up" : "down",
    });
  }
  if (entry.kept > 0) chips.push({ text: fill(t("practiceProgress.timeline.kept"), { n: entry.kept }), tone: "same" });
  for (const record of entry.records) {
    chips.push({ text: fill(t("practiceProgress.timeline.record"), { text: recordText(record, t) }), tone: "best" });
  }
  if (older.length > 0 && !older.some((item) => item.tier === entry.tier)) {
    chips.push({ text: fill(t("practiceProgress.timeline.newTier"), { tier: tierLabel(entry.tier, t) }), tone: "down" });
  }
  return chips;
}

const TIMELINE_SHOWN = 5;

/** "Sau mỗi buổi đã thay đổi gì", newest first, each session against the usual level. */
export function TimelineCard({ timeline, jobId }: { timeline: TimelineEntry[]; jobId: string | null }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [shown, setShown] = useState(TIMELINE_SHOWN);
  const entries = timeline.filter((entry) => !jobId || entry.jobId === jobId);
  if (entries.length === 0) return null;
  return (
    <section className={panel}>
      <h2 className="font-display text-lg font-bold text-[#14244B] sm:text-xl">{t("practiceProgress.timeline.title")}</h2>
      <p className="mt-1 text-xs text-[#607096]">{t("practiceProgress.timeline.desc")}</p>
      <ol className="mt-3">
        {entries.slice(0, shown).map((entry, index) => (
          <li key={entry.sessionId} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#EEF2F8] py-3.5">
            <span className="w-24 shrink-0">
              <span className="block text-[15px] font-bold text-[#14244B]">{shortDate(entry.date, locale)}</span>
              <span className="block text-xs text-[#607096]">{tierLabel(entry.tier, t)}</span>
            </span>
            <span
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold",
                entry.baseline === "above" ? CHIP.up : entry.baseline === "below" ? CHIP.down : CHIP.same,
                entry.baseline === null && "font-semibold text-[#607096]",
              )}
            >
              {t(`practiceProgress.timeline.baseline.${entry.baseline ?? "none"}`)}
            </span>
            <span className="flex min-w-0 flex-[1_1_300px] flex-wrap gap-1.5">
              {timelineChips(entry, entries.slice(index + 1), t).map((chip) => (
                <span key={chip.text} className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold", CHIP[chip.tone])}>
                  {chip.text}
                </span>
              ))}
            </span>
            <Link href={`/interview/results/${entry.sessionId}`} className="shrink-0 text-sm font-semibold hover:underline">
              {t("practiceProgress.timeline.report")}
            </Link>
          </li>
        ))}
      </ol>
      {entries.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + TIMELINE_SHOWN * 2)}
          className="mt-2 inline-flex h-9 items-center rounded-xl px-4 text-xs font-bold text-[#204195] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
        >
          {fill(t("practiceProgress.timeline.more"), { n: Math.min(TIMELINE_SHOWN * 2, entries.length - shown) })}
        </button>
      )}
    </section>
  );
}

/** First session for the position: no verdict yet, the rounds' first scores and what to do next. */
export function FirstSessionView({ progress, job, gaps }: { progress: PracticeProgress; job: JobReadiness; gaps: GapItem[] }) {
  const { t } = useLanguage();
  const advice = adviceRoundOf(job);
  const week = progress.week;
  const points = gaps.slice(0, 3).map((gap) => gap.point);
  return (
    <div className="flex flex-wrap items-start gap-6">
      <section className={cn(panel, "flex-[999_1_520px]")}>
        <h2 className="font-display text-xl font-extrabold text-[#14244B]">{t("practiceProgress.start.title")}</h2>
        <p className="mt-2 text-sm text-[#33415F]">{t("practiceProgress.start.desc")}</p>
        <ul className="mt-4">
          {job.rounds.map((round) => {
            const first = round.series?.[0];
            return (
              <li key={round.area} className="flex min-h-[48px] items-center gap-3 border-t border-[#EEF2F8]">
                <span className="min-w-0 flex-1 text-[15px] font-semibold text-[#14244B]">{areaName(round.area, t)}</span>
                <span className="shrink-0 text-sm text-[#607096]">
                  {first ? fill(t("practiceProgress.start.first"), { score: first.score.toFixed(1) }) : t("practiceProgress.start.notAsked")}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
      <section className={cn(panel, "flex-[1_1_340px]")}>
        <h2 className="text-xs font-bold uppercase tracking-wide text-[#607096]">{t("practiceProgress.start.next")}</h2>
        <ol className="mt-3 space-y-3">
          <li className="flex gap-3 rounded-2xl border border-[#DCE4F3] p-3.5">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#EEF3FF] text-xs font-extrabold text-[#204195]">1</span>
            <div className="min-w-0 space-y-1">
              <p className="text-[15px] font-bold text-[#14244B]">{t("practiceProgress.start.second")}</p>
              <p className="text-xs text-[#607096]">
                {advice
                  ? fill(t("practiceProgress.start.secondDesc"), { round: areaName(advice.round.area, t) })
                  : t("practiceProgress.start.secondAny")}
              </p>
              <Link
                href={practiceHref(job.jobId, lastResumeFor(progress, job.jobId), advice?.round.area)}
                className="mt-1.5 inline-flex h-10 items-center rounded-xl bg-[#204195] px-4 text-sm font-semibold text-white hover:bg-[#183275]"
              >
                {t("practiceProgress.start.cta")}
              </Link>
            </div>
          </li>
          {points.length > 0 && (
            <li className="flex gap-3 rounded-2xl border border-[#DCE4F3] p-3.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#EEF3FF] text-xs font-extrabold text-[#204195]">2</span>
              <div className="min-w-0 space-y-1">
                <p className="text-[15px] font-bold text-[#14244B]">{fill(t("practiceProgress.start.read"), { n: points.length })}</p>
                <p className="text-xs text-[#607096]">{points.join(" · ")}</p>
              </div>
            </li>
          )}
        </ol>
        {week && (
          <p className="mt-4 border-t border-[#EEF2F8] pt-3 text-sm text-[#33415F]">
            {fill(t("practiceProgress.start.goal"), { goal: week.goal, n: week.sessions })}
          </p>
        )}
      </section>
    </div>
  );
}

/** A closed section at the bottom of the page (real interviews, calendar, details). */
export function MoreSection({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-[#DCE4F3] bg-white">
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-5">
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-[#14244B]">{title}</span>
          {desc && <span className="mt-0.5 block text-xs text-[#607096]">{desc}</span>}
        </span>
        <ChevronDown className="size-5 shrink-0 text-[#607096] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-6 border-t border-[#EAEFF8] p-3 sm:p-5">{children}</div>
    </details>
  );
}
