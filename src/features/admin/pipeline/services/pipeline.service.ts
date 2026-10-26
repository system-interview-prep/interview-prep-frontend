import { apiClient } from "@/lib/apiClient";

/**
 * Admin view of what the AI did for an interview (backend:
 * src/modules/interviews/application/pipeline_view.py and pipeline_health.py).
 */

export type StageKey = "created" | "entry" | "plan" | "questions" | "interview" | "evaluation" | "report";
export type StageStatus = "done" | "running" | "error" | "pending" | "skipped";
export type EventStatus = "started" | "completed" | "error" | "warning" | "info";

export type PipelineStage = {
  key: StageKey;
  status: StageStatus;
  startedAt: string | null;
  endedAt: string | null;
  durationMs: number | null;
  note: string | null;
};

export type PipelineEvent = {
  id: number | null;
  at: string | null;
  stage: string;
  event: string;
  status: EventStatus;
  turnIndex: number | null;
  durationMs: number | null;
  payload: Record<string, unknown>;
};

export type TurnExchange = {
  at: string | null;
  action: string | null;
  stage: string | null;
  intent: string | null;
  sufficiency: string | null;
  missingAspect: string | null;
  probeKind: "gap" | "deepen" | null;
  preScore: number | null;
  ackSource: string | null;
  ackReason: string | null;
  generatedBy: string | null;
  repeatsRecent: boolean | null;
  hardAnswerTimeout: boolean | null;
  answerChars: number | null;
  interviewer: string | null;
  coreMs: number | null;
  modality: string | null;
  /** Speech control (backend core/speech_checks.py); missing on turns before 25/10. */
  ackRaw?: string | null;
  speechPlan?: SpeechPlanStep[];
  speechChecks?: SpeechCheck[];
  newTerms?: string[];
  transition?: boolean | null;
  /** LLM monitoring (backend application/llm_checks.py, core/llm_tracing.py). */
  decisionRule?: string | null;
  flags?: string[];
  langfuseTraceId?: string | null;
};

/** Links into Langfuse; null when Langfuse is not configured or not reachable. */
export type LangfuseLinks = { projectUrl: string; sessionUrl?: string } | null;

/** Where one part of the reply came from: ACK | TRANSITION | QUESTION. */
export type SpeechPlanStep = { act: string; source: string };

/** One decision of a speech guard on an AI line. */
export type SpeechCheck = {
  kind: "ack" | "probe" | "clarify" | "qna" | "compose" | string;
  outcome: "pass" | "reject" | "fix" | "error" | string;
  reason?: string | null;
  draft?: string | null;
};

export type RubricPoint = {
  key?: string;
  description?: string;
  importance?: string;
  status?: string;
  quote?: string;
  adjusted?: boolean;
};

export type VoiceIncident = {
  at: string | null;
  event: string;
  status: EventStatus;
  reason?: string;
  action?: string;
  after_s?: number;
  confidence?: number;
  words?: number;
  error_type?: string;
  component?: string;
  provider?: string;
  available?: boolean;
};

export type PipelineTurn = {
  turnId: string;
  turnIndex: number;
  status: string;
  stage: string | null;
  source: string | null;
  difficulty: string | null;
  target: string | null;
  questionText: string | null;
  spokenRejected: boolean;
  answerSeconds: number | null;
  followups: { type: string; content: string; generatedBy: string | null; missingAspect: string | null }[];
  askedAt: string | null;
  lastAnswerAt: string | null;
  answerCount: number;
  exchanges: TurnExchange[];
  voiceIncidents: VoiceIncident[];
  grade: { score: number | null; outcome: string | null; rubricPoints: RubricPoint[]; feedback: string | null } | null;
};

export type AiCall = {
  id: number | null;
  at: string | null;
  sessionId: string | null;
  purpose: string | null;
  provider: string | null;
  model: string | null;
  status: "ok" | "error";
  durationMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  inputChars: number | null;
  outputChars: number | null;
  errorType: string | null;
  errorMessage: string | null;
  inputPreview?: string | null;
  outputPreview?: string | null;
};

export type AiCallSummary = {
  total: number;
  errors: number;
  totalMs: number;
  p50Ms: number | null;
  p95Ms: number | null;
  inputTokens: number;
  outputTokens: number;
  byPurpose: {
    purpose: string;
    count: number;
    errors: number;
    avgMs: number | null;
    p95Ms: number | null;
    inputTokens: number;
    outputTokens: number;
  }[];
};

export type PlanTarget = {
  label: string;
  importance: number | null;
  questionCount: number | null;
  matchStatuses: string[];
  priorities: string[];
};

