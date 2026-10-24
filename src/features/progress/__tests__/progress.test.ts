import { describe, expect, it } from "vitest";
import { groupByArea, uniqueLabels } from "../components/ProgressPage";
import { SKILL_AREAS } from "../services/progress.service";
import { fill, milestoneText, percent, trendTone } from "../utils/progressFormat";
import { progressVi } from "@/i18n/dicts/progress.dict";

const t = (key: string) => progressVi[key] ?? key;

describe("progress formatting", () => {
  it("keeps two interviews on the same day apart on the chart", () => {
    expect(uniqueLabels(["2026-10-19T02:00:00Z", "2026-10-19T09:00:00Z", "2026-10-20T02:00:00Z"], "vi-VN")).toEqual([
      "19/10",
      "19/10 (2)",
      "20/10",
    ]);
  });

  it("writes milestones and rates for people", () => {
    expect(milestoneText({ kind: "skill_reached", date: "", sessionId: "s", skill: "Redis", score: 7.2 }, t)).toBe(
      "Redis đạt 7.2/10",
    );
    expect(milestoneText({ kind: "first_challenge", date: "", sessionId: "s", jobTitle: "Backend" }, t)).toBe(
      "Mở khoá chế độ Thử thách (Backend)",
    );
    expect(percent(0.666)).toBe("67%");
    expect(percent(null)).toBe("—");
    expect(fill("{a}/{b}", { a: 1, b: 2 })).toBe("1/2");
    expect(trendTone("up")).toBe("good");
  });

  it("has every key in both languages", async () => {
    const { progressEn } = await import("@/i18n/dicts/progress.dict");
    expect(Object.keys(progressEn).sort()).toEqual(Object.keys(progressVi).sort());
  });
});

