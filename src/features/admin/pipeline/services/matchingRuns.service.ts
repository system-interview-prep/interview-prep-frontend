import { apiClient } from "@/lib/apiClient";
import type { AiCall, AiCallSummary } from "./pipeline.service";

/** CV–JD matching runs recorded by the backend (matching_pipeline_events, migration 0032). */

export type MatchStepKey =
  | "request"
  | "inputs"
  | "cache"
  | "reparse"
  | "requirements"
  | "semantic"
  | "scoring"
  | "cache_write"
  | "done"
  | "clarify"
  | "questions"
  | "rescore";

export type MatchStepStatus = "pending" | "running" | "done" | "skipped" | "error";
export type MatchRunStatus = "running" | "completed" | "failed";
export type MatchFlow = "match" | "clarify_prepare" | "clarify_questions" | "clarify_full" | "rescore" | "planner" | "celery";

export type MatchRun = {
  runId: string;
  flow: MatchFlow | string;
  status: MatchRunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  user: { id: string; name: string | null; email: string | null } | null;
  cv: { id: string; fileName: string | null } | null;
  job: { id: string; title: string | null } | null;
  decision: string | null;
  fitBand: string | null;
  /** 0..1 */
  suitabilityScore: number | null;
  cacheHit: boolean | null;
  currentStep: MatchStepKey | string;
  aiCalls: number;
  aiErrors: number;
  warnings: string[];
};

/** Step summary fields are the stored event fields (snake_case). */
export type MatchStep = {
  key: MatchStepKey;
  status: MatchStepStatus;
  startedAt: string | null;
  durationMs: number | null;
  summary: Record<string, unknown>;
};

export type MatchRequirement = {
  requirementId: string;
  label: string | null;
  priority: string | null;
  status: string;
  evaluator: string | null;
  reasonCode: string | null;
  confidence: number | null;
};

export type MatchScoring = {
  eligibility: string | null;
  compatibilityStatus: string | null;
  suitabilityScore: number | null;
  diagnosticScore: number | null;
  fitBand: string | null;
  decision: string | null;
  provenanceMode: string | null;
  factors: { name: string; score: number | null; weight: number | null }[];
  warnings: string[];
};

export type MatchEvent = {
  at: string | null;
  stage: string;
  event: string;
  status: string;
  durationMs: number | null;
  payload: Record<string, unknown>;
};

export type MatchRunDetail = {
  run: MatchRun;
  steps: MatchStep[];
  requirements: {
    total: number;
    byStatus: Record<string, number>;
    byEvaluator: Record<string, number>;
    items: MatchRequirement[];
  } | null;
  scoring: MatchScoring | null;
  clarification: {
    gate: Record<string, unknown> | null;
    questions: Record<string, unknown> | null;
    rescore: Record<string, unknown> | null;
  } | null;
  events: MatchEvent[];
  ai: { summary: AiCallSummary; calls: AiCall[] };
};

export type MatchRunFilters = {
  limit?: number;
  offset?: number;
  status?: "all" | MatchRunStatus;
  days?: number;
  q?: string;
};

export const matchingRunsService = {
  async list(filters: MatchRunFilters): Promise<{ items: MatchRun[]; total: number }> {
    const response = await apiClient.get<{ items: MatchRun[]; total: number }>("/admin/matching/runs", {
      params: { ...filters, q: filters.q || undefined },
    });
    return response.data;
  },
  async detail(runId: string): Promise<MatchRunDetail> {
    const response = await apiClient.get<MatchRunDetail>(`/admin/matching/runs/${encodeURIComponent(runId)}`);
    return response.data;
  },
};
