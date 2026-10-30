import type { CvProcessingStatus } from "../types";

/**
 * What the candidate can do with a CV right now. Shared by "My CVs" and the
 * CV picker so the two never disagree about the same file.
 *
 * - ready: parsed, can be used for matching and interviews
 * - processing: the server is still working on it
 * - slow: still processing after the usual time; it may finish, so it is not
 *   called a failure (the client cannot know that)
 * - failed: the server reported a failure
 */
export type CvViewState = "ready" | "processing" | "slow" | "failed";

/** Parsing usually finishes well within this; past it we say "taking longer". */
export const SLOW_PROCESSING_MS = 5 * 60 * 1000;

export interface CvStatusInput {
  status?: CvProcessingStatus | null;
  error?: string | null;
  uploadedAt?: string | null;
  /** Last status change; a re-parse of an old CV is not slow because of its upload date. */
  updatedAt?: string | null;
}

export function cvViewState(file: CvStatusInput, nowMs: number = Date.now()): CvViewState {
  if (file.status === "DONE") return "ready";
  if (file.status === "FAILED" || (file.error && !file.status)) return "failed";
  const since = Date.parse(file.updatedAt || file.uploadedAt || "");
  if (Number.isFinite(since) && nowMs - since > SLOW_PROCESSING_MS) return "slow";
  return "processing";
}

/** 1-based step of the parsing pipeline, for "Bước x/3". */
export function processingStep(status?: CvProcessingStatus | null): 1 | 2 | 3 {
  if (status === "AI_PROCESSING") return 3;
  if (status === "PARSING") return 2;
  return 1;
}

export const PROCESSING_STEP_KEYS: Record<1 | 2 | 3, string> = {
  1: "cvStatus.step.queued",
  2: "cvStatus.step.reading",
  3: "cvStatus.step.analyzing",
};
