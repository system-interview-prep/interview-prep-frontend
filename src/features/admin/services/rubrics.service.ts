import api from "@/lib/apiClient";

export type RubricItem = {
  rubricId: string;
  stableKey: string;
  /** Question the rubric is authored and edited on (null when it is not linked to any question). */
  questionId?: string | null;
  questionStableKey?: string | null;
  questionVersion?: string | null;
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
