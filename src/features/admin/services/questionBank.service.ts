import api from "@/lib/apiClient";

export type QuestionStatus = "DRAFT" | "IN_REVIEW" | "NEEDS_REVISION" | "APPROVED" | "CALIBRATED" | "RETIRED" | "REJECTED";

// Vocabularies the interview selector matches on. Any other value is rejected by Core.
export const DIFFICULTY_BANDS = ["foundational", "intermediate", "advanced"] as const;
export const QUESTION_TYPES = ["technical", "conceptual", "system_design", "coding"] as const;
// Taxonomy version that holds skill and specialization concepts.
export const DEFAULT_TAXONOMY_VERSION = "internal-career-2026.1";
/** How far a version has been checked (Core question_bank/trust.py). */
export type QuestionTrust = "generated" | "initial" | "reviewed" | "calibrated";
/** What one difficulty band means, the same for every skill (Core question_bank/difficulty.py). */
export type DifficultyLevel = { band: string; label: string; audience: string; expects: string; shape: string };

/** A taxonomy concept: the id is what the selector matches on, the label is what a person reads. */
export type ConceptRef = { conceptId: string; label?: string; relevance: number };

export type QuestionBankItem = {
  questionId: string;
  stableKey: string;
  currentVersion: {
    questionVersionId: string;
    version: string;
    status: QuestionStatus;
    canonicalText: string;
    /** Approved Vietnamese wording of a question written in another language; what candidates hear. */
    localizedText?: string | null;
    canonicalLocale: string;
    questionType: string;
    difficultyBand: string;
    softAnswerSeconds: number;
    /** Drafted by the system for a skill the bank lacked (question_generation). */
    generated?: boolean;
    trust?: QuestionTrust;
  };
  /** Turns that asked this question, any version. */
  askedCount?: number;
  taxonomy: {
    roles: ConceptRef[];
    skills: ConceptRef[];
    primaryCompetency: ConceptRef | null;
  };
  updatedAt: string;
};

export type RubricCriterionInput = {
  stableKey: string; name: string; description: string; weight: number; critical?: boolean;
  anchors: Array<{ level: 0 | 1 | 2 | 3; description: string }>;
};
export type AttachRubricPayload = { rubricVersionId: string } | { minimumCoverage?: number; criteria: RubricCriterionInput[] };

export type QuestionDetail = QuestionBankItem & {
  currentVersion: QuestionBankItem["currentVersion"] & {
    objective: string; createdBy: string; thinkingSeconds: number; hardAnswerSeconds: number;
    createdByName?: string | null;
  };
  approvedVersionId: string | null;
  /** Review history of the current version, oldest first. */
  reviews?: QuestionReviewEntry[];
  /** What the signed-in person may do, and why not (question_bank/permissions.py). */
  actions?: Record<QuestionAction, ActionPermission>;
  reviewTypes?: string[];
  rubric: {
    rubricVersionId: string; stableKey: string; version: string; minimumCoverage: number; approved: boolean;
    criteria: Array<{
      stableKey: string; name: string; description: string; weight: number; critical: boolean;
      anchors?: Array<{ level: 0 | 1 | 2 | 3; description: string }>;
    }>;
  } | null;
};

export type UpdateDraftPayload = Partial<{
  canonicalText: string; objective: string; questionType: string; difficultyBand: string;
  thinkingSeconds: number; softAnswerSeconds: number; hardAnswerSeconds: number; changeSummary: string;
}>;

export type ReviewDecision = "APPROVE" | "REQUEST_CHANGES" | "REJECT";
export type QuestionAction = "edit" | "submit" | "review" | "approve" | "revise" | "verify";
export type ActionPermission = { allowed: boolean; reason: string | null };
export type QuestionReviewEntry = {
  id: string; reviewerId: string; reviewer: string | null; reviewType: string;
  decision: string; comment: string | null; reviewedAt: string | null;
};
export type WorkBucket = "drafts" | "changes" | "review" | "approve";
export type WorkSummary = { buckets: Partial<Record<WorkBucket, number>>; generatedInReview: number; /** Approved questions nobody reviewed. */ unverified?: number; roles: string[] };
type VersionResponse = { questionVersionId: string; questionId: string; version: string; status: QuestionStatus };

export type QuestionListResponse = { items: QuestionBankItem[]; page: number; pageSize: number; total: number };
export type QuestionListParams = {
  q?: string; status?: string; difficultyBand?: string; page?: number; pageSize?: number;
  /** "My work" bucket of the signed-in person. */
  mine?: WorkBucket;
  /** ai: drafts the system generated. */
  source?: "ai" | "human";
  trust?: QuestionTrust;
  /** asked: the questions candidates met most first. */
  sort?: "recent" | "asked";
};

