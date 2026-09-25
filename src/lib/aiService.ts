
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type ChatHistoryItem = {
  role: string;
  content: string;
  timestamp: string;
  metadata?: any;
};

export type ChatHistoryResponse = {
  history: ChatHistoryItem[];
};

export type ChatRequest = {
  sessionId: string;
  prompt: string;
  language: string;
};

export type ChatResponse = {
  reply: string;
};

export type ChatVoiceResponse = {
  reply: string;
  audioBase64: string;
  mimeType: string;
};

export type VideoCallChatVoiceResponse = ChatVoiceResponse & {
  audioUrl?: string;
};

export type CvScoringDecision = "PASS" | "FAIL";

export type EligibilityStatus = "eligible" | "ineligible" | "review_required";

export type CompatibilityStatus = "compatible" | "incompatible" | "unknown" | "not_applicable";

export type FitBand = "strong_fit" | "partial_fit" | "review_required" | "not_eligible" | "insufficient_evidence";

export type MatchingDecision = "assessed" | "abstained";

export type RequirementStatus = "met" | "not_met" | "unknown" | "not_applicable";

export type EvidenceStrength = "mention" | "claimed" | "applied" | "demonstrated";

export type ConceptResult = {
  conceptId: string;
  label: string;
  status: RequirementStatus;
  confidence?: number | null;
  evidenceRefs: string[];
  evidenceStrength?: EvidenceStrength | null;
  reasonCode: string;
};

export type RequirementResult = {
  requirementId: string;
  status: RequirementStatus;
  score?: number | null;
  confidence?: number | null;
  evidenceRefs: string[];
  reasonCode: string;
  evidenceExplanation?: string;
  conceptResults?: ConceptResult[];
  groupOperator?: "atomic" | "all_of" | "any_of";
};

export type CompatibilityResult = {
  criterion: "work_mode" | "location";
  status: CompatibilityStatus;
  confidence?: number | null;
  reasonCode: string;
};

export type FactorResult = {
  factor: "requirement_coverage" | "skill" | "experience" | "language" | "semantic";
  status: "scored" | "not_applicable" | "unknown";
  rawScore?: number | null;
  reliability?: number | null;
  policyWeight?: number | null;
  effectiveWeight?: number | null;
  denseScore?: number | null;
  sparseScore?: number | null;
  evidenceRefs: string[];
  warningCode?: string | null;
};

export type MatchingPolicy = {
  policyVersion?: "balanced-v1" | "balanced-v2" | "skill-focus-v1" | "experience-focus-v1";
  mustHaveMode?: "strict" | "advisory";
  unknownHandling?: "manual_review" | "penalize";
  semanticMode?: "hybrid" | "dense_only" | "sparse_only";
  bm25Weight?: number;
  bm25ProviderMode?: "auto" | "in_memory" | "paradedb";
};

export type ScoreProvenance = {
  mode: "requirement_aware" | "semantic_only_estimated" | "unavailable";
  scoredFactors: string[];
  supportedRequirementCount: number;
  scoredRequirementCount: number;
  unknownRequirementCount: number;
  metRequirementCount?: number;
  notMetRequirementCount?: number;
  unsupportedRequirementCount?: number;
  totalRequirementCount: number;
  evidenceCoverage?: "complete" | "partial" | "unavailable";
  requirementCoverage?: number | null;
  factorContributions?: Record<string, number>;
};

export type CandidatePreferences = {
  acceptedWorkModes?: Array<"remote" | "hybrid" | "on_site">;
  acceptedLocations?: string[];
  willingToRelocate?: boolean | null;
};

