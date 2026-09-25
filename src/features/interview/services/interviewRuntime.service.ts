import apiClient from "@/lib/apiClient";

export type InterviewRuntimeMode = "text" | "voice" | "video";

export type InterviewRuntimePlanSummary = {
  planId: string;
  schemaVersion: string;
  status: "DRAFT" | "READY" | "LOCKED" | "FAILED";
};

export type InterviewRuntimeSession = {
  sessionId: string;
  resumeId: string | null;
  jobId: string | null;
  mode: InterviewRuntimeMode;
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

  close: async (sessionId: string): Promise<InterviewRuntimeSession> => {
    const response = await apiClient.post<InterviewRuntimeSession>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/close`,
    );
    return response.data;
  },
};
