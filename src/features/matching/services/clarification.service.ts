import api from "@lib/apiClient";
import type {
  CandidatePreferences,
  MatchResult,
  MatchingPolicy,
} from "@/lib/aiService";

export type MissingEvidenceDimension =
  | "duration"
  | "proficiency"
  | "scale"
  | "responsibility"
  | "education"
  | "language_level"
  | "certification"
  | "experience_context"
  | "other";

export type ClarificationRequest = {
  requirementId: string;
  missingDimension: MissingEvidenceDimension;
  confidence: number;
  evidenceRefs: string[];
  reasonCode: "jev_candidate_clarification_needed";
  promptKey: string;
};

export type MatchClarificationAnalysis = {
  matchResult: MatchResult;
  clarificationRequests: ClarificationRequest[];
};

export type ClarificationMatchPayload = {
  schemaVersion: "2.1";
  resume: Record<string, unknown>;
  job: Record<string, unknown>;
  matchingPolicy?: MatchingPolicy;
  candidatePreferences?: CandidatePreferences;
  asyncProcessing?: boolean;
};

const ALLOWED_DIMENSIONS = new Set<MissingEvidenceDimension>([
  "duration",
  "proficiency",
  "scale",
  "responsibility",
  "education",
  "language_level",
  "certification",
  "experience_context",
  "other",
]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function normalizeClarificationRequest(raw: unknown): ClarificationRequest | null {
  const item = asRecord(raw);
  const requirementId = String(item.requirementId ?? item.requirement_id ?? "").trim();
  const rawDimension = String(item.missingDimension ?? item.missing_dimension ?? "other");
  const missingDimension = ALLOWED_DIMENSIONS.has(rawDimension as MissingEvidenceDimension)
    ? (rawDimension as MissingEvidenceDimension)
    : "other";
  const confidence = Number(item.confidence ?? 0);
  const rawEvidenceRefs = item.evidenceRefs ?? item.evidence_refs;
  const evidenceRefs = Array.isArray(rawEvidenceRefs)
    ? rawEvidenceRefs.map((value) => String(value)).filter(Boolean)
    : [];
  const promptKey = String(item.promptKey ?? item.prompt_key ?? "").trim();

  if (!requirementId || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return null;
  }

  return {
    requirementId,
    missingDimension,
    confidence,
    evidenceRefs,
    reasonCode: "jev_candidate_clarification_needed",
    promptKey: promptKey || `matching.clarification.${missingDimension}`,
  };
}

export function normalizeClarificationAnalysis(raw: unknown): MatchClarificationAnalysis {
  const body = asRecord(raw);
  const rawRequests = body.clarificationRequests ?? body.clarification_requests;
  const clarificationRequests = Array.isArray(rawRequests)
    ? rawRequests
        .map(normalizeClarificationRequest)
        .filter((item): item is ClarificationRequest => item !== null)
    : [];

  return {
    matchResult: (body.matchResult ?? body.match_result ?? {}) as MatchResult,
    clarificationRequests,
  };
}

export async function analyzeMatchClarifications(
  payload: ClarificationMatchPayload
): Promise<MatchClarificationAnalysis> {
  const response = await api.post<unknown>("/api/v1/matching/clarifications", {
    ...payload,
    asyncProcessing: payload.asyncProcessing ?? false,
  });
  return normalizeClarificationAnalysis(response.data);
}