export type MatchResult = {
  schemaVersion: string;
  pipelineVersion: string;
  resumeId: string;
  jobId: string;
  policyVersion: string;
  eligibility: EligibilityStatus;
  compatibilityStatus: CompatibilityStatus;
  diagnosticScore?: number | null;
  suitabilityScore: number | null;
  fitBand: FitBand;
  decision: MatchingDecision;
  requirementResults: RequirementResult[];
  compatibilityResults: CompatibilityResult[];
  factorResults: FactorResult[];
  scoreProvenance?: ScoreProvenance;
  warnings: string[];
  failedMustHaveRequirements?: string[];
};

export type CvScoringCriterion = {
  name: string;
  type: string;
  importance: number;
  match: number | null;
  score: number | null;
  evidence: string;
  criterion?: string;
  details?: string;
  match_score?: number | null;
  status?: RequirementStatus;
  confidence?: number;
  reasonCode?: string;
  evidenceRefs?: string[];
};

export type CvScoringResponse = {
  candidateId: string;
  jobId: string;
  score: {
    raw: number | null;
    max: number;
    normalized: number | null;
    percentage: number | null;
  };
  decision: CvScoringDecision;
  matchingDecision?: MatchingDecision;
  hardFilters: {
    passed: boolean;
    reasons: string[];
  };
  criteriaBreakdown: CvScoringCriterion[];
  summary: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  overallFeedback?: string;
  evidence?: {
    must_have: Array<{ requirement: string; status: "matched" | "missing"; snippets: string[] }>;
    nice_to_have: Array<{ requirement: string; status: "matched" | "missing"; snippets: string[] }>;
    constraints: Array<{ requirement: string; status: "matched" | "missing"; snippets: string[] }>;
  };
  metadata?: {
    scoringVersion?: string;
    timestamp?: string;
  };
  /* Core v2.1 Matching Extensions */
  eligibility?: EligibilityStatus;
  compatibilityStatus?: CompatibilityStatus;
  suitabilityScore?: number | null;
  diagnosticScore?: number | null;
  failedMustHaveRequirements?: string[];
  fitBand?: FitBand;
  factorResults?: FactorResult[];
  scoreProvenance?: ScoreProvenance;
  requirementResults?: RequirementResult[];
  compatibilityResults?: CompatibilityResult[];
  warnings?: string[];
  matchResult?: MatchResult;
};

