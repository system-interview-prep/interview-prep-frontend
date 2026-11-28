import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { MatchResult } from "@/lib/aiService";
import { ClarificationPanel } from "../components/ClarificationPanel";
import {
  analyzeMatchClarifications,
  normalizeClarificationAnalysis,
  normalizeClarificationRequest,
  normalizeClarificationRescoreResult,
  rescoreMatchClarifications,
  type ClarificationRequest,
} from "../services/clarification.service";
import type { HumanizedRequirement } from "../types/match-details.types";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@lib/apiClient", () => ({ default: { post } }));

const question: ClarificationRequest = {
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
  label: "Kinh nghiệm sử dụng Java",
  category: "skill",
  priority: "must_have",
  status: "unknown",
  statusLabel: "Cần xác nhận",
};

const matchResult = {
  schemaVersion: "2.1",
  pipelineVersion: "matching-v2",
  resumeId: "cv-1",
  jobId: "job-1",
  policyVersion: "balanced-v1",
  eligibility: "review_required",
  compatibilityStatus: "not_applicable",
  suitabilityScore: null,
  fitBand: "review_required",
  decision: "abstained",
  requirementResults: [{
    requirementId: "req-java",
    status: "unknown",
    evidenceRefs: [],
    reasonCode: "skill_duration_not_evidenced",
  }],
  compatibilityResults: [],
  factorResults: [],
  warnings: [],
} as MatchResult;

describe("matching clarification frontend contract", () => {
  beforeEach(() => post.mockReset());

  it("normalizes the backend-authored question and provenance fields", () => {
    expect(normalizeClarificationRequest({
      requirement_id: "req-java",
      missing_dimension: "duration",
      confidence: 0.9,
      evidence_refs: ["cv-evidence-1"],
      question_text: question.questionText,
      semantic_alignment_score: 0.88,
      reason_code: "candidate_clarification_needed",
    })).toEqual(question);
  });

  it("fails closed when the AI-authored question or semantic score is missing", () => {
    expect(normalizeClarificationRequest({
      requirementId: "req-java",
      missingDimension: "duration",
      confidence: 0.9,
      questionText: "",
      semanticAlignmentScore: 0.9,
      reasonCode: "candidate_clarification_needed",
    })).toBeNull();
    expect(normalizeClarificationRequest({
      ...question,
      semanticAlignmentScore: 2,
    })).toBeNull();
  });

  it("normalizes the analysis result and only retains valid clarification questions", () => {
    const analysis = normalizeClarificationAnalysis({
      match_result: matchResult,
      clarification_requests: [question, { requirementId: "bad", questionText: "missing gates" }],
    });

    expect(analysis.matchResult.requirementResults[0].status).toBe("unknown");
    expect(analysis.clarificationRequests).toEqual([question]);
  });

  it("requests canonical CV/JD resolution by IDs for clarification analysis", async () => {
    post.mockResolvedValue({ data: { matchResult, clarificationRequests: [question] } });
    const payload = { candidateId: "cv-1", jobId: "job-1" };

    const analysis = await analyzeMatchClarifications(payload);

    expect(post).toHaveBeenCalledWith("/api/v1/matching/clarifications-by-ids", payload);
    expect(analysis.clarificationRequests).toEqual([question]);
  });

  it("submits answers to the rescore endpoint and normalizes the final statuses", async () => {
    const finalResult = {
      ...matchResult,
      requirementResults: [{ requirementId: "req-java", status: "met" }],
    };
    const response = {
      initialMatchResult: matchResult,
      finalMatchResult: finalResult,
      processedAnswers: [{
        requirementId: "req-java",
        evidenceRef: "answer-ref",
        evidenceSource: "candidate_self_report",
        status: "met",
      }],
    };
    post.mockResolvedValue({ data: response });
    const payload = {
      candidateId: "cv-1",
      jobId: "job-1",
      initialAnalysis: { matchResult, clarificationRequests: [question] },
      answers: [{ requirementId: "req-java", answerText: "36 months using Java." }],
    };

    const result = normalizeClarificationRescoreResult(
      (await rescoreMatchClarifications(payload))
    );

    expect(post).toHaveBeenCalledWith("/api/v1/matching/clarifications/rescore-by-ids", payload);
    expect(result.finalMatchResult.requirementResults[0].status).toBe("met");
    expect(result.processedAnswers[0].evidenceSource).toBe("candidate_self_report");
  });

  it("renders the exact AI-authored question with an answer field", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClarificationPanel, {
        requests: [question],
        requirements: [requirement],
      })
    );

    expect(html).toContain(question.questionText);
    expect(html).toContain("clarification-answer-req-java");
    expect(html).toContain("Gửi câu trả lời và chấm lại");
    expect(html).not.toContain("confidence");
  });

  it("shows the unresolved outcome without claiming that matching is resolved", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClarificationPanel, {
        requests: [question],
        requirements: [requirement],
        processedAnswers: [{
          requirementId: "req-java",
          evidenceRef: "answer-ref",
          evidenceSource: "candidate_self_report",
          status: "unknown",
        }],
      })
    );

    expect(html).toContain("Cần thêm bằng chứng để kết luận");
    expect(html).toContain("tự khai");
  });
});