describe("progress under filters (many CVs, positions, months)", () => {
  const point = (i: number, score: number, jobId: string, resumeId: string) => ({
    sessionId: `s${i}`, date: new Date(Date.UTC(2026, 0, 1 + i * 5)).toISOString(), score, difficulty: null,
    tier: "standard" as const, jobId, resumeId,
  });
  const session = (i: number, jobId: string, resumeId: string) => ({
    sessionId: `s${i}`, date: new Date(Date.UTC(2026, 0, 1 + i * 5)).toISOString(), jobId, jobTitle: jobId,
    overallScore: 6, tier: "standard" as const, difficulty: null, resumeId, resumeName: resumeId,
    behavior: { technicalTurns: 4, answeredTurns: 4, firstTimeSufficient: 2, firstTimeSufficientRate: 0.5, probesNeeded: 2, skipped: 0 },
  });
  const progress = {
    sessions: [session(0, "be", "cv1"), session(1, "data", "cv2"), session(2, "be", "cv1"), session(3, "be", "cv1")],
    skills: [
      { conceptId: "redis", label: "Redis", points: [point(0, 4, "be", "cv1"), point(2, 5, "be", "cv1"), point(3, 6, "be", "cv1")], latest: 6, best: 6, trend: { status: "up", delta: 2 } },
      { conceptId: "sql", label: "SQL", points: [point(0, 7, "be", "cv1"), point(1, 6, "data", "cv2")], latest: 6, best: 7, trend: { status: "insufficient", delta: null } },
      { conceptId: "spark", label: "Apache Spark", points: [point(1, 5, "data", "cv2")], latest: 5, best: 5, trend: { status: "insufficient", delta: null } },
    ],
    jobs: [], resumes: [],
  } as never;
  const now = new Date(Date.UTC(2026, 1, 1));

  it("narrows skills to one CV and recomputes their numbers", async () => {
    const { filteredSkills, DEFAULT_FILTERS } = await import("../utils/progressModel");
    const cv2 = filteredSkills(progress, { ...DEFAULT_FILTERS, resumeId: "cv2" }, now);
    expect(cv2.map((s) => [s.label, s.sessionsCount, s.latest])).toEqual([["Apache Spark", 1, 5], ["SQL", 1, 6]]);
    const all = filteredSkills(progress, DEFAULT_FILTERS, now);
    expect(all[0].label).toBe("Redis");
    expect(filteredSkills(progress, { ...DEFAULT_FILTERS, query: "spark" }, now).map((s) => s.label)).toEqual(["Apache Spark"]);
    expect(filteredSkills(progress, { ...DEFAULT_FILTERS, sort: "weakest" }, now)[0].label).toBe("Apache Spark");
  });

  it("folds long series into monthly points", async () => {
    const { foldMonthly } = await import("../utils/progressModel");
    const many = Array.from({ length: 20 }, (_, i) => ({ date: new Date(Date.UTC(2026, Math.floor(i / 5), 1 + i)).toISOString(), score: i % 10 }));
    const folded = foldMonthly(many);
    expect(folded).toHaveLength(4);
    expect(folded[0].count).toBe(5);
    expect(foldMonthly(many.slice(0, 5))).toHaveLength(5);
  });

  it("finds how ready the candidate is for the position they practise most", async () => {
    const { readinessOf } = await import("../utils/progressModel");
    const ready = readinessOf(progress);
    expect(ready).toMatchObject({ jobId: "be", sessions: 3, ready: 0, total: 2 });
    // Weakest first.
    // The smoothed estimate, not the last raw score.
    expect(ready?.skills.map((s) => [s.label, s.latest])).toEqual([["Redis", 5.08], ["SQL", 6.48]]);
    expect(readinessOf(progress, "data")).toMatchObject({ jobId: "data", total: 2 });
  });

  it("summarises the page and picks one skill to practise next", async () => {
    const { filteredSkills, summaryOf, DEFAULT_FILTERS } = await import("../utils/progressModel");
    const skills = filteredSkills(progress, DEFAULT_FILTERS, now);
    const summary = summaryOf(skills, now);
    expect(summary.improving.map((s) => s.label)).toEqual(["Redis"]);
    // Nothing is falling or stale yet: the lowest skill under the line.
    expect(summary.focusReason).toBe("low");
    expect(summary.focus?.label).toBe("Apache Spark");
    // A month later every skill is stale; a falling one would still come first.
    const later = new Date(Date.UTC(2026, 2, 1));
    expect(summaryOf(skills, later)).toMatchObject({ focusReason: "stale" });
    const falling = skills.map((s) => (s.label === "SQL" ? { ...s, trend: { status: "down" as const, delta: -1 } } : s));
    expect(summaryOf(falling, later)).toMatchObject({ focusReason: "down" });
    expect(summaryOf(falling, later).focus?.label).toBe("SQL");
    const allGood = summaryOf(skills.map((s) => ({ ...s, latest: 8 })), now);
    expect(allGood.focus).toBeNull();
  });

  it("shows habits as the mean of the last three sessions, so the number and the trend agree", async () => {
    const { habitsOf } = await import("../utils/progressModel");
    const withRates = (rates: number[], skips: number[]) =>
      rates.map((rate, i) => {
        const base = session(0, "be", "cv1");
        return { ...base, sessionId: `h${i}`, behavior: { ...base.behavior, firstTimeSufficientRate: rate, skipped: skips[i] } };
      });
    const habits = habitsOf(withRates([0.1, 0.2, 0.5, 0.6, 0.6, 0], [3, 0, 0, 0, 1, 3]) as never);
    expect(habits.firstTimeSufficientRate.latest).toBe(0);
    expect(habits.firstTimeSufficientRate.recent).toBeCloseTo(0.4);
    expect(habits.firstTimeSufficientRate.trend.status).toBe("up");
    // More skips lately is worse: shown as going down.
    expect(habits.skippedPerSession.recent).toBeCloseTo(4 / 3);
    expect(habits.skippedPerSession.trend.status).toBe("flat");
  });

  it("orders milestones by date and shortens long titles", async () => {
    const { sortedMilestones, shortTitle } = await import("../utils/progressModel");
    const dates = sortedMilestones([{ date: "2026-08-26" }, { date: "2026-10-19" }, { date: "2026-09-03" }]).map((m) => m.date);
    expect(dates).toEqual(["2026-10-19", "2026-09-03", "2026-08-26"]);
    expect(shortTitle("Backend")).toBe("Backend");
    const long = shortTitle("Chuyên viên Phân tích Dữ liệu Cao cấp phụ trách Hệ thống Báo cáo Tài chính", 40);
    expect(long.endsWith("…")).toBe(true);
    expect(long.length).toBeLessThanOrEqual(41);
  });

});