// Hàm tiện ích trích xuất Cookie trong client-side
function getAuthHeaders(): Record<string, string> {
  if (typeof document !== 'undefined') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; access_token=`);
    if (parts.length === 2) {
      const token = parts.pop()?.split(';').shift();
      return { "Authorization": `Bearer ${token}` };
    }
  }
  return {};
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function sendVoiceChatMessage(request: ChatRequest): Promise<ChatVoiceResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/chat-voice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function createSession(params?: { type?: "Chat" | "Voice" | "Call"; language?: string }): Promise<{ sessionId: string }> {
  const res = await fetch(`${API_BASE_URL}/ai/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      type: params?.type ?? "Chat",
      language: params?.language ?? "English",
    }),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function getChatHistory(sessionId: string = "default-session"): Promise<ChatHistoryResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/history?sessionId=${encodeURIComponent(sessionId)}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    }
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function getAllSessions(): Promise<{ sessions: string[] }> {
  const res = await fetch(`${API_BASE_URL}/ai/sessions`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    }
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function closeSession(sessionId: string): Promise<{ sessionId: string; status: string; endedAt: string }> {
  const res = await fetch(`${API_BASE_URL}/ai/session/${encodeURIComponent(sessionId)}/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    }
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function startVideoCall(params: { roomId: string; sessionId?: string }): Promise<{ callId: string; roomId: string; startedAt: string }> {
  const res = await fetch(`${API_BASE_URL}/interview/video-calls/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function endVideoCall(callId: string): Promise<{ callId: string; endedAt: string }> {
  const res = await fetch(`${API_BASE_URL}/interview/video-calls/${encodeURIComponent(callId)}/end`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    }
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function sendVideoCallVoiceChatMessage(params: { callId: string; prompt: string; language: string }): Promise<VideoCallChatVoiceResponse> {
  const res = await fetch(`${API_BASE_URL}/interview/video-calls/${encodeURIComponent(params.callId)}/chat-voice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({ prompt: params.prompt, language: params.language }),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export function normalizeMatchResult(raw: any, candidateId: string, jobId: string): CvScoringResponse {
  const rawSuitability: number | null = typeof raw.suitabilityScore === "number"
    ? raw.suitabilityScore
    : typeof raw.suitability_score === "number"
    ? raw.suitability_score
    : typeof raw.score?.normalized === "number"
    ? raw.score.normalized
    : null;
  const rawDiagnosticScore: number | null = typeof raw.diagnosticScore === "number"
    ? raw.diagnosticScore
    : typeof raw.diagnostic_score === "number"
    ? raw.diagnostic_score
    : null;

  const rawEligibility = raw.eligibility;
  const eligibility: EligibilityStatus =
    rawEligibility === "eligible" || rawEligibility === "ineligible" || rawEligibility === "review_required"
      ? rawEligibility
      : "review_required";

  const rawFitBand = raw.fitBand || raw.fit_band;
  const fitBand: FitBand | undefined =
    rawFitBand === "strong_fit" ||
    rawFitBand === "partial_fit" ||
    rawFitBand === "review_required" ||
    rawFitBand === "not_eligible" ||
    rawFitBand === "insufficient_evidence"
      ? rawFitBand
      : undefined;

  const matchingDecision: MatchingDecision =
    raw.decision === "assessed" || raw.decision === "abstained"
      ? raw.decision
      : (rawSuitability === null || eligibility === "review_required" ? "abstained" : "assessed");

  // A score calculated while a must-have is unresolved is only an auxiliary
  // signal. Never expose it as the candidate's final suitability score.
  const suitability: number | null =
    matchingDecision === "assessed" && eligibility === "eligible" &&
    (fitBand === "strong_fit" || fitBand === "partial_fit")
      ? rawSuitability
      : null;
  const diagnosticScore = rawDiagnosticScore;
  const percentage: number | null = typeof suitability === "number"
    ? (typeof raw.score?.percentage === "number" ? raw.score.percentage : Math.round(suitability * 100))
    : (typeof diagnosticScore === "number" ? Math.round(diagnosticScore * 100) : null);

  const legacyDecision: CvScoringDecision =
    raw.decision === "PASS" || raw.decision === "FAIL"
      ? raw.decision
      : (matchingDecision === "assessed" && (fitBand === "strong_fit" || fitBand === "partial_fit") && eligibility === "eligible" ? "PASS" : "FAIL");

  const rawFactors = raw.factorResults || raw.factor_results;
  const factorResults: FactorResult[] = Array.isArray(rawFactors)
    ? rawFactors.map((f: any) => ({
        factor: f.factor,
        status: (f.status === "scored" || f.status === "not_applicable" || f.status === "unknown") ? f.status : "unknown",
        rawScore: typeof f.rawScore === "number" ? f.rawScore : (typeof f.raw_score === "number" ? f.raw_score : null),
        reliability: typeof f.reliability === "number" ? f.reliability : (typeof f.reliability_score === "number" ? f.reliability_score : null),
        policyWeight: typeof f.policyWeight === "number" ? f.policyWeight : (typeof f.policy_weight === "number" ? f.policy_weight : null),
        effectiveWeight: typeof f.effectiveWeight === "number" ? f.effectiveWeight : (typeof f.effective_weight === "number" ? f.effective_weight : null),
        denseScore: typeof f.denseScore === "number" ? f.denseScore : (typeof f.dense_score === "number" ? f.dense_score : null),
        sparseScore: typeof f.sparseScore === "number" ? f.sparseScore : (typeof f.sparse_score === "number" ? f.sparse_score : null),
        evidenceRefs: Array.isArray(f.evidenceRefs || f.evidence_refs) ? (f.evidenceRefs || f.evidence_refs) : [],
        warningCode: f.warningCode || f.warning_code || null,
      }))
    : [];

  const rawReqs = raw.requirementResults || raw.requirement_results;
  const requirementResults: RequirementResult[] = Array.isArray(rawReqs)
    ? rawReqs.map((r: any) => ({
        requirementId: r.requirementId || r.requirement_id || "",
        status: (r.status === "met" || r.status === "not_met" || r.status === "unknown" || r.status === "not_applicable")
          ? r.status
          : "unknown",
        score: typeof r.score === "number" ? r.score : null,
        confidence: typeof r.confidence === "number" ? r.confidence : null,
        evidenceRefs: Array.isArray(r.evidenceRefs || r.evidence_refs) ? (r.evidenceRefs || r.evidence_refs) : [],
        reasonCode: r.reasonCode || r.reason_code || "",
        evidenceExplanation: r.evidenceExplanation || r.evidence_explanation || undefined,
        conceptResults: Array.isArray(r.conceptResults || r.concept_results)
          ? (r.conceptResults || r.concept_results).map((c: any) => ({
              conceptId: c.conceptId || c.concept_id || "",
              label: c.label || "",
              status: (c.status === "met" || c.status === "not_met" || c.status === "unknown" || c.status === "not_applicable")
                ? c.status
                : "unknown",
              confidence: typeof c.confidence === "number" ? c.confidence : null,
              evidenceRefs: Array.isArray(c.evidenceRefs || c.evidence_refs) ? (c.evidenceRefs || c.evidence_refs) : [],
              evidenceStrength: c.evidenceStrength || c.evidence_strength || null,
              reasonCode: c.reasonCode || c.reason_code || "",
            }))
          : undefined,
        groupOperator: r.groupOperator || r.group_operator || "atomic",
      }))
    : [];

  const rawCompat = raw.compatibilityResults || raw.compatibility_results;
  const compatibilityResults: CompatibilityResult[] = Array.isArray(rawCompat)
    ? rawCompat.map((c: any) => ({
        criterion: c.criterion,
        status: (c.status === "compatible" || c.status === "incompatible" || c.status === "unknown" || c.status === "not_applicable")
          ? c.status
          : "unknown",
        confidence: typeof c.confidence === "number" ? c.confidence : null,
        reasonCode: c.reasonCode || c.reason_code || "",
      }))
    : [];

  const rawProvenance = raw.scoreProvenance || raw.score_provenance;
  const scoreProvenance: ScoreProvenance | undefined = rawProvenance && typeof rawProvenance === "object"
    ? {
        mode: rawProvenance.mode === "requirement_aware" || rawProvenance.mode === "semantic_only_estimated"
          ? rawProvenance.mode
          : "unavailable",
        scoredFactors: rawProvenance.scoredFactors || rawProvenance.scored_factors || [],
        supportedRequirementCount: rawProvenance.supportedRequirementCount ?? rawProvenance.supported_requirement_count ?? 0,
        scoredRequirementCount: rawProvenance.scoredRequirementCount ?? rawProvenance.scored_requirement_count ?? 0,
        unknownRequirementCount: rawProvenance.unknownRequirementCount ?? rawProvenance.unknown_requirement_count ?? 0,
        metRequirementCount: rawProvenance.metRequirementCount ?? rawProvenance.met_requirement_count,
        notMetRequirementCount: rawProvenance.notMetRequirementCount ?? rawProvenance.not_met_requirement_count,
        unsupportedRequirementCount: rawProvenance.unsupportedRequirementCount ?? rawProvenance.unsupported_requirement_count,
        totalRequirementCount: rawProvenance.totalRequirementCount ?? rawProvenance.total_requirement_count ?? 0,
        evidenceCoverage: rawProvenance.evidenceCoverage || rawProvenance.evidence_coverage,
        requirementCoverage: rawProvenance.requirementCoverage ?? rawProvenance.requirement_coverage ?? null,
        factorContributions: rawProvenance.factorContributions || rawProvenance.factor_contributions || {},
      }
    : undefined;

  const criteriaBreakdown: CvScoringCriterion[] = Array.isArray(raw.criteriaBreakdown)
    ? raw.criteriaBreakdown
    : requirementResults.map((r) => {
        const isMet = r.status === "met";
        const isNotMet = r.status === "not_met";
        const resolvedScore = typeof r.score === "number" ? r.score : (isMet ? 1.0 : isNotMet ? 0.0 : null);
        return {
          name: r.requirementId,
          type: isMet ? "must_have" : isNotMet ? "gap" : r.status,
          importance: 1.0,
          match: resolvedScore,
          score: resolvedScore,
          evidence: r.reasonCode || (isMet ? "Đáp ứng tiêu chí" : isNotMet ? "Chưa đáp ứng" : r.status === "not_applicable" ? "Không áp dụng" : "Chưa đủ bằng chứng"),
          status: r.status,
          confidence: r.confidence,
          reasonCode: r.reasonCode,
          evidenceRefs: r.evidenceRefs,
        };
      });

  const hardFilterReasons = Array.isArray(raw.hardFilters?.reasons)
    ? raw.hardFilters.reasons
    : requirementResults
        .filter((r) => r.status === "not_met")
        .map((r) => `Yêu cầu ${r.requirementId}: ${r.reasonCode || "Chưa đạt tiêu chí bắt buộc"}`);

  return {
    candidateId,
    jobId,
    score: {
      raw: typeof raw.score?.raw === "number"
        ? raw.score.raw
        : (typeof suitability === "number" ? Number((suitability * 10).toFixed(1)) : null),
      max: typeof raw.score?.max === "number" ? raw.score.max : 10,
      normalized: suitability,
      percentage,
    },
    decision: legacyDecision,
    matchingDecision,
    hardFilters: {
      passed: typeof raw.hardFilters?.passed === "boolean" ? raw.hardFilters.passed : eligibility === "eligible",
      reasons: hardFilterReasons,
    },
    criteriaBreakdown,
    summary: {
      strengths: Array.isArray(raw.summary?.strengths) ? raw.summary.strengths : [],
      weaknesses: Array.isArray(raw.summary?.weaknesses) ? raw.summary.weaknesses : [],
      suggestions: Array.isArray(raw.summary?.suggestions) ? raw.summary.suggestions : [],
    },
    overallFeedback: raw.overallFeedback || raw.overall_feedback,
    evidence: raw.evidence,
    metadata: {
      scoringVersion: raw.metadata?.scoringVersion || raw.pipelineVersion || raw.policyVersion || "2.1",
      timestamp: raw.metadata?.timestamp || new Date().toISOString(),
    },
    /* v2.1 fields */
    eligibility,
    compatibilityStatus: raw.compatibilityStatus || raw.compatibility_status || "not_applicable",
    suitabilityScore: suitability,
    diagnosticScore,
    failedMustHaveRequirements: Array.isArray(raw.failedMustHaveRequirements || raw.failed_must_have_requirements)
      ? (raw.failedMustHaveRequirements || raw.failed_must_have_requirements)
      : [],
    fitBand,
    factorResults,
    scoreProvenance,
    requirementResults,
    compatibilityResults,
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
    matchResult: raw.schemaVersion === "2.1" ? (raw as MatchResult) : undefined,
  };
}

export async function scoreCvAgainstJobProfile(params: {
  candidateId: string;
  jobId: string;
  matchingPolicy?: MatchingPolicy;
  candidatePreferences?: CandidatePreferences;
}): Promise<CvScoringResponse> {
  // First attempt modern matching endpoint /api/v1/matching/match-ids
  let res = await fetch(`${API_BASE_URL}/api/v1/matching/match-ids`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      candidateId: params.candidateId,
      jobId: params.jobId,
      cvId: params.candidateId,
      jobDescriptionId: params.jobId,
      matchingPolicy: params.matchingPolicy,
      candidatePreferences: params.candidatePreferences,
    }),
  });

  // If match-ids is not implemented, fallback to legacy /ai/score-cv-jp
  if (res.status === 404 || res.status === 405) {
    res = await fetch(`${API_BASE_URL}/ai/score-cv-jp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        candidateId: params.candidateId,
        jobId: params.jobId,
        cvId: params.candidateId,
        jobDescriptionId: params.jobId,
        matchingPolicy: params.matchingPolicy,
        candidatePreferences: params.candidatePreferences,
      }),
    });
  }

  if (!res.ok) {
    let message = "Network response was not ok";
    try {
      const payload = (await res.json()) as { message?: string; error?: string; detail?: string };
      message = payload.message || payload.error || payload.detail || message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }

  const rawData = await res.json();
  return normalizeMatchResult(rawData, params.candidateId, params.jobId);
}

export async function matchCvDirect(payload: {
  schemaVersion: "2.1";
  resume: any;
  job: any;
  matchingPolicy?: MatchingPolicy;
  candidatePreferences?: CandidatePreferences;
  asyncProcessing?: boolean;
}): Promise<MatchResult> {
  const res = await fetch(`${API_BASE_URL}/api/v1/matching/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      ...payload,
      asyncProcessing: payload.asyncProcessing ?? false,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Matching failed");
  }
  return res.json();
}

export type InterviewQuestionPlan = {
  position: string;
  language: string;
  count: number;
  /** Legacy fields (cũ – có thể không có) */
  sessionId?: string;
  candidateId?: string;
  jobId?: string;
  stages?: Array<{ name: string; targetCount: number }>;
};

export type InterviewQuestionItem = {
  id: string;
  order: number;
  /** Tên stage (nếu có plan đa giai đoạn) */
  stage?: string;
  /** Vị trí/vai trò phỏng vấn */
  position?: string;
  question: string;
  question_text?: string;
  created_at?: string;
};

/**
 * Generate interview questions cho một session.
 *
 * **Kết nối BE**: `POST /ai/session/{session_id}/questions/generate`
 *
 * BE nhận: `{ count, position, language }`
 * BE trả: `{ sessionId, questions: string[], plan: { position, language, count } }`
 *
 * @param params.sessionId  ID session đã tạo bằng createSession()
 * @param params.position   Vị trí/chủ đề phỏng vấn (ví dụ "Software Engineer")
 * @param params.count      Số câu hỏi (1-20, mặc định 5)
 * @param params.language   Ngôn ngữ ("English" | "Vietnamese")
 */
export async function generateInterviewQuestions(params: {
  sessionId: string;
  position?: string;
  count?: number;
  language?: string;
}): Promise<{ sessionId: string; questions: string[]; plan: { position: string; language: string; count: number } }> {
  const res = await fetch(
    `${API_BASE_URL}/ai/session/${encodeURIComponent(params.sessionId)}/questions/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        count: params.count ?? 5,
        position: params.position ?? "General",
        language: params.language ?? "English",
      }),
    }
  );
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

/**
 * Download file CV gốc (PDF/DOCX) của user hiện tại.
 *
 * **Kết nối BE**: `GET /users/me/cvs/{cv_id}/download`
 *
 * @returns ArrayBuffer của file CV
 * @deprecated Dùng `cvDownloadApi.download(cvId)` từ `@lib/apiClient` để có thêm filename.
 */
export async function downloadCv(cvId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE_URL}/users/me/cvs/${encodeURIComponent(cvId)}/download`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to download CV");
  return res.arrayBuffer();
}

/** @deprecated Use downloadCv() instead */
export const downloadCvPdf = downloadCv;
