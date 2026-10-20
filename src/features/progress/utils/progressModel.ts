import type {
  JobProgress,
  LevelEvent,
  PracticeProgress,
  ProgressCalibration,
  ProgressSession,
  SkillPoint,
  SkillProgress,
  Trend,
  GapItem,
  JobReadiness,
  RoundReadiness,
  SkillArea,
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

export type SkillView = SkillProgress & { sessionsCount: number; comparablePoints: number; level: number };

/*
 * Noise-aware statistics, mirroring application/progress.py (research 20/10,
 * PROGRESS_EVIDENCE_RESEARCH): a change is "up" only when the chance that it is
 * real, beyond the smallest worthwhile change, is at least 80%, given the
 * measured typical error of one session. Points are compared within one tier
 * (unless tier offsets were measured) and one grader version.
 */
export const DEFAULT_CALIBRATION: ProgressCalibration = {
  measured: false,
  measuredAt: null,
  typicalError: 1.2,
  swc: 0.3,
  gradingSd: null,
  tierOffsets: {},
  tierAdjusted: false,
};
export const TREND_PROBABILITY = 0.8;
export const LEVEL_EDGES = [4.0, 5.5, 7.0, 8.5];
export const LEVEL_MARGIN = 0.3;
export const PROCESS_SD = 0.35;
export const LEVEL_COUNT = LEVEL_EDGES.length + 1;

function erf(x: number): number {
  // Abramowitz & Stegun 7.1.26 (|error| < 1.5e-7).
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function phi(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

export function reliableTrend(values: number[], calibration: ProgressCalibration = DEFAULT_CALIBRATION): Trend {
  if (values.length < TREND_MIN_POINTS) return { status: "insufficient", delta: null, probability: null };
  const window = Math.min(3, Math.floor(values.length / 2) || 1);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const delta = mean(values.slice(-window)) - mean(values.slice(0, window));
  const se = calibration.typicalError * Math.sqrt(2 / window);
  const pUp = phi((delta - calibration.swc) / se);
  const pDown = phi((-delta - calibration.swc) / se);
  const status = pUp >= TREND_PROBABILITY ? "up" : pDown >= TREND_PROBABILITY ? "down" : "flat";
  return { status, delta: Math.round(delta * 10) / 10, probability: Math.round((delta >= 0 ? pUp : pDown) * 100) / 100 };
}

export function kalmanEstimates(values: number[], calibration: ProgressCalibration = DEFAULT_CALIBRATION): [number, number][] {
  const r = calibration.typicalError ** 2;
  const q = PROCESS_SD ** 2;
  const out: [number, number][] = [];
  let mean = 0;
  let variance = 0;
  values.forEach((value, index) => {
    if (index === 0) {
      mean = value;
      variance = r;
    } else {
      variance += q;
      const gain = variance / (variance + r);
      mean += gain * (value - mean);
      variance *= 1 - gain;
    }
    out.push([Math.round(mean * 100) / 100, Math.round(Math.sqrt(variance) * 100) / 100]);
  });
  return out;
}

export function bandOf(value: number): number {
  return LEVEL_EDGES.filter((edge) => value >= edge).length;
}

export function skillLevels(estimates: number[]): { level: number; changes: [number, number, number][] } {
  if (estimates.length === 0) return { level: 0, changes: [] };
  let level = bandOf(estimates[0]);
  const changes: [number, number, number][] = [];
  estimates.slice(1).forEach((value, i) => {
    let next = level;
    while (next < LEVEL_EDGES.length && value >= LEVEL_EDGES[next] + LEVEL_MARGIN) next += 1;
    while (next > 0 && value < LEVEL_EDGES[next - 1] - LEVEL_MARGIN) next -= 1;
    if (next !== level) {
      changes.push([i + 1, level, next]);
      level = next;
    }
  });
  return { level, changes };
}

/** Points comparable with the latest one: same tier (unless offsets were measured) and grader version. */
export function comparablePoints<T extends { tier: string; graderVersion?: string | null }>(
  points: T[],
  calibration: ProgressCalibration = DEFAULT_CALIBRATION,
): T[] {
  if (points.length === 0) return [];
  const latest = points[points.length - 1];
  const versions = points.map((p) => p.graderVersion).filter((v): v is string => Boolean(v));
  const current = versions.length ? versions[versions.length - 1] : null;
  return points.filter(
    (p) =>
      !(current && p.graderVersion && p.graderVersion !== current) &&
      (calibration.tierAdjusted || p.tier === latest.tier),
  );
}

export function adjustedScore(point: { score: number; tier: string }, calibration: ProgressCalibration = DEFAULT_CALIBRATION): number {
  return calibration.tierAdjusted ? point.score + (calibration.tierOffsets[point.tier] ?? 0) : point.score;
}

/** Trend, smoothed estimates and level of one skill's (filtered) points. */
export function skillStats(points: SkillPoint[], calibration: ProgressCalibration = DEFAULT_CALIBRATION) {
  const comparable = comparablePoints(points, calibration);
  const values = comparable.map((p) => adjustedScore(p, calibration));
  const estimates = kalmanEstimates(values, calibration);
  const { level, changes } = skillLevels(estimates.map(([m]) => m));
  const bySession = new Map(comparable.map((p, i) => [p.sessionId, estimates[i]]));
  const withEstimates = points.map((p) => {
    const e = bySession.get(p.sessionId);
    return { ...p, estimate: e ? e[0] : null, estimateSd: e ? e[1] : null };
  });
  const levelEvents: LevelEvent[] = changes.map(([i, from, to]) => ({
    sessionId: comparable[i].sessionId,
    date: comparable[i].date,
    from,
    to,
  }));
  const last = estimates[estimates.length - 1];
  return {
    points: withEstimates,
    trend: reliableTrend(values, calibration),
    comparablePoints: comparable.length,
    estimate: last ? last[0] : null,
    estimateSd: last ? last[1] : null,
    level,
    levelEvents,
  };
}

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
      ...skillStats(points, progress.calibration ?? DEFAULT_CALIBRATION),
      latest: scores[scores.length - 1],
      best: Math.max(...scores),
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
        trend: reliableTrend(
          points.filter((p) => p.tier === currentTier).map((p) => p.score),
          progress.calibration ?? DEFAULT_CALIBRATION,
        ),
      };
    })
    .filter((job) => job.points.length > 0);
}

