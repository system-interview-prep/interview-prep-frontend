import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ClarificationPanel, clarificationPromptText } from "../components/ClarificationPanel";
import {
  normalizeClarificationAnalysis,
  normalizeClarificationRequest,
  type ClarificationRequest,
} from "../services/clarification.service";
import type { HumanizedRequirement } from "../types/match-details.types";

const requirement: HumanizedRequirement = {
  id: "req-backend-scale",
  label: "Kinh nghiệm thiết kế backend có khả năng mở rộng",
  category: "experience",
  priority: "must_have",
  status: "unknown",
  statusLabel: "Chưa đủ bằng chứng",
};

const clarification: ClarificationRequest = {
  requirementId: "req-backend-scale",
  missingDimension: "scale",
  confidence: 0.91,
  evidenceRefs: ["cv-ev-1"],
  reasonCode: "jev_candidate_clarification_needed",
  promptKey: "matching.clarification.scale",
};

describe("Jev clarification frontend contract", () => {
  it("normalizes snake_case clarification payloads", () => {
    const result = normalizeClarificationRequest({
      requirement_id: "req-1",
      missing_dimension: "duration",
      confidence: 0.82,
      evidence_refs: ["ev-1"],
      reason_code: "jev_candidate_clarification_needed",
      prompt_key: "matching.clarification.duration",
    });

    expect(result).toEqual({
      requirementId: "req-1",
      missingDimension: "duration",
      confidence: 0.82,
      evidenceRefs: ["ev-1"],
      reasonCode: "jev_candidate_clarification_needed",
      promptKey: "matching.clarification.duration",
    });
  });

  it("falls back to a safe dimension without inventing status or score", () => {
    const result = normalizeClarificationRequest({
      requirementId: "req-1",
      missingDimension: "unsupported_dimension",
      confidence: 0.8,
    });

    expect(result?.missingDimension).toBe("other");
    expect(result).not.toHaveProperty("status");
    expect(result).not.toHaveProperty("score");
  });

  it("normalizes the additive analysis envelope", () => {
    const analysis = normalizeClarificationAnalysis({
      match_result: { schemaVersion: "2.1", requirementResults: [] },
      clarification_requests: [clarification],
    });

    expect(analysis.clarificationRequests).toHaveLength(1);
    expect(analysis.clarificationRequests[0].requirementId).toBe("req-backend-scale");
    expect((analysis.matchResult as { schemaVersion?: string }).schemaVersion).toBe("2.1");
  });

  it("renders guidance as missing-evidence help, not a new matching conclusion", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClarificationPanel, {
        requests: [clarification],
        requirements: [requirement],
      })
    );

    expect(html).toContain("Có thể bổ sung để xác minh tốt hơn");
    expect(html).toContain("quy mô hệ thống hoặc dự án");
    expect(html).toContain("91% confidence");
    expect(html).toContain("không thay đổi điểm hoặc kết luận matching hiện tại");
    expect(html).not.toContain("Phù hợp");
    expect(html).not.toContain("Chưa đáp ứng");
  });

  it("creates a factual clarification prompt tied to the requirement", () => {
    expect(clarificationPromptText(clarification, requirement)).toBe(
      "Vui lòng bổ sung quy mô hệ thống hoặc dự án để làm rõ “Kinh nghiệm thiết kế backend có khả năng mở rộng”."
    );
  });

  it("renders an honest fallback when clarification analysis is unavailable", () => {
    const html = renderToStaticMarkup(
      React.createElement(ClarificationPanel, {
        requests: [],
        requirements: [requirement],
        error: "clarification_unavailable",
      })
    );

    expect(html).toContain("Kết quả matching hiện tại vẫn được giữ nguyên");
  });
});
