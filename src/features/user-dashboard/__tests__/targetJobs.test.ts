import { describe, expect, it } from "vitest";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { ProgressSession } from "@features/progress/services/progress.service";
import { resolveTargetJobId, savedTargetJobs } from "../utils/targetJobs";

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
});
