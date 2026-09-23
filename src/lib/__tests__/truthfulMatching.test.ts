import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { normalizeMatchResult, type CvScoringResponse } from "../aiService";
import {
  CompactMatchSummary,
  MatchBreakdown,
  ReportContent,
  resolveFitBandGaugeColor,
  resolveReasonCodeText,
  resolveWarningText,
} from "../../app/(workspace)/interview/cv-score/page";

describe("Truthful Matching UI Remediation — Phase 1 & 1.1 Hardening", () => {
  it("preserves conceptResults and groupOperator while normalizing backend payloads", () => {
    const normalized = normalizeMatchResult(
      {
        schemaVersion: "2.1",
        suitabilityScore: null,
        eligibility: "review_required",
        requirementResults: [{
          requirementId: "req-group",
          status: "unknown",
          confidence: 0.4,
          evidenceRefs: ["cv-1"],
          reasonCode: "concept_group_evidence_missing",
          groupOperator: "all_of",
          conceptResults: [{
            conceptId: "skill-python",
            label: "Python",
            status: "met",
            confidence: 0.8,
            evidenceRefs: ["cv-1"],
            evidenceStrength: "applied",
            reasonCode: "concept_evidence_sufficient",
          }],
        }],
      },
      "candidate-1",
      "job-1"
    );

    expect(normalized.requirementResults?.[0].groupOperator).toBe("all_of");
    expect(normalized.requirementResults?.[0].conceptResults?.[0].evidenceRefs).toEqual(["cv-1"]);
    expect(normalized.requirementResults?.[0].conceptResults?.[0].evidenceStrength).toBe("applied");
  });

  describe("Point 1: Unmapped requirement priority & Must-have stats exclusion", () => {
    it("assigns priority 'unknown' to unmapped requirements and excludes them from mustHaveStats", () => {
      const rawBackend = {
        schemaVersion: "2.1",
        suitabilityScore: 0.8,
        eligibility: "eligible",
        requirementResults: [
          {
            requirementId: "req-unmapped-extra",
            status: "not_met",
            score: 0.0,
            confidence: 0.9,
            evidenceRefs: [],
            reasonCode: "skill_not_evidenced",
          },
          {
            requirementId: "req-known-must-have",
            status: "met",
            score: 1.0,
            confidence: 1.0,
            evidenceRefs: [],
            reasonCode: "skill_evidenced",
          },
        ],
      };

      const normalized = normalizeMatchResult(rawBackend, "c1", "j1");
      const requirementsMap = new Map([
        ["req-known-must-have", { label: "Java Spring Boot", kind: "Kỹ năng", priority: "must_have" }],
      ]);

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: normalized,
          jobProfile: null,
          requirementsMap,
        })
      );

      // Must have stats should show 1 / 1, NOT 2 / 2 (unmapped requirement is not counted as must-have)
      expect(html).toContain("1 / 1");
      expect(html).not.toContain("2 / 2");
    });

    it("case: mapped requirement but missing priority renders label, omits both priority badges, and excludes from Must-have Gate", () => {
      const rawBackend = {
        schemaVersion: "2.1",
        suitabilityScore: 0.85,
        eligibility: "eligible",
        requirementResults: [
          {
            requirementId: "req-known-no-priority",
            status: "met",
            score: 1.0,
            confidence: 0.9,
            evidenceRefs: [],
            reasonCode: "skill_evidenced",
          },
        ],
      };

      const normalized = normalizeMatchResult(rawBackend, "c1", "j1");
      const requirementsMap = new Map([
        ["req-known-no-priority", { label: "Kubernetes Cluster Admin", kind: "Hạ tầng" }], // Notice: no priority!
      ]);

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: normalized,
          jobProfile: null,
          requirementsMap,
        })
      );

      // 1. Requirement label renders normally
      expect(html).toContain("Kubernetes Cluster Admin");

      // 2. Does NOT render "Bắt buộc (Must-Have)"
      expect(html).not.toContain("Bắt buộc (Must-Have)");

      // 3. Does NOT render "Ưu tiên (Nice-To-Have)"
      expect(html).not.toContain("Ưu tiên (Nice-To-Have)");

      // 4. Must-have Gate section is NOT rendered when all requirements have missing priority (mustHaveStats.total === 0)
      expect(html).not.toContain("Trạng thái Bộ lọc Bắt buộc (Must-Have Gate)");
    });

    it("verifies exact priority semantics: must_have and required count in stats; preferred, nice_to_have, and unknown do not", () => {
      const rawBackend = {
        schemaVersion: "2.1",
        suitabilityScore: 0.75,
        eligibility: "eligible",
        requirementResults: [
          { requirementId: "req-1", status: "met", score: 1.0, confidence: 1.0, evidenceRefs: [], reasonCode: "skill_evidenced" },
          { requirementId: "req-2", status: "met", score: 1.0, confidence: 1.0, evidenceRefs: [], reasonCode: "skill_evidenced" },
          { requirementId: "req-3", status: "met", score: 1.0, confidence: 1.0, evidenceRefs: [], reasonCode: "skill_evidenced" },
          { requirementId: "req-4", status: "met", score: 1.0, confidence: 1.0, evidenceRefs: [], reasonCode: "skill_evidenced" },
          { requirementId: "req-5", status: "met", score: 1.0, confidence: 1.0, evidenceRefs: [], reasonCode: "skill_evidenced" },
        ],
      };

      const normalized = normalizeMatchResult(rawBackend, "c1", "j1");
      const requirementsMap = new Map([
        ["req-1", { label: "Must-Have Criterion", priority: "must_have" }],
        ["req-2", { label: "Required Criterion", priority: "required" }],
        ["req-3", { label: "Nice-To-Have Criterion", priority: "nice_to_have" }],
        ["req-4", { label: "Preferred Criterion", priority: "preferred" }],
        ["req-5", { label: "Unknown Priority Criterion", priority: "unknown" }],
      ]);

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: normalized,
          jobProfile: null,
          requirementsMap,
        })
      );

      // Only req-1 and req-2 should be in must-have stats: total = 2
      expect(html).toContain("2 / 2");
      expect(html).not.toContain("5 / 5");

      // Priority is communicated once by section headings, never repeated per row.
      expect(html).toContain("Yêu cầu bắt buộc");
      expect(html).toContain("Tiêu chí ưu tiên");
      expect(html).not.toContain("Bắt buộc (Must-Have)");
      expect(html).not.toContain("Ưu tiên (Nice-To-Have)");
    });
  });

  describe("Point 2: Factor effectiveWeight preservation (no effectiveWeight || policyWeight)", () => {
    it("preserves effectiveWeight = 0 and does not fall back to policyWeight", () => {
      const rawBackend = {
        schemaVersion: "2.1",
        factorResults: [
          {
            factor: "language",
            status: "not_applicable",
            rawScore: null,
            reliability: 0.0,
            policyWeight: 0.15,
            effectiveWeight: 0, // <--- 0 must be preserved, not overwritten by policyWeight 0.15
            evidenceRefs: [],
          },
        ],
      };

      const normalized = normalizeMatchResult(rawBackend, "c1", "j1");
      expect(normalized.factorResults?.[0].effectiveWeight).toBe(0);

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: normalized,
          jobProfile: null,
          requirementsMap: new Map(),
        })
      );

      expect(html).not.toContain("Trọng số thực tế");
      expect(html).not.toContain("Trọng số chính sách");
    });
  });

  describe("Point 3: Normalization of missing/invalid factor status and conservative defaults", () => {
    it("normalizes invalid factor status to 'unknown' and defaults weights/confidence to 0", () => {
      const rawBackend = {
        schemaVersion: "2.1",
        factorResults: [
          {
            factor: "skill",
            status: "invalid_status_from_api",
            // missing reliability, policyWeight, effectiveWeight
          },
        ],
        requirementResults: [
          {
            requirementId: "req-1",
            status: "unknown",
            // missing confidence
          },
        ],
      };

      const normalized = normalizeMatchResult(rawBackend, "c1", "j1");
      expect(normalized.factorResults?.[0].status).toBe("unknown");
      // Truthful UI contract: missing numeric fields are null, not synthetic 0
      expect(normalized.factorResults?.[0].reliability).toBeNull();
      expect(normalized.factorResults?.[0].policyWeight).toBeNull();
      expect(normalized.factorResults?.[0].effectiveWeight).toBeNull();
      expect(normalized.requirementResults?.[0].confidence).toBeNull();
    });
  });

  describe("Point 4: CvScoringCriterion.score is number | null, unknown/not_applicable are null (no synthetic 0.5)", () => {
    it("sets criterion score and match to null for unknown and not_applicable when not numeric", () => {
      const rawBackend = {
        schemaVersion: "2.1",
        requirementResults: [
          {
            requirementId: "req-unknown",
            status: "unknown",
            confidence: 0.5,
            evidenceRefs: [],
            reasonCode: "skill_not_evidenced",
          },
          {
            requirementId: "req-na",
            status: "not_applicable",
            confidence: 1.0,
            evidenceRefs: [],
            reasonCode: "not_applicable",
          },
        ],
      };

      const normalized = normalizeMatchResult(rawBackend, "c1", "j1");
      const unk = normalized.criteriaBreakdown.find((c) => c.name === "req-unknown");
      const na = normalized.criteriaBreakdown.find((c) => c.name === "req-na");

      expect(unk?.score).toBeNull();
      expect(unk?.match).toBeNull();
      expect(unk?.score).not.toBe(0.5);

      expect(na?.score).toBeNull();
      expect(na?.match).toBeNull();
      expect(na?.score).not.toBe(0.5);
    });
  });

  describe("Point 5: Empty states distinguish between 'no data' vs 'evaluated with no gap'", () => {
    it("does not render a duplicated gap insight card when there is no not_met criterion", () => {
      const rawBackend = {
        schemaVersion: "2.1",
        requirementResults: [
          {
            requirementId: "req-1",
            status: "met",
            score: 1.0,
            confidence: 1.0,
            evidenceRefs: [],
            reasonCode: "skill_evidenced",
          },
        ],
      };

      const normalized = normalizeMatchResult(rawBackend, "c1", "j1");
      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: normalized,
          jobProfile: null,
          requirementsMap: new Map(),
        })
      );

      expect(html).toContain("Tiêu chí tuyển dụng");
      expect(html).not.toContain("Khoảng trống cần lưu ý");
      expect(html).not.toContain("Chưa có dữ liệu tiêu chí để phân tích khoảng trống.");
    });

    it("renders the criteria empty state when requirementResults is empty", () => {
      const rawBackend = {
        schemaVersion: "2.1",
        requirementResults: [],
      };

      const normalized = normalizeMatchResult(rawBackend, "c1", "j1");
      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: normalized,
          jobProfile: null,
          requirementsMap: new Map(),
        })
      );

      expect(html).toContain("Chưa có kết quả đối chiếu cho vị trí này.");
      expect(html).not.toContain("Khoảng trống cần lưu ý");
    });
  });

  describe("Point 6: Gauge color derived from backend fitBand, not threshold 70/45", () => {
    it("derives color from fitBand regardless of raw score value", () => {
      // Even if score is 80%, if fitBand is review_required, gauge color is amber (#F59E0B)
      expect(resolveFitBandGaugeColor("review_required", true)).toBe("#F59E0B");
      expect(resolveFitBandGaugeColor("not_eligible", true)).toBe("#DC2626");
      expect(resolveFitBandGaugeColor("strong_fit", true)).toBe("#16A34A");
      expect(resolveFitBandGaugeColor("partial_fit", true)).toBe("#2563EB");
      expect(resolveFitBandGaugeColor("insufficient_evidence", true)).toBe("#94A3B8");
      expect(resolveFitBandGaugeColor("strong_fit", false)).toBe("#94A3B8");
    });
  });

  describe("Point 7: Rendered Component Tests", () => {
    it("does not fabricate zero counts when requirement results are unavailable", () => {
      const html = renderToStaticMarkup(
        React.createElement(MatchBreakdown, { requirementResults: undefined })
      );

      expect(html).toContain("Chưa có dữ liệu trạng thái tiêu chí");
      expect(html).not.toContain(">0<");
    });

    it("keeps a 41% score referential when all 14 criteria still need verification", () => {
      const html = renderToStaticMarkup(
        React.createElement(
          React.Fragment,
          null,
          React.createElement(CompactMatchSummary, {
            eligibility: "review_required",
            percentage: 41,
            requirementResults: Array.from({ length: 14 }, () => ({ status: "unknown" })),
          }),
          React.createElement(MatchBreakdown, {
            requirementResults: Array.from({ length: 14 }, () => ({ status: "unknown" })),
          })
        )
      );

      expect(html).toContain(">41<");
      expect(html).toContain("Điểm phù hợp tổng hợp");
      expect(html).toContain("Cần xác minh thêm");
      expect(html).toContain("Phần lớn tiêu chí hiện chưa có đủ bằng chứng để xác nhận.");
      expect(html).toContain(">14<");
      expect(html).toContain("Điểm tham khảo dựa trên thông tin hiện có.");
    });

    it("renders 'unknown' requirement truthfully as 'Chưa đủ bằng chứng', never 'Chưa đạt'", () => {
      const rawBackend: CvScoringResponse = {
        candidateId: "c1",
        jobId: "j1",
        score: { raw: 7.0, max: 10, normalized: 0.7, percentage: 70 },
        decision: "PASS",
        matchingDecision: "assessed",
        eligibility: "eligible",
        fitBand: "partial_fit",
        hardFilters: { passed: true, reasons: [] },
        criteriaBreakdown: [],
        requirementResults: [
          {
            requirementId: "req-k8s",
            status: "unknown",
            score: null,
            confidence: 0.4,
            evidenceRefs: [],
            reasonCode: "skill_not_evidenced",
          },
        ],
        summary: { strengths: [], weaknesses: [], suggestions: [] },
      };

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: rawBackend,
          jobProfile: null,
          requirementsMap: new Map(),
        })
      );

      expect(html).toContain("Chưa đủ bằng chứng");
      expect(html).not.toContain("Chưa đạt");
    });

    it("renders 'not_applicable' factor truthfully without 0%", () => {
      const rawBackend: CvScoringResponse = {
        candidateId: "c1",
        jobId: "j1",
        score: { raw: 8.0, max: 10, normalized: 0.8, percentage: 80 },
        decision: "PASS",
        matchingDecision: "assessed",
        eligibility: "eligible",
        fitBand: "strong_fit",
        hardFilters: { passed: true, reasons: [] },
        criteriaBreakdown: [],
        factorResults: [
          {
            factor: "language",
            status: "not_applicable",
            rawScore: null,
            reliability: 0.0,
            policyWeight: 0.0,
            effectiveWeight: 0.0,
            evidenceRefs: [],
          },
        ],
        summary: { strengths: [], weaknesses: [], suggestions: [] },
      };

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: rawBackend,
          jobProfile: null,
          requirementsMap: new Map(),
        })
      );

      expect(html).toContain("Không áp dụng");
      // Must not render "0%" as factor score
      expect(html).not.toContain('<span class="font-extrabold text-[#14244B]">0%</span>');
    });

    it("renders empty state when factorResults is empty, without synthetic factor bars", () => {
      const rawBackend: CvScoringResponse = {
        candidateId: "c1",
        jobId: "j1",
        score: { raw: 8.0, max: 10, normalized: 0.8, percentage: 80 },
        decision: "PASS",
        matchingDecision: "assessed",
        eligibility: "eligible",
        fitBand: "strong_fit",
        hardFilters: { passed: true, reasons: [] },
        criteriaBreakdown: [],
        factorResults: [],
        summary: { strengths: [], weaknesses: [], suggestions: [] },
      };

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: rawBackend,
          jobProfile: null,
          requirementsMap: new Map(),
        })
      );

      expect(html).not.toContain("Phân tích theo các trụ cột năng lực");
      expect(html).not.toContain("Kỹ năng bổ trợ (Nice-to-have)");
    });

    it("renders 'review_required' eligibility as 'Cần xác minh thêm', not 'Chưa đáp ứng điều kiện bắt buộc'", () => {
      const rawBackend: CvScoringResponse = {
        candidateId: "c1",
        jobId: "j1",
        score: { raw: 6.0, max: 10, normalized: 0.6, percentage: 60 },
        decision: "FAIL",
        matchingDecision: "assessed",
        eligibility: "review_required",
        fitBand: "review_required",
        hardFilters: { passed: false, reasons: [] },
        criteriaBreakdown: [],
        summary: { strengths: [], weaknesses: [], suggestions: [] },
      };

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: rawBackend,
          jobProfile: null,
          requirementsMap: new Map(),
        })
      );

      expect(html).toContain("Cần xác minh thêm");
      expect(html).not.toContain("Chưa đáp ứng điều kiện bắt buộc");
    });

    it("renders no synthetic percentage when the backend score is null", () => {
      const rawBackend: CvScoringResponse = {
        candidateId: "c1",
        jobId: "j1",
        score: { raw: null, max: 10, normalized: null, percentage: null },
        decision: "FAIL",
        matchingDecision: "abstained",
        suitabilityScore: null,
        eligibility: "review_required",
        fitBand: "insufficient_evidence",
        hardFilters: { passed: false, reasons: [] },
        criteriaBreakdown: [],
        summary: { strengths: [], weaknesses: [], suggestions: [] },
      };

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: rawBackend,
          jobProfile: null,
          requirementsMap: new Map(),
        })
      );

      expect(html).toContain("Cần xác minh thêm");
      expect(html).not.toContain("0% điểm tổng hợp tham khảo");
    });

    it("renders an abstained score as reference information beside the review state", () => {
      const rawBackend: CvScoringResponse = {
        candidateId: "c1",
        jobId: "j1",
        score: { raw: 7.2, max: 10, normalized: 0.72, percentage: 72 },
        decision: "PASS",
        matchingDecision: "abstained",
        suitabilityScore: 0.72,
        eligibility: "review_required",
        fitBand: "review_required",
        hardFilters: { passed: true, reasons: [] },
        criteriaBreakdown: [],
        summary: { strengths: [], weaknesses: [], suggestions: [] },
      };

      const html = renderToStaticMarkup(
        React.createElement(ReportContent, {
          result: rawBackend,
          jobProfile: null,
          requirementsMap: new Map(),
        })
      );

      expect(html).toContain("Điểm phù hợp tổng hợp");
      expect(html).toContain("Điểm tham khảo dựa trên thông tin hiện có.");
      expect(html).toContain("Cần xác minh thêm");
      expect(html).toContain("Chưa đủ bằng chứng để đưa ra kết luận chắc chắn.");
      expect(html).toContain("72");
    });
  });

  describe("Reason code & warning mappings", () => {
    it("maps backend reason codes to friendly Vietnamese explanations without raw snake_case", () => {
      expect(resolveReasonCodeText("skill_not_evidenced")).toContain("Chưa tìm thấy bằng chứng");
      expect(resolveReasonCodeText("skill_level_below_minimum")).toContain("Cấp độ kỹ năng");
      expect(resolveReasonCodeText("education_requirement_needs_specialized_evaluator")).toContain("học vấn");
      expect(resolveReasonCodeText("certificate_requirement_needs_specialized_evaluator")).toContain("chuyên viên nhân sự xác minh");
    });

    it("maps backend warnings correctly", () => {
      expect(resolveWarningText("semantic_dense_provider_fallback_to_sparse")).toContain("đối sánh từ khóa");
    });
  });
});
