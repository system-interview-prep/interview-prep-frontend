import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ClarificationPanel } from "../components/ClarificationPanel";
import {
  fetchStoredClarificationSession,
  normalizeClarificationRescoreResult,
  normalizeStoredSession,
  type ClarificationRequest,
} from "../services/clarification.service";
import type { HumanizedRequirement } from "../types/match-details.types";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@lib/apiClient", () => ({ default: { post } }));

const storedQuestion = {
  requirementId: "req-java",
  missingDimension: "duration",
  confidence: 0.9,
  evidenceRefs: ["cv-evidence-1"],
  questionText: "Bạn đã sử dụng Java trong bao lâu ở công việc thực tế?",
  semanticAlignmentScore: 0.88,
  reasonCode: "candidate_clarification_needed",
};

const requirement: HumanizedRequirement = {
  id: "req-java",
  label: "Java",
  status: "unknown",
  priority: "must_have",
} as HumanizedRequirement;

beforeEach(() => {
  post.mockReset();
});

describe("a reloaded page gets its clarification session back", () => {
  it("reads back the question as asked, the answer typed, and the outcome", () => {
    const session = normalizeStoredSession({
      questions: [storedQuestion],
      answers: { "req-java": "Tôi có 3 năm kinh nghiệm Java." },
      processedAnswers: [
        {
          requirementId: "req-java",
          evidenceRef: "clarification-abc-123",
          status: "met",
          reasonCode: "candidate_self_report_meets_requirement",
          explanation: "Ứng viên tự khai 36 tháng kinh nghiệm.",
        },
      ],
    });

    expect(session.questions).toHaveLength(1);
    expect(session.questions[0].questionText).toBe(storedQuestion.questionText);
    expect(session.answers).toEqual({ "req-java": "Tôi có 3 năm kinh nghiệm Java." });
    expect(session.processedAnswers[0].status).toBe("met");
    expect(session.processedAnswers[0].reasonCode).toBe(
      "candidate_self_report_meets_requirement"
    );
  });

  it("survives an empty or malformed body rather than throwing", () => {
    expect(normalizeStoredSession(null)).toEqual({
      questions: [],
      answers: {},
      processedAnswers: [],
    });
    expect(
      normalizeStoredSession({ questions: "nope", answers: 7, processedAnswers: null })
    ).toEqual({ questions: [], answers: {}, processedAnswers: [] });
  });

  it("drops blank answers instead of restoring an empty textarea as answered", () => {
    const session = normalizeStoredSession({
      questions: [storedQuestion],
      answers: { "req-java": "   ", "req-other": "Có." },
    });

    expect(session.answers).toEqual({ "req-other": "Có." });
  });

  it("calls the session endpoint, not the generating ones", async () => {
    post.mockResolvedValue({ data: { questions: [storedQuestion], answers: {} } });

    await fetchStoredClarificationSession({ candidateId: "cv-1", jobId: "job-1" });

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/api/v1/matching/clarifications/session-by-ids", {
      candidateId: "cv-1",
      jobId: "job-1",
    });
  });

  it("asks for one matching run, so a new assessment is not shown the old one", async () => {
    post.mockResolvedValue({ data: { questions: [], answers: {} } });

    await fetchStoredClarificationSession({
      candidateId: "cv-1",
      jobId: "job-1",
      fitAttemptId: "attempt-2",
    });

    expect(post).toHaveBeenCalledWith("/api/v1/matching/clarifications/session-by-ids", {
      candidateId: "cv-1",
      jobId: "job-1",
      fitAttemptId: "attempt-2",
    });
  });
});

describe("an outcome explains itself when it could not be scored", () => {
  const renderPanel = (outcome: Record<string, unknown>) =>
    renderToStaticMarkup(
      React.createElement(ClarificationPanel, {
        requests: [storedQuestion as ClarificationRequest],
        requirements: [requirement],
        answers: { "req-java": "Tôi dùng Java hàng ngày." },
        processedAnswers: normalizeClarificationRescoreResult({
          processedAnswers: [outcome],
        }).processedAnswers,
      })
    );

  it("shows why an unknown outcome stayed unknown", () => {
    const markup = renderPanel({
      requirementId: "req-java",
      evidenceRef: "clarification-abc-123",
      status: "unknown",
      reasonCode: "candidate_self_report_missing_duration",
      explanation: "Câu trả lời chưa nêu thời lượng cụ thể nên chưa đủ để đối chiếu.",
    });

    expect(markup).toContain("Câu trả lời chưa nêu thời lượng cụ thể");
  });

  it("does not print an explanation next to a decided outcome", () => {
    const markup = renderPanel({
      requirementId: "req-java",
      evidenceRef: "clarification-abc-123",
      status: "met",
      reasonCode: "candidate_self_report_meets_requirement",
      explanation: "Ứng viên tự khai 36 tháng kinh nghiệm.",
    });

    expect(markup).not.toContain("Ứng viên tự khai 36 tháng kinh nghiệm.");
  });
});