/** Mean of the latest `TREND_MIN_POINTS` values: what the habit tiles show, so the number and the trend agree. */
function recentMean(values: number[]): number | null {
  if (values.length === 0) return null;
  const tail = values.slice(-TREND_MIN_POINTS);
  return tail.reduce((a, b) => a + b, 0) / tail.length;
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
    firstTimeSufficientRate: {
      latest: rates.length ? rates[rates.length - 1] : null,
      recent: recentMean(rates),
      recentCount: Math.min(rates.length, TREND_MIN_POINTS),
      trend: rateTrend,
    },
    skippedPerSession: {
      latest: skipped.length ? skipped[skipped.length - 1] : null,
      recent: recentMean(skipped),
      recentCount: Math.min(skipped.length, TREND_MIN_POINTS),
      trend: flipped,
    },
  };
}

/** A skill counts as ready for a position from this score (0–10), the line drawn on every skill chart. */
export const READY_SCORE = 7;
/** Level "Vững" (from 7.0, with hysteresis) counts as ready. */
export const READY_LEVEL = 3;
/** A skill not practised for this many days is flagged for review (spaced practice). */
export const STALE_DAYS = 30;
const DAY_MS = 86_400_000;

export type ReadinessSkill = { conceptId: string; label: string; latest: number; ready: boolean; level: number };
export type Readiness = {
  jobId: string;
  jobTitle: string | null;
  sessions: number;
  ready: number;
  total: number;
  /** Weakest first: the ones still short of the line lead. */
  skills: ReadinessSkill[];
};

/**
 * How close the candidate is to the position they practise most (or the one
 * picked in the filter): of the skills that position's interviews asked
 * about, how many have reached `READY_SCORE` the last time they were scored.
 */
export function readinessOf(progress: PracticeProgress, jobId: string | "all" = "all"): Readiness | null {
  const counts = new Map<string, { title: string | null; sessions: number; last: number }>();
  for (const session of progress.sessions) {
    if (!session.jobId || session.overallScore === null) continue;
    const entry = counts.get(session.jobId) ?? { title: session.jobTitle, sessions: 0, last: 0 };
    entry.sessions += 1;
    entry.last = Math.max(entry.last, new Date(session.date).getTime() || 0);
    entry.title = session.jobTitle ?? entry.title;
    counts.set(session.jobId, entry);
  }
  const target =
    jobId !== "all"
      ? jobId
      : [...counts.entries()].sort((a, b) => b[1].sessions - a[1].sessions || b[1].last - a[1].last)[0]?.[0];
  const info = target ? counts.get(target) : undefined;
  if (!target || !info) return null;
  const skills: ReadinessSkill[] = progress.skills
    .filter((skill) => skill.points.some((p) => p.jobId === target))
    .map((skill) => {
      // The smoothed estimate and its level (with hysteresis), so one weak session does not flip "ready".
      const stats = skillStats(skill.points, progress.calibration ?? DEFAULT_CALIBRATION);
      const latest = stats.estimate ?? skill.points[skill.points.length - 1]?.score ?? skill.latest;
      return { conceptId: skill.conceptId, label: skill.label, latest, level: stats.level, ready: stats.level >= READY_LEVEL };
    })
    .sort((a, b) => a.latest - b.latest || a.label.localeCompare(b.label));
  if (skills.length === 0) return null;
  return {
    jobId: target,
    jobTitle: info.title,
    sessions: info.sessions,
    ready: skills.filter((s) => s.ready).length,
    total: skills.length,
    skills,
  };
}

