import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("@components/shared/NavigationLoadingProvider", () => ({
  useNavigationLoading: () => ({ showNavigationLoading: () => undefined, hideNavigationLoading: () => undefined }),
}));

import { DashboardOverview } from "../components/UserDashboardHome";
import { greetingName, type StoredDashboardSession } from "../components/DashboardSections";

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

describe("DashboardOverview", () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 14, 12));
  });
  afterAll(() => vi.useRealTimers());

  it("renders hero welcome banner, metrics, and practice modes for a candidate", () => {
    const html = render({});
    expect(html).toContain("Chào An,");
    expect(html).toContain("Bắt đầu phỏng vấn ngay");
    expect(html).toContain("Điểm sẵn sàng");
    expect(html).toContain("Chế độ luyện tập");
    expect(html).toContain("Phỏng vấn Video AI");
    expect(html).toContain("Phỏng vấn Giọng nói");
    expect(html).toContain("Phỏng vấn Chat");
  });

  it("shows an in-progress session notice in the hero with a resume action", () => {
    const html = render({
      cvCount: 1,
      sessions: [session(0, { status: "IN_PROGRESS", endedAt: null, overallScore: null, answeredTurns: 2, totalTurns: 6 })],
    });
    expect(html).toContain("Buổi dang dở");
    expect(html).toContain("Backend Developer");
    expect(html).toContain("Tiếp tục ngay");
  });

  it("points a candidate to their weakest skill in the AI improvement focus card", () => {
    const sessions = [session(0, { overallScore: 7.2 }), session(1, { mode: "voice" })];
    const html = render({ cvCount: 1, sessions });
    expect(html).toContain("Gợi ý cải thiện từ AI");
    expect(html).toContain("System design");
    expect(html).toContain("5.2/10");
    expect(html).toContain("Luyện lại vị trí này");
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