describe("noise-aware progress (research 20/10, mirrors application/progress.py)", () => {
  it("calls a change progress only beyond the session noise", async () => {
    const { reliableTrend, DEFAULT_CALIBRATION } = await import("../utils/progressModel");
    expect(reliableTrend([5.0, 5.2, 5.0, 5.8, 5.9, 5.7]).status).toBe("flat");
    const clear = reliableTrend([4.0, 4.5, 4.2, 6.0, 6.4, 6.6]);
    expect(clear.status).toBe("up");
    expect(clear.probability).toBeGreaterThanOrEqual(0.8);
    expect(reliableTrend([7.0, 7.2, 7.1, 5.0, 4.8, 5.2]).status).toBe("down");
    const quiet = { ...DEFAULT_CALIBRATION, typicalError: 0.4, swc: 0.2 };
    expect(reliableTrend([5.0, 5.2, 5.0, 5.8, 5.9, 5.7], quiet).status).toBe("up");
  });

  it("smooths with a Kalman filter and changes level only past the margin", async () => {
    const { kalmanEstimates, skillLevels } = await import("../utils/progressModel");
    const estimates = kalmanEstimates([5, 8, 5, 8]);
    expect(estimates[0][0]).toBe(5);
    expect(estimates[1][0]).toBeGreaterThan(5);
    expect(estimates[1][0]).toBeLessThan(8);
    expect(estimates[0][1]).toBeGreaterThan(estimates[3][1]);
    expect(skillLevels([5.6, 7.1, 7.4, 6.9, 6.75])).toEqual({ level: 3, changes: [[2, 2, 3]] });
    expect(skillLevels([7.5, 6.5])).toEqual({ level: 2, changes: [[1, 3, 2]] });
  });

  it("compares only within the latest tier and grader version", async () => {
    const { comparablePoints, DEFAULT_CALIBRATION } = await import("../utils/progressModel");
    const p = (tier: string, graderVersion: string | null) => ({ tier, graderVersion });
    const points = [p("standard", null), p("standard", "m1"), p("challenge", "m2"), p("challenge", "m2")];
    expect(comparablePoints(points)).toHaveLength(2);
    expect(comparablePoints(points, { ...DEFAULT_CALIBRATION, tierAdjusted: true, tierOffsets: { challenge: 1 } })).toHaveLength(3);
  });

  it("shows checklist evidence as first answers vs latest answers", async () => {
    const { evidenceOf } = await import("../utils/progressModel");
    const session = (i: number, measurable: number, star: number, skipped = 0) => ({
      sessionId: `e${i}`, date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString(), jobId: "be", jobTitle: "BE",
      overallScore: 6, tier: "standard" as const, difficulty: null, resumeId: null, resumeName: null,
      behavior: {
        technicalTurns: 5, answeredTurns: 5, firstTimeSufficient: 3, firstTimeSufficientRate: 0.6, probesNeeded: 2,
        skipped, starTurns: star, starComplete: 0, measurableResult: measurable,
      },
    });
    const sessions = [session(1, 0, 3), session(2, 1, 3), session(3, 2, 3), session(4, 3, 3)];
    const metrics = evidenceOf(sessions);
    const measurable = metrics.find((m) => m.key === "measurable")!;
    // First 6 experience answers (1/6) vs latest 6 (5/6).
    expect(measurable).toMatchObject({ nBefore: 6, nNow: 6, status: "improved" });
    expect(measurable.before).toBeCloseTo(1 / 6);
    expect(measurable.now).toBeCloseTo(5 / 6);
    // Older data without checklist counts: not enough to compare.
    expect(metrics.find((m) => m.key === "fullCore")!.status).toBe("insufficient");
    // Too few sessions for two separate windows.
    expect(evidenceOf(sessions.slice(0, 1)).find((m) => m.key === "firstTime")!.status).toBe("insufficient");
    // Fewer skipped questions reads as better.
    const skips = evidenceOf([session(1, 0, 0, 3), session(2, 0, 0, 3), session(3, 0, 0, 0), session(4, 0, 0, 0)]);
    expect(skips.find((m) => m.key === "skipRate")!.status).toBe("improved");
  });
});

describe("skills a candidate can read (research 20/10)", () => {
  it("groups skills by area in a fixed order and puts unknown ones last", () => {
    const groups = groupByArea([
      { id: "redis", area: "data" as const },
      { id: "cv", area: "project" as const },
      { id: "x" },
      { id: "pg", area: "data" as const },
    ]);
    expect(groups.map((g) => g.area)).toEqual(["project", "data", "other"]);
    expect(groups[1].skills.map((s) => s.id)).toEqual(["redis", "pg"]);
  });

  it("names and explains every area", () => {
    for (const area of SKILL_AREAS) {
      expect(progressVi[`practiceProgress.area.${area}`]).toBeTruthy();
      expect(progressVi[`practiceProgress.area.${area}.desc`]).toBeTruthy();
    }
  });
});

