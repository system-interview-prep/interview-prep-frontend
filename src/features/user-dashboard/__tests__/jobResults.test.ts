import { describe, expect, it } from "vitest";
import type { StoredDashboardSession } from "../components/DashboardSections";
import { buildJobResultsOverview } from "../utils/jobResults";

function session(
  sessionId: string,
  jobId: string | null,
  jobTitle: string,
  startedAt: string,
  extra: Partial<StoredDashboardSession> = {},
): StoredDashboardSession {
  return {
    sessionId,
    jobId,
    jobTitle,
    startedAt,
    mode: "text",
    status: "CLOSED",
    answeredTurns: 3,
    overallScore: null,
    ...extra,
  };
}

describe("buildJobResultsOverview", () => {
  it("groups attended sessions across jobs and keeps unlinked sessions separate", () => {
    const data = buildJobResultsOverview([
      session("one", "job-a", "AI Engineer", "2026-11-01T10:00:00Z", { overallScore: 0 }),
      session("two", "job-a", "AI Engineer", "2026-11-02T10:00:00Z", { mode: "voice", overallScore: 8 }),
      session("three", "job-b", "Product Analyst", "2026-11-03T10:00:00Z", { answeredTurns: 1 }),
      session("four", null, "", "2026-11-04T10:00:00Z", { overallScore: 9 }),
      session("empty", "job-c", "No answer", "2026-11-05T10:00:00Z", { answeredTurns: 0, status: "CLOSED" }),
    ]);

    expect(data.attendedSessions.map((item) => item.sessionId)).toEqual(["four", "three", "two", "one"]);
    expect(data.jobCount).toBe(2);
    expect(data.jobs.map((item) => [item.title, item.sessions.length])).toEqual([
      ["AI Engineer", 2],
      ["Phỏng vấn chung", 1],
      ["Product Analyst", 1],
    ]);
    expect(data.jobs[0].scoresByRoom.chat).toEqual({ average: 0, count: 1 });
    expect(data.jobs[0].scoresByRoom.voice).toEqual({ average: 8, count: 1 });
    expect(data.jobs[0].latestScoredSession?.sessionId).toBe("two");
    expect(data.scoresByRoom.chat).toEqual({ average: 4.5, count: 2 });
    expect(data.scoresByRoom.voice).toEqual({ average: 8, count: 1 });
    expect(data.scoredSessionCount).toBe(3);
    expect(data.highestScoredSession?.sessionId).toBe("four");
  });

  it("distinguishes an in-progress session from an unscored completed job", () => {
    const data = buildJobResultsOverview([
      session("open", "job-a", "AI Engineer", "2026-11-03T10:00:00Z", { status: "IN_PROGRESS" }),
      session("closed", "job-b", "Backend Engineer", "2026-11-02T10:00:00Z"),
      session("video-score", "job-c", "Product Engineer", "2026-11-01T10:00:00Z", { mode: "video", overallScore: 6 }),
    ]);

    expect(data.jobs.find((job) => job.jobId === "job-a")?.status).toBe("in_progress");
    expect(data.jobs.find((job) => job.jobId === "job-b")?.status).toBe("unscored");
    expect(data.scoresByRoom.chat).toEqual({ average: null, count: 0 });
    expect(data.scoresByRoom.voice).toEqual({ average: null, count: 0 });
    expect(data.scoresByRoom.video).toEqual({ average: 6, count: 1 });
    expect(data.highestScoredSession?.sessionId).toBe("video-score");
  });

  it("counts a technically ended session as attended when the candidate answered", () => {
    const data = buildJobResultsOverview([
      session("technical", "job-a", "AI Engineer", "2026-11-03T10:00:00Z", {
        answeredTurns: 1,
        endReason: "TECHNICAL_FAILURE",
        overallScore: null,
      }),
    ]);

    expect(data.attendedSessions).toHaveLength(1);
    expect(data.jobs[0].status).toBe("unscored");
    expect(data.scoredSessionCount).toBe(0);
  });
});
