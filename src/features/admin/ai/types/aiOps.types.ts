export type ObservabilityConnectionStatus = "CONNECTED" | "PARTIAL" | "NOT_CONNECTED" | "ERROR";

export interface AIOverviewStats {
  runs?: number;
  successRate?: number; // 0..100
  p50LatencyMs?: number;
  p95LatencyMs?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  errorCount?: number;
  evaluationScore?: number; // 0..100
}

export type AICapabilityType =
  | "CV_PARSING"
  | "CV_JD_MATCHING"
  | "QUESTION_GENERATION"
  | "INTERVIEW_CONVERSATION"
  | "INTERVIEW_SCORING"
  | "FEEDBACK_GENERATION";

export interface AIModelConfig {
  id: string;
  capability: AICapabilityType;
  capabilityLabel: string;
  provider: "OpenAI" | "Google Vertex" | "Anthropic" | "DeepSeek" | "Self-Hosted";
  modelName: string;
  environment: "PRODUCTION" | "STAGING" | "DEVELOPMENT";
  version: string;
  status: "ACTIVE" | "FALLBACK" | "DEPRECATED";
  lastChanged: string;
  readOnly: boolean;
}

export interface AIPromptItem {
  id: string;
  promptKey: string;
  name: string;
  capability: AICapabilityType;
  currentVersion: string;
  environment: "PRODUCTION" | "STAGING";
  status: "ACTIVE" | "DRAFT" | "ROLLBACK";
  updatedBy: string;
  updatedAt: string;
}

export interface AITraceItem {
  traceId: string;
  feature: AICapabilityType;
  sessionId?: string;
  model: string;
  latencyMs: number;
  tokens: number;
  costUsd?: number;
  status: "SUCCESS" | "ERROR" | "TIMEOUT";
  timestamp: string;
  hasDeepLink?: boolean;
  deepLinkUrl?: string;
}

export interface AIErrorGroup {
  id: string;
  feature: AICapabilityType;
  provider: string;
  model: string;
  errorType: string;
  count: number;
  lastOccurrence: string;
}