export type FocusReason = "down" | "stale" | "low";
export type ProgressSummary = {
  improving: SkillView[];
  focus: SkillView | null;
  focusReason: FocusReason | null;
  idleDays: number;
};

/**
 * One line at the top of the page and one thing to do next: the skills going
 * up, and the skill to practise now. A falling skill comes first, then one not
 * practised for `STALE_DAYS`, then the lowest one still under the line.
 */
export function summaryOf(allSkills: SkillView[], now: Date): ProgressSummary {
  const idle = (skill: SkillView) => {
    const last = skill.points[skill.points.length - 1];
    return last ? Math.floor((now.getTime() - new Date(last.date).getTime()) / DAY_MS) : 0;
  };
  // JSON, XML… are no longer asked on their own: never the thing to practise next.
  const skills = allSkills.filter((s) => !s.minor);
  const improving = skills.filter((s) => s.trend.status === "up").sort((a, b) => (b.trend.delta ?? 0) - (a.trend.delta ?? 0));
  const under = skills.filter((s) => s.latest < READY_SCORE);
  const down = under.filter((s) => s.trend.status === "down").sort((a, b) => (a.trend.delta ?? 0) - (b.trend.delta ?? 0))[0];
  const stale = under.filter((s) => idle(s) >= STALE_DAYS).sort((a, b) => a.latest - b.latest)[0];
  const low = under.slice().sort((a, b) => a.latest - b.latest || b.sessionsCount - a.sessionsCount)[0];
  const focus = down ?? stale ?? low ?? null;
  const focusReason: FocusReason | null = down ? "down" : stale ? "stale" : low ? "low" : null;
  return { improving, focus, focusReason, idleDays: focus ? idle(focus) : 0 };
}