describe("ready for a real interview: rounds, gaps, practice (research 20/10)", () => {
  const round = (area: string, status: string, estimate: number | null) =>
    ({ area, status, estimate, sessions: 2, skills: [], topGap: null }) as never;

  it("picks the weakest round to practise next and links a focused session", async () => {
    const { nextRound, practiceHref } = await import("../utils/progressModel");
    const job = {
      jobId: "job-be",
      jobTitle: "Backend",
      sessions: 4,
      rounds: [round("data", "almost", 6.2), round("infra", "practice", 4.1), round("project", "ready", 7.4)],
    };
    expect(nextRound(job)?.area).toBe("infra");
    expect(nextRound({ ...job, rounds: [round("project", "ready", 7.5)] })).toBeNull();
    expect(practiceHref("job-be", "cv-1", "infra")).toBe("/interview/cv-score?candidateId=cv-1&jobId=job-be&focus=infra");
    // Project and teamwork questions are in every session: no focus parameter.
    expect(practiceHref("job-be", "cv-1", "project")).toBe("/interview/cv-score?candidateId=cv-1&jobId=job-be");
    expect(practiceHref(null, null, "data")).toBe("/interview/select");
  });

  it("filters the revision notebook by CV and position", async () => {
    const { filteredGaps, DEFAULT_FILTERS } = await import("../utils/progressModel");
    const gap = (jobId: string, resumeId: string) => ({
      skill: "Redis",
      skillKey: "skill-redis",
      area: "data" as const,
      point: `p-${jobId}-${resumeId}`,
      status: "MISSING" as const,
      timesAsked: 2,
      timesMissed: 2,
      lastSeen: { sessionId: "s1", date: "2026-10-10T00:00:00Z", question: "q", jobId, resumeId },
    });
    const progress = { gaps: { open: [gap("a", "cv1"), gap("b", "cv1")], fixed: [gap("a", "cv2")] } } as never;
    const out = filteredGaps(progress, { ...DEFAULT_FILTERS, jobId: "a" });
    expect(out.open.map((g) => g.point)).toEqual(["p-a-cv1"]);
    expect(filteredGaps(progress, { ...DEFAULT_FILTERS, resumeId: "cv1" }).fixed).toEqual([]);
  });

  it("never suggests practising a keyword that is no longer asked", async () => {
    const { summaryOf } = await import("../utils/progressModel");
    const skill = (label: string, latest: number, minor: boolean) =>
      ({ conceptId: label, label, latest, minor, trend: { status: "flat" }, points: [], sessionsCount: 3 }) as never;
    const summary = summaryOf([skill("XML", 0.3, true), skill("Redis", 5.0, false)], new Date("2026-10-20"));
    expect((summary.focus as { label: string } | null)?.label).toBe("Redis");
  });

  it("names the rounds asked in a failed interview that were not ready then", async () => {
    const { notReadyAtTheTime } = await import("../components/ReadinessCards");
    const report = {
      id: "r1",
      jobId: "job-be",
      company: null,
      date: "2026-10-18",
      stage: "technical" as const,
      result: "failed" as const,
      askedAreas: ["data", "infra", "ai"] as never,
      hardParts: null,
      readiness: { rounds: { data: { status: "ready" as const, estimate: 7.2 }, infra: { status: "practice" as const, estimate: 4 } } },
    };
    expect(notReadyAtTheTime(report)).toEqual(["infra"]);
  });
});

describe("streak calendar (research 24/10)", () => {
  it("lays out each streak week as 7 days and marks days after today as future", async () => {
    const { calendarWeeks } = await import("../components/StreakCard");
    const week = (weekStart: string, current = false) => ({ weekStart, count: 1, met: false, frozen: false, current });
    const weeks = calendarWeeks(
      [week("2026-10-12"), week("2026-10-19", true)],
      [{ date: "2026-10-14", started: 1, valid: 1, fixed: 1 }],
      "2026-10-21",
    );
    expect(weeks).toHaveLength(2);
    expect(weeks[0].days.map((d) => d.date)).toEqual([
      "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18",
    ]);
    expect(weeks[0].days[2].activity?.fixed).toBe(1);
    expect(weeks[1].days.filter((d) => d.future).map((d) => d.date)[0]).toBe("2026-10-22");
  });
});

