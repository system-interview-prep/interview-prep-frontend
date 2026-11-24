import { describe, expect, it, vi } from "vitest";

const { get, post, put, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
}));
vi.mock("@/lib/apiClient", () => ({ default: { get, post, put, patch } }));

import { questionBankApi } from "../questionBank.service";
import { rubricsApi } from "../rubrics.service";

describe("question bank admin API contract", () => {
  it("serializes list filters on the Core namespace", async () => {
    get.mockResolvedValueOnce({ data: { items: [] } });
    await questionBankApi.list({ q: "postgres", status: "DRAFT", page: 2, pageSize: 10 });
    expect(get).toHaveBeenCalledWith("/admin/question-bank/questions", {
      params: { q: "postgres", status: "DRAFT", page: 2, pageSize: 10 },
    });
  });

  it("uses the rubric endpoint rather than the retired /admin/rubrics path", async () => {
    get.mockResolvedValueOnce({ data: { items: [] } });
    await rubricsApi.list("system-design");
    expect(get).toHaveBeenCalledWith("/admin/question-bank/rubrics", { params: { q: "system-design" } });
  });

  it("creates a manual question through the Core draft endpoint", async () => {
    post.mockResolvedValueOnce({ data: {} });
    await questionBankApi.createDraft({ stableKey: "backend.api.001", version: "1.0.0", taxonomyVersion: "v1", questionType: "conceptual", difficultyBand: "intermediate", canonicalLocale: "vi-VN", canonicalText: "Q", objective: "O", thinkingSeconds: 0, softAnswerSeconds: 60, hardAnswerSeconds: 120, contextPolicy: {}, personalizationPolicy: {}, changeSummary: "", taxonomyMappings: [{ conceptId: "comp", purpose: "PRIMARY_COMPETENCY", relevance: 1 }] });
    expect(post).toHaveBeenCalledWith("/admin/question-bank/questions/drafts", expect.objectContaining({ stableKey: "backend.api.001" }));
  });

  it("drives the review lifecycle through the question-version endpoints", async () => {
    put.mockResolvedValue({ data: {} });
    post.mockResolvedValue({ data: {} });
    await questionBankApi.attachRubric("qv-1", { criteria: [] });
    await questionBankApi.submit("qv-1");
    await questionBankApi.review("qv-1", "APPROVE");
    await questionBankApi.approve("qv-1");
    expect(put).toHaveBeenCalledWith("/admin/question-bank/question-versions/qv-1/rubric", { criteria: [] });
    expect(post).toHaveBeenCalledWith("/admin/question-bank/question-versions/qv-1/submit");
    expect(post).toHaveBeenCalledWith("/admin/question-bank/question-versions/qv-1/reviews", { reviewType: "CONTENT", decision: "APPROVE", comment: undefined });
    expect(post).toHaveBeenCalledWith("/admin/question-bank/question-versions/qv-1/approve", { approvalPolicyVersion: "qb-approval-v1" });
  });

  it("revises an approved version and edits the draft", async () => {
    post.mockResolvedValue({ data: {} });
    patch.mockResolvedValue({ data: {} });
    await questionBankApi.revise("qv-1");
    await questionBankApi.updateDraft("qv-2", { canonicalText: "Q2" });
    expect(post).toHaveBeenCalledWith("/admin/question-bank/question-versions/qv-1/revise");
    expect(patch).toHaveBeenCalledWith("/admin/question-bank/question-versions/qv-2", { canonicalText: "Q2" });
  });
});
