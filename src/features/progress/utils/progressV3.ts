import type {
  GapItem,
  JobReadiness,
  PracticeProgress,
  ProgressSession,
  RoomName,
  RoundReadiness,
  ScoreOverview,
  TimelineEntry,
} from "../services/progress.service";
import { LADDER_SOLID, ROUND_READY_LEVEL } from "./progressModel";

/*
 * Progress page v3 (design 29/10, DOC_AND_PLAN PROGRESS_PAGE_V3_DESIGN):
 * Chat and Voice are read apart (the camera is an option of Voice), the
 * overview compares two groups of valid sessions that share no session, and
 * the page says first what got better, then the one thing to practise.
 */

export const ROOMS: RoomName[] = ["chat", "voice"];
/** A drop of this much in the overview is told as a drop (the flat band of the trends). */
export const DROP_AT = -0.5;

export function roomCounts(progress: PracticeProgress): Record<RoomName, number> & { camera: number } {
  const rooms = progress.rooms;
  return {
    chat: rooms?.chat.count ?? 0,
    voice: rooms?.voice.count ?? 0,
    camera: rooms?.voice.cameraSessions ?? 0,
  };
}

/** The room of the latest session, else the one with sessions. */
export function defaultRoom(progress: PracticeProgress): RoomName {
  const sorted = [...progress.sessions].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  if (latest?.room) return latest.room;
  const counts = roomCounts(progress);
  return counts.voice > counts.chat ? "voice" : "chat";
}

/** The page data of one room: the room's views over the global ones (streak and activity stay global). */
export function roomProgressOf(progress: PracticeProgress, room: RoomName): PracticeProgress {
  const view = progress.rooms?.[room];
  if (!view) return progress;
  return {
    ...progress,
    sessions: view.sessions,
    skills: view.skills,
    jobs: view.jobs,
    behavior: view.behavior,
    milestones: view.milestones,
    gaps: view.gaps,
    readiness: view.readiness,
    timeline: view.timeline,
    wins: view.wins,
    overview: view.overview,
  };
}

/** Rounds that have been practised but are not at Vững yet, closest to it first. */
export function roundsToPractise(job: JobReadiness | null): RoundReadiness[] {
  if (!job) return [];
  const distance = (round: RoundReadiness) => {
    const next = round.next;
    const left = next ? Math.max(0, next.need - next.have) : 2;
    const series = round.series ?? [];
    const last = series.length ? series[series.length - 1].score : 0;
    return left * 10 + (LADDER_SOLID - last);
  };
  return job.rounds
    .filter((round) => (round.series?.length ?? 0) > 0 && (round.level ?? 0) < ROUND_READY_LEVEL)
    .sort((a, b) => distance(a) - distance(b));
}

/** Change of a round between its two latest sessions. */
function lastStep(round: RoundReadiness): number | null {
  const series = round.series ?? [];
  if (series.length < 2) return null;
  return series[series.length - 1].score - series[series.length - 2].score;
}

/** Change of a round from its first session to its latest. */
function sinceFirst(round: RoundReadiness): number | null {
  const series = round.series ?? [];
  if (series.length < 2) return null;
  return series[series.length - 1].score - series[0].score;
}

export type Conclusion =
  | { kind: "up"; round: RoundReadiness }
  | { kind: "down"; round: RoundReadiness | null }
  | null;

/**
 * The first sentence of the page. A drop of the overview is told first, with
 * the round that fell most in its latest session; else the round that grew
 * most since its first session. None below 4 valid sessions (no comparison).
 */
export function conclusionOf(job: JobReadiness | null, overview: ScoreOverview | undefined): Conclusion {
  if (!job || !overview || overview.window === 0 || overview.change === null) return null;
  if (overview.change <= DROP_AT) {
    const fell = job.rounds
      .map((round) => ({ round, step: lastStep(round) }))
      .filter((item): item is { round: RoundReadiness; step: number } => item.step !== null && item.step < 0)
      .sort((a, b) => a.step - b.step)[0];
    return { kind: "down", round: fell?.round ?? null };
  }
  const grew = job.rounds
    .map((round) => ({ round, gain: sinceFirst(round) }))
    .filter((item): item is { round: RoundReadiness; gain: number } => item.gain !== null && item.gain >= 0.5)
    .sort((a, b) => b.gain - a.gain)[0];
  return grew ? { kind: "up", round: grew.round } : null;
}

/** The open point behind a round's most missed point, with how often it was asked (the denominator). */
export function repeatedGapOf(round: RoundReadiness | null, gaps: GapItem[]): GapItem | null {
  if (!round?.topGap) return null;
  return (
    gaps.find((gap) => gap.point === round.topGap?.point && gap.skill === round.topGap?.skill) ??
    gaps.find((gap) => gap.point === round.topGap?.point) ??
    null
  );
}

/** A point is told as repeated only when it was asked at least twice. */
export function isRepeated(gap: GapItem | null): gap is GapItem {
  return Boolean(gap && gap.timesAsked >= 2 && gap.timesMissed >= 2);
}

/** The latest session that counts (enough real answers), newest last in `sessions`. */
export function latestValidSession(sessions: ProgressSession[]): ProgressSession | null {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].valid !== false && sorted[i].overallScore !== null) return sorted[i];
  }
  return null;
}

export type LatestFeedback = {
  session: ProgressSession;
  entry: TimelineEntry | null;
  /** What got better in that session: a level change up or a record. */
  better: { kind: "level"; area: string; to: number } | { kind: "record"; entry: TimelineEntry } | null;
  /** The point to fix that the session missed, most missed first. */
  fix: GapItem | null;
};

export function latestFeedbackOf(progress: PracticeProgress): LatestFeedback | null {
  const session = latestValidSession(progress.sessions);
  if (!session) return null;
  const entry = (progress.timeline ?? []).find((item) => item.sessionId === session.sessionId) ?? null;
  const up = entry?.levelChanges.find((change) => change.to > change.from);
  const better = up
    ? { kind: "level" as const, area: up.area, to: up.to }
    : entry && entry.records.length > 0
      ? { kind: "record" as const, entry }
      : null;
  const fix =
    [...(progress.gaps?.open ?? [])]
      .filter((gap) => gap.lastSeen.sessionId === session.sessionId)
      .sort((a, b) => b.timesMissed - a.timesMissed)[0] ?? null;
  return { session, entry, better, fix };
}

/** Positions (percent of the plot) of a 0–10 series, oldest first. */
export function plotPoints(scores: number[]): { left: number; top: number }[] {
  const n = scores.length;
  return scores.map((score, index) => ({
    left: n === 1 ? 50 : (index * 100) / (n - 1),
    top: yOf(score),
  }));
}

/** Vertical position (percent from the top) of a score on a 0–10 axis. */
export function yOf(score: number): number {
  const clamped = Math.max(0, Math.min(10, score));
  return 4 + (1 - clamped / 10) * 92;
}
