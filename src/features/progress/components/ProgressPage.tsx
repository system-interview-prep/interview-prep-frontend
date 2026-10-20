"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Flag, Flame, Loader2, Snowflake, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localeOf } from "@/i18n/format";
import { cn } from "@/utils";
import {
  progressApi,
  type JobProgress,
  type PracticeProgress,
  type ProgressSession,
  type Trend,
} from "../services/progress.service";
import { fill, longDate, milestoneText, monthLabel, percent, shortDate, tierLabel, trendLabel } from "../utils/progressFormat";
import {
  DEFAULT_FILTERS,
  filteredJobs,
  filteredSessions,
  filteredSkills,
  foldMonthly,
  habitsOf,
  type ProgressFilters,
  type SkillSort,
  type SkillView,
} from "../utils/progressModel";
import { ScoreLineChart, type ScorePoint } from "./ScoreLineChart";

const GOALS = [1, 2, 3, 4, 5, 6, 7];
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

function WeeklyStreakCard({ progress, onGoal, savingGoal }: { progress: PracticeProgress; onGoal: (goal: number) => void; savingGoal: boolean }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const { streak } = progress;
  return (
    <Card title={t("practiceProgress.streak.title")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <Flame className="size-6 self-center text-orange-500" aria-hidden="true" />
          <span className="font-display text-3xl font-extrabold tabular-nums text-[#14244B] sm:text-4xl">{streak.weeks}</span>
          <span className="text-sm font-semibold text-[#607096]">{t("practiceProgress.streak.unit")}</span>
        </div>
        <div className="min-w-0 text-right text-xs text-[#607096]">
          <p className="font-semibold text-[#14244B]">
            {fill(t("practiceProgress.streak.thisWeek"), { count: streak.thisWeekCount, goal: streak.goal })}
          </p>
          <p>
            {streak.thisWeekRemaining > 0
              ? fill(t("practiceProgress.streak.remaining"), { n: streak.thisWeekRemaining })
              : t("practiceProgress.streak.met")}
          </p>
        </div>
      </div>
      <ol className="mt-4 grid grid-cols-8 gap-1 sm:gap-1.5" aria-label={t("practiceProgress.streak.title")}>
        {streak.history.map((week) => {
          const state = week.current
            ? "current"
            : week.met
              ? "met"
              : week.frozen
                ? "frozen"
                : "missed";
          const label = `${shortDate(week.weekStart, locale)}: ${t(`practiceProgress.streak.week.${state}`)} (${week.count})`;
          return (
            <li key={week.weekStart} title={label} className="flex min-w-0 flex-col items-center gap-1">
              <span
                className={cn(
                  "grid h-9 w-full place-items-center rounded-lg text-xs font-bold",
                  state === "met" && "bg-[#204195] text-white",
                  state === "frozen" && "bg-[#E8F1FB] text-[#2C6CB0] ring-1 ring-[#BBD3EE]",
                  state === "missed" && "bg-[#F8FAFC] text-[#9AA6C2] ring-1 ring-[#EAEFF8]",
                  state === "current" &&
                    (week.met ? "bg-[#204195] text-white ring-2 ring-[#FCB625]" : "bg-white text-[#204195] ring-2 ring-[#204195]"),
                )}
              >
                {state === "met" || (state === "current" && week.met) ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : state === "frozen" ? (
                  <Snowflake className="size-4" aria-hidden="true" />
                ) : (
                  week.count
                )}
                <span className="sr-only">{label}</span>
              </span>
              <span className="whitespace-nowrap text-[9px] tabular-nums text-[#8B98B5] sm:text-[10px]">{shortDate(week.weekStart, locale)}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-[#607096]">
        <Snowflake className="size-3.5 shrink-0" aria-hidden="true" />
        {streak.freezeAvailableThisMonth ? t("practiceProgress.streak.freezeAvailable") : t("practiceProgress.streak.freezeUsed")}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EAEFF8] pt-4">
        <span className="text-xs font-semibold text-[#14244B]">{t("practiceProgress.streak.goal")}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={t("practiceProgress.streak.goal")}>
          {GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              role="radio"
              aria-checked={progress.weeklyGoal === goal}
              disabled={savingGoal}
              onClick={() => onGoal(goal)}
              className={cn(
                "size-8 rounded-lg text-xs font-bold transition-colors disabled:opacity-60",
                progress.weeklyGoal === goal
                  ? "bg-[#204195] text-white"
                  : "bg-[#F8FAFC] text-[#14244B] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]",
              )}
            >
              {goal}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#607096]">{t("practiceProgress.streak.goalUnit")}</span>
      </div>
    </Card>
  );
}

function HabitsCard({ sessions }: { sessions: ProgressSession[] }) {
  const { t } = useLanguage();
  const behavior = habitsOf(sessions);
  const tiles = [
    {
      key: "first",
      label: t("practiceProgress.habits.firstTime"),
      help: t("practiceProgress.habits.firstTimeHelp"),
      value: percent(behavior.firstTimeSufficientRate.latest),
      trend: behavior.firstTimeSufficientRate.trend,
    },
    {
      key: "skip",
      label: t("practiceProgress.habits.skipped"),
      help: t("practiceProgress.habits.skippedHelp"),
      value: behavior.skippedPerSession.latest === null ? "—" : String(behavior.skippedPerSession.latest),
      trend: behavior.skippedPerSession.trend,
    },
  ];
  return (
    <Card title={t("practiceProgress.habits.title")}>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.key} className="min-w-0 rounded-2xl bg-[#F8FAFC] px-4 py-3 ring-1 ring-[#EAEFF8]">
            <p className="text-xs font-semibold text-[#607096]">{tile.label}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-display text-xl font-extrabold tabular-nums text-[#14244B] sm:text-2xl">{tile.value}</span>
              <TrendBadge trend={tile.trend} />
            </div>
            <p className="mt-1 text-[11px] text-[#8B98B5]">{tile.help}</p>
          </div>
        ))}
      </div>
    </Card>
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

/** Days without practice after which a skill is flagged for review (spaced practice). */
const STALE_DAYS = 30;

function SkillCardItem({ skill, now }: { skill: SkillView; now: Date }) {
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
  }));
  return (
    <div className="min-w-0 rounded-2xl p-3 ring-1 ring-[#EAEFF8]">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-bold text-[#14244B] [overflow-wrap:anywhere]">{skill.label}</p>
        <TrendBadge trend={skill.trend} />
      </div>
      <p className="mt-0.5 text-[11px] text-[#607096]">
        {fill(t("practiceProgress.skills.latest"), { score: skill.latest.toFixed(1) })} ·{" "}
        {fill(t("practiceProgress.skills.best"), { score: skill.best.toFixed(1) })} ·{" "}
        {fill(t("practiceProgress.skills.sessions"), { n: skill.sessionsCount })}
      </p>
      {idleDays >= STALE_DAYS && (
        <p className="mt-1 inline-flex rounded-full bg-[#FFF8E6] px-2 py-0.5 text-[11px] font-semibold text-[#7A4B00]">
          {fill(t("practiceProgress.skills.stale"), { n: idleDays })}
        </p>
      )}
      <ScoreLineChart points={points} ariaLabel={`${skill.label}: ${points.map((p) => p.score).join(", ")}`} />
    </div>
  );
}

function SkillsCard({
  skills,
  filters,
  onChange,
  now,
}: {
  now: Date;
  skills: SkillView[];
  filters: ProgressFilters;
  onChange: (next: ProgressFilters) => void;
}) {
  const { t } = useLanguage();
  const [shown, setShown] = useState(SKILL_CHARTS);
  const charted = skills.filter((skill) => skill.sessionsCount >= 2);
  const once = skills.filter((skill) => skill.sessionsCount < 2);
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
        <span className="text-xs text-[#8B98B5]">{fill(t("practiceProgress.skills.count"), { n: skills.length })}</span>
      </div>
      {charted.length === 0 ? (
        <p className="text-sm text-[#607096]">{t("practiceProgress.skills.noneRepeated")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {charted.slice(0, shown).map((skill) => (
            <SkillCardItem key={skill.conceptId} skill={skill} now={now} />
          ))}
        </div>
      )}
      {charted.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + SKILL_CHARTS)}
          className="mt-4 inline-flex h-9 items-center rounded-xl px-4 text-xs font-bold text-[#204195] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
        >
          {fill(t("practiceProgress.skills.showMore"), { n: Math.min(SKILL_CHARTS, charted.length - shown) })}
        </button>
      )}
      {once.length > 0 && (
        <div className="mt-5 border-t border-[#EAEFF8] pt-4">
          <p className="text-xs font-semibold text-[#607096]">{fill(t("practiceProgress.skills.once"), { n: once.length })}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {once.map((skill) => (
              <li key={skill.conceptId} className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs text-[#14244B] ring-1 ring-[#EAEFF8]">
                {skill.label} <span className="font-semibold tabular-nums">{skill.latest.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

const JOBS_SHOWN = 3;

function JobsCard({ jobs }: { jobs: JobProgress[] }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [shown, setShown] = useState(JOBS_SHOWN);
  if (jobs.length === 0) return null;
  return (
    <Card title={t("practiceProgress.jobs.title")} desc={t("practiceProgress.jobs.desc")}>
      <div className="space-y-5">
        {jobs.slice(0, shown).map((job) => {
          const folded = foldMonthly(job.points);
          const monthly = folded.length < job.points.length;
          const labels = monthly
            ? folded.map((p) => monthLabel(p.date))
            : uniqueLabels(folded.map((p) => p.date), locale);
          const labelOfSession = new Map<string, string>();
          job.points.forEach((p) => {
            const index = monthly ? folded.findIndex((f) => monthLabel(f.date) === monthLabel(p.date)) : folded.findIndex((f) => f.sessionId === p.sessionId);
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
            <div key={job.jobId}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 text-sm font-bold text-[#14244B] [overflow-wrap:anywhere]">{job.jobTitle ?? job.jobId}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#FFF8E6] px-2 py-0.5 text-[11px] font-semibold text-[#7A4B00] ring-1 ring-[#FCB625]/40">
                    {tierLabel(job.currentTier, t)}
                  </span>
                  <TrendBadge trend={job.trend} />
                </div>
              </div>
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
        })}
      </div>
      {jobs.length > shown && (
        <button
          type="button"
          onClick={() => setShown((n) => n + JOBS_SHOWN)}
          className="mt-4 inline-flex h-9 items-center rounded-xl px-4 text-xs font-bold text-[#204195] ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
        >
          {fill(t("practiceProgress.jobs.showMore"), { n: jobs.length - shown })}
        </button>
      )}
    </Card>
  );
}

function MilestonesCard({ progress }: { progress: PracticeProgress }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  if (progress.milestones.length === 0) return null;
  return (
    <Card title={t("practiceProgress.milestones.title")}>
      <ol className="relative space-y-3 border-l-2 border-[#EAEFF8] pl-5">
        {progress.milestones
          .slice()
          .reverse()
          .map((milestone) => (
            <li key={`${milestone.kind}-${milestone.sessionId}-${milestone.skill ?? ""}`} className="relative">
              <span className="absolute -left-[27px] top-0.5 grid size-5 place-items-center rounded-full bg-[#FCB625] text-[#14244B]">
                <Flag className="size-3" aria-hidden="true" />
              </span>
              <Link href={`/interview/results/${milestone.sessionId}`} className="text-sm font-semibold text-[#14244B] [overflow-wrap:anywhere] hover:underline">
                {milestoneText(milestone, t)}
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-xl font-black tracking-tight text-[#14244B] sm:text-2xl">{t("practiceProgress.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-[#607096]">{t("practiceProgress.subtitle")}</p>
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
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <WeeklyStreakCard progress={progress} onGoal={changeGoal} savingGoal={savingGoal} />
            {hasSessions && view && <HabitsCard sessions={view.sessions} />}
          </div>
          {hasSessions && view ? (
            <>
              <FilterBar progress={progress} filters={filters} onChange={setFilters} />
              {view.sessions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#C9D7F1] bg-white p-6 text-center text-sm text-[#607096]">
                  {t("practiceProgress.filter.empty")}
                </p>
              ) : (
                <>
                  <SkillsCard skills={view.skills} filters={filters} onChange={setFilters} now={now} />
                  <JobsCard jobs={view.jobs} />
                </>
              )}
              <MilestonesCard progress={progress} />
              <SessionsTable sessions={view.sessions} />
            </>
          ) : (
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
          )}
        </>
      )}
    </div>
  );
}
