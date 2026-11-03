import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

import { ViJourneyPanel } from "../components/ViPanels";
import { buildViJourney } from "../utils/viJourney";

describe("Vi journey panel", () => {
  it("explains that the preparation journey is complete and points back to job progress", () => {
    const journey = buildViJourney({
      cvs: [{ id: "cv-1", originalName: "CV.pdf", status: "DONE" }],
      savedJobCount: 1,
      sessions: [{ sessionId: "s-1", mode: "text", status: "CLOSED", overallScore: 7.2 }],
      seenReports: new Set(["s-1"]),
    });
    const html = renderToStaticMarkup(<ViJourneyPanel journey={journey} onNavigate={() => undefined} />);

    expect(html).toContain("Các bước CV, vị trí và báo cáo đã hoàn tất");
    expect(html).toContain('href="/dashboard/progress"');
    expect(html).toContain("Tiếp tục luyện ở Tiến độ");
    expect(html).not.toContain("Mọi thứ đã xong");
  });
});
