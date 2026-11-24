import { beforeEach, describe, expect, it, vi } from "vitest";

const apiGet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/apiClient", () => ({ apiClient: { get: apiGet } }));

import {
  findLatestCandidateJobFitAttempt,
  loadAllCandidateJobFitAttempts,
  loadCandidateJobFitAttempt,
  loadCandidateJobFitAttempts,
} from "../utils/fitHistory";

describe("candidate job fit attempts", () => {
  beforeEach(() => apiGet.mockReset());

  it("loads saved attempts for the selected job", async () => {
    const items = [{
      id: "attempt-1",
      jobId: "job/1",
      cvId: "cv-1",
      cvName: "Backend CV.pdf",
      met: 2,
      total: 8,
      analyzedAt: "2026-11-03T08:00:00+00:00",
    }];
    apiGet.mockResolvedValue({ data: { items } });

    await expect(loadCandidateJobFitAttempts("job/1")).resolves.toEqual(items);
    expect(apiGet).toHaveBeenCalledWith("/api/v1/matching/fit-history/job%2F1");
  });

  it("returns an empty list when the history endpoint has no rows", async () => {
    apiGet.mockResolvedValue({ data: {} });

    await expect(loadCandidateJobFitAttempts("job-1")).resolves.toEqual([]);
  });

  it("picks the newest saved attempt for the selected CV", () => {
    const attempts = [
      { id: "newer-other-cv", cvId: "cv-2", jobId: "job-1", met: 3, total: 8, analyzedAt: "2026-11-03" },
      { id: "newer-selected-cv", cvId: "cv-1", jobId: "job-1", met: 4, total: 8, analyzedAt: "2026-11-02" },
      { id: "older-selected-cv", cvId: "cv-1", jobId: "job-1", met: 2, total: 8, analyzedAt: "2026-11-01" },
    ];

    expect(findLatestCandidateJobFitAttempt(attempts, "cv-1")?.id).toBe("newer-selected-cv");
    expect(findLatestCandidateJobFitAttempt(attempts, "cv-missing")).toBeNull();
  });

  it("loads recent matching attempts across all jobs", async () => {
    const items = [{
      id: "attempt-1",
      jobId: "job-1",
      jobTitle: "OJT AI Engineer",
      cvId: "cv-1",
      met: 4,
      total: 8,
      analyzedAt: "2026-11-03T08:00:00+00:00",
    }];
    apiGet.mockResolvedValue({ data: { items } });

    await expect(loadAllCandidateJobFitAttempts()).resolves.toEqual(items);
    expect(apiGet).toHaveBeenCalledWith("/api/v1/matching/fit-history/attempts");
  });

  it("loads a saved assessment snapshot by attempt id", async () => {
    const attempt = {
      id: "attempt-1",
      jobId: "job-1",
      cvId: "cv-1",
      met: 2,
      total: 8,
      analyzedAt: "2026-11-03T08:00:00+00:00",
      resultSnapshot: { fitBand: "partial_fit" },
    };
    apiGet.mockResolvedValue({ data: attempt });

    await expect(loadCandidateJobFitAttempt("attempt/1")).resolves.toEqual(attempt);
    expect(apiGet).toHaveBeenCalledWith("/api/v1/matching/fit-history/attempts/attempt%2F1");
  });
});
