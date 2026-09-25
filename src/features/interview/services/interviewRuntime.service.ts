import apiClient from "@/lib/apiClient";

export type InterviewRuntimeMode = "text" | "voice" | "video";

export type InterviewRuntimePlanSummary = {
  planId: string;
  schemaVersion: string;
  status: "DRAFT" | "READY" | "LOCKED" | "FAILED";
};

export type InterviewCompetencyTarget = {
  selectionRank: number | null;
  taxonomyVersion: string;
  conceptId: string;
  label: string;
  importance: number;
  targetQuestionCount: number;
  rationale: {
    source: string;
    requirementIds: string[];
    priorities: string[];
    matchStatuses: string[];
    jobEvidenceRefs: string[];
  };
};

export type InterviewPlanDifficulty = {
  level: "foundational" | "intermediate" | "advanced" | "unspecified";
  source: "job_seniority" | "job_seniority_missing";
  seniority: string | null;
};

export type InterviewPlanSection = {
  sectionId: "warmup" | "core" | "gap_validation" | "closing";
  label: string;
  durationMinutes: number;
  purpose: string;
};

export type InterviewEvaluationTarget = {
  requirementId: string;
  priority: string;
  kind: string;
  label: string;
  groupOperator: "atomic" | "all_of" | "any_of";
  status: "met" | "not_met" | "unknown" | "not_applicable";
  reasonCode: string;
  conceptIds: string[];
  conceptResults: Array<{
    conceptId: string;
    label: string;
    status: "met" | "not_met" | "unknown" | "not_applicable";
    confidence: number;
    reasonCode: string;
    candidateEvidenceRefs: string[];
  }>;
  jobEvidenceRefs: string[];
  candidateEvidenceRefs: string[];
  evaluationMode: "competency" | "requirement_validation";
  attention: "validate_gap" | "verify_claim" | "not_applicable";
};

export type InterviewRuntimePlan = {
  planId: string;
  sessionId: string;
  schemaVersion: string;
  status: "DRAFT" | "READY" | "LOCKED" | "FAILED";
  policyVersion: string | null;
  fingerprint: string | null;
  questionBudget: number | null;
  targetQuestionCount: number;
  difficulty: InterviewPlanDifficulty | null;
  sections: InterviewPlanSection[];
  evaluationTargets: InterviewEvaluationTarget[];
  sourceContext: Record<string, unknown>;
  targets: InterviewCompetencyTarget[];
  createdAt: string;
  updatedAt: string;
};

export type InterviewFrozenTurn = {
  turnId: string;
  turnIndex: number;
  status: string;
  questionVersionId: string | null;
  rubricVersionId: string | null;
  answerText?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  question: {
    schemaVersion?: string;
    selectorPolicyVersion?: string;
    questionVersionId?: string;
    stableKey?: string;
    version?: string;
    questionType?: string;
    difficulty?: string;
    locale?: string;
    canonicalLocale?: string;
    questionText?: string;
    objective?: string;
    expectedPoints?: Array<Record<string, unknown>>;
    rubric?: Record<string, unknown>;
    taxonomyTarget?: Record<string, unknown>;
  };
};

export type InterviewQuestionSelection = {
  sessionId: string;
  planId: string;
  status: "LOCKED";
  selectorPolicyVersion: string;
  fingerprint?: string;
  turns: InterviewFrozenTurn[];
};

export type InterviewTextRuntime = {
  sessionId: string;
  sessionStatus: string;
  completed: boolean;
  progress: {
    answered: number;
    total: number;
  };
  currentTurn: InterviewFrozenTurn | null;
  turns: InterviewFrozenTurn[];
};

export type InterviewRuntimeSession = {
  sessionId: string;
  resumeId: string | null;
  jobId: string | null;
  mode: InterviewRuntimeMode;
  experienceType?: "question_practice" | "interview_chat";
  locale: string;
  durationMinutes: number;
  status: string;
  startedAt: string;
  endedAt: string | null;
  plan: InterviewRuntimePlanSummary | null;
};

export type CreateInterviewRuntimeSessionRequest = {
  resumeId: string;
  jobId: string;
  mode: InterviewRuntimeMode;
  experienceType?: "question_practice" | "interview_chat";
  locale: string;
  durationMinutes?: number;
};

export const interviewRuntimeApi = {
  create: async (
    payload: CreateInterviewRuntimeSessionRequest,
  ): Promise<InterviewRuntimeSession> => {
    const response = await apiClient.post<InterviewRuntimeSession>(
      "/api/v1/interviews/sessions",
      {
        ...payload,
        experienceType: payload.experienceType ?? "question_practice",
        durationMinutes: payload.durationMinutes ?? 25,
      },
    );
    return response.data;
  },

  get: async (sessionId: string): Promise<InterviewRuntimeSession> => {
    const response = await apiClient.get<InterviewRuntimeSession>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}`,
    );
    return response.data;
  },

  list: async (): Promise<InterviewRuntimeSession[]> => {
    const response = await apiClient.get<{ sessions: InterviewRuntimeSession[] }>(
      "/api/v1/interviews/sessions",
    );
    return response.data.sessions;
  },

  buildPlan: async (sessionId: string): Promise<InterviewRuntimePlan> => {
    const response = await apiClient.post<InterviewRuntimePlan>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/plan`,
    );
    return response.data;
  },

  getPlan: async (sessionId: string): Promise<InterviewRuntimePlan> => {
    const response = await apiClient.get<InterviewRuntimePlan>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/plan`,
    );
    return response.data;
  },

  selectQuestions: async (
    sessionId: string,
  ): Promise<InterviewQuestionSelection> => {
    const response = await apiClient.post<InterviewQuestionSelection>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/questions/select`,
    );
    return response.data;
  },

  getTurns: async (sessionId: string): Promise<InterviewFrozenTurn[]> => {
    const response = await apiClient.get<{
      sessionId: string;
      turns: InterviewFrozenTurn[];
    }>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/turns`,
    );
    return response.data.turns;
  },

  getTextRuntime: async (sessionId: string): Promise<InterviewTextRuntime> => {
    const response = await apiClient.get<InterviewTextRuntime>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/runtime`,
    );
    return response.data;
  },

  askTurn: async (
    sessionId: string,
    turnId: string,
  ): Promise<InterviewFrozenTurn> => {
    const response = await apiClient.post<InterviewFrozenTurn>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/turns/${encodeURIComponent(turnId)}/ask`,
    );
    return response.data;
  },

  answerTurn: async (
    sessionId: string,
    turnId: string,
    answerText: string,
  ): Promise<InterviewFrozenTurn> => {
    const response = await apiClient.post<InterviewFrozenTurn>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/turns/${encodeURIComponent(turnId)}/answer`,
      { answerText },
    );
    return response.data;
  },

  completeTextRuntime: async (
    sessionId: string,
  ): Promise<InterviewTextRuntime> => {
    const response = await apiClient.post<InterviewTextRuntime>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/complete`,
    );
    return response.data;
  },

  close: async (sessionId: string): Promise<InterviewRuntimeSession> => {
    const response = await apiClient.post<InterviewRuntimeSession>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/close`,
    );
    return response.data;
  },
};
