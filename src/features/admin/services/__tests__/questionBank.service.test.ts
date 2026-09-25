import { describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));
vi.mock("@/lib/apiClient", () => ({ default: { get, post } }));

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
    await questionBankApi.createDraft({ stableKey: "backend.api.001", version: "1.0.0", taxonomyVersion: "v1", questionType: "CONCEPTUAL", difficultyBand: "MEDIUM", canonicalLocale: "vi-VN", canonicalText: "Q", objective: "O", thinkingSeconds: 0, softAnswerSeconds: 60, hardAnswerSeconds: 120, contextPolicy: {}, personalizationPolicy: {}, changeSummary: "", taxonomyMappings: [{ conceptId: "comp", purpose: "PRIMARY_COMPETENCY", relevance: 1 }] });
    expect(post).toHaveBeenCalledWith("/admin/question-bank/questions/drafts", expect.objectContaining({ stableKey: "backend.api.001" }));
  });
});
