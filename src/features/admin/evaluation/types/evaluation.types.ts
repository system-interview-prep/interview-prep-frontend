export type EvaluatorType =
  | "RULE_BASED"
  | "SCHEMA_VALIDATION"
  | "EXACT_STRUCTURED"
  | "LLM_AS_JUDGE"
  | "HUMAN_REVIEW";

export interface EvalDatasetItem {
  id: string;
  name: string;
  feature: string;
  version: string;
  caseCount: number;
  isGolden: boolean;
  status: "DRAFT" | "REVIEWED" | "APPROVED";
  updatedAt: string;
}

export interface EvalExperimentItem {
  id: string;
  name: string;
  datasetId: string;
  datasetName: string;
  variantA: {
    label: string;
    promptVersion: string;
    model: string;
    score?: number;
    latencyMs?: number;
    costUsd?: number;
  };
  variantB: {
    label: string;
    promptVersion: string;
    model: string;
    score?: number;
    latencyMs?: number;
    costUsd?: number;
  };
  regressionsCount: number;
  status: "COMPLETED" | "RUNNING" | "FAILED";
  createdAt: string;
}

export interface EvalRegressionItem {
  id: string;
  caseId: string;
  caseTitle: string;
  feature: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  reason: string;
  reviewStatus: "NEEDS_REVIEW" | "ACKNOWLEDGED" | "RESOLVED";
}
