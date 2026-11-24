import axios from "axios";
import { apiClient } from "@/lib/apiClient";

/** The `detail` code of a refused admin action ("already_closed", "running", …), or null. */
export function adminErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string") return detail;
  return error.response ? `http_${error.response.status}` : "network";
}

/* ---------------------------------------------------------------- settings */

export type ConfigItem = {
  key: string;
  value: string | number | boolean | null;
  /** Environment variable that sets it; null when fixed in code. */
  env: string | null;
  default: string | number | boolean | null;
  /** True when .env overrides the default. */
  changed: boolean;
};

export type SystemConfig = {
  groups: { key: string; items: ConfigItem[] }[];
  generatedAt: string;
};

/* ---------------------------------------------------------- question quality */

export type QuestionQualityGroup = {
  stage: string;
  source: string;
  asked: number;
  answeredRate: number | null;
  skippedRate: number | null;
  meanScore: number | null;
  scoreStdDev: number | null;
  meanAnswerSeconds: number | null;
  overHardTimeRate: number | null;
  probesPerTurn: number | null;
  llmProbeShare: number | null;
  unlabelledProbeShare: number | null;
  clarifiesPerTurn: number | null;
  difficultyMatchRate: number | null;
  repeatedAcrossSessionsRate: number | null;
  duplicateInSessionCount: number;
  wrongLanguageCount: number;
  leakCount: number;
};

export type QuestionQuality = {
  sessions: number;
  askedTurns: number;
  sourceMix: Record<string, number>;
  planDifficulty: Record<string, number>;
  groups: QuestionQualityGroup[];
};

/* ------------------------------------------------------------ user detail */

export type UserActivitySession = {
  id: string;
  status: string;
  mode: "chat" | "voice" | "video";
  jobTitle: string | null;
  startedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  durationMinutes: number | null;
  /** 0–10; null when not graded. */
  score: number | null;
};

export type UserActivity = {
  user: {
    id: string;
    email: string;
    name: string | null;
    provider: string | null;
    isActive: boolean;
    createdAt: string | null;
    roles: string[];
    weeklyGoal: number | null;
  };
  summary: {
    sessions: number;
    /** Sessions shown in the list (the newest ones); the counts above cover all of them. */
    listed: number;
    closed: number;
    graded: number;
    ungraded: number;
    open: number;
    avgScore: number | null;
    bestScore: number | null;
    cvs: number;
    cvsFailed: number;
    matchingRuns: number;
    realReports: number;
  };
  cvs: { id: string; fileName: string | null; status: string; error: string | null; createdAt: string | null; updatedAt: string | null }[];
  sessions: UserActivitySession[];
  matchingRuns: { runId: string; startedAt: string | null; jobTitle: string | null; status: "done" | "error" | "running" }[];
  realReports: { id: string; company: string | null; date: string | null; stage: string; result: string }[];
  limits: { cvs: number; sessions: number; matchingRuns: number };
  generatedAt: string;
};

/* ---------------------------------------------------------- system health */

export type HealthStatus = "ok" | "warn" | "down" | "off";

export type HealthCheck = {
  key: "database" | "rabbitmq" | "livekit" | "voiceAgent" | "langfuse" | string;
  status: HealthStatus;
  /** Short code: "no_worker", "timeout", "migration_behind", … */
  detail: string | null;
  data: {
    latencyMs?: number;
    applied?: string | null;
    head?: string | null;
    queues?: { key: string; name: string; messages: number | null; consumers: number | null; missing?: boolean }[];
    rooms?: number;
    activeRooms?: number;
    lastEventAt?: string | null;
    projectUrl?: string | null;
    /** Langfuse: providers of the LLM connections the AI judges use; null when unknown. */
    llmConnections?: string[] | null;
    error?: string;
  };
  checkedMs: number;
};

export type SystemHealth = { overall: HealthStatus; checks: HealthCheck[]; checkedAt: string };