export type CreateQuestionDraftPayload = {
  stableKey: string; version: string; taxonomyVersion: string; questionType: string; difficultyBand: string;
  canonicalLocale: string; canonicalText: string; objective: string; thinkingSeconds: number;
  softAnswerSeconds: number; hardAnswerSeconds: number; contextPolicy: Record<string, unknown>;
  personalizationPolicy: Record<string, unknown>; changeSummary: string;
  taxonomyMappings: Array<{ conceptId: string; purpose: "TARGET_ROLE" | "TARGET_SKILL" | "PRIMARY_COMPETENCY" | "SUPPORTING_COMPETENCY"; relevance: number }>;
};

export type ImportSummary = { importId: string; status: string; totalRows: number; validRows: number; warningRows: number; errorRows: number };
export type ImportRow = { rowId: string; rowNumber: number; status: string; payload: Record<string, unknown>; errors: Array<{ field: string; code: string }>; warnings: Array<{ field: string; code: string }> };

export const questionBankApi = {
  list: (params: QuestionListParams = {}) =>
    api.get<QuestionListResponse>("/admin/question-bank/questions", { params }),
  retire: (questionIds: string[]) =>
    api.post<{ retiredQuestionIds: string[]; retiredCount: number }>("/admin/question-bank/questions/retire", { questionIds }),
  get: (questionId: string) =>
    api.get<QuestionDetail>(`/admin/question-bank/questions/${encodeURIComponent(questionId)}`),
  attachRubric: (questionVersionId: string, payload: AttachRubricPayload) =>
    api.put<{ questionVersionId: string; rubricVersionId: string }>(`/admin/question-bank/question-versions/${encodeURIComponent(questionVersionId)}/rubric`, payload),
  revise: (questionVersionId: string) =>
    api.post<VersionResponse>(`/admin/question-bank/question-versions/${encodeURIComponent(questionVersionId)}/revise`),
  updateDraft: (questionVersionId: string, payload: UpdateDraftPayload) =>
    api.patch<VersionResponse>(`/admin/question-bank/question-versions/${encodeURIComponent(questionVersionId)}`, payload),
  submit: (questionVersionId: string) =>
    api.post<VersionResponse>(`/admin/question-bank/question-versions/${encodeURIComponent(questionVersionId)}/submit`),
  review: (questionVersionId: string, decision: ReviewDecision, comment?: string, reviewType = "CONTENT") =>
    api.post<{ reviewId: string; decision: ReviewDecision }>(`/admin/question-bank/question-versions/${encodeURIComponent(questionVersionId)}/reviews`, { reviewType, decision, comment }),
  workSummary: () => api.get<WorkSummary>("/admin/question-bank/questions/work-summary"),
  approve: (questionVersionId: string, approvalPolicyVersion = "qb-approval-v1") =>
    api.post<VersionResponse>(`/admin/question-bank/question-versions/${encodeURIComponent(questionVersionId)}/approve`, { approvalPolicyVersion }),
  /** A person vouches for an approved version nobody reviewed (the seeded bank). */
  verify: (questionVersionId: string, comment?: string) =>
    api.post<{ reviewId: string; trust: QuestionTrust }>(`/admin/question-bank/question-versions/${encodeURIComponent(questionVersionId)}/verify`, { comment }),
  difficultyGuide: (locale = "vi-VN") =>
    api.get<{ version: string; levels: DifficultyLevel[]; calibrationMinSample: number }>("/admin/question-bank/difficulty-guide", { params: { locale } }),
  createDraft: (payload: CreateQuestionDraftPayload) =>
    api.post<{ questionId: string; questionVersionId: string; version: string; status: string }>("/admin/question-bank/questions/drafts", payload),
  downloadImportTemplate: (format: "csv" | "xlsx") => api.get(`/admin/question-bank/imports/template?format=${format}`, { responseType: "blob" }),
  uploadImport: (file: File) => { const body = new FormData(); body.append("file", file); return api.post<ImportSummary>("/admin/question-bank/imports", body); },
  getImportRows: (importId: string) => api.get<{ items: ImportRow[] }>(`/admin/question-bank/imports/${encodeURIComponent(importId)}/rows`),
  patchImportRow: (importId: string, rowId: string, payload: Record<string, unknown>) => api.patch(`/admin/question-bank/imports/${encodeURIComponent(importId)}/rows/${encodeURIComponent(rowId)}`, payload),
  downloadImportReport: (importId: string) => api.get(`/admin/question-bank/imports/${encodeURIComponent(importId)}/report`, { responseType: "blob" }),
  commitImport: (importId: string, idempotencyKey: string) => api.post(`/admin/question-bank/imports/${encodeURIComponent(importId)}/commit`, undefined, { headers: { "Idempotency-Key": idempotencyKey } }),
};
