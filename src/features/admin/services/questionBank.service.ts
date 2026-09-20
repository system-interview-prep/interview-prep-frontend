import api from "@/lib/apiClient";

export type QuestionStatus = "DRAFT" | "IN_REVIEW" | "NEEDS_REVISION" | "APPROVED" | "CALIBRATED" | "RETIRED";

export type QuestionBankItem = {
  questionId: string;
  stableKey: string;
  currentVersion: {
    questionVersionId: string;
    version: string;
    status: QuestionStatus;
    canonicalText: string;
    canonicalLocale: string;
    questionType: string;
    difficultyBand: string;
    softAnswerSeconds: number;
  };
  taxonomy: {
    roles: Array<{ conceptId: string; relevance: number }>;
    skills: Array<{ conceptId: string; relevance: number }>;
    primaryCompetency: { conceptId: string; relevance: number } | null;
  };
  updatedAt: string;
};

export type QuestionListResponse = { items: QuestionBankItem[]; page: number; pageSize: number; total: number };
export type QuestionListParams = { q?: string; status?: string; difficultyBand?: string; page?: number; pageSize?: number };

export type CreateQuestionDraftPayload = {
  stableKey: string; version: string; taxonomyVersion: string; questionType: string; difficultyBand: string;
  canonicalLocale: string; canonicalText: string; objective: string; thinkingSeconds: number;
  softAnswerSeconds: number; hardAnswerSeconds: number; contextPolicy: Record<string, unknown>;
  personalizationPolicy: Record<string, unknown>; changeSummary: string;
  taxonomyMappings: Array<{ conceptId: string; purpose: "TARGET_ROLE" | "TARGET_SKILL" | "PRIMARY_COMPETENCY" | "SUPPORTING_COMPETENCY"; relevance: number }>;
};

export const questionBankApi = {
  list: (params: QuestionListParams = {}) =>
    api.get<QuestionListResponse>("/admin/question-bank/questions", { params }),
  get: (questionId: string) =>
    api.get<QuestionBankItem>(`/admin/question-bank/questions/${encodeURIComponent(questionId)}`),
  createDraft: (payload: CreateQuestionDraftPayload) =>
    api.post<{ questionId: string; questionVersionId: string; version: string; status: string }>("/admin/question-bank/questions/drafts", payload),
};
