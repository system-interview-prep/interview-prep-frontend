import { apiClient } from "@/lib/apiClient";
import type { AiCall, AiCallSummary } from "./pipeline.service";

/** How each uploaded CV was processed (cv_pipeline_events, migration 0033; older CVs come from user_cvs only). */

export type CvStepKey = "upload" | "queue" | "extract" | "source" | "parse" | "quality" | "save" | "done";
export type CvStepStatus = "pending" | "running" | "done" | "skipped" | "error";
export type CvRunStatus = "running" | "completed" | "review" | "failed";

export type CvRun = {
  cvId: string;
  /** false: uploaded before tracking existed (steps are inferred from the CV status). */
  tracked: boolean;
  status: CvRunStatus;
  dbStatus: string | null;
  canonicalStatus: string | null;
  uploadedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  attempts: number;
  user: { id: string; name: string | null; email: string | null } | null;
  cv: { id: string; fileName: string | null; sizeBytes: number | null; contentType: string | null };
  currentStep: CvStepKey | string;
  provider: string | null;
  parserVersion: string | null;
  sectionCounts: Record<string, number> | null;
  warningsCount: number | null;
  aiCalls: number;
  aiErrors: number;
  warnings: string[];
};

/** Summary fields are the stored event fields (snake_case). */
export type CvStep = {
  key: CvStepKey;
  status: CvStepStatus;
  startedAt: string | null;
  durationMs: number | null;
  summary: Record<string, unknown>;
};

export type CvExtraction = {
  provider: string | null;
  extractorVersion: string | null;
  markdownCharacters: number | null;
  contentBlocks: number | null;
  attempts: { provider: string | null; outcome: "used" | "failed" | "skipped"; errorType: string | null }[];
};

export type CvQuality = {
  status: string | null;
  parserVersion: string | null;
  sourceCharacters: number | null;
  sectionCounts: Record<string, number> | null;
  coverage: { rawText: string | null; evidence: string | null; sections: Record<string, string> };
  reasonCodes: string[];
  checks: Record<string, boolean>;
  warnings: { code: string; severity: string | null; section: string | null }[];
};

export type CvEvent = {
  at: string | null;
  stage: string;
  event: string;
  status: string;
  durationMs: number | null;
  attemptId: string | null;
  payload: Record<string, unknown>;
};

export type CvRunDetail = {
  run: CvRun;
  steps: CvStep[];
  extraction: CvExtraction | null;
  quality: CvQuality | null;
  events: CvEvent[];
  ai: { summary: AiCallSummary; calls: AiCall[] };
};

export type CvRunFilters = {
  limit?: number;
  offset?: number;
  status?: "all" | CvRunStatus;
  days?: number;
  q?: string;
};

export const cvParsingRunsService = {
  async list(filters: CvRunFilters): Promise<{ items: CvRun[]; total: number }> {
    const response = await apiClient.get<{ items: CvRun[]; total: number }>("/admin/cv-parsing/runs", {
      params: { ...filters, q: filters.q || undefined },
    });
    return response.data;
  },
  async detail(cvId: string): Promise<CvRunDetail> {
    const response = await apiClient.get<CvRunDetail>(`/admin/cv-parsing/runs/${encodeURIComponent(cvId)}`);
    return response.data;
  },
};
