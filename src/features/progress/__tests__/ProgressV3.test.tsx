import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { PracticeProgress } from "../services/progress.service";
import type { InterviewRuntimeSession } from "@features/interview/services/interviewRuntime.service";
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

  it("shows a selected job's open session separately from scored progress and offers resume", () => {
    const session = {
      sessionId: "open-session",
      jobId: job.id,
      jobTitle: job.title,
      mode: "text",
      experienceType: "interview_chat",
      locale: "vi-VN",
      durationMinutes: 15,
      status: "OPEN",
      startedAt: "2026-11-02T10:00:00Z",
      endedAt: null,
      endReason: null,
      plan: null,
      answeredTurns: 2,
      totalTurns: 6,
    } as InterviewRuntimeSession;
    const html = renderToStaticMarkup(
      <ProgressV3
        progress={emptyProgress}
        onGoal={() => undefined}
        savingGoal={false}
        targetJobs={[job]}
        targetJobId={job.id}
        runtimeSessions={[session]}
      />,
    );

    expect(html).toContain("Buổi chưa xuất hiện trong tiến độ");
    expect(html).toContain("Buổi đang dở · chưa được tính");
    expect(html).toContain("Đã trả lời 2 câu");
    expect(html).toContain('href="/interview/room/open-session"');
    expect(html).toContain("Xem lại");
  });

  it("explains that a closed ungraded session is not counted without assuming why", () => {
    const session = {
      sessionId: "ungraded-session",
      jobId: job.id,
      jobTitle: job.title,
      mode: "text",
      experienceType: "interview_chat",
      locale: "vi-VN",
      durationMinutes: 15,
      status: "CLOSED",
      startedAt: "2026-11-02T10:00:00Z",
      endedAt: "2026-11-02T10:10:00Z",
      endReason: "USER_ENDED",
      plan: null,
      answeredTurns: 2,
      totalTurns: 6,
      overallScore: null,
    } as InterviewRuntimeSession;
    const html = renderToStaticMarkup(
      <ProgressV3
        progress={emptyProgress}
        onGoal={() => undefined}
        savingGoal={false}
        targetJobs={[job]}
        targetJobId={job.id}
        runtimeSessions={[session]}
      />,
    );

    expect(html).toContain("Đã kết thúc · chưa có đánh giá nên chưa được tính");
    expect(html).toContain("Hệ thống không đoán lý do buổi chưa được chấm.");
    expect(html).not.toContain("Fewer than 3 main questions");
  });
});
