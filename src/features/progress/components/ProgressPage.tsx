"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Flag, Loader2, Target, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localeOf } from "@/i18n/format";
import { cn } from "@/utils";
import {
  progressApi,
  type JobProgress,
  type PracticeProgress,
  type JobReadiness,
  type ProgressSession,
  type SkillArea,
  type Trend,
  SKILL_AREAS,
} from "../services/progress.service";
import { fill, longDate, milestoneText, monthLabel, percent, shortDate, tierLabel, trendLabel } from "../utils/progressFormat";
import {
  DEFAULT_FILTERS,
  filteredJobs,
  filteredSessions,
  filteredSkills,
  foldMonthly,
  evidenceOf,
  filteredGaps,
  FOCUSABLE_AREAS,
  jobReadinessOf,
  lastResumeFor,
  nextRound,
  practiceHref,
  LEVEL_COUNT,
  LEVEL_EDGES,
  LEVEL_MARGIN,
  readinessOf,
  READY_SCORE,
  shortTitle,
  sortedMilestones,
  STALE_DAYS,
  summaryOf,
  type EvidenceMetric,
  type ProgressFilters,
  type Readiness,
  type SkillSort,
  type SkillView,
} from "../utils/progressModel";
import { ScoreLineChart, type ScorePoint } from "./ScoreLineChart";
import { GapNotebookCard, RealInterviewsCard, RoundsCard, WinsCard } from "./ReadinessCards";
import { WeeklyStreakCard } from "./StreakCard";
import {
  DueCard,
  FirstSessionView,
  MoreSection,
  ReadyHeadline,
  RecordsCard,
  StrengthsCard,
  TimelineCard,
  WeekCard,
} from "./ProgressOverview";
import { ProgressV3 } from "./ProgressV3";

const SKILL_CHARTS = 6;

