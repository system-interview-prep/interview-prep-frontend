import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const targetHookState = vi.hoisted(() => ({
  selected: null as string | null,
  saved: [] as string[],
  select: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("../hooks/useTargetJob", () => ({
  useTargetJob: () => ({ targetJobId: targetHookState.selected, selectTargetJob: targetHookState.select }),
}));
vi.mock("../hooks/useSavedJobs", () => ({
  useSavedJobs: () => ({ savedJobIds: new Set(targetHookState.saved) }),
}));
vi.mock("@components/shared/NavigationLoadingProvider", () => ({
  useNavigationLoading: () => ({ showNavigationLoading: () => undefined, hideNavigationLoading: () => undefined }),
}));

import { DashboardOverview } from "../components/UserDashboardHome";
import { DailyGoal, greetingName, JobPreparationBoard, weakestCompetency, type StoredDashboardSession } from "../components/DashboardSections";
import { jobPreparations } from "../utils/targetJobs";
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
    keywords: ["TypeScript", "Testing"], description: `${title} cần kinh nghiệm xây dựng sản phẩm và kiểm thử.`,
    createdAt: "2026-10-01", updatedAt: "2026-10-01",
  };
}

describe("DashboardOverview", () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 12));
  });
  afterAll(() => vi.useRealTimers());

  it("renders a compact overview with a clearly named progress CTA and no duplicate shortcuts", () => {
    targetHookState.selected = null;
    targetHookState.saved = [];
    const html = render({});
    expect(html).toContain("home-banner-title");
    expect(html).toContain("%2Fimg%2Fbanner.png");
    expect(html).toContain("%2Fimg%2FJD_Checklist_Icons.png");
    expect(html).toContain("%2Fimg%2FClipboard_Search_Icons.png");
    expect(html).toContain("Buổi luyện gần nhất");
    expect(html).toContain("Bài tập tiếp theo");
    expect(html).toContain("Chưa có buổi hoàn thành");
    expect(html).toContain("Chọn việc làm");
    expect(html).toContain("Luyện phỏng vấn chung");
    expect(html).toContain("Tổng số buổi đã tham gia");
    expect(html).toContain("Chưa có buổi nào");
    expect(html).toContain("Xem tổng quan");
    expect(html).toContain("Chưa chọn công việc");
    expect(html).not.toContain("aria-label=\"Lối tắt\"");
    expect(html).not.toContain("Chế độ luyện tập");
    // Keep other decorative claims out of the candidate overview.
    expect(html).not.toContain("👋");
    expect(html).not.toContain("30%");
  });

  it("renders useful support and resource shortcuts to existing pages", () => {
    const html = render({});
    expect(html).toContain('id="home-resources-title"');
    expect(html).toContain('href="/dashboard/help"');
    expect(html).toContain('href="/resources?topic=interview"');
    expect(html).toContain('href="/resources"');
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

  it("counts all sessions the candidate actually joined, across jobs and score states", () => {
    const html = render({
      sessions: [
        session(0, { jobId: "job-1", answeredTurns: 2, overallScore: null }),
        session(1, { jobId: "job-2", answeredTurns: 5, overallScore: 8.2 }),
        session(2, { jobId: "job-3", answeredTurns: 0, overallScore: null }),
      ],
    });
    expect(html).toContain("2 <span class=\"text-sm font-medium\">buổi</span>");
    expect(html).toContain("Cộng dồn trên mọi công việc và phòng luyện.");
    expect(html).not.toContain("1/2");
  });

  it("points a candidate to their weakest skill from the latest session", () => {
    targetHookState.selected = null;
    targetHookState.saved = [];
    const sessions = [session(0, { overallScore: 7.2 }), session(1, { mode: "voice" })];
    const html = render({ isGuest: true, profiles: [targetJob("job-1", "Backend Developer")], cvCount: 1, sessions });
    expect(html).toContain("Bài tập tiếp theo");
    expect(html).toContain("System design");
    expect(html).toContain("5.2/10");
    expect(html).toContain("Xem bài luyện hôm nay");
    expect(html).toContain("Backend Developer");
  });

  it("shows the latest completed session score", () => {
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

  it("shows the latest session score even when no target job is selected", () => {
    const zeroScore = render({
      isGuest: true,
      profiles: [targetJob("job-1", "Backend Developer")],
      sessions: [session(0, { overallScore: 0 })],
    });
    expect(zeroScore).toContain("0.0/10");

    const noTarget = render({ sessions: [session(0, { overallScore: 0 })] });
    expect(noTarget).toContain("0.0/10");
    expect(noTarget).toContain("Buổi luyện gần nhất");
    expect(noTarget).not.toContain("Chọn công việc mục tiêu để xem điểm riêng.");
    expect(noTarget).not.toContain("System design");
  });

  it("shows the newest completed session in the overview card", () => {
    const html = render({
      isGuest: true,
      sessions: [session(0, { jobTitle: "AI Engineer", overallScore: null, competencyScores: [] })],
    });
    expect(html).toContain("Buổi luyện gần nhất");
    expect(html).toContain("AI Engineer");
    expect(html).toContain("Chưa có \u0111iểm");
    expect(html).toContain("Xem báo cáo →");
  });

  it("keeps the suggested skill scoped to the selected target job without a duplicate Home selector", () => {
    targetHookState.selected = "job-2";
    targetHookState.saved = ["job-1", "job-2"];
    targetHookState.select = vi.fn();
    const html = render({
      profiles: [targetJob("job-1", "Backend Developer"), targetJob("job-2", "Frontend Developer")],
      sessions: [session(0, { jobId: "job-1", jobTitle: "Backend Developer" })],
    });

    expect(html).not.toContain('aria-label="Chọn công việc mục tiêu trên trang chủ"');
    expect(html).toContain("Bài luyện hôm nay được cá nhân hóa theo Frontend Developer.");
    expect(html).toContain("Bắt đầu luyện cho Frontend Developer");
    expect(html).not.toContain("System design");
    expect(html).toContain("Gợi ý công việc nên thử");
    expect(html).toContain('href="/dashboard/jobs/job-1"');
    expect(html).toContain('href="/dashboard/jobs/job-2"');
    expect(html).toContain("Frontend Developer cần kinh nghiệm xây dựng sản phẩm và kiểm thử.");
  });

  it("shows a saved job's due answer as one concrete next action", () => {
    const job = targetJob("job-1", "Backend Developer");
    const gap = {
      due: true,
      skill: "System design",
      skillKey: "system-design",
      point: "Nêu một đánh đổi cụ thể",
      lastSeen: { jobId: job.id, question: "Bạn thiết kế cache thế nào?", questionVersionId: "qv-1" },
    } as unknown as GapItem;
    const [item] = jobPreparations([job], new Set([job.id]), [], [gap]);
    const html = renderToStaticMarkup(
      <JobPreparationBoard items={[item]} onAction={() => undefined} onBrowseJobs={() => undefined} />,
    );
    expect(html).toContain("Các vị trí bạn đang chuẩn bị");
    expect(html).toContain("Có câu đến hạn");
    expect(html).toContain("System design: Nêu một đánh đổi cụ thể");
    expect(html).toContain("Ôn câu đến hạn");
    expect((html.match(/<button /g) ?? []).length).toBe(1);
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