describe("progress page v2: ladder, week, records, timeline (research 24/10)", () => {
  const round = (area: string, level: 0 | 1 | 2 | 3, scores: number[], extra: Record<string, unknown> = {}) => ({
    area: area as never,
    status: "almost" as const,
    estimate: scores[scores.length - 1] ?? null,
    sessions: scores.length,
    skills: [],
    topGap: null,
    level,
    series: scores.map((score, i) => ({ sessionId: `s${i}`, date: `2026-10-0${i + 1}T02:00:00Z`, tier: "standard" as const, score })),
    next: { kind: "run" as const, score: 7, have: 1, need: 2 },
    ...extra,
  });
  const job = (rounds: ReturnType<typeof round>[]) => ({ jobId: "job-be", jobTitle: "Backend", sessions: 4, rounds });

  it("advises the round about to go down first, then the lowest level", async () => {
    const { adviceRoundOf, readyCountOf } = await import("../utils/progressModel");
    const rounds = [round("data", 1, [6, 7.2]), round("infra", 1, [5.8, 5.9]), round("teamwork", 2, [7.5, 5, 7.4], { atRisk: true })];
    expect(adviceRoundOf(job(rounds))).toMatchObject({ reason: "risk", round: { area: "teamwork" } });
    expect(adviceRoundOf(job(rounds.slice(0, 2)))).toMatchObject({ reason: "lowest", round: { area: "infra" } });
    expect(adviceRoundOf(job([round("data", 2, [7.2, 7.4])]))).toBeNull();
    expect(readyCountOf(job(rounds))).toBe(1);
  });

  it("writes the rule that moves a round up, with the progress made", async () => {
    const { ladderRule } = await import("../components/ProgressOverview");
    expect(ladderRule(round("data", 1, [6, 7.2]), t)).toBe("Để lên Vững: 2 buổi liên tiếp từ 7.0 điểm (đã có 1/2) · lần gần nhất 7.2");
    expect(ladderRule(round("ai", 0, []), t)).toBe("Chưa được hỏi phần này ở vị trí này.");
    expect(ladderRule(round("data", 3, [8], { next: { kind: "top", score: 7, have: 0, need: 0 } }), t)).toBe(
      "Bậc cao nhất. Luyện đều để giữ bậc.",
    );
  });

  it("tells what changed after a session, and a first session at a harder tier", async () => {
    const { timelineChips } = await import("../components/ProgressOverview");
    const entry = {
      sessionId: "s3", date: "2026-10-14T02:00:00Z", jobId: "job-be", tier: "challenge" as const, score: 6.1, baseline: null,
      levelChanges: [{ area: "language" as const, from: 1 as const, to: 2 as const }], kept: 4,
      records: [{ kind: "first_star_complete" as const, quote: "giảm 40%" }],
    };
    const older = [{ ...entry, sessionId: "s2", tier: "standard" as const, levelChanges: [], records: [] }];
    expect(timelineChips(entry, older, t).map((chip) => chip.text)).toEqual([
      "↑ Ngôn ngữ lập trình lên Vững",
      "= 4 phần giữ bậc",
      "Kỷ lục: Lần đầu kể kinh nghiệm đủ bối cảnh, việc, hành động, kết quả",
      "Lần đầu ở mức Thử thách, điểm thấp hơn là bình thường",
    ]);
  });

  it("lists due points most missed first, records newest first, and opens a re-ask session", async () => {
    const { dueOf, practiceHref, recentRecords } = await import("../utils/progressModel");
    const gap = (point: string, missed: number, due: boolean, dueAt?: string) => ({
      skill: "Redis", skillKey: "redis", area: "data" as const, point, status: "MISSING" as const, timesAsked: missed,
      timesMissed: missed, due, dueAt,
      lastSeen: { sessionId: "s1", date: "2026-10-08T02:00:00Z", question: "Q", jobId: "job-be", resumeId: "cv-1" },
    });
    expect(dueOf([gap("a", 1, true), gap("b", 3, true)]).due.map((g) => g.point)).toEqual(["b", "a"]);
    expect(dueOf([gap("a", 1, false, "2026-10-30"), gap("b", 1, false, "2026-10-28")]).nextAt).toBe("2026-10-28");
    const timeline = [
      { sessionId: "s2", date: "d2", jobId: "job-be", tier: "standard" as const, score: 7, baseline: null, levelChanges: [], kept: 0,
        records: [{ kind: "first_full_core" as const }] },
      { sessionId: "s1", date: "d1", jobId: "other", tier: "standard" as const, score: 7, baseline: null, levelChanges: [], kept: 0,
        records: [{ kind: "first_no_incorrect" as const }] },
    ];
    expect(recentRecords(timeline, "job-be").map((r) => r.sessionId)).toEqual(["s2"]);
    expect(practiceHref("job-be", "cv-1", "data", { conceptId: "redis", skill: "Redis" })).toBe(
      "/interview/cv-score?candidateId=cv-1&jobId=job-be&focus=data&reask=redis&reaskSkill=Redis",
    );
    expect(practiceHref("job-be", "cv-1", "project", { conceptId: "label:kể dự án", skill: "Dự án" })).toBe(
      "/interview/cv-score?candidateId=cv-1&jobId=job-be",
    );
  });
});
