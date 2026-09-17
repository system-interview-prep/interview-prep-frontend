
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

export type RequirementResult = {
  requirementId: string;
  status: RequirementStatus;
  score?: number | null;
  confidence: number;
  evidenceRefs: string[];
  reasonCode: string;
};

export type CompatibilityResult = {
  criterion: "work_mode" | "location";
  status: CompatibilityStatus;
  confidence: number;
  reasonCode: string;
};

export type FactorResult = {
  factor: "skill" | "experience" | "language" | "semantic";
  status: "scored" | "not_applicable" | "unknown";
  rawScore?: number | null;
  reliability: number;
  policyWeight: number;
  effectiveWeight: number;
  denseScore?: number | null;
  sparseScore?: number | null;
  evidenceRefs: string[];
  warningCode?: string | null;
};

export type MatchingPolicy = {
  policyVersion?: "balanced-v1" | "skill-focus-v1" | "experience-focus-v1";
  mustHaveMode?: "strict" | "advisory";
  unknownHandling?: "manual_review" | "penalize";
  semanticMode?: "hybrid" | "dense_only" | "sparse_only";
  bm25Weight?: number;
  bm25ProviderMode?: "auto" | "in_memory" | "paradedb";
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
  suitabilityScore: number | null;
  fitBand: FitBand;
  decision: MatchingDecision;
  requirementResults: RequirementResult[];
  compatibilityResults: CompatibilityResult[];
  factorResults: FactorResult[];
  warnings: string[];
};

export type CvScoringCriterion = {
  name: string;
  type: string;
  importance: number;
  match: number;
  score: number;
  evidence: string;
  criterion?: string;
  details?: string;
  match_score?: number;
};

export type CvScoringResponse = {
  candidateId: string;
  jobId: string;
  score: {
    raw: number;
    max: number;
    normalized: number;
    percentage: number;
  };
  decision: CvScoringDecision;
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
  fitBand?: FitBand;
  factorResults?: FactorResult[];
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
  const suitability = typeof raw.suitabilityScore === "number"
    ? raw.suitabilityScore
    : typeof raw.suitability_score === "number"
    ? raw.suitability_score
    : (raw.score?.normalized ?? 0);

  const percentage = typeof raw.score?.percentage === "number"
    ? raw.score.percentage
    : Math.round(suitability * 100);

  const eligibility: EligibilityStatus = raw.eligibility || "eligible";
  const fitBand: FitBand = raw.fitBand || raw.fit_band || (percentage >= 70 ? "strong_fit" : percentage >= 45 ? "partial_fit" : "not_eligible");
  const decision: CvScoringDecision = raw.decision === "PASS" || raw.decision === "FAIL"
    ? raw.decision
    : ((fitBand === "strong_fit" || fitBand === "partial_fit") && eligibility === "eligible" ? "PASS" : "FAIL");

  const rawFactors = raw.factorResults || raw.factor_results || [];
  const factorResults: FactorResult[] = Array.isArray(rawFactors)
    ? rawFactors.map((f: any) => ({
        factor: f.factor,
        status: f.status || "scored",
        rawScore: typeof f.rawScore === "number" ? f.rawScore : f.raw_score,
        reliability: typeof f.reliability === "number" ? f.reliability : 1.0,
        policyWeight: typeof f.policyWeight === "number" ? f.policyWeight : (f.policy_weight ?? 0.25),
        effectiveWeight: typeof f.effectiveWeight === "number" ? f.effectiveWeight : (f.effective_weight ?? 0.25),
        denseScore: typeof f.denseScore === "number" ? f.denseScore : f.dense_score,
        sparseScore: typeof f.sparseScore === "number" ? f.sparseScore : f.sparse_score,
        evidenceRefs: Array.isArray(f.evidenceRefs || f.evidence_refs) ? (f.evidenceRefs || f.evidence_refs) : [],
        warningCode: f.warningCode || f.warning_code || null,
      }))
    : [];

  const rawReqs = raw.requirementResults || raw.requirement_results || [];
  const requirementResults: RequirementResult[] = Array.isArray(rawReqs)
    ? rawReqs.map((r: any) => ({
        requirementId: r.requirementId || r.requirement_id || "req",
        status: r.status || "unknown",
        score: typeof r.score === "number" ? r.score : null,
        confidence: typeof r.confidence === "number" ? r.confidence : 1.0,
        evidenceRefs: Array.isArray(r.evidenceRefs || r.evidence_refs) ? (r.evidenceRefs || r.evidence_refs) : [],
        reasonCode: r.reasonCode || r.reason_code || "",
      }))
    : [];

  const rawCompat = raw.compatibilityResults || raw.compatibility_results || [];
  const compatibilityResults: CompatibilityResult[] = Array.isArray(rawCompat)
    ? rawCompat.map((c: any) => ({
        criterion: c.criterion,
        status: c.status,
        confidence: typeof c.confidence === "number" ? c.confidence : 1.0,
        reasonCode: c.reasonCode || c.reason_code || "",
      }))
    : [];

  const criteriaBreakdown: CvScoringCriterion[] = Array.isArray(raw.criteriaBreakdown)
    ? raw.criteriaBreakdown
    : requirementResults.map((r) => ({
        name: r.requirementId,
        type: r.status === "met" ? "must_have" : "gap",
        importance: 1.0,
        match: r.score ?? (r.status === "met" ? 1.0 : 0.0),
        score: r.score ?? (r.status === "met" ? 1.0 : 0.0),
        evidence: r.reasonCode || (r.status === "met" ? "Đáp ứng tiêu chí" : "Chưa đủ bằng chứng"),
      }));

  const hardFilterReasons = Array.isArray(raw.hardFilters?.reasons)
    ? raw.hardFilters.reasons
    : requirementResults
        .filter((r) => r.status === "not_met")
        .map((r) => `Yêu cầu ${r.requirementId}: ${r.reasonCode || "Chưa đạt tiêu chí bắt buộc"}`);

  return {
    candidateId,
    jobId,
    score: {
      raw: typeof raw.score?.raw === "number" ? raw.score.raw : Number((suitability * 10).toFixed(1)),
      max: typeof raw.score?.max === "number" ? raw.score.max : 10,
      normalized: suitability,
      percentage,
    },
    decision,
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
    fitBand,
    factorResults,
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
  sessionId: string;
  candidateId: string;
  jobId: string;
  language: string;
  stages: Array<{ name: string; targetCount: number }>;
};

export type InterviewQuestionItem = {
  id: string;
  order: number;
  stage: string;
  category: string;
  difficulty: string;
  question_text: string;
  expected_signals: string[];
  source_refs: { cv: string[]; jp: string[] };
  created_at: string;
};

export async function generateInterviewQuestions(params: {
  sessionId: string;
  candidateId: string;
  jobId: string;
  language?: string;
  totalQuestions?: number;
  force?: boolean;
}): Promise<{ plan: InterviewQuestionPlan; questions: InterviewQuestionItem[] }> {
  const res = await fetch(
    `${API_BASE_URL}/ai/session/${encodeURIComponent(params.sessionId)}/questions/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        candidateId: params.candidateId,
        jobId: params.jobId,
        language: params.language || "Vietnamese",
        totalQuestions: params.totalQuestions,
        force: Boolean(params.force),
      }),
    }
  );
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function downloadCvPdf(candidateId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE_URL}/users/me/cvs/${encodeURIComponent(candidateId)}/download`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to download CV PDF");
  return res.arrayBuffer();
}
