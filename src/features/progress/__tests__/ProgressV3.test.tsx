import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { PracticeProgress } from "../services/progress.service";
import { ProgressV3 } from "../components/ProgressV3";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("@components/shared/NavigationLoadingProvider", () => ({
  useNavigationLoading: () => ({ showNavigationLoading: () => undefined, hideNavigationLoading: () => undefined }),
}));

const job = {
  id: "saved-job",
  title: "AI Engineer",
  company: { name: "Example" },
  listingStatus: "ACTIVE",
  keywords: ["RAG evaluation", "Python"],
  primaryTaxonomy: { conceptId: "ai", label: "AI engineering" },
} as JobProfile;

const emptyProgress = {
  generatedAt: "2026-11-02T00:00:00Z",
  weeklyGoal: 2,
  resumes: [],
  streak: { weeks: 0, goal: 2, thisWeekCount: 0, thisWeekRemaining: 2, freezeAvailableThisMonth: false, history: [] },
  sessions: [],
  skills: [],
  jobs: [],
  behavior: { firstTimeSufficientRate: { latest: null, trend: { status: "insufficient", delta: null } }, skippedPerSession: { latest: null, trend: { status: "insufficient", delta: null } } },
  milestones: [],
  trendRule: { minPoints: 4, window: 2, flatDelta: 0.2 },
  readiness: [],
} as unknown as PracticeProgress;

describe("ProgressV3 target job", () => {
  it("offers a saved job with no practice history and grounds the first task in its JD", () => {
    const html = renderToStaticMarkup(
      <ProgressV3
        progress={emptyProgress}
        onGoal={() => undefined}
        savingGoal={false}
        targetJobs={[job]}
        targetJobId={job.id}
        onTargetJobChange={() => undefined}
      />,
    );

    expect(html).toContain("Công việc mục tiêu");
    expect(html).toContain("AI Engineer");
    expect(html).toContain("RAG evaluation");
    expect(html).toContain("Chưa có buổi luyện được tính điểm");
    expect(html).toContain("Chọn CV và bắt đầu");
    expect(html).not.toContain("0.0/10");
  });
});
