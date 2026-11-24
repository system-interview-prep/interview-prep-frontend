import { describe, expect, it } from "vitest";
import type { StoredDashboardSession } from "../components/DashboardSections";
import { buildAIReview } from "../utils/aiReview";

const session: StoredDashboardSession & { overallScore: number } = {
  sessionId: "session-1",
  jobId: "job-1",
  jobTitle: "AI Engineer",
  startedAt: "2026-11-02T10:00:00Z",
  mode: "voice",
  status: "CLOSED",
  overallScore: 6.5,
  answeredTurns: 4,
  totalTurns: 5,
};

describe("buildAIReview", () => {
  it("extracts concise strengths, improvements, and next topics from a saved evaluation", () => {
    const review = buildAIReview(session, {
      candidate_feedback: "  Trình bày rõ hơn bằng một kết quả đo được. ",
      turn_evaluations: [
        { score: 7, strengths: ["Nêu rõ bối cảnh"], weaknesses: ["Thiếu số liệu kết quả"] },
        { score: 6, strengths: ["Nêu rõ bối cảnh"], weaknesses: ["Chưa giải thích quyết định"] },
      ],
      next_round_topics: ["Đánh giá chất lượng mô hình", "Thiết kế RAG"],
    });

    expect(review?.strengths).toEqual(["Nêu rõ bối cảnh"]);
    expect(review?.weaknesses).toEqual(["Thiếu số liệu kết quả", "Chưa giải thích quyết định"]);
    expect(review?.nextTopics).toEqual(["Đánh giá chất lượng mô hình", "Thiết kế RAG"]);
    expect(review?.session.sessionId).toBe("session-1");
  });

  it("does not create generic content when the evaluation has no written comments", () => {
    expect(buildAIReview(session, { overallScore: 6.5, competencyScores: [] })).toBeNull();
  });

  it("ignores the long general AI summary when the concise review sections are empty", () => {
    expect(buildAIReview(session, {
      overallScore: 6.5,
      competencyScores: [],
      candidate_feedback: "A long general AI summary that should not be shown on the dashboard.",
    })).toBeNull();
  });
});
