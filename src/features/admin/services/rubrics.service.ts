import api from "@/lib/apiClient";

export type RubricItem = {
  rubricId: string;
  stableKey: string;
  currentVersion: {
    rubricVersionId: string;
    version: string;
    status: "DRAFT" | "APPROVED";
    criteriaCount: number;
    totalWeight: number;
  } | null;
};

export const rubricsApi = {
  list: (q?: string) => api.get<{ items: RubricItem[] }>("/admin/question-bank/rubrics", { params: q ? { q } : undefined }),
};
