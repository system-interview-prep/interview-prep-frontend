import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  default: {
    get,
    post,
  },
}));

import { interviewReportApi, type EvaluationReport } from "../interviewReport.service";

describe("interviewReportApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getEvaluation endpoint correctly", async () => {
    const mockReport: EvaluationReport = {
      sessionId: "session-123",
      overallScore: 8.5,
      decisionRecommendation: "STRONG_PASS",
      competencyScores: [
        { competency: "Problem Solving", score: 8.5 },
      ],
      turnEvaluations: [],
      recruiterSummary: "Good candidate",
      candidateFeedback: "Keep it up",
      nextRoundTopics: ["System Design"],
      redFlags: [],
      evaluatedAt: "2026-09-26T10:00:00Z",
    };
    get.mockResolvedValueOnce({ data: mockReport });

    const res = await interviewReportApi.getEvaluation("session-123");
    expect(get).toHaveBeenCalledWith("/api/v1/interviews/sessions/session-123/evaluation");
    expect(res.overallScore).toBe(8.5);
    expect(res.decisionRecommendation).toBe("STRONG_PASS");
  });

  it("calls evaluateSession endpoint correctly", async () => {
    const mockReport: EvaluationReport = {
      sessionId: "session-123",
      overallScore: 7.2,
      decisionRecommendation: "PASS",
      competencyScores: [],
      turnEvaluations: [],
      recruiterSummary: "Pass candidate",
      candidateFeedback: "Improve communication",
      nextRoundTopics: [],
      redFlags: [],
      evaluatedAt: "2026-09-26T10:05:00Z",
    };
    post.mockResolvedValueOnce({ data: mockReport });

    const res = await interviewReportApi.evaluateSession("session-123");
    expect(post).toHaveBeenCalledWith("/api/v1/interviews/sessions/session-123/evaluate");
    expect(res.overallScore).toBe(7.2);
    expect(res.decisionRecommendation).toBe("PASS");
  });
});
