import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("@components/shared/NavigationLoadingProvider", () => ({
  useNavigationLoading: () => ({ showNavigationLoading: () => undefined, hideNavigationLoading: () => undefined }),
}));

import { DashboardOverview } from "../components/UserDashboardHome";
import { DailyGoal, greetingName, weakestCompetency, type StoredDashboardSession } from "../components/DashboardSections";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { GapItem } from "@features/progress/services/progress.service";

const DAY = 24 * 60 * 60 * 1000;

function session(daysAgo: number, extra: Partial<StoredDashboardSession> = {}): StoredDashboardSession {
  const started = new Date(new Date(2026, 9, 14, 10).getTime() - daysAgo * DAY);
  return {
    sessionId: `s-${daysAgo}-${extra.mode ?? "text"}`,
    jobId: "job-1",
    jobTitle: "Backend Developer",
    startedAt: started.toISOString(),
    endedAt: new Date(started.getTime() + 20 * 60 * 1000).toISOString(),
    mode: "text",
    status: "CLOSED",
    overallScore: 6.5,
    answeredTurns: 5,
    totalTurns: 5,
    competencyScores: [
      { competency: "System design", score: 5.2 },
      { competency: "Giao tiếp", score: 7.4 },
    ],
    ...extra,
  };
}

const render = (props: Partial<React.ComponentProps<typeof DashboardOverview>>) =>
  renderToStaticMarkup(
    <DashboardOverview
      onNavigate={() => undefined}
      onStartVideo={async () => undefined}
      videoError={false}
      onDismissVideoError={() => undefined}
      userName="Nguyễn Văn An"
      profiles={[]}
      sessions={[]}
      cvCount={0}
      error={false}
      onRetry={() => undefined}
      {...props}
    />,
  );

function targetJob(id: string, title: string): JobProfile {
  return {
    id, title, company: { name: "Example" }, location: null, workMode: "hybrid", employmentType: "full_time",
    seniority: "mid", experience: { minYears: 2 }, salary: null,
    primaryTaxonomy: { conceptId: "software", label: "Software engineering" }, source: null,
    postedAt: null, listingStatus: "ACTIVE", processingStatus: "DONE", status: "ACTIVE",
    keywords: ["TypeScript", "Testing"], createdAt: "2026-10-01", updatedAt: "2026-10-01",
  };
}

describe("DashboardOverview", () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 12));
  });
  afterAll(() => vi.useRealTimers());

  it("renders a compact overview, progress CTA and shortcuts", () => {
    const html = render({});
    expect(html).toContain("Chào An,");
    expect(html).toContain("Tóm tắt nhanh");
    expect(html).toContain("Điểm buổi gần nhất");
    expect(html).toContain("Xem tiến độ và luyện hôm nay");
    expect(html).toContain("Việc làm");
    expect(html).toContain("CV");
    expect(html).toContain("Lịch sử");
    expect(html).not.toContain("Chế độ luyện tập");
    // No marketing claims, emoji or gradients on the home page.
    expect(html).not.toContain("👋");
    expect(html).not.toContain("30%");
    expect(html).not.toContain("gradient");
  });

  it("puts an unfinished session first, with its answered count and a resume action", () => {
    const html = render({
      cvCount: 1,
      sessions: [session(0, { status: "IN_PROGRESS", endedAt: null, overallScore: null, answeredTurns: 2, totalTurns: 6 })],
    });
    expect(html).toContain("Buổi dang dở");
    expect(html).toContain("Backend Developer");
    expect(html).toContain("Tiếp tục ngay");
    expect(html).toContain("Đã trả lời 2/6 câu");
    expect(html).toContain("Bạn còn một buổi chưa xong.");
  });

  it("points a candidate to their weakest skill from the latest session", () => {
    const sessions = [session(0, { overallScore: 7.2 }), session(1, { mode: "voice" })];
    const html = render({ isGuest: true, profiles: [targetJob("job-1", "Backend Developer")], cvCount: 1, sessions });
    expect(html).toContain("Tóm tắt nhanh");
    expect(html).toContain("System design");
    expect(html).toContain("5.2/10");
    expect(html).toContain("Xem tiến độ và luyện hôm nay");
    expect(html).toContain("Backend Developer");
  });

  it("compares the latest score only with the same target job", () => {
    const html = render({
      isGuest: true,
      profiles: [targetJob("job-1", "Backend Developer"), targetJob("job-2", "AI Engineer")],
      sessions: [
        session(0, { jobId: "job-1", jobTitle: "Backend Developer", overallScore: 5.2 }),
        session(1, { jobId: "job-2", jobTitle: "AI Engineer", overallScore: 9.5 }),
        session(2, { jobId: "job-1", jobTitle: "Backend Developer", overallScore: 4.8 }),
      ],
    });
    expect(html).toContain("5.2/10");
    expect(html).not.toContain("9.5/10");
  });
});