/* ---------------------------------------------------------------- practice */

export type PracticeWeek = {
  week: string;
  sessions: number;
  graded: number;
  valid: number;
  activeUsers: number;
  practisingUsers: number;
  metGoal: number;
  avgScore: number | null;
};

export type PracticeStats = {
  weeks: PracticeWeek[];
  totals: {
    sessions: number;
    closed: number;
    graded: number;
    valid: number;
    short: number;
    users: number;
    practisingUsers: number;
    returningUsers: number;
    medianSessionsPerUser: number | null;
  };
  goalDistribution: Record<string, number>;
  realReports: { total: number; passed: number; failed: number; waiting: number };
  rules: { validMinAnswers: number; defaultWeeklyGoal: number };
  windowWeeks: number;
  includeDemo: boolean;
  since: string;
  generatedAt: string;
};

export type GradingBatch = {
  total: number;
  graded: number;
  failed: number;
  skipped: number;
  running: boolean;
  startedAt: string;
  finishedAt: string | null;
};

export const adminOpsService = {
  /** End a session stuck open. Written to the access log. */
  async closeSession(sessionId: string, note?: string): Promise<{ previousStatus: string; endReason: string }> {
    const response = await apiClient.post<{ success: boolean; previousStatus: string; endReason: string }>(
      `/admin/sessions/${encodeURIComponent(sessionId)}/close`,
      { note: note || null },
    );
    return response.data;
  },
  /** Grade a closed session without a report; runs in the background. Written to the access log. */
  async gradeSession(sessionId: string): Promise<void> {
    await apiClient.post(`/admin/sessions/${encodeURIComponent(sessionId)}/grade`);
  },
  /** Parse a user's CV again. Written to the access log. */
  async reparseCv(cvId: string): Promise<void> {
    await apiClient.post(`/admin/cv-parsing/runs/${encodeURIComponent(cvId)}/reparse`);
  },
  async systemConfig(): Promise<SystemConfig> {
    const response = await apiClient.get<{ success: boolean } & SystemConfig>("/admin/system/config");
    return response.data;
  },
  async questionQuality(params: { since?: string; includeDemo: boolean }): Promise<QuestionQuality> {
    const response = await apiClient.get<{ success: boolean } & QuestionQuality>("/admin/question-quality", {
      params: { since: params.since, includeDemo: params.includeDemo },
    });
    return response.data;
  },
  /** One account's CVs, sessions, matching runs and reports. Written to the access log. */
  async userActivity(userId: string): Promise<UserActivity> {
    const response = await apiClient.get<{ success: boolean } & UserActivity>(
      `/admin/users/${encodeURIComponent(userId)}/activity`,
    );
    return response.data;
  },
  async systemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get<{ success: boolean } & SystemHealth>("/admin/system/health");
    return response.data;
  },
  async practice(weeks: number, includeDemo: boolean): Promise<PracticeStats> {
    const response = await apiClient.get<{ success: boolean } & PracticeStats>("/admin/practice", {
      params: { weeks, includeDemo },
    });
    return response.data;
  },
  /** Grade closed sessions without a report, one after another (at most 50), of one user or of everyone. */
  async gradePending(userId?: string): Promise<{ queued: number; limit: number }> {
    const response = await apiClient.post<{ success: boolean; queued: number; limit: number }>("/admin/grading-batch", {
      userId: userId ?? null,
    });
    return response.data;
  },
  /** The last batch, and how many sessions a batch would grade now (answered at least one main question). */
  async gradingBatch(userId?: string): Promise<{ batch: GradingBatch | null; eligible: number | null }> {
    const response = await apiClient.get<{ success: boolean; batch: GradingBatch | null; eligible?: number }>(
      "/admin/grading-batch",
      { params: { userId } },
    );
    return { batch: response.data.batch, eligible: response.data.eligible ?? null };
  },
};
