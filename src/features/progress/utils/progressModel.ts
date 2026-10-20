import type {
  JobProgress,
  PracticeProgress,
  ProgressSession,
  SkillPoint,
  SkillProgress,
  Trend,
} from "../services/progress.service";

/**
 * Client-side view of the progress data under the page filters (CV, position,
 * time range). A candidate keeps practising for months with several CVs and
 * many positions, so the page must stay readable at 5 sessions and at 500:
 * filters narrow it, long series fold into monthly points, skills are
 * searchable and paged. The trend rule mirrors the backend
 * (application/progress.py): 3 points minimum, mean of up to 3 latest vs 3
 * first, under 0.5 is "flat".
 */

export const TREND_MIN_POINTS = 3;
export const FLAT_DELTA = 0.5;
/** Above this many points a chart shows one point per month (mean). */
export const MONTHLY_FOLD_AT = 12;

export type TimeRange = "3m" | "6m" | "12m" | "all";
export type SkillSort = "most" | "improved" | "weakest";

export type ProgressFilters = {
  resumeId: string | "all";
  jobId: string | "all";
  range: TimeRange;
  query: string;
  sort: SkillSort;
};

export const DEFAULT_FILTERS: ProgressFilters = { resumeId: "all", jobId: "all", range: "all", query: "", sort: "most" };

const RANGE_MONTHS: Record<TimeRange, number | null> = { "3m": 3, "6m": 6, "12m": 12, all: null };

export function trendOf(values: number[]): Trend {
  if (values.length < TREND_MIN_POINTS) return { status: "insufficient", delta: null };
  const window = Math.min(3, Math.floor(values.length / 2) || 1);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const delta = mean(values.slice(-window)) - mean(values.slice(0, window));
  const rounded = Math.round(delta * 10) / 10;
  return { status: Math.abs(delta) < FLAT_DELTA ? "flat" : delta > 0 ? "up" : "down", delta: rounded };
}

export function sinceDate(range: TimeRange, now: Date): Date | null {
  const months = RANGE_MONTHS[range];
  if (months === null) return null;
  const since = new Date(now);
  since.setMonth(since.getMonth() - months);
  return since;
}

function inScope(
  item: { date: string; jobId?: string | null; resumeId?: string | null },
  filters: ProgressFilters,
  since: Date | null,
): boolean {
  if (filters.resumeId !== "all" && item.resumeId !== filters.resumeId) return false;
  if (filters.jobId !== "all" && item.jobId !== filters.jobId) return false;
  if (since && new Date(item.date) < since) return false;
  return true;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase().trim();
}

export type SkillView = SkillProgress & { sessionsCount: number };

export function filteredSkills(progress: PracticeProgress, filters: ProgressFilters, now: Date): SkillView[] {
  const since = sinceDate(filters.range, now);
  const query = normalize(filters.query);
  const items: SkillView[] = [];
  for (const skill of progress.skills) {
    if (query && !normalize(skill.label).includes(query)) continue;
    const points = skill.points.filter((p) => inScope(p, filters, since));
    if (points.length === 0) continue;
    const scores = points.map((p) => p.score);
    items.push({
      ...skill,
      points,
      latest: scores[scores.length - 1],
      best: Math.max(...scores),
      trend: trendOf(scores),
      sessionsCount: points.length,
    });
  }
  const delta = (s: SkillView) => (s.trend.delta ?? 0);
  items.sort((a, b) => {
    if (filters.sort === "improved") return delta(b) - delta(a) || b.sessionsCount - a.sessionsCount;
    if (filters.sort === "weakest") return a.latest - b.latest || b.sessionsCount - a.sessionsCount;
    return b.sessionsCount - a.sessionsCount || a.label.localeCompare(b.label);
  });
  return items;
}

export function filteredSessions(progress: PracticeProgress, filters: ProgressFilters, now: Date): ProgressSession[] {
  const since = sinceDate(filters.range, now);
  return progress.sessions.filter((s) => inScope(s, filters, since));
}

export function filteredJobs(progress: PracticeProgress, filters: ProgressFilters, now: Date): JobProgress[] {
  const since = sinceDate(filters.range, now);
  const sessionsInScope = new Set(filteredSessions(progress, filters, now).map((s) => s.sessionId));
  return progress.jobs
    .filter((job) => filters.jobId === "all" || job.jobId === filters.jobId)
    .map((job) => {
      const points = job.points.filter((p) => sessionsInScope.has(p.sessionId) && (!since || new Date(p.date) >= since));
      const currentTier = points.length ? points[points.length - 1].tier : job.currentTier;
      return {
        ...job,
        points,
        currentTier,
        tierChanges: job.tierChanges.filter((c) => points.some((p) => p.sessionId === c.sessionId)),
        trend: trendOf(points.filter((p) => p.tier === currentTier).map((p) => p.score)),
      };
    })
    .filter((job) => job.points.length > 0);
}

export function habitsOf(sessions: ProgressSession[]) {
  const rates = sessions
    .map((s) => s.behavior.firstTimeSufficientRate)
    .filter((r): r is number => r !== null && r !== undefined);
  const rateTrend = trendOf(rates.map((r) => r * 10));
  const skipped = sessions.map((s) => s.behavior.skipped);
  const skipTrend = trendOf(skipped);
  // Fewer skipped questions is better: improving reads as "up".
  const flipped: Trend = {
    ...skipTrend,
    status: skipTrend.status === "up" ? "down" : skipTrend.status === "down" ? "up" : skipTrend.status,
  };
  return {
    firstTimeSufficientRate: { latest: rates.length ? rates[rates.length - 1] : null, trend: rateTrend },
    skippedPerSession: { latest: skipped.length ? skipped[skipped.length - 1] : null, trend: flipped },
  };
}

/** Long series: one point per calendar month (mean score), so a year of practice stays legible. */
export function foldMonthly<T extends { date: string; score: number }>(points: T[]): (T & { count: number })[] {
  if (points.length <= MONTHLY_FOLD_AT) return points.map((p) => ({ ...p, count: 1 }));
  const buckets = new Map<string, T[]>();
  for (const point of points) {
    const date = new Date(point.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, [...(buckets.get(key) ?? []), point]);
  }
  return [...buckets.values()].map((group) => ({
    ...group[group.length - 1],
    score: Math.round((group.reduce((a, p) => a + p.score, 0) / group.length) * 10) / 10,
    count: group.length,
  }));
}

export type { SkillPoint };
