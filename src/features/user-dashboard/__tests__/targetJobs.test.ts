import { describe, expect, it } from "vitest";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { ProgressSession } from "@features/progress/services/progress.service";
import { jobPreparations, resolveTargetJobId, savedTargetJobs } from "../utils/targetJobs";

const profile = (id: string, listingStatus: JobProfile["listingStatus"] = "ACTIVE") => ({ id, listingStatus, status: "ACTIVE" } as JobProfile);
const session = (jobId: string, date: string) => ({ jobId, date } as ProgressSession);

describe("target job selection", () => {
  it("includes saved active profiles even when they have no practice history", () => {
    const jobs = savedTargetJobs(
      [profile("practised"), profile("unseen"), profile("closed", "CLOSED"), profile("not-saved")],
      new Set(["practised", "unseen", "closed"]),
    );

    expect(jobs.map((job) => job.id)).toEqual(["practised", "unseen"]);
  });

  it("keeps a valid choice and otherwise falls back to the latest saved-job practice", () => {
    const jobs = [{ id: "job-a" }, { id: "job-b" }];
    const sessions = [session("job-a", "2026-10-10"), session("job-b", "2026-10-20"), session("not-saved", "2026-10-25")];

    expect(resolveTargetJobId(jobs, "job-a", sessions)).toBe("job-a");
    expect(resolveTargetJobId(jobs, "removed", sessions)).toBe("job-b");
    expect(resolveTargetJobId([{ id: "job-c" }], null, [])).toBe("job-c");
    expect(resolveTargetJobId([], null, sessions)).toBeNull();
  });

  it("prioritizes unfinished sessions and due reviews, then jobs without practice", () => {
    const jobs = [profile("practising"), profile("not-started"), profile("due"), profile("open")];
    const session = (jobId: string, startedAt: string, status = "CLOSED", overallScore: number | null = 6) => ({
      sessionId: `${jobId}-${startedAt}`,
      jobId,
      startedAt,
      status,
      overallScore,
      mode: "text",
    }) as never;
    const gap = (jobId: string) => ({ due: true, lastSeen: { jobId } }) as never;

    const items = jobPreparations(
      jobs,
      new Set(jobs.map((job) => job.id)),
      [
        session("practising", "2026-10-10T10:00:00Z", "CLOSED", 0),
        session("open", "2026-10-12T10:00:00Z", "IN_PROGRESS", null),
        session("due", "2026-10-11T10:00:00Z"),
      ],
      [gap("due")],
    );

    expect(items.map((item) => [item.job.id, item.status])).toEqual([
      ["open", "in_progress"],
      ["due", "due"],
      ["not-started", "not_started"],
      ["practising", "practising"],
    ]);
    expect(items.find((item) => item.job.id === "practising")?.latestScoredSession?.overallScore).toBe(0);
  });

  it("does not claim a saved job has not been practised when session data is unavailable", () => {
    const [item] = jobPreparations([profile("unknown")], new Set(["unknown"]), [], [], false);
    expect(item.status).toBe("unknown");
  });

  it("does not infer that an old job was never practised when the session list reached its limit", () => {
    const sessions = Array.from({ length: 100 }, (_, index) => ({
      sessionId: `other-${index}`,
      jobId: "other-job",
      startedAt: `2026-10-${String((index % 28) + 1).padStart(2, "0")}T10:00:00Z`,
      status: "CLOSED",
      mode: "text",
    }) as never);
    const [item] = jobPreparations([profile("old-job")], new Set(["old-job"]), sessions, []);
    expect(item.status).toBe("unknown");
  });
});