export type PlanDifficulty = {
  level?: string;
  source?: string;
  jobLevel?: string;
  practiceTier?: string;
  fitAdjustment?: { direction: "easier" | "harder"; reasons: string[]; matchPercent: number | null };
};

export type SessionPipeline = {
  session: {
    id: string;
    status: string | null;
    mode: string | null;
    durationMinutes: number | null;
    locale: string | null;
    startedAt: string | null;
    endedAt: string | null;
    endReason: string | null;
    jobTitle: string | null;
    companyName: string | null;
    candidateEmail: string | null;
    candidateName: string | null;
  };
  live: boolean;
  liveState: LiveState | null;
  timing: {
    startedAt: string | null;
    endedAt: string | null;
    elapsedMs: number | null;
    budgetMinutes: number | null;
    remainingMs: number | null;
  };
  currentTurnIndex: number | null;
  /** gradable: answered main questions, what grading scores (absent before 26/10). */
  turnCounts: { total: number; warmup: number; main: number; gradable?: number };
  langfuse?: LangfuseLinks;
  voice: VoiceSummary | null;
  stages: PipelineStage[];
  entry: {
    matchPercent: number | null;
    fitBand: string | null;
    eligibility: string | null;
    matchingDecision: string | null;
    warnings: string[];
    practiceTier: "basic" | "standard" | "challenge" | null;
    blocked: boolean;
    blockedReason: string | null;
    policy: { minMatchPercent: number; lowFitPercent: number; challengePercent: number; blockNotEligible: boolean };
  };
  plan: {
    status: string | null;
    policyVersion: string | null;
    questionBudget: number | null;
    difficulty: PlanDifficulty | null;
    targets: PlanTarget[];
    questionSources: Record<string, number>;
    generatedQuestionCount: number | null;
    uncoveredTargets: unknown[];
    practiceTier: string | null;
  };
  questions: {
    turnsCount: number;
    sources: Record<string, number>;
    fallbackCount: number | null;
    generatedQuestionCount: number | null;
    generation: { conceptId: string | null; requested: number | null; filed: number | null; rejected: number | null }[];
    spoken: { saved: number; rejected: number; total: number; rejectedTurnIds: string[] } | null;
    uncoveredTargets: unknown[];
  };
  turns: PipelineTurn[];
  warnings: PipelineEvent[];
  evaluation: {
    job: { status: string; attemptCount: number; lastError: string | null; leaseUntil: string | null; updatedAt: string | null } | null;
    progress: { graded: number; total: number | null } | null;
    gradedTurns: { turnIndex: number | null; score: number | null; outcome: string | null; graded: boolean; method: string; at: string | null }[];
    coverage: { ratio: number | null; uncovered: unknown[] } | null;
    decisionCapped: { originalDecision: string | null; coverageRatio: number | null } | null;
    overallScore: number | null;
    decision: string | null;
    evaluatedAt: string | null;
  };
  ai: AiCallSummary & { recent: AiCall[] };
  events: PipelineEvent[];
  eventsTruncated: boolean;
  generatedAt: string;
};

export type Rate = { count: number; total: number; rate: number | null };

/** What the room is doing now (backend: pipeline_view.live_state, voice_events.VOICE_STATES). */
export type LiveStateKey =
  | "ai_speaking"
  | "waiting_answer"
  | "candidate_speaking"
  | "answer_pending"
  | "processing"
  | "candidate_away"
  | "grading"
  | "preparing"
  | "not_started";

export type LiveState = {
  state: LiveStateKey | null;
  since: string | null;
  source: "voice" | "messages" | "job" | "events" | "derived";
  kind?: string | null;
  step?: string;
};

export type VoiceSummary = {
  ttsTtfbP50Ms: number | null;
  ttsTtfbP95Ms: number | null;
  coreP50Ms: number | null;
  coreP95Ms: number | null;
  answers: number;
  notHeard: number;
  unclear: number;
  replayed: number;
  reprompts: number;
  interruptions: number;
  coreFailures: number;
  providerDegraded: number;
  ttsFallback: number;
  candidateLeft: number;
  sttModel: string | null;
  ttsProvider: string | null;
};

export type BoardStepKey =
  | "planning"
  | "selecting"
  | "not_started"
  | "interviewing"
  | "grading"
  | "grading_failed"
  | "finished";

export type LiveBoardGroup = "all" | "attention" | "interviewing" | "preparing" | "grading" | "finished";

export type LiveBoardQuery = { group?: LiveBoardGroup; q?: string; limit?: number; offset?: number };

