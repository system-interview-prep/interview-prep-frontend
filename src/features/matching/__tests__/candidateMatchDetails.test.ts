import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  formatStatusLabel,
  formatExperienceDuration,
  formatExperienceCondition,
  formatLanguageCondition,
  resolveGroupStatus,
} from "../utils/match-formatters";
import { CandidateMatchDetails } from "../components/CandidateMatchDetails";
import { MatchStatusBadge } from "../components/MatchStatusBadge";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { EvidenceInspector } from "../components/EvidenceInspector";
import type { HumanizedRequirement, RequirementGroup } from "../types/match-details.types";

describe("Candidate Job Match Details UI — Professional ATS", () => {
  /* ── 1. Status Labels Mapping ── */
  describe("1. Status Labels Mapping", () => {
    it("maps backend statuses to Vietnamese HR/ATS terminology without using 'FAIL'", () => {
      expect(formatStatusLabel("met")).toBe("Phù hợp");
      expect(formatStatusLabel("not_applicable")).toBe("Không áp dụng");
      expect(formatStatusLabel("unknown")).toBe("Chưa đủ bằng chứng");
      expect(formatStatusLabel("not_met")).toBe("Chưa đáp ứng");

      // Verify "FAIL" is never used
      expect(formatStatusLabel("not_met")).not.toContain("FAIL");
      expect(formatStatusLabel("not_met")).not.toContain("fail");
    });

    it("renders MatchStatusBadge with restrained colors and clear icons", () => {
      const htmlMet = renderToStaticMarkup(React.createElement(MatchStatusBadge, { status: "met" }));
      expect(htmlMet).toContain("Phù hợp");
      expect(htmlMet).not.toContain("AI");

      const htmlUnknown = renderToStaticMarkup(React.createElement(MatchStatusBadge, { status: "unknown" }));
      expect(htmlUnknown).toContain("Chưa đủ bằng chứng");

      const htmlNotMet = renderToStaticMarkup(React.createElement(MatchStatusBadge, { status: "not_met" }));
      expect(htmlNotMet).toContain("Chưa đáp ứng");
    });
  });

  /* ── 2. Human-readable Condition Formatters ── */
  describe("2. Human-readable Condition Formatters", () => {
    it("formats experience conditions into human-readable text without raw enums", () => {
      expect(formatExperienceCondition(24, "gte")).toBe("Tối thiểu 2 năm kinh nghiệm");
      expect(formatExperienceCondition(36, "eq")).toBe("Đúng 3 năm kinh nghiệm");
      expect(formatExperienceCondition(60, "lte")).toBe("Tối đa 5 năm kinh nghiệm");
      expect(formatExperienceCondition(6, "gt")).toBe("Trên 6 tháng kinh nghiệm");

      // Verify raw enums are NOT present
      const formatted = formatExperienceCondition(24, "gte");
      expect(formatted).not.toContain("operator");
      expect(formatted).not.toContain("gte");
      expect(formatted).not.toContain("minimum_experience_months");
    });

    it("formats experience duration accurately in years and months", () => {
      expect(formatExperienceDuration(32)).toBe("2 năm 8 tháng");
      expect(formatExperienceDuration(24)).toBe("2 năm");
      expect(formatExperienceDuration(6)).toBe("6 tháng");
      expect(formatExperienceDuration(0)).toBe("");
    });

    it("formats language/credential requirements into human-readable Vietnamese", () => {
      const formatted = formatLanguageCondition("IELTS", 6.5, "gte", true);
      expect(formatted).toBe("IELTS ≥ 6.5 hoặc chứng chỉ tương đương");
      expect(formatted).not.toContain("threshold");
      expect(formatted).not.toContain("equivalent_allowed");

      const formattedNoEquiv = formatLanguageCondition("TOEIC", 750, "gte", false);
      expect(formattedNoEquiv).toBe("TOEIC ≥ 750");
    });
  });

  /* ── 3. Group Semantics (ANY_OF & ALL_OF) ── */
  describe("3. Group Semantics (ANY_OF & ALL_OF)", () => {
    /**
     * Truthful UI Contract:
     * Backend does NOT expose GroupRequirementResult.
     * resolveGroupStatus() MUST return { status: null, statusLabel: null }
     * so the frontend never synthesizes a parent group conclusion.
     * The group status badge is hidden in RequirementGroupCard when status is null.
     */
    it("returns null status and statusLabel for any_of — frontend must not synthesize", () => {
      const result = resolveGroupStatus("any_of", ["met", "not_met"]);
      expect(result.status).toBeNull();
      expect(result.statusLabel).toBeNull();
    });

    it("returns null status and statusLabel for all_of — frontend must not synthesize", () => {
      const result = resolveGroupStatus("all_of", ["met", "met"]);
      expect(result.status).toBeNull();
      expect(result.statusLabel).toBeNull();
    });

    it("returns null status regardless of child statuses — backend is source of truth", () => {
      expect(resolveGroupStatus("any_of", ["unknown", "not_met"]).status).toBeNull();
      expect(resolveGroupStatus("all_of", ["met", "not_met", "met"]).status).toBeNull();
      expect(resolveGroupStatus("any_of", ["not_met", "not_met"]).status).toBeNull();
    });
  });

  /* ── 4. Evidence Drawer Rendering ── */
  describe("4. Evidence Drawer Rendering", () => {
    it("renders JD evidence text and CV evidence with real metadata tags", () => {
      const html = renderToStaticMarkup(
        React.createElement(EvidenceDrawer, {
          jdEvidenceText: "Tối thiểu 2 năm kinh nghiệm Java và Spring Boot",
          cvEvidence: [
            {
              snippet: "Developed microservices with Spring Boot for 2 years",
              section: "Work Experience",
            },
          ],
          reasonText: "Khớp từ khóa và dự án thực tế",
          status: "met",
        })
      );

      // Headers
      expect(html).toContain("Yêu cầu công việc");
      expect(html).toContain("Tối thiểu 2 năm kinh nghiệm Java và Spring Boot");
      expect(html).toContain("Bằng chứng trong CV");
      expect(html).toContain("Developed microservices with Spring Boot for 2 years");
    });

    it("renders truthful empty evidence message when no CV evidence is found", () => {
      const html = renderToStaticMarkup(
        React.createElement(EvidenceDrawer, {
          jdEvidenceText: "Chứng chỉ AWS Solutions Architect",
          cvEvidence: [],
          status: "not_met",
        })
      );

      expect(html).toContain("Chưa tìm thấy bằng chứng phù hợp trong CV.");
      // Strict constraint: NEVER say "AI could not find..."
      expect(html).not.toContain("AI");
      expect(html).not.toContain("AI could not find");
    });

    it("renders unknown state with respectful, non-failing explanation", () => {
      const html = renderToStaticMarkup(
        React.createElement(EvidenceDrawer, {
          jdEvidenceText: "Kinh nghiệm với Kafka Streams",
          cvEvidence: [],
          status: "unknown",
        })
      );

      expect(html).toContain("Trong CV hiện chưa tìm thấy thông tin đủ rõ để xác nhận tiêu chí này.");
      expect(html).not.toContain("FAIL");
    });
  });

  /* ── 5. Full Component Rendering & ATS Hierarchy ── */
  describe("5. CandidateMatchDetails Component Rendering", () => {
    const mockRequirements: HumanizedRequirement[] = [
      {
        id: "req-java",
        label: "Java & Spring Boot",
        category: "skill",
        priority: "must_have",
        conditionText: "Thành thạo kiến trúc microservices",
        status: "met",
        statusLabel: "Phù hợp",
        jdEvidenceText: "Yêu cầu Java 17+, Spring Boot 3+",
        cvEvidence: [{ snippet: "2 years building REST API in Spring Boot" }],
      },
      {
        id: "req-exp",
        label: "Kinh nghiệm Backend",
        category: "experience",
        priority: "must_have",
        conditionText: "Tối thiểu 2 năm",
        status: "met",
        statusLabel: "Phù hợp",
        cvEvidence: [{ snippet: "Khoảng 2 năm 8 tháng kinh nghiệm liên quan" }],
      },
      {
        id: "req-docker",
        label: "Docker & Kubernetes",
        category: "skill",
        priority: "preferred",
        status: "unknown",
        statusLabel: "Chưa đủ bằng chứng",
      },
      {
        id: "req-ielts",
        label: "IELTS",
        category: "language",
        priority: "preferred",
        conditionText: "IELTS ≥ 6.5 hoặc chứng chỉ tương đương",
        status: "not_met",
        statusLabel: "Chưa đáp ứng",
      },
    ];

    it("renders the criteria review without duplicating the job header", () => {
      const html = renderToStaticMarkup(
        React.createElement(CandidateMatchDetails, {
          requirements: mockRequirements,
        })
      );

      expect(html).toContain("Tiêu chí tuyển dụng");
      expect(html).toContain("Yêu cầu bắt buộc");
      expect(html).toContain("Tiêu chí ưu tiên");
      expect(html).toContain("2 / 2 phù hợp");
      expect(html).toContain("Tất cả");
      expect(html).toContain("Cần xác minh");
      expect(html).toContain("Chưa đủ bằng chứng");
      expect(html).toContain("Chưa đáp ứng");
      expect(html).toContain("Tiêu chí đang xem");
      expect(html).toContain("Yêu cầu trong JD");
      expect(html).not.toContain("Senior Backend Engineer");
      expect(html).not.toContain("Mức độ phù hợp với vị trí");
      expect(html).not.toContain("Bắt buộc (Must-Have)");
    });

    it("renders empty state cleanly when requirements array is empty", () => {
      const html = renderToStaticMarkup(
        React.createElement(CandidateMatchDetails, {
          requirements: [],
        })
      );

      expect(html).toContain("Chưa có kết quả đối chiếu cho vị trí này.");
      expect(html).not.toContain("AI could not find");
    });

    it("renders ANY_OF group with proper subtext and child items", () => {
      const group: RequirementGroup = {
        groupId: "grp-lang",
        title: "Java hoặc Kotlin",
        operator: "any_of",
        priority: "must_have",
        status: "met",
        statusLabel: "Phù hợp",
        subtext: "Chỉ cần đáp ứng một trong các tiêu chí",
        items: [
          {
            id: "req-java-child",
            label: "Java Core",
            category: "skill",
            priority: "must_have",
            status: "met",
            statusLabel: "Phù hợp",
          },
          {
            id: "req-kotlin-child",
            label: "Kotlin",
            category: "skill",
            priority: "must_have",
            status: "unknown",
            statusLabel: "Chưa đủ bằng chứng",
          },
        ],
      };

      const html = renderToStaticMarkup(
        React.createElement(CandidateMatchDetails, {
          requirements: [...group.items],
          groups: [group],
        })
      );

      expect(html).toContain("Java hoặc Kotlin");
      expect(html).toContain("Chỉ cần đáp ứng một trong các tiêu chí");
      expect(html).toContain("Java Core");
      expect(html).toContain("Kotlin");
    });
  });

  describe("6. Concept-level evidence inspector", () => {
    const conceptRequirement: HumanizedRequirement = {
      id: "req-ai-knowledge",
      label: "Kiến thức cơ bản về NLP, GenAI và LLM",
      priority: "must_have",
      status: "unknown",
      statusLabel: "Chưa đủ bằng chứng",
      groupOperator: "all_of",
      conceptResults: [
        {
          conceptId: "skill-nlp",
          label: "NLP",
          status: "met",
          confidence: 0.9,
          evidence: [{ evidenceId: "cv-1", text: "Built an NLP pipeline", pageNumber: 2, section: "projects" }],
        },
        {
          conceptId: "skill-llm",
          label: "LLM",
          status: "unknown",
          confidence: 0,
          evidence: [],
        },
      ],
    };

    it("renders evidence under each atomic concept with humanized statuses", () => {
      const html = renderToStaticMarkup(
        React.createElement(EvidenceInspector, { requirement: conceptRequirement })
      );

      expect(html).toContain("Cần đáp ứng tất cả nội dung");
      expect(html).toContain("Có bằng chứng");
      expect(html).toContain("Chưa đủ bằng chứng");
      expect(html).toContain("Built an NLP pipeline");
      expect(html).toContain("Trang 2");
      expect(html).not.toContain("ALL_OF");
      expect(html).not.toContain("demonstrated");
    });

    it("hides the conclusion block when no real explanation exists", () => {
      const html = renderToStaticMarkup(
        React.createElement(EvidenceInspector, { requirement: conceptRequirement })
      );

      expect(html).not.toContain("Kết luận");
      expect(html).not.toContain("Chưa có diễn giải bổ sung");
    });
  });
});
