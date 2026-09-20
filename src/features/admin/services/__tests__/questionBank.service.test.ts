import { describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("@/lib/apiClient", () => ({ default: { get } }));

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
});
