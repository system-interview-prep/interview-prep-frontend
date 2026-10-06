import api from "@lib/apiClient";
import type {
  CandidatePreferences,
  MatchResult,
  MatchingPolicy,
  RequirementStatus,
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
  questionText: string;
  semanticAlignmentScore: number;
  reasonCode: "candidate_clarification_needed";
};

export type MatchClarificationAnalysis = {
  matchResult: MatchResult;
  clarificationRequests: ClarificationRequest[];
};

export type ClarificationMatchPayload = {
  candidateId: string;
  jobId: string;
  matchingPolicy?: MatchingPolicy;
  candidatePreferences?: CandidatePreferences;
};

export type CandidateClarificationAnswer = {
  requirementId: string;
  answerText: string;
};

export type ClarificationAnswerOutcome = {
  requirementId: string;
  evidenceRef: string;
  evidenceSource: "candidate_self_report";
  status: RequirementStatus;
};

export type MatchClarificationRescoreResult = {
  initialMatchResult: MatchResult;
  finalMatchResult: MatchResult;
  processedAnswers: ClarificationAnswerOutcome[];
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
const ALLOWED_STATUSES = new Set<RequirementStatus>(["met", "not_met", "unknown", "not_applicable"]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizedText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeClarificationRequest(raw: unknown): ClarificationRequest | null {
  const item = asRecord(raw);
  const requirementId = normalizedText(item.requirementId ?? item.requirement_id);
  const rawDimension = normalizedText(item.missingDimension ?? item.missing_dimension);
  const missingDimension = ALLOWED_DIMENSIONS.has(rawDimension as MissingEvidenceDimension)
    ? (rawDimension as MissingEvidenceDimension)
    : "other";
  const confidence = Number(item.confidence);
  const semanticAlignmentScore = Number(item.semanticAlignmentScore ?? item.semantic_alignment_score);
  const questionText = normalizedText(item.questionText ?? item.question_text);
  const rawEvidenceRefs = item.evidenceRefs ?? item.evidence_refs;
  const evidenceRefs = Array.isArray(rawEvidenceRefs)
    ? rawEvidenceRefs.map(normalizedText).filter(Boolean)
    : [];
  const reasonCode = normalizedText(item.reasonCode ?? item.reason_code);

  if (
    !requirementId ||
    questionText.length < 15 ||
    !Number.isFinite(confidence) || confidence < 0 || confidence > 1 ||
    !Number.isFinite(semanticAlignmentScore) || semanticAlignmentScore < 0 || semanticAlignmentScore > 1 ||
    reasonCode !== "candidate_clarification_needed"
  ) {
    return null;
  }

  return {
    requirementId,
    missingDimension,
    confidence,
    evidenceRefs,
    questionText,
    semanticAlignmentScore,
    reasonCode,
  };
}

export function normalizeClarificationAnalysis(raw: unknown): MatchClarificationAnalysis {
  const body = asRecord(raw);
  const rawResult = asRecord(body.matchResult ?? body.match_result);
  const rawRequests = body.clarificationRequests ?? body.clarification_requests;
  const clarificationRequests = Array.isArray(rawRequests)
    ? rawRequests
        .map(normalizeClarificationRequest)
        .filter((item): item is ClarificationRequest => item !== null)
    : [];

  return {
    matchResult: rawResult as unknown as MatchResult,
    clarificationRequests,
  };
}

export function normalizeClarificationRescoreResult(raw: unknown): MatchClarificationRescoreResult {
  const body = asRecord(raw);
  const rawAnswers = body.processedAnswers ?? body.processed_answers;
  const processedAnswers = Array.isArray(rawAnswers)
    ? rawAnswers.flatMap((value) => {
        const item = asRecord(value);
        const requirementId = normalizedText(item.requirementId ?? item.requirement_id);
        const evidenceRef = normalizedText(item.evidenceRef ?? item.evidence_ref);
        const rawStatus = normalizedText(item.status) as RequirementStatus;
        if (!requirementId || !evidenceRef || !ALLOWED_STATUSES.has(rawStatus)) return [];
        return [{
          requirementId,
          evidenceRef,
          evidenceSource: "candidate_self_report" as const,
          status: rawStatus,
        }];
      })
    : [];

  return {
    initialMatchResult: asRecord(body.initialMatchResult ?? body.initial_match_result) as unknown as MatchResult,
    finalMatchResult: asRecord(body.finalMatchResult ?? body.final_match_result) as unknown as MatchResult,
    processedAnswers,
  };
}

export async function analyzeMatchClarifications(
  payload: ClarificationMatchPayload
): Promise<MatchClarificationAnalysis> {
  const response = await api.post<unknown>("/api/v1/matching/clarifications-by-ids", payload);
  return normalizeClarificationAnalysis(response.data);
}

export async function rescoreMatchClarifications(
  payload: ClarificationMatchPayload & {
    initialAnalysis: MatchClarificationAnalysis;
    answers: CandidateClarificationAnswer[];
  }
): Promise<MatchClarificationRescoreResult> {
  const response = await api.post<unknown>("/api/v1/matching/clarifications/rescore-by-ids", payload);
  return normalizeClarificationRescoreResult(response.data);
}