export type LiveBoardPage = {
  sessions: (LiveSession & { group?: Exclude<LiveBoardGroup, "all" | "attention">; attention?: boolean })[];
  total: number;
  counts: Record<LiveBoardGroup, number>;
  limit: number;
  offset: number;
  generatedAt: string;
};

export type RoomObserverSeat = {
  serverUrl: string;
  participantToken: string;
  roomName: string;
  mode: string;
  logged: boolean;
};

export type LiveSession = {
  id: string;
  candidateName: string | null;
  candidateEmail: string | null;
  jobTitle: string | null;
  mode: string | null;
  status: string | null;
  startedAt: string | null;
  elapsedMs: number | null;
  budgetMinutes: number | null;
  turns: { total: number; answered: number; current: number | null; warmup: number };
  step: {
    step: BoardStepKey;
    state?: LiveStateKey | null;
    kind?: string | null;
    since?: string | null;
    graded?: number;
    total?: number | null;
    endReason?: string | null;
  };
  warnings: number;
  errors: number;
  ackFallbacks: number;
  lastEventAt: string | null;
};

export type AlertKind =
  | "grading_failed"
  | "grading_stuck"
  | "live_errors"
  | "plan_stuck"
  | "voice_degraded"
  | "interview_idle"
  | "ack_fallback_rate"
  | "probe_fallback_rate"
  | "turn_latency"
  | "ai_errors";

export type AdminAlert = {
  kind: AlertKind;
  severity: "error" | "warning";
  count: number;
  sessions: { id: string; candidate: string | null; jobTitle: string | null }[];
  lastAt: string | null;
  total?: number;
  rate?: number | null;
  threshold?: number;
  minutes?: number;
  p95Ms?: number;
  thresholdMs?: number;
};

export type AdminAlerts = {
  alerts: AdminAlert[];
  counts: { error: number; warning: number };
  generatedAt: string;
};

export type CandidateAnswer = { type: string | null; at: string | null; text: string; truncated: boolean; chars: number };

export type AccessLog = {
  id: number;
  adminEmail: string | null;
  action: string;
  sessionId: string | null;
  targetId: string | null;
  detail: Record<string, unknown>;
  candidate: string | null;
  at: string | null;
};

/** Pushed by the backend after each write (socket.io /admin-pipeline, event "pipeline.event"). */
export type PipelineLiveSummary = {
  sessionId: string | null;
  at: string;
  events: { event: string; stage: string; status: EventStatus; turnIndex: number | null }[];
  aiCalls: number;
  aiErrors: number;
  problems: number;
};

export type AiHealth = {
  windowDays: number;
  since: string;
  turns: {
    count: number;
    sessions: number;
    p50Ms: number | null;
    p95Ms: number | null;
    ackFallback: Rate;
    probeFallback: Rate;
    repeatedAck: Rate;
  };
  spokenRewriteRejected: Rate;
  steps: { stage: string; completed: number; errors: number; p50Ms: number | null; p95Ms: number | null }[];
  warnings: { event: string; status: string; count: number; sessions: number; lastAt: string | null }[];
  ai: {
    calls: number;
    errors: Rate;
    p50Ms: number | null;
    p95Ms: number | null;
    inputTokens: number;
    outputTokens: number;
    byPurpose: { purpose: string; calls: number; errors: number; p50Ms: number | null; p95Ms: number | null; tokens: number }[];
  };
  daily: { day: string | null; turns: number; turnP95Ms: number | null; errors: number }[];
  evaluation: { done: number; failed: number; processing: number; retried: number; failureRate: Rate };
  stuck: {
    sessionId: string;
    reason: "evaluation_lease_expired" | "evaluation_failed" | "plan_not_ready" | "interview_idle";
    status: string | null;
    candidateEmail: string | null;
    jobTitle: string | null;
    updatedAt: string | null;
  }[];
  /** Rule flags on turns in the window (application/llm_checks.py). */
  flags?: { flag: string; count: number; sessions: number }[];
  /** Why the engine acted, per turn. */
  decisionRules?: { rule: string; count: number }[];
  langfuse?: LangfuseLinks;
  generatedAt: string;
};