/** Newest first, whatever order the server grouped them in. */
export function sortedMilestones<T extends { date: string }>(milestones: T[]): T[] {
  return milestones.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Long position titles inside a sentence: cut at a word, with an ellipsis. */
export function shortTitle(title: string | null | undefined, max = 48): string {
  const value = (title ?? "").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,(–-]+$/, "")}…`;
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

/*
 * Evidence of progress in how the candidate answers (research 20/10): rates
 * from the grading checklist, compared between the first answers and the
 * latest ones. Concrete and explainable ("answers with a measurable result:
 * 20% → 60%"), and steadier than a 0–10 score.
 */
export type EvidenceKey =
  | "coreCoverage"
  | "fullCore"
  | "noIncorrect"
  | "firstTime"
  | "recovered"
  | "starComplete"
  | "measurable"
  | "skipRate";

export type EvidenceMetric = {
  key: EvidenceKey;
  before: number | null;
  now: number | null;
  nBefore: number;
  nNow: number;
  status: "improved" | "declined" | "same" | "insufficient";
};

/** Answers needed on each side before a rate is compared. */
export const EVIDENCE_MIN = 5;
/** A change smaller than this (in share) is "the same", whatever the counts. */
export const EVIDENCE_MIN_DIFF = 0.1;

type Counter = (b: ProgressSession["behavior"]) => [number, number];

const COUNTERS: Record<EvidenceKey, Counter> = {
  coreCoverage: (b) => [b.coreCovered ?? 0, b.coreTotal ?? 0],
  fullCore: (b) => [b.fullCoreTurns ?? 0, b.checklistTurns ?? 0],
  noIncorrect: (b) => [(b.checklistTurns ?? 0) - (b.incorrectTurns ?? 0), b.checklistTurns ?? 0],
  firstTime: (b) => [b.firstTimeSufficient, b.answeredTurns],
  recovered: (b) => [b.recoveredAfterProbe ?? 0, b.recoveredAfterProbe === undefined ? 0 : b.probesNeeded],
  starComplete: (b) => [b.starComplete ?? 0, b.starTurns ?? 0],
  measurable: (b) => [b.measurableResult ?? 0, b.starTurns ?? 0],
  skipRate: (b) => [b.skipped, b.technicalTurns],
};

/** Lower is better for these. */
const LOWER_IS_BETTER = new Set<EvidenceKey>(["skipRate"]);

function windowed(sessions: ProgressSession[], counter: Counter, fromEnd: boolean): { hits: number; total: number; used: number } {
  const order = fromEnd ? sessions.slice().reverse() : sessions;
  let hits = 0;
  let total = 0;
  let used = 0;
  for (const session of order) {
    const [h, n] = counter(session.behavior);
    if (n <= 0) {
      used += 1;
      continue;
    }
    hits += h;
    total += n;
    used += 1;
    if (total >= EVIDENCE_MIN) break;
  }
  return { hits, total, used };
}

/**
 * Before/now for each evidence rate: the earliest sessions until EVIDENCE_MIN
 * answers, against the latest sessions until EVIDENCE_MIN answers; the two
 * windows must not overlap. "improved" needs a difference beyond both
 * EVIDENCE_MIN_DIFF and the binomial noise at 80% (z 1.28).
 */
export function evidenceOf(sessions: ProgressSession[]): EvidenceMetric[] {
  return (Object.keys(COUNTERS) as EvidenceKey[]).map((key) => {
    const counter = COUNTERS[key];
    const first = windowed(sessions, counter, false);
    const last = windowed(sessions, counter, true);
    const enough = first.total >= EVIDENCE_MIN && last.total >= EVIDENCE_MIN && first.used + last.used <= sessions.length;
    const before = first.total ? first.hits / first.total : null;
    const now = last.total ? last.hits / last.total : null;
    if (!enough || before === null || now === null) {
      return { key, before, now, nBefore: first.total, nNow: last.total, status: "insufficient" as const };
    }
    const pooled = (first.hits + last.hits) / (first.total + last.total);
    const noise = 1.28 * Math.sqrt(Math.max(pooled * (1 - pooled), 0.01) * (1 / first.total + 1 / last.total));
    const diff = LOWER_IS_BETTER.has(key) ? before - now : now - before;
    const threshold = Math.max(EVIDENCE_MIN_DIFF, noise);
    const status = diff >= threshold ? "improved" : -diff >= threshold ? "declined" : "same";
    return { key, before, now, nBefore: first.total, nNow: last.total, status };
  });
}

// --------------------------------------------------------------------------
// Rounds, gaps and practice (research 20/10, "Ứng viên có quan tâm không"):
// before a real interview a candidate asks "am I ready, what will they ask
// and where am I still weak, what do I practise now". The backend groups the
// answers by interview round (core/interview_rounds.py) and follows each key
// point across sessions (progress.gap_notebook).
// --------------------------------------------------------------------------

/** Technical rounds a session can focus on (backend interview_rounds.FOCUSABLE_AREAS). */
export const FOCUSABLE_AREAS: SkillArea[] = ["language", "framework", "data", "api", "infra", "ai"];

/** The position the readiness card is about: the filtered one, else the most practised. */
export function jobReadinessOf(progress: PracticeProgress, jobId: string | "all" = "all"): JobReadiness | null {
  const all = progress.readiness ?? [];
  if (all.length === 0) return null;
  if (jobId !== "all") return all.find((item) => item.jobId === jobId) ?? null;
  return all.slice().sort((a, b) => b.sessions - a.sessions)[0] ?? null;
}

const STATUS_ORDER: Record<RoundReadiness["status"], number> = { practice: 0, thin: 1, unseen: 2, almost: 3, ready: 4 };

/** The round to practise next: the weakest one, then one with too little evidence. */
export function nextRound(job: JobReadiness | null): RoundReadiness | null {
  if (!job) return null;
  const open = job.rounds.filter((round) => round.status !== "ready");
  return (
    open.slice().sort(
      (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (a.estimate ?? 0) - (b.estimate ?? 0),
    )[0] ?? null
  );
}

/** The CV last used for this position, so "Luyện vòng này" starts with it. */
export function lastResumeFor(progress: PracticeProgress, jobId: string): string | null {
  const sessions = progress.sessions.filter((s) => s.jobId === jobId && s.resumeId);
  return sessions[sessions.length - 1]?.resumeId ?? null;
}

/** Link that opens a practice session for this position, focused on a technical round. */
export function practiceHref(jobId: string | null, resumeId: string | null, area?: SkillArea | null): string {
  if (!jobId || !resumeId) return "/interview/select";
  const params = new URLSearchParams({ candidateId: resumeId, jobId });
  if (area && FOCUSABLE_AREAS.includes(area)) params.set("focus", area);
  return `/interview/cv-score?${params.toString()}`;
}

/** Gaps under the page filters (CV and position of the last time the point was judged). */
export function filteredGaps(progress: PracticeProgress, filters: ProgressFilters): { open: GapItem[]; fixed: GapItem[] } {
  const keep = (item: GapItem) =>
    (filters.jobId === "all" || item.lastSeen.jobId === filters.jobId) &&
    (filters.resumeId === "all" || item.lastSeen.resumeId === filters.resumeId);
  return { open: (progress.gaps?.open ?? []).filter(keep), fixed: (progress.gaps?.fixed ?? []).filter(keep) };
}
