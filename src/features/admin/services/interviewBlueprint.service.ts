import api from "@/lib/apiClient";

/** Versioned interview stage policy (Core: core/interview_blueprint.py). */
export type BlueprintStatus = "DRAFT" | "IN_REVIEW" | "ACTIVE" | "RETIRED" | "REJECTED";

export type BlueprintDefinition = {
  schemaVersion: string;
  warmUp: { softAnswerSeconds: number; hardAnswerSeconds: number };
  validate: {
    enabled: boolean;
    softAnswerSeconds: number;
    hardAnswerSeconds: number;
    probeEnabled: boolean;
    untilRatio: number;
  };
  technical: {
    maxQuestions: number;
    expectedSecondsPerQuestion: number;
    probeEnabled: boolean;
    deepDiveUntilRatio: number;
    challengeUntilRatio: number;
    challengeForCoding: boolean;
    challengeForCvGaps: boolean;
    fastFailAfterGiveUps: number;
  };
  behavioral: { enabled: boolean; softAnswerSeconds: number; hardAnswerSeconds: number; reserveSeconds: number };
  closing: {
    qnaEnabled: boolean;
    maxQuestions: number;
    budgetSeconds: number;
    reserveSeconds: number;
    minSecondsToOpen: number;
  };
  pacing: { emergencyCutoffSeconds: number; behindScheduleRatio: number };
};

export type BlueprintPreviewRow = {
  durationMinutes: number;
  technicalQuestions: number;
  expectedSeconds: number;
  fits: boolean;
};

export type BlueprintVersion = {
  id: string;
  blueprintId: string | null;
  version: number;
  name: string;
  /** Shown to candidates once this version is activated. */
  description: string;
  status: BlueprintStatus;
  definition: BlueprintDefinition;
  changeSummary: string;
  basedOnId: string | null;
  createdBy: string;
  submittedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  activatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  preview: BlueprintPreviewRow[];
  activationErrors: string[];
  actions: { edit: boolean; submit: boolean; activate: boolean; reject: boolean };
};

/** An interview type candidates choose; its versions are what experts edit and admins approve. */
export type InterviewTypeAdmin = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isListed: boolean;
  displayOrder: number;
  activeVersion: { id: string; version: number } | null;
  preview: BlueprintPreviewRow[];
  pendingReview: number;
  stats: { sessions: number; completionRate: number | null; averageScore: number | null };
  versions: BlueprintVersion[];
  actions: { newDraft: boolean; toggleListed: boolean; makeDefault: boolean };
};

export type BlueprintList = {
  items: InterviewTypeAdmin[];
  systemDefault: { name: string; preview: BlueprintPreviewRow[] };
};

const BASE = "/admin/interview-blueprints";

export const interviewBlueprintApi = {
  list: () => api.get<BlueprintList>(BASE),
  get: (id: string) => api.get<BlueprintVersion>(`${BASE}/${encodeURIComponent(id)}`),
  createType: (body: { name: string; description?: string }) => api.post<BlueprintVersion>(`${BASE}/types`, body),
  updateType: (id: string, body: { isListed?: boolean; isDefault?: boolean; displayOrder?: number }) =>
    api.patch<{ id: string; isListed: boolean; isDefault: boolean; displayOrder: number }>(
      `${BASE}/types/${encodeURIComponent(id)}`,
      body,
    ),
  create: (body: { blueprintId?: string; basedOnId?: string | null; name?: string; changeSummary?: string }) =>
    api.post<BlueprintVersion>(BASE, body),
  update: (
    id: string,
    body: { name?: string; description?: string; definition?: BlueprintDefinition; changeSummary?: string },
  ) =>
    api.patch<BlueprintVersion>(`${BASE}/${encodeURIComponent(id)}`, body),
  submit: (id: string) => api.post<BlueprintVersion>(`${BASE}/${encodeURIComponent(id)}/submit`),
  activate: (id: string) => api.post<BlueprintVersion>(`${BASE}/${encodeURIComponent(id)}/activate`, {}),
  reject: (id: string, note: string) => api.post<BlueprintVersion>(`${BASE}/${encodeURIComponent(id)}/reject`, { note }),
  preview: (definition: BlueprintDefinition) =>
    api.post<{ preview: BlueprintPreviewRow[]; activationErrors: string[] }>(`${BASE}/preview`, definition),
};

/** Badge tone per status (AdminStatusBadge). */
export const BLUEPRINT_STATUS_TONE = {
  DRAFT: "draft",
  IN_REVIEW: "review",
  ACTIVE: "success",
  RETIRED: "archived",
  REJECTED: "rejected",
} as const;

/** The Core error code of a failed request, or null. */
export function blueprintErrorCode(error: unknown): string | null {
  const detail = (error as { response?: { data?: { detail?: { errorCode?: string } } } })?.response?.data?.detail;
  return detail && typeof detail === "object" ? detail.errorCode ?? null : null;
}