/** Admin page "Lời nói AI" (GET /admin/ai/speech). */
export type SpeechControl = {
  windowDays: number;
  since: string;
  truncated: boolean;
  config: {
    speechV2: boolean;
    ackMode: string;
    dialect: string;
    maxNhePerTurn: number;
    interjectionShare: number;
    interjectionWindow: number;
    model: string;
  };
  turns: { count: number; sessions: number; withChecks: number };
  guards: {
    kind: string;
    turns: number;
    pass: number;
    reject: number;
    fix: number;
    error: number;
    rejectRate: Rate;
    errorRate: Rate;
  }[];
  reasons: { kind: string; outcome: string; reason: string; count: number; sessions: number }[];
  sources: { ack: { source: string; count: number }[]; question: { source: string; count: number }[] };
  style: { interjectionOpenings: Rate; overNhe: Rate; repeatedAck: Rate; newTermsTurns: Rate };
  newTerms: { term: string; count: number }[];
  recent: {
    at: string | null;
    sessionId: string;
    turnIndex: number | null;
    kind: string;
    outcome: string;
    reason: string | null;
    draft: string | null;
    said: string | null;
    eventId: number | null;
    checkIndex: number;
    verdict: SpeechVerdict | null;
  }[];
  /** Admins' hand checks: a refusal of a good line is a false block. */
  review?: { falseBlocks: Rate; byKind: { kind: string; falseBlocks: Rate }[] };
  generatedAt: string;
};

export type SpeechVerdict = "correct" | "wrong";

export type AiCallFilters = {
  purpose?: string;
  status?: "ok" | "error";
  sessionId?: string;
  days?: number;
  limit?: number;
  offset?: number;
};

export const pipelineService = {
  async session(sessionId: string): Promise<SessionPipeline> {
    const response = await apiClient.get<{ success: boolean } & SessionPipeline>(
      `/admin/sessions/${encodeURIComponent(sessionId)}/pipeline`,
    );
    return response.data;
  },
  async health(days: number): Promise<AiHealth> {
    const response = await apiClient.get<{ success: boolean } & AiHealth>("/admin/ai/health", { params: { days } });
    return response.data;
  },
  async speech(days: number): Promise<SpeechControl> {
    const response = await apiClient.get<{ success: boolean } & SpeechControl>("/admin/ai/speech", { params: { days } });
    return response.data;
  },
  /** Mark a refused or edited line as blocked correctly, a good line blocked, or clear the mark. */
  async reviewSpeech(eventId: number, checkIndex: number, verdict: SpeechVerdict | "clear"): Promise<SpeechVerdict | null> {
    const response = await apiClient.post<{ success: boolean; verdict: SpeechVerdict | null }>("/admin/ai/speech/reviews", {
      eventId,
      checkIndex,
      verdict,
    });
    return response.data.verdict;
  },
  async calls(filters: AiCallFilters): Promise<{ total: number; summary: AiCallSummary; calls: AiCall[] }> {
    const response = await apiClient.get<{ success: boolean; total: number; summary: AiCallSummary; calls: AiCall[] }>(
      "/admin/ai/calls",
      { params: filters },
    );
    return response.data;
  },
  /** One filtered page of the live board; `counts` covers every live session. */
  async live(params: LiveBoardQuery = {}): Promise<LiveBoardPage> {
    const response = await apiClient.get<{ success: boolean } & LiveBoardPage>("/admin/sessions/live", {
      params: { ...params, q: params.q || undefined },
    });
    return response.data;
  },
  async alerts(): Promise<AdminAlerts> {
    const response = await apiClient.get<{ success: boolean } & AdminAlerts>("/admin/ai/alerts");
    return response.data;
  },
  /** A hidden, listen-only seat in a running voice/video interview room. Each seat is written to the access log. */
  async observe(sessionId: string): Promise<RoomObserverSeat> {
    const response = await apiClient.post<{ success: boolean } & RoomObserverSeat>(
      `/admin/sessions/${encodeURIComponent(sessionId)}/observe`,
    );
    return response.data;
  },
  /** The candidate's answers to one question. Each call is written to the access log. */
  async answers(sessionId: string, turnId: string): Promise<CandidateAnswer[]> {
    const response = await apiClient.get<{ success: boolean; answers: CandidateAnswer[] }>(
      `/admin/sessions/${encodeURIComponent(sessionId)}/turns/${encodeURIComponent(turnId)}/answers`,
    );
    return response.data.answers;
  },
  async accessLogs(
    limit: number,
    offset: number,
    kind: "all" | "reads" | "changes" = "all",
  ): Promise<{ total: number; logs: AccessLog[] }> {
    const response = await apiClient.get<{ success: boolean; total: number; logs: AccessLog[] }>(
      "/admin/access-logs",
      { params: { limit, offset, kind } },
    );
    return response.data;
  },
  async call(callId: string): Promise<AiCall> {
    const response = await apiClient.get<{ success: boolean; call: AiCall }>(
      `/admin/ai/calls/${encodeURIComponent(callId)}`,
    );
    return response.data.call;
  },
};
