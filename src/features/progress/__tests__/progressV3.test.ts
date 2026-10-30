import { describe, expect, it } from "vitest";
import type { GapItem, JobReadiness, PracticeProgress, RoundReadiness } from "../services/progress.service";
import {
  conclusionOf,
  defaultRoom,
  isRepeated,
  latestFeedbackOf,
  repeatedGapOf,
  roomProgressOf,
  roundsToPractise,
  yOf,
} from "../utils/progressV3";

/* Progress page v3 (design 29/10): rooms apart, a conclusion first, the one point to practise. */

const series = (...scores: number[]) =>
  scores.map((score, i) => ({ sessionId: `s${i}`, date: `2026-10-${10 + i}T08:00:00Z`, tier: "standard" as const, score }));

const round = (area: RoundReadiness["area"], level: 0 | 1 | 2 | 3, scores: number[], extra: Partial<RoundReadiness> = {}): RoundReadiness => ({
  area,
  status: "practice",
  estimate: scores[scores.length - 1] ?? null,
  sessions: scores.length,
  skills: [],
  topGap: null,
  level,
  series: series(...scores),
  next: level === 1 ? { kind: "run", score: 7, have: 1, need: 2 } : { kind: "challenge", score: 7, have: 0, need: 1 },
  ...extra,
});

const job = (rounds: RoundReadiness[]): JobReadiness => ({ jobId: "job", jobTitle: "Backend", sessions: 4, rounds });

const gap = (point: string, timesAsked: number, timesMissed: number, sessionId = "s3"): GapItem => ({
  skill: "Redis",
  skillKey: "skill-redis",
  area: "data",
  point,
  status: "MISSING",
  timesAsked,
  timesMissed,
  lastSeen: { sessionId, date: "2026-10-13T08:00:00Z", question: "Bạn cache thế nào?", jobId: "job", resumeId: "cv" },
});

describe("progress page v3", () => {
  it("tells the round that grew most, and a drop first when the average falls", () => {
    const rounds = [round("data", 2, [6.0, 7.2, 7.5]), round("project", 1, [5.0, 5.4])];
    expect(conclusionOf(job(rounds), { sessions: 4, window: 2, start: 5.8, recent: 6.8, change: 1.0, latest: 7.1 })).toEqual({
      kind: "up",
      round: rounds[0],
    });
    const fell = [round("data", 2, [7.3, 5.4]), round("project", 1, [5.0, 5.2])];
    const down = conclusionOf(job(fell), { sessions: 5, window: 2, start: 6.6, recent: 5.8, change: -0.8, latest: 5.6 });
    expect(down).toEqual({ kind: "down", round: fell[0] });
    // Below 4 valid sessions there is no comparison, so no sentence.
    expect(conclusionOf(job(rounds), { sessions: 3, window: 0, start: null, recent: null, change: null, latest: 7 })).toBeNull();
  });

  it("lists the rounds below Vững, closest to it first", () => {
    const rounds = [
      round("project", 0, [4.5], { next: { kind: "reach", score: 5.5, have: 0, need: 1 } }),
      round("data", 1, [7.2]),
      round("api", 2, [7.4, 7.6]),
    ];
    expect(roundsToPractise(job(rounds)).map((r) => r.area)).toEqual(["data", "project"]);
  });

  it("says a point is repeated only with its denominator of times asked", () => {
    const withGap = round("data", 1, [6.0, 6.5], { topGap: { point: "Hết hạn cache", skill: "Redis", timesMissed: 3 } });
    const found = repeatedGapOf(withGap, [gap("Hết hạn cache", 4, 3)]);
    expect(found?.timesAsked).toBe(4);
    expect(isRepeated(found)).toBe(true);
    expect(isRepeated(gap("Hết hạn cache", 1, 1))).toBe(false);
  });

  it("reads one room at a time and skips a session that did not count", () => {
    const session = (id: string, date: string, room: "chat" | "voice", valid = true) => ({
      sessionId: id, date, jobId: "job", jobTitle: "Backend", overallScore: 6.5, tier: "standard" as const, difficulty: null,
      resumeId: "cv", resumeName: null, behavior: {} as never, valid, room,
    });
    const voiceSessions = [session("v1", "2026-10-20T08:00:00Z", "voice"), session("v2", "2026-10-25T08:00:00Z", "voice", false)];
    const progress = {
      sessions: [session("c1", "2026-10-21T08:00:00Z", "chat"), ...voiceSessions],
      skills: [],
      jobs: [],
      behavior: {} as never,
      milestones: [],
      streak: {} as never,
      rooms: {
        chat: { sessions: [], skills: [], jobs: [], behavior: {} as never, milestones: [], overview: {} as never, count: 1, cameraSessions: 0 },
        voice: {
          sessions: voiceSessions, skills: [], jobs: [], behavior: {} as never, milestones: [],
          overview: { sessions: 1, window: 0, start: null, recent: null, change: null, latest: 6.5 },
          gaps: { open: [gap("Hết hạn cache", 2, 2, "v1")], fixed: [] }, timeline: [], count: 2, cameraSessions: 1,
        },
      },
    } as unknown as PracticeProgress;
    expect(defaultRoom(progress)).toBe("voice"); // the latest session was in Voice
    const voice = roomProgressOf(progress, "voice");
    expect(voice.sessions.map((s) => s.sessionId)).toEqual(["v1", "v2"]);
    const feedback = latestFeedbackOf(voice);
    expect(feedback?.session.sessionId).toBe("v1"); // v2 did not count
    expect(feedback?.fix?.point).toBe("Hết hạn cache");
  });

  it("draws scores on a full 0–10 axis", () => {
    expect(yOf(10)).toBeCloseTo(4);
    expect(yOf(0)).toBeCloseTo(96);
    expect(yOf(12)).toBeCloseTo(4);
  });
});
