import { describe, expect, it } from "vitest";
import { buildViJourney, isWorkspacePath, reportIdFromPath, type ViCv, type ViSession } from "../utils/viJourney";

const NOW = Date.parse("2026-10-20T05:00:00Z");
const minutesAgo = (n: number) => new Date(NOW - n * 60_000).toISOString();

const cv = (over: Partial<ViCv> = {}): ViCv => ({
  id: "cv-1",
  originalName: "CV_Backend.pdf",
  status: "DONE",
  createdAt: minutesAgo(600),
  updatedAt: minutesAgo(600),
  ...over,
});

const session = (over: Partial<ViSession> = {}): ViSession => ({
  sessionId: "s-1",
  jobTitle: "Backend Developer",
  mode: "text",
  status: "CLOSED",
  startedAt: minutesAgo(120),
  endedAt: minutesAgo(90),
  endReason: "COMPLETED",
  overallScore: 6.8,
  evaluatedAt: minutesAgo(80),
  answeredTurns: 8,
  ...over,
});

const build = (over: Partial<Parameters<typeof buildViJourney>[0]> = {}) =>
  buildViJourney({ cvs: [], savedJobCount: 0, sessions: [], seenReports: new Set(), now: NOW, ...over });

describe("buildViJourney", () => {
  it("starts a new candidate at uploading a CV", () => {
    const journey = build();
    expect(journey.current?.key).toBe("cv");
    expect(journey.steps.map((step) => step.state)).toEqual(["current", "todo", "todo", "todo"]);
    expect(journey.status).toBe("todo");
    expect(journey.pending).toBe(1);
  });

  it("walks the steps as the candidate makes progress", () => {
    expect(build({ cvs: [cv()] }).current?.key).toBe("job");
    expect(build({ cvs: [cv()], savedJobCount: 1 }).current?.key).toBe("interview");
    const afterInterview = build({ cvs: [cv()], sessions: [session()] });
    expect(afterInterview.current?.key).toBe("report");
    expect(afterInterview.current?.href).toBe("/interview/results/s-1");
    const allDone = build({ cvs: [cv()], sessions: [session()], seenReports: new Set(["s-1"]) });
    expect(allDone.current).toBeNull();
    expect(allDone.status).toBe("done");
    expect(allDone.pending).toBe(0);
  });

  it("does not count a session that failed to start as practice", () => {
    const journey = build({ cvs: [cv()], sessions: [session({ endReason: "TECHNICAL_FAILURE", overallScore: null })] });
    expect(journey.current?.key).toBe("interview");
  });

  it("reports a CV being read, with its step, and polls instead of nagging", () => {
    const journey = build({ cvs: [cv({ status: "AI_PROCESSING", updatedAt: minutesAgo(1) })] });
    expect(journey.status).toBe("busy");
    expect(journey.events[0]).toMatchObject({ kind: "cvProcessing", step: 3, subject: "CV_Backend.pdf" });
    // Reading is not something the candidate has to act on.
    expect(journey.pending).toBe(0);
  });

  it("puts a failed CV first and shows the error state", () => {
    const journey = build({
      cvs: [cv({ id: "cv-2", status: "FAILED" }), cv()],
      sessions: [session({ sessionId: "s-2", status: "OPEN", answeredTurns: 3, endedAt: null, overallScore: null })],
    });
    expect(journey.status).toBe("error");
    expect(journey.events.map((event) => event.kind)).toEqual(["cvFailed", "openSession"]);
    expect(journey.pending).toBe(2);
  });

  it("announces a CV that just finished, but not an old one", () => {
    expect(build({ cvs: [cv({ updatedAt: minutesAgo(5) })] }).events[0]?.kind).toBe("cvReady");
    expect(build({ cvs: [cv()] }).events).toEqual([]);
  });

  it("reminds about a started session that is still open, linking back to its room", () => {
    const open = session({ sessionId: "s-9", status: "OPEN", answeredTurns: 2, endedAt: null, overallScore: null });
    const journey = build({ cvs: [cv()], sessions: [open] });
    expect(journey.status).toBe("open");
    expect(journey.events[0]).toMatchObject({ kind: "openSession", href: "/interview/room/s-9", mode: "text" });
    // Created but never started: nothing to come back to.
    expect(build({ cvs: [cv()], sessions: [{ ...open, answeredTurns: 0 }] }).events).toEqual([]);
  });

  it("announces a fresh report until it is opened", () => {
    const fresh = build({ cvs: [cv()], sessions: [session()] });
    expect(fresh.events[0]).toMatchObject({ kind: "reportReady", href: "/interview/results/s-1" });
    expect(build({ cvs: [cv()], sessions: [session()], seenReports: new Set(["s-1"]) }).events).toEqual([]);
    const old = session({ evaluatedAt: minutesAgo(60 * 24 * 5) });
    expect(build({ cvs: [cv()], sessions: [old] }).events).toEqual([]);
  });
});

describe("paths", () => {
  it("finds the report id of a results page", () => {
    expect(reportIdFromPath("/interview/results/abc-1")).toBe("abc-1");
    expect(reportIdFromPath("/interview/select")).toBeNull();
  });

  it("knows which pages are the workspace", () => {
    expect(isWorkspacePath("/dashboard")).toBe(true);
    expect(isWorkspacePath("/dashboard/cvs")).toBe(true);
    expect(isWorkspacePath("/interview/select")).toBe(true);
    expect(isWorkspacePath("/")).toBe(false);
    expect(isWorkspacePath("/pricing")).toBe(false);
  });
});