describe("DailyGoal", () => {
  const job: JobProfile = {
    id: "job-1", title: "OJT AI Engineer", company: { name: "Example" }, location: null,
    workMode: "hybrid", employmentType: "internship", seniority: "intern", experience: { minYears: 0 },
    salary: null, primaryTaxonomy: { conceptId: "ai", label: "AI engineering" }, source: null,
    postedAt: null, listingStatus: "ACTIVE", processingStatus: "DONE", status: "ACTIVE",
    keywords: ["Python", "LLM", "RAG"], createdAt: "2026-10-01", updatedAt: "2026-10-01",
  };
  const gap: GapItem = {
    skill: "AI model evaluation", skillKey: "skill-ai", area: "ai", point: "Nêu cách đo chất lượng đầu ra",
    status: "MISSING", timesAsked: 1, timesMissed: 1, due: true,
    lastSeen: {
      sessionId: "s-1", date: "2026-10-13T10:00:00Z", question: "Bạn đánh giá câu trả lời của RAG thế nào?",
      questionVersionId: "qv-1", jobId: "job-1", resumeId: "cv-1",
    },
  };

  it("turns a due gap into a specific next-day retry for the selected job", () => {
    const html = renderToStaticMarkup(
      <DailyGoal
        job={job} jobs={[job]} focus={null} dueGap={gap} completedToday={false}
        onSelectJob={() => undefined} onPractice={() => undefined} onBrowseJobs={() => undefined}
      />,
    );
    expect(html).toContain("OJT AI Engineer");
    expect(html).toContain("Bạn đánh giá câu trả lời của RAG thế nào?");
    expect(html).toContain("Nêu cách đo chất lượng đầu ra");
    expect(html).toContain("0/1 buổi hoàn thành");
    expect(html).toContain("Luyện lại câu này");
  });

  it("shows a new development step after today's goal is complete", () => {
    const html = renderToStaticMarkup(
      <DailyGoal
        job={job} jobs={[job]} focus={weakestCompetency([session(0)])} dueGap={null} completedToday
        onSelectJob={() => undefined} onPractice={() => undefined} onBrowseJobs={() => undefined}
      />,
    );
    expect(html).toContain("1/1 buổi hoàn thành");
    expect(html).toContain("Luyện thêm câu mới");
  });

  it("asks the candidate to choose a job instead of showing a generic goal", () => {
    const html = renderToStaticMarkup(
      <DailyGoal
        job={null} jobs={[]} focus={null} dueGap={null} completedToday={false}
        onSelectJob={() => undefined} onPractice={() => undefined} onBrowseJobs={() => undefined}
      />,
    );
    expect(html).toContain("Chọn một vị trí đang ứng tuyển");
    expect(html).toContain("Chọn vị trí ứng tuyển");
  });
});

describe("greetingName", () => {
  it("greets by the given name and ignores a role or title after a separator", () => {
    expect(greetingName("Nguyễn Văn An")).toBe("An");
    expect(greetingName("Nguyễn Thị Thanh Hiền Phương Anh – Ứng viên Kỹ sư Phần mềm Backend & Dữ liệu")).toBe("Anh");
    expect(greetingName("Trần Bình - Data Engineer")).toBe("Bình");
    expect(greetingName("Lê Chi & Dữ liệu")).toBe("Chi");
    expect(greetingName("Phạm Minh (Tony)")).toBe("Minh");
    expect(greetingName("Nguyễn Văn An—Dev")).toBe("An");
    expect(greetingName("hien.nguyen@example.com")).toBe("hien.nguyen");
  });

  it("returns an empty string when there is no usable name", () => {
    expect(greetingName("")).toBe("");
    expect(greetingName(null)).toBe("");
    expect(greetingName("  &  ")).toBe("");
    expect(greetingName("& Dữ liệu")).toBe("");
  });
});
