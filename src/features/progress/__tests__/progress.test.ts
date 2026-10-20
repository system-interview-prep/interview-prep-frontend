import { describe, expect, it } from "vitest";
import { uniqueLabels } from "../components/ProgressPage";
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
});