/** Unique x labels: two interviews on the same day must not share a category. */
export function uniqueLabels(dates: string[], locale: string): string[] {
  const seen = new Map<string, number>();
  // A series longer than ~10 months shows the year, so 10/10/25 and 10/10/26 differ.
  const times = dates.map((iso) => new Date(iso).getTime()).filter(Number.isFinite);
  const withYear = times.length > 1 && Math.max(...times) - Math.min(...times) > 300 * 86_400_000;
  return dates.map((iso) => {
    const base = withYear ? `${shortDate(iso, locale)}/${String(new Date(iso).getFullYear()).slice(2)}` : shortDate(iso, locale);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
}

/** For "fewer is better" counts (skipped questions) the backend already reports improving as "up". */
export function TrendBadge({ trend }: { trend: Trend }) {
  const { t } = useLanguage();
  const Icon = trend.status === "up" ? TrendingUp : trend.status === "down" ? TrendingDown : Minus;
  return (
    <span
      title={
        trend.probability != null && trend.status !== "insufficient"
          ? fill(t("practiceProgress.trend.probability"), { p: Math.round(trend.probability * 100) })
          : undefined
      }
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        trend.status === "up" && "bg-emerald-50 text-emerald-700",
        trend.status === "down" && "bg-rose-50 text-rose-700",
        (trend.status === "flat" || trend.status === "insufficient") && "bg-[#F0F4FC] text-[#607096]",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {trendLabel(trend.status, t)}
    </span>
  );
}

function Card({ title, desc, children, className }: { title: string; desc?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:p-5", className)}>
      <h2 className="font-display text-lg font-bold text-[#14244B]">{title}</h2>
      {desc && <p className="mt-1 text-xs leading-relaxed text-[#607096]">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** How the candidate answers, first answers vs latest ones: the clearest evidence of progress. */
function EvidenceCard({ sessions }: { sessions: ProgressSession[] }) {
  const { t } = useLanguage();
  const metrics = evidenceOf(sessions);
  const shown = metrics.filter((m) => m.nBefore + m.nNow > 0);
  const order = { improved: 0, declined: 1, same: 2, insufficient: 3 } as const;
  shown.sort((a, b) => order[a.status] - order[b.status]);
  if (shown.length === 0) return null;
  return (
    <Card title={t("practiceProgress.evidence.title")} desc={t("practiceProgress.evidence.desc")}>
      <ul className="grid gap-3 md:grid-cols-2">
        {shown.map((metric) => (
          <EvidenceRow key={metric.key} metric={metric} />
        ))}
      </ul>
    </Card>
  );
}

function EvidenceRow({ metric }: { metric: EvidenceMetric }) {
  const { t } = useLanguage();
  const pct = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);
  const tone =
    metric.status === "improved"
      ? "bg-emerald-50 text-emerald-700"
      : metric.status === "declined"
        ? "bg-rose-50 text-rose-700"
        : "bg-[#F0F4FC] text-[#607096]";
  return (
    <li className="min-w-0 rounded-2xl bg-[#F8FAFC] px-4 py-3 ring-1 ring-[#EAEFF8]">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[13px] font-semibold text-[#14244B]">{t(`practiceProgress.evidence.${metric.key}`)}</p>
        <span className={cn("shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", tone)}>
          {t(`practiceProgress.evidence.status.${metric.status}`)}
        </span>
      </div>
      {metric.status === "insufficient" ? (
        <p className="mt-2 text-xs text-[#607096]">
          {fill(t("practiceProgress.evidence.needMore"), { n: Math.min(metric.nBefore, metric.nNow), min: 5 })}
        </p>
      ) : (
        <>
          <p className="mt-1.5 font-display text-xl font-extrabold tabular-nums text-[#14244B]">
            {pct(metric.before)} <span className="text-base font-bold text-[#8B98B5]">→</span> {pct(metric.now)}
          </p>
          <div className="mt-2 space-y-1" aria-hidden="true">
            <div className="h-1.5 overflow-hidden rounded-full bg-[#EAEFF8]">
              <div className="h-1.5 rounded-full bg-[#9AA6C2]" style={{ width: `${Math.round((metric.before ?? 0) * 100)}%` }} />
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#EAEFF8]">
              <div className="h-1.5 rounded-full bg-[#204195]" style={{ width: `${Math.round((metric.now ?? 0) * 100)}%` }} />
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-[#607096]">
            {fill(t(metric.key === "coreCoverage" ? "practiceProgress.evidence.windowPoints" : "practiceProgress.evidence.window"), {
              before: metric.nBefore,
              now: metric.nNow,
            })}
          </p>
        </>
      )}
    </li>
  );
}

/** Level name, its position, and how far the estimate is from the next level. */
function SkillLevel({ skill }: { skill: SkillView }) {
  const { t } = useLanguage();
  const estimate = skill.estimate ?? null;
  const next = skill.level < LEVEL_EDGES.length ? LEVEL_EDGES[skill.level] + LEVEL_MARGIN : null;
  const gap = estimate !== null && next !== null ? Math.max(0, next - estimate) : null;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="shrink-0 whitespace-nowrap rounded-full bg-[#EEF2FD] px-2 py-0.5 text-[11px] font-bold text-[#204195]">
          {t(`practiceProgress.level.${skill.level}`)}
        </span>
        <span className="min-w-0 text-right text-[11px] text-[#607096]">
          {gap === null
            ? t("practiceProgress.level.top")
            : fill(t("practiceProgress.level.toNext"), { gap: gap.toFixed(1), level: t(`practiceProgress.level.${skill.level + 1}`) })}
        </span>
      </div>
      <div className="mt-1.5 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${LEVEL_COUNT}, minmax(0, 1fr))` }} aria-hidden="true">
        {Array.from({ length: LEVEL_COUNT }, (_, i) => (
          <span key={i} className={cn("h-1.5 rounded-full", i <= skill.level ? "bg-[#204195]" : "bg-[#DCE4F3]")} />
        ))}
      </div>
    </div>
  );
}

const selectClass =
  "h-9 min-w-0 max-w-full rounded-xl border border-[#DCE4F3] bg-white px-3 text-xs font-semibold text-[#14244B] focus:outline-none focus:ring-2 focus:ring-[#204195]/30";

/** One row above the charts: CV, position, time range (dataviz: filters in one row). */
function FilterBar({
  progress,
  filters,
  onChange,
}: {
  progress: PracticeProgress;
  filters: ProgressFilters;
  onChange: (next: ProgressFilters) => void;
}) {
  const { t } = useLanguage();
  const jobs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const session of progress.sessions) {
      if (session.jobId && !seen.has(session.jobId)) seen.set(session.jobId, session.jobTitle ?? session.jobId);
    }
    return [...seen.entries()];
  }, [progress.sessions]);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#DCE4F3] bg-white p-3" role="group" aria-label={t("practiceProgress.filter.label")}>
      <span className="text-xs font-bold text-[#607096]">{t("practiceProgress.filter.label")}</span>
      <select
        aria-label={t("practiceProgress.filter.cv")}
        className={cn(selectClass, "w-full sm:w-auto sm:max-w-[16rem]")}
        value={filters.resumeId}
        onChange={(e) => onChange({ ...filters, resumeId: e.target.value })}
      >
        <option value="all">{t("practiceProgress.filter.allCvs")}</option>
        {progress.resumes.map((cv) => (
          <option key={cv.resumeId} value={cv.resumeId}>
            {cv.name ?? cv.resumeId} ({cv.sessions})
          </option>
        ))}
      </select>
      <select
        aria-label={t("practiceProgress.filter.job")}
        className={cn(selectClass, "w-full sm:w-auto sm:max-w-[16rem]")}
        value={filters.jobId}
        onChange={(e) => onChange({ ...filters, jobId: e.target.value })}
      >
        <option value="all">{t("practiceProgress.filter.allJobs")}</option>
        {jobs.map(([id, title]) => (
          <option key={id} value={id}>
            {title}
          </option>
        ))}
      </select>
      <div className="flex gap-1" role="radiogroup" aria-label={t("practiceProgress.filter.range")}>
        {(["3m", "6m", "12m", "all"] as const).map((range) => (
          <button
            key={range}
            type="button"
            role="radio"
            aria-checked={filters.range === range}
            onClick={() => onChange({ ...filters, range })}
            className={cn(
              "h-9 rounded-xl px-3 text-xs font-semibold",
              filters.range === range ? "bg-[#204195] text-white" : "bg-[#F8FAFC] text-[#14244B] ring-1 ring-[#DCE4F3]",
            )}
          >
            {t(`practiceProgress.filter.range.${range}`)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SkillCardItem({ skill, now, hideLevel = false }: { skill: SkillView; now: Date; hideLevel?: boolean }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const last = skill.points[skill.points.length - 1];
  const idleDays = last ? Math.floor((now.getTime() - new Date(last.date).getTime()) / 86_400_000) : 0;
  const folded = foldMonthly(skill.points);
  const monthly = folded.length < skill.points.length;
  const labels = monthly
    ? folded.map((p) => monthLabel(p.date))
    : uniqueLabels(folded.map((p) => p.date), locale);
  const points: ScorePoint[] = folded.map((p, i) => ({
    key: p.sessionId,
    x: labels[i],
    score: p.score,
    detail: monthly ? fill(t("practiceProgress.skills.monthMean"), { n: p.count }) : tierLabel(p.tier, t),
    estimate: p.estimate ?? null,
    // 80% band around the estimate.
    band:
      p.estimate != null && p.estimateSd != null
        ? [Math.max(0, p.estimate - 1.28 * p.estimateSd), Math.min(10, p.estimate + 1.28 * p.estimateSd)]
        : null,
  }));
  return (
    <div className="min-w-0 rounded-2xl p-3 ring-1 ring-[#EAEFF8]">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-bold text-[#14244B] [overflow-wrap:anywhere]">{skill.label}</p>
        <TrendBadge trend={skill.trend} />
      </div>
      {!hideLevel && <SkillLevel skill={skill} />}
      <p className="mt-1.5 text-[11px] text-[#607096]">
        {skill.estimate != null && !hideLevel && (
          <>
            {fill(t("practiceProgress.skills.estimate"), { score: skill.estimate.toFixed(1) })} ·{" "}
          </>
        )}
        {fill(t("practiceProgress.skills.latest"), { score: skill.latest.toFixed(1) })} ·{" "}
        {fill(t("practiceProgress.skills.sessions"), { n: skill.sessionsCount })}
      </p>
      {idleDays >= STALE_DAYS && (
        <p className="mt-1 inline-flex rounded-full bg-[#FFF8E6] px-2 py-0.5 text-[11px] font-semibold text-[#7A4B00]">
          {fill(t("practiceProgress.skills.stale"), { n: idleDays })}
        </p>
      )}
      {monthly && <p className="mt-1 text-[11px] text-[#607096]">{t("practiceProgress.skills.monthlyNote")}</p>}
      <ScoreLineChart
        points={points}
        target={READY_SCORE}
        targetLabel={fill(t("practiceProgress.skills.target"), { score: READY_SCORE })}
        ariaLabel={`${skill.label}: ${points.map((p) => p.score).join(", ")}`}
      />
      <SkillQuestions skill={skill} />
    </div>
  );
}

const AREA_SHOWN = 3;

/** Skills grouped by area in display order; empty areas left out, order inside kept. */
export function groupByArea<T extends { area?: SkillArea }>(skills: T[]): { area: SkillArea; skills: T[] }[] {
  return SKILL_AREAS.map((area) => ({ area, skills: skills.filter((skill) => (skill.area ?? "other") === area) })).filter(
    (group) => group.skills.length > 0,
  );
}

/** One area (databases, infrastructure, projects…): its skills, a few at a time. */
function SkillAreaGroup({ area, skills, now, hideLevel }: { area: SkillArea; skills: SkillView[]; now: Date; hideLevel?: boolean }) {
  const { t } = useLanguage();
  const [shown, setShown] = useState(AREA_SHOWN);
  const improving = skills.filter((skill) => skill.trend.status === "up").length;
  return (
    <section aria-label={t(`practiceProgress.area.${area}`)}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-bold text-[#14244B]">{t(`practiceProgress.area.${area}`)}</h3>
        <p className="text-[11px] text-[#607096]">
          {fill(t("practiceProgress.area.summary"), { n: skills.length, up: improving })}
        </p>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-[#607096]">{t(`practiceProgress.area.${area}.desc`)}</p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {skills.slice(0, shown).map((skill) => (
          <SkillCardItem key={skill.conceptId} skill={skill} now={now} hideLevel={hideLevel} />
        ))}
      </div>
      {skills.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + SKILL_CHARTS)}
          className="mt-3 inline-flex h-9 items-center rounded-xl px-4 text-xs font-bold text-[#204195] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
        >
          {fill(t("practiceProgress.skills.showMore"), { n: Math.min(SKILL_CHARTS, skills.length - shown) })}
        </button>
      )}
    </section>
  );
}

/** The skill cards of one round, opened from the readiness card (filtered skills only). */
function RoundSkills({ conceptIds, skills, now }: { conceptIds: string[]; skills: SkillView[]; now: Date }) {
  const { t } = useLanguage();
  const inRound = conceptIds
    .map((id) => skills.find((skill) => skill.conceptId === id))
    .filter((skill): skill is SkillView => Boolean(skill));
  if (inRound.length === 0) return <p className="text-xs text-[#607096]">{t("practiceProgress.rounds.noDetail")}</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {inRound.map((skill) => (
        <SkillCardItem key={skill.conceptId} skill={skill} now={now} />
      ))}
    </div>
  );
}

/** What was asked under a skill, the score, and the key points the answer missed. */
function SkillQuestions({ skill }: { skill: SkillView }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const questions = skill.recentQuestions ?? [];
  if (questions.length === 0) return null;
  return (
    <details className="mt-2 rounded-xl bg-[#F8FAFC] px-3 py-2 ring-1 ring-[#EAEFF8]">
      <summary className="cursor-pointer text-xs font-semibold text-[#204195]">
        {fill(t("practiceProgress.skills.questions"), { n: questions.length })}
      </summary>
      <ol className="mt-2 space-y-3">
        {questions.map((item, index) => (
          // The same question can come twice in a session (asked again after a skip).
          <li key={`${item.sessionId}-${item.question}-${index}`} className="text-xs">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-[#14244B] [overflow-wrap:anywhere]">{item.question || t("practiceProgress.skills.questionUnknown")}</p>
              <span className="shrink-0 font-bold tabular-nums text-[#14244B]">{item.score.toFixed(1)}</span>
            </div>
            {item.missing.length > 0 ? (
              <div className="mt-1">
                <p className="text-[11px] font-semibold text-[#8A5A0B]">{t("practiceProgress.skills.missing")}</p>
                <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[11px] text-[#33415F]">
                  {item.missing.map((miss) => (
                    <li key={miss.point}>
                      {miss.point}
                      {miss.status !== "MISSING" && (
                        <span className="text-[#607096]"> ({t(`practiceProgress.skills.missing.${miss.status}`)})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : item.checked ? (
              <p className="mt-1 text-[11px] text-[#287A4B]">{t("practiceProgress.skills.missingNone")}</p>
            ) : null}
            <Link href={`/interview/results/${item.sessionId}`} className="mt-1 inline-block text-[11px] font-semibold hover:underline">
              {fill(t("practiceProgress.skills.openReport"), { date: shortDate(item.date, locale) })}
            </Link>
          </li>
        ))}
      </ol>
    </details>
  );
}

function SkillsCard({
  skills,
  filters,
  onChange,
  now,
  hideLevel,
}: {
  now: Date;
  /** Under the ladder (page v2) the round level is the only level shown. */
  hideLevel?: boolean;
  skills: SkillView[];
  filters: ProgressFilters;
  onChange: (next: ProgressFilters) => void;
}) {
  const { t } = useLanguage();
  // JSON, XML, Git…: no longer asked as a topic of their own (research 20/10).
  const minor = skills.filter((skill) => skill.minor);
  const asked = skills.filter((skill) => !skill.minor);
  const charted = asked.filter((skill) => skill.sessionsCount >= 2);
  const once = asked.filter((skill) => skill.sessionsCount < 2);
  return (
    <Card title={t("practiceProgress.skills.title")} desc={t("practiceProgress.skills.desc")}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder={t("practiceProgress.skills.search")}
          aria-label={t("practiceProgress.skills.search")}
          className={cn(selectClass, "w-full font-normal sm:w-56")}
        />
        <select
          aria-label={t("practiceProgress.skills.sort")}
          className={selectClass}
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SkillSort })}
        >
          <option value="most">{t("practiceProgress.skills.sort.most")}</option>
          <option value="improved">{t("practiceProgress.skills.sort.improved")}</option>
          <option value="weakest">{t("practiceProgress.skills.sort.weakest")}</option>
        </select>
        <span className="text-xs text-[#8B98B5]">{fill(t("practiceProgress.skills.count"), { n: asked.length })}</span>
      </div>
      {charted.length === 0 ? (
        <p className="text-sm text-[#607096]">{t("practiceProgress.skills.noneRepeated")}</p>
      ) : (
        <div className="space-y-6">
          {groupByArea(charted).map(({ area, skills: inArea }) => (
            <SkillAreaGroup key={area} area={area} skills={inArea} now={now} hideLevel={hideLevel} />
          ))}
        </div>
      )}
      {once.length > 0 && (
        <div className="mt-5 border-t border-[#EAEFF8] pt-4">
          <p className="text-xs font-semibold text-[#607096]">{fill(t("practiceProgress.skills.once"), { n: once.length })}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {once.map((skill) => (
              <li
                key={skill.conceptId}
                title={t(`practiceProgress.area.${skill.area ?? "other"}`)}
                className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs text-[#14244B] ring-1 ring-[#EAEFF8]"
              >
                {skill.label} <span className="font-semibold tabular-nums">{skill.latest.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {minor.length > 0 && (
        <p className="mt-4 text-[11px] leading-relaxed text-[#607096]">
          {fill(t("practiceProgress.skills.minorNote"), { skills: minor.map((skill) => skill.label).join(", ") })}
        </p>
      )}
    </Card>
  );
}

const JOBS_SHOWN = 3;
const ONCE_SHOWN = 5;

function JobChart({ job }: { job: JobProgress }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const folded = foldMonthly(job.points);
  const monthly = folded.length < job.points.length;
  const labels = monthly ? folded.map((p) => monthLabel(p.date)) : uniqueLabels(folded.map((p) => p.date), locale);
  const labelOfSession = new Map<string, string>();
  job.points.forEach((p) => {
    const index = monthly
      ? folded.findIndex((f) => monthLabel(f.date) === monthLabel(p.date))
      : folded.findIndex((f) => f.sessionId === p.sessionId);
    if (index >= 0) labelOfSession.set(p.sessionId, labels[index]);
  });
  const points: ScorePoint[] = folded.map((p, i) => ({
    key: p.sessionId,
    x: labels[i],
    score: p.score,
    detail: monthly ? fill(t("practiceProgress.skills.monthMean"), { n: p.count }) : tierLabel(p.tier, t),
  }));
  const markers = job.tierChanges.map((change) => ({
    x: labelOfSession.get(change.sessionId) ?? "",
    label: fill(t("practiceProgress.jobs.tierChange"), { tier: tierLabel(change.to, t) }),
  }));
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 text-sm font-bold text-[#14244B] [overflow-wrap:anywhere]">{job.jobTitle ?? job.jobId}</p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#FFF8E6] px-2 py-0.5 text-[11px] font-semibold text-[#7A4B00] ring-1 ring-[#FCB625]/40">
            {tierLabel(job.currentTier, t)}
          </span>
          <TrendBadge trend={job.trend} />
        </div>
      </div>
      {monthly && <p className="mt-1 text-[11px] text-[#607096]">{t("practiceProgress.skills.monthlyNote")}</p>}
      <ScoreLineChart
        points={points}
        markers={markers}
        height={170}
        ariaLabel={`${job.jobTitle ?? ""}: ${points.map((p) => `${p.x} ${p.score}`).join(", ")}`}
      />
      {markers.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2 text-[11px] text-[#7A4B00]">
          {markers.map((marker) => (
            <li key={`${marker.x}-${marker.label}`} className="flex items-center gap-1.5">
              <span className="h-3 w-0.5 rounded bg-[#D99A19]" aria-hidden="true" />
              {marker.x}: {marker.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Positions with two sessions or more get a chart; one-off positions a compact list (a one-point chart says nothing). */
function JobsCard({ jobs }: { jobs: JobProgress[] }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [shown, setShown] = useState(JOBS_SHOWN);
  const [onceShown, setOnceShown] = useState(ONCE_SHOWN);
  if (jobs.length === 0) return null;
  const charted = jobs.filter((job) => job.points.length >= 2);
  const once = jobs.filter((job) => job.points.length < 2);
  return (
    <Card title={t("practiceProgress.jobs.title")} desc={t("practiceProgress.jobs.desc")}>
      {charted.length > 0 && (
        <div className="space-y-5">
          {charted.slice(0, shown).map((job) => (
            <JobChart key={job.jobId} job={job} />
          ))}
        </div>
      )}
      {charted.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + JOBS_SHOWN)}
          className="mt-4 inline-flex h-9 items-center rounded-xl px-4 text-xs font-bold text-[#204195] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
        >
          {fill(t("practiceProgress.jobs.showMore"), { n: charted.length - shown })}
        </button>
      )}
      {once.length > 0 && (
        <div className={cn(charted.length > 0 && "mt-5 border-t border-[#EAEFF8] pt-4")}>
          <p className="text-xs font-semibold text-[#607096]">{fill(t("practiceProgress.jobs.once"), { n: once.length })}</p>
          <ul className="mt-2 divide-y divide-[#EAEFF8]">
            {once.slice(0, onceShown).map((job) => {
              const point = job.points[0];
              return (
                <li key={job.jobId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <Link
                    href={`/interview/results/${point.sessionId}`}
                    className="min-w-0 flex-1 basis-56 text-sm font-semibold text-[#14244B] [overflow-wrap:anywhere] hover:underline"
                  >
                    {job.jobTitle ?? job.jobId}
                  </Link>
                  <span className="text-[11px] text-[#607096]">{shortDate(point.date, locale)}</span>
                  <span className="rounded-full bg-[#FFF8E6] px-2 py-0.5 text-[11px] font-semibold text-[#7A4B00]">{tierLabel(point.tier, t)}</span>
                  <span className="w-10 text-right text-sm font-bold tabular-nums text-[#14244B]">{point.score.toFixed(1)}</span>
                </li>
              );
            })}
          </ul>
          {once.length > onceShown && (
            <button
              type="button"
              onClick={() => setOnceShown((n) => n + ONCE_SHOWN * 2)}
              className="mt-2 inline-flex h-9 items-center rounded-xl px-4 text-xs font-bold text-[#204195] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
            >
              {fill(t("practiceProgress.jobs.onceMore"), { n: once.length - onceShown })}
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

/** One line on where the candidate stands, and the one skill to practise next (feed-forward). */
function SummaryCard({
  progress,
  skills,
  sessions,
  now,
  job,
}: {
  progress: PracticeProgress;
  skills: SkillView[];
  sessions: ProgressSession[];
  now: Date;
  job: JobReadiness | null;
}) {
  const { t } = useLanguage();
  const summary = summaryOf(skills, now);
  const { streak } = progress;
  // The clearest change in how the candidate answers leads the summary.
  const evidence = evidenceOf(sessions)
    .filter((m) => m.status === "improved" && m.before !== null && m.now !== null)
    .sort((a, b) => Math.abs((b.now ?? 0) - (b.before ?? 0)) - Math.abs((a.now ?? 0) - (a.before ?? 0)))[0];
  // One supporting sentence (UX review 20/10: three unrelated facts in one
  // line were hard to read): the clearest change in answers, else the skills
  // going up, else the week. The streak card has the week in full.
  const supporting = evidence
    ? fill(t("practiceProgress.summary.evidence"), {
        what: t(`practiceProgress.evidence.${evidence.key}`),
        before: `${Math.round((evidence.before ?? 0) * 100)}%`,
        now: `${Math.round((evidence.now ?? 0) * 100)}%`,
      })
    : summary.improving.length === 1
      ? fill(t("practiceProgress.summary.improvingOne"), { skill: summary.improving[0].label })
      : summary.improving.length > 1
        ? fill(t("practiceProgress.summary.improvingMany"), {
            skill: summary.improving[0].label,
            n: summary.improving.length - 1,
          })
        : streak.weeks > 0
          ? fill(t("practiceProgress.summary.streak"), { n: streak.weeks })
          : fill(t("practiceProgress.summary.streakNone"), { count: streak.thisWeekCount, goal: streak.goal });
  // With readiness by round: the round to practise next, the point missed most
  // there, and a link that opens a session focused on that round.
  const round = nextRound(job);
  const roundLine = round
    ? [
        fill(t(`practiceProgress.summary.round.${round.status}`), {
          round: t(`practiceProgress.area.${round.area}`),
          score: round.estimate?.toFixed(1) ?? "—",
        }),
        round.topGap ? fill(t("practiceProgress.summary.round.gap"), { point: round.topGap.point }) : null,
      ]
        .filter(Boolean)
        .join(" ")
    : job
      ? t("practiceProgress.summary.round.allReady")
      : null;
  const href = job ? practiceHref(job.jobId, lastResumeFor(progress, job.jobId), round?.area) : "/interview/select";
  const focusLine =
    roundLine ??
    (summary.focus && summary.focusReason
      ? fill(t(`practiceProgress.summary.focus.${summary.focusReason}`), {
          skill: summary.focus.label,
          score: summary.focus.latest.toFixed(1),
          n: summary.idleDays,
          target: READY_SCORE,
        })
      : fill(t("practiceProgress.summary.allReady"), { target: READY_SCORE }));
  return (
    <section
      aria-label={t("practiceProgress.summary.title")}
      className="flex flex-col gap-4 rounded-2xl border border-[#C9D6F5] bg-[#F5F8FF] p-4 sm:flex-row sm:items-center sm:p-5"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="flex items-start gap-2 text-base font-bold leading-7 text-[#14244B]">
          <Target className="mt-1.5 size-4 shrink-0 text-[#204195]" aria-hidden="true" />
          <span>{focusLine}</span>
        </p>
        <p className="pl-6 text-sm leading-6 text-[#4A5878]">{supporting}</p>
      </div>
      <Link
        href={href}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white hover:bg-[#183275] sm:self-center"
      >
        {round && FOCUSABLE_AREAS.includes(round.area)
          ? t("practiceProgress.rounds.practice")
          : round || (!job && summary.focus)
            ? t("practiceProgress.summary.practice")
            : t("practiceProgress.summary.practiceMore")}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

const READY_SHOWN = 5;

/** Feed-up: how close the candidate is to their position (skills at the line). The week's goal sits in the streak card beside it. */
function GoalsCard({ readiness }: { readiness: Readiness | null }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const skills = readiness ? (expanded ? readiness.skills : readiness.skills.slice(0, READY_SHOWN)) : [];
  return (
    <Card title={t("practiceProgress.goals.title")}>
      <div className="space-y-5">
        {readiness ? (
          <div>
            <p className="text-xs font-semibold text-[#607096]">{t("practiceProgress.goals.ready")}</p>
            <p className="mt-0.5 text-sm font-bold text-[#14244B] [overflow-wrap:anywhere]">{readiness.jobTitle ?? readiness.jobId}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EAEFF8]" aria-hidden="true">
                <div
                  className="h-2 rounded-full bg-[#287A4B]"
                  style={{ width: `${Math.round((readiness.ready / readiness.total) * 100)}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-bold tabular-nums text-[#14244B]">
                {fill(t("practiceProgress.goals.readyValue"), { ready: readiness.ready, total: readiness.total, target: READY_SCORE })}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {skills.map((skill) => (
                <li key={skill.conceptId} className="grid grid-cols-[minmax(0,1fr)_5rem_2.5rem] items-center gap-2 text-xs">
                  <span className="truncate text-[#14244B]" title={skill.label}>
                    {skill.label}
                  </span>
                  <span className="relative h-1.5 rounded-full bg-[#EAEFF8]" aria-hidden="true">
                    <span
                      className={cn("absolute inset-y-0 left-0 rounded-full", skill.ready ? "bg-[#287A4B]" : "bg-[#D08A1E]")}
                      style={{ width: `${Math.min(100, (skill.latest / 10) * 100)}%` }}
                    />
                    <span className="absolute -top-0.5 h-2.5 w-0.5 rounded bg-[#287A4B]" style={{ left: `${READY_SCORE * 10}%` }} />
                  </span>
                  <span className={cn("text-right font-semibold tabular-nums", skill.ready ? "text-[#1F5C3A]" : "text-[#8A5A0B]")}>
                    {skill.latest.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
            {readiness.skills.length > READY_SHOWN && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-2 inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold text-[#204195] hover:bg-[#F0F4FC]"
              >
                {expanded
                  ? t("practiceProgress.goals.showLess")
                  : fill(t("practiceProgress.goals.showAll"), { n: readiness.skills.length })}
              </button>
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-[#607096]">
              {fill(t("practiceProgress.goals.readyHelp"), { job: shortTitle(readiness.jobTitle, 40), n: readiness.sessions })}
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#607096]">{t("practiceProgress.goals.readyEmpty")}</p>
        )}
      </div>
    </Card>
  );
}

/** How "đang tốt lên" is decided, and whether the noise behind it was measured. */
function CalibrationNote({ progress }: { progress: PracticeProgress }) {
  const { t, lang } = useLanguage();
  const calibration = progress.calibration;
  if (!calibration) return null;
  return (
    <p className="px-1 text-[11px] leading-relaxed text-[#607096]">
      {calibration.measured && calibration.measuredAt
        ? fill(t("practiceProgress.calibration.measured"), {
            date: longDate(calibration.measuredAt, localeOf(lang)),
            te: calibration.typicalError.toFixed(1),
          })
        : fill(t("practiceProgress.calibration.default"), { te: calibration.typicalError.toFixed(1) })}{" "}
      {t("practiceProgress.calibration.rule")}
    </p>
  );
}

function MilestonesCard({ progress }: { progress: PracticeProgress }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  if (progress.milestones.length === 0) return null;
  return (
    <Card title={t("practiceProgress.milestones.title")}>
      <ol className="relative space-y-3 border-l-2 border-[#EAEFF8] pl-5">
        {sortedMilestones(progress.milestones)
          .map((milestone) => (
            <li key={`${milestone.kind}-${milestone.sessionId}-${milestone.skill ?? ""}`} className="relative">
              <span className="absolute -left-[27px] top-0.5 grid size-5 place-items-center rounded-full bg-[#FCB625] text-[#14244B]">
                <Flag className="size-3" aria-hidden="true" />
              </span>
              <Link href={`/interview/results/${milestone.sessionId}`} className="text-sm font-semibold text-[#14244B] [overflow-wrap:anywhere] hover:underline">
                {milestoneText({ ...milestone, jobTitle: shortTitle(milestone.jobTitle) }, t)}
              </Link>
              <p className="text-[11px] text-[#8B98B5]">{longDate(milestone.date, locale)}</p>
            </li>
          ))}
      </ol>
    </Card>
  );
}

const TABLE_ROWS = 10;

function SessionsTable({ sessions }: { sessions: ProgressSession[] }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [shown, setShown] = useState(TABLE_ROWS);
  const newestFirst = sessions.slice().reverse();
  return (
    <details className="rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:p-5">
      <summary className="cursor-pointer text-sm font-bold text-[#204195]">{t("practiceProgress.table.show")}</summary>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="text-[#607096]">
            <tr>
              <th className="py-2 pr-3 font-semibold">{t("practiceProgress.table.date")}</th>
              <th className="py-2 pr-3 font-semibold">{t("practiceProgress.table.position")}</th>
              <th className="py-2 pr-3 font-semibold">{t("practiceProgress.table.cv")}</th>
              <th className="py-2 pr-3 font-semibold">{t("practiceProgress.table.level")}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t("practiceProgress.table.score")}</th>
              <th className="py-2 pr-3 text-right font-semibold">{t("practiceProgress.table.firstTime")}</th>
              <th className="py-2 text-right font-semibold">{t("practiceProgress.table.skipped")}</th>
            </tr>
          </thead>
          <tbody className="text-[#14244B]">
            {newestFirst.slice(0, shown).map((s) => (
                <tr key={s.sessionId} className="border-t border-[#EAEFF8]">
                  <td className="whitespace-nowrap py-2 pr-3">{longDate(s.date, locale)}</td>
                  <td className="max-w-[14rem] py-2 pr-3 [overflow-wrap:anywhere]">{s.jobTitle ?? "—"}</td>
                  <td className="max-w-[12rem] py-2 pr-3 [overflow-wrap:anywhere]">{s.resumeName ?? "—"}</td>
                  <td className="py-2 pr-3">{tierLabel(s.tier, t)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{s.overallScore?.toFixed(1) ?? "—"}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{percent(s.behavior.firstTimeSufficientRate)}</td>
                  <td className="py-2 text-right tabular-nums">{s.behavior.skipped}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {newestFirst.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + TABLE_ROWS)}
          className="mt-3 inline-flex h-9 items-center rounded-xl px-4 text-xs font-bold text-[#204195] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
        >
          {fill(t("practiceProgress.skills.showMore"), { n: Math.min(TABLE_ROWS, newestFirst.length - shown) })}
        </button>
      )}
    </details>
  );
}

export function ProgressPage({ initialProgress = null }: { initialProgress?: PracticeProgress | null } = {}) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState<PracticeProgress | null>(initialProgress);
  const [failed, setFailed] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    progressApi
      .get()
      .then(setProgress)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (!initialProgress) load();
  }, [load, initialProgress]);

  const changeGoal = async (goal: number) => {
    if (!progress || goal === progress.weeklyGoal) return;
    setSavingGoal(true);
    try {
      await progressApi.setWeeklyGoal(goal);
      setProgress(await progressApi.get());
    } catch {
      /* keep the previous goal */
    } finally {
      setSavingGoal(false);
    }
  };

  const hasSessions = useMemo(() => (progress?.sessions.length ?? 0) > 0, [progress]);
  const [filters, setFilters] = useState<ProgressFilters>(DEFAULT_FILTERS);
  const [now] = useState(() => new Date());
  const view = useMemo(
    () =>
      progress
        ? {
            sessions: filteredSessions(progress, filters, now),
            skills: filteredSkills(progress, filters, now),
            jobs: filteredJobs(progress, filters, now),
          }
        : null,
    [progress, filters, now],
  );
  const readiness = useMemo(() => (progress ? readinessOf(progress, filters.jobId) : null), [progress, filters.jobId]);
  // Readiness by interview round (newer backends); the skill list card is the fallback.
  const job = useMemo(() => (progress ? jobReadinessOf(progress, filters.jobId) : null), [progress, filters.jobId]);
  const byRound = Boolean(progress?.readiness);
  // Page v2 (research 24/10): ladder, week, records and timeline from newer backends.
  const ladderJob = useMemo(
    () => (progress ? (jobReadinessOf(progress, filters.jobId) ?? jobReadinessOf(progress, "all")) : null),
    [progress, filters.jobId],
  );
  const v2 = Boolean(progress?.week && progress?.timeline && ladderJob?.rounds.some((round) => round.level !== undefined));
  const jobChoices = progress?.readiness ?? [];
  // Page v3 (design 29/10): rooms apart, overview without shared sessions, one action (backend from 29/10).
  const v3 = Boolean(progress?.rooms);

  return (
    // Bottom room on phones for the assistant button fixed in the corner.
    <div className="space-y-6 pb-20 sm:pb-0">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-black tracking-tight text-[#14244B] sm:text-2xl">{t("practiceProgress.title")}</h1>
          {!v2 && <p className="mt-1 max-w-3xl text-sm text-[#607096]">{t("practiceProgress.subtitle")}</p>}
        </div>
        {!v3 && v2 && hasSessions && ladderJob && jobChoices.length > 1 && (
          <label className="flex w-full flex-col gap-1 text-xs font-semibold text-[#607096] sm:w-auto">
            {t("practiceProgress.v2.job")}
            <select
              className="h-11 w-full min-w-0 rounded-xl border border-[#DCE4F3] bg-white px-3 text-sm font-semibold text-[#14244B] focus:outline-none focus:ring-2 focus:ring-[#204195]/30 sm:w-72"
              value={ladderJob.jobId}
              onChange={(e) => setFilters({ ...filters, jobId: e.target.value })}
            >
              {jobChoices.map((choice) => (
                <option key={choice.jobId} value={choice.jobId}>
                  {choice.jobTitle ?? choice.jobId}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {failed ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <p>{t("practiceProgress.error")}</p>
          <button type="button" onClick={load} className="mt-3 font-bold underline">
            {t("practiceProgress.retry")}
          </button>
        </div>
      ) : !progress ? (
        <div className="flex items-center gap-2 rounded-2xl border border-[#DCE4F3] bg-white p-6 text-sm text-[#607096]">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t("practiceProgress.loading")}
        </div>
      ) : !hasSessions || !view ? (
        <>
          <div className="rounded-2xl border border-dashed border-[#C9D7F1] bg-white p-8 text-center">
            <p className="text-base font-bold text-[#14244B]">{t("practiceProgress.empty.title")}</p>
            <p className="mt-1 text-sm text-[#607096]">{t("practiceProgress.empty.desc")}</p>
            <Link
              href="/interview/select"
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#204195] px-4 text-sm font-semibold text-white hover:bg-[#183275]"
            >
              {t("practiceProgress.empty.cta")}
            </Link>
          </div>
          <WeeklyStreakCard progress={progress} onGoal={changeGoal} savingGoal={savingGoal} />
        </>
      ) : v3 ? (
        <>
          <ProgressV3 progress={progress} onGoal={changeGoal} savingGoal={savingGoal} />
          <div className="space-y-3">
            <MoreSection title={t("practiceProgress.more.real")}>
              <RealInterviewsCard progress={progress} />
            </MoreSection>
            <MoreSection title={t("practiceProgress.more.calendar")}>
              <WeeklyStreakCard progress={progress} onGoal={changeGoal} savingGoal={savingGoal} />
            </MoreSection>
          </div>
        </>
      ) : v2 && ladderJob ? (
        <>
          {ladderJob.sessions <= 1 ? (
            <FirstSessionView
              progress={progress}
              job={ladderJob}
              gaps={(progress.gaps?.open ?? []).filter((gap) => gap.lastSeen.jobId === ladderJob.jobId)}
            />
          ) : (
            <>
              {/*
                Review 28/10: the candidate could not tell strong from weak parts.
                Top: strong and weak on the ladder only, beside this week's plan;
                then the points due. History and records are opened on demand.
              */}
              <div className="flex flex-wrap items-start gap-6">
                <StrengthsCard progress={progress} job={ladderJob} />
                <WeekCard progress={progress} job={ladderJob} />
              </div>
              <DueCard
                progress={progress}
                gaps={(progress.gaps?.open ?? []).filter((gap) => gap.lastSeen.jobId === ladderJob.jobId)}
              />
            </>
          )}
          <div className="space-y-3">
            {ladderJob.sessions > 1 && (
              <MoreSection title={t("practiceProgress.more.history")}>
                <ReadyHeadline job={ladderJob} />
                <RecordsCard timeline={progress.timeline ?? []} jobId={ladderJob.jobId} />
                <TimelineCard timeline={progress.timeline ?? []} jobId={ladderJob.jobId} />
              </MoreSection>
            )}
            <MoreSection title={t("practiceProgress.more.real")}>
              <RealInterviewsCard progress={progress} />
            </MoreSection>
            <MoreSection title={t("practiceProgress.more.calendar")}>
              <WeeklyStreakCard progress={progress} onGoal={changeGoal} savingGoal={savingGoal} />
            </MoreSection>
            <MoreSection title={t("practiceProgress.detail.title")}>
              <FilterBar progress={progress} filters={filters} onChange={setFilters} />
              {view.sessions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#C9D7F1] bg-white p-6 text-center text-sm text-[#607096]">
                  {t("practiceProgress.filter.empty")}
                </p>
              ) : (
                <>
                  <GapNotebookCard gaps={filteredGaps(progress, filters)} progress={progress} />
                  <EvidenceCard sessions={view.sessions} />
                  <SkillsCard skills={view.skills} filters={filters} onChange={setFilters} now={now} hideLevel />
                  <JobsCard jobs={view.jobs} />
                  <CalibrationNote progress={progress} />
                  <MilestonesCard progress={progress} />
                  <SessionsTable sessions={view.sessions} />
                </>
              )}
            </MoreSection>
          </div>
        </>
      ) : (
        <>
          {/*
            UX review 20/10: three tiers. 1) where you stand and what to do now
            (summary, readiness by round, the points to review); 2) the real
            interviews and the weekly habit; 3) the detail, closed by default.
            The filters sit on top and apply to everything but the week and
            the real interviews.
          */}
          <FilterBar progress={progress} filters={filters} onChange={setFilters} />
          {view.sessions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#C9D7F1] bg-white p-6 text-center text-sm text-[#607096]">
              {t("practiceProgress.filter.empty")}
            </p>
          ) : (
            <>
              <SummaryCard progress={progress} skills={view.skills} sessions={view.sessions} now={now} job={job} />
              {byRound ? (
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                  <RoundsCard
                    progress={progress}
                    job={job}
                    renderSkills={(conceptIds) => <RoundSkills conceptIds={conceptIds} skills={view.skills} now={now} />}
                  />
                  <div className="grid gap-6">
                    <WinsCard
                      wins={(progress.wins ?? []).filter((win) => filters.jobId === "all" || win.jobId === filters.jobId)}
                    />
                    <GapNotebookCard
                      gaps={filteredGaps(progress, filters)}
                      progress={progress}
                      showFixed={(progress.wins ?? []).length === 0}
                    />
                  </div>
                </div>
              ) : (
                <GoalsCard readiness={readiness} />
              )}
            </>
          )}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {byRound ? <RealInterviewsCard progress={progress} /> : <div className="hidden lg:block" />}
            <WeeklyStreakCard progress={progress} onGoal={changeGoal} savingGoal={savingGoal} />
          </div>
          {view.sessions.length > 0 && (
            <details className="group rounded-2xl border border-[#DCE4F3] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5">
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#14244B]">{t("practiceProgress.detail.title")}</span>
                  <span className="mt-0.5 block text-xs text-[#607096]">{t("practiceProgress.detail.desc")}</span>
                </span>
                <ChevronDown className="size-5 shrink-0 text-[#607096] transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="space-y-6 border-t border-[#EAEFF8] p-3 sm:p-5">
                <EvidenceCard sessions={view.sessions} />
                <SkillsCard skills={view.skills} filters={filters} onChange={setFilters} now={now} />
                <JobsCard jobs={view.jobs} />
                <CalibrationNote progress={progress} />
                <MilestonesCard progress={progress} />
                <SessionsTable sessions={view.sessions} />
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
