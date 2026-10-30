import apiClient from "@/lib/apiClient";

export type ChatRole = "user" | "assistant" | "system";

export type InterviewStage =
  | "WARM_UP"
  | "VALIDATE"
  | "DEEP_DIVE"
  | "CHALLENGE"
  | "BEHAVIORAL"
  | "CLOSING"
  | "CLOSED";

export type ChatMessageType =
  | "GREETING"
  | "MAIN_QUESTION"
  | "CLARIFY"
  | "PROBE"
  | "CANDIDATE_ANSWER"
  | "CANDIDATE_QUESTION"
  | "ACKNOWLEDGMENT"
  | "WRAP_UP"
  | "CONFIRM_ABORT";

export type ChatMessage = {
  messageId: string;
  sessionId: string;
  role: ChatRole;
  messageType: ChatMessageType;
  turnId?: string | null;
  sequence: number;
  content: string;
  metadata?: Record<string, unknown>;
  clientMessageId?: string | null;
  createdAt: string;
};

export type CurrentTurnInfo = {
  turnId: string;
  turnIndex: number;
  stage?: InterviewStage | string;
  competency?: string;
  questionVersionId?: string | null;
  questionType?: string;
  language?: string;
  starterCode?: string;
  testCasesCode?: string;
  /** Clean wording of the question being answered (no acknowledgement prefix). */
  questionText?: string | null;
  /** The open follow-up (probe) on this question, if any. */
  followUpText?: string | null;
  /** When this question was asked, for the per-question timer. */
  startedAt?: string | null;
  softAnswerSeconds?: number | null;
  hardAnswerSeconds?: number | null;
};

export type EndReason =
  | "COMPLETED"
  | "NORMAL_COMPLETION"
  | "USER_ENDED"
  | "CANDIDATE_ABORT"
  | "HARD_TIMEOUT"
  | "FAST_FAIL_TECH"
  | "FAST_FAIL_VALIDATION"
  | "TECHNICAL_FAILURE"
  | "CANDIDATE_LEFT";

export type ChatRuntimeTurn = {
  turnId: string;
  turnIndex: number;
  stage?: InterviewStage | string;
  status: string;
  questionType?: string;
  language?: string;
  starterCode?: string;
  testCasesCode?: string;
};

export type ChatRuntimeResponse = {
  sessionId: string;
  sessionStatus: "OPEN" | "CLOSED";
  experienceType: "interview_chat" | "question_practice";
  endReason?: EndReason | null;
  jobTitle: string;
  totalTurns: number;
  currentTurnIndex: number;
  currentTurn: CurrentTurnInfo | null;
  messages: ChatMessage[];
  isAwaitingCandidate: boolean;
  durationMinutes?: number;
  startedAt?: string | null;
  workingMemory?: {
    current_stage?: InterviewStage | string;
    elapsed_time?: number;
    remaining_time?: number;
    [key: string]: unknown;
  };
  turns?: ChatRuntimeTurn[];
};

export type SendChatMessageRequest = {
  clientMessageId?: string;
  content: string;
  telemetry?: Record<string, unknown>;
};

export type SendChatMessageResponse = {
  userMessage: ChatMessage;
  assistantResponse: ChatMessage;
  turnStatus: {
    turnId?: string;
    turnIndex?: number;
    isFollowUp?: boolean;
    completed: boolean;
  };
  sessionStatus: "OPEN" | "CLOSED";
  endReason?: EndReason | null;
  action?: string;
  currentStage?: InterviewStage | string;
  currentTurnIndex?: number;
  remainingTimeSeconds?: number;
};

export type CompleteChatResponse = {
  sessionId: string;
  sessionStatus: "CLOSED";
  endReason?: EndReason | null;
  endedAt: string;
  summary: string;
};

export type ChatPresenceResponse = {
  open: boolean;
  /** When the candidate had left the room (page closed), if they just came back. */
  awaySince: string | null;
  /** Minutes away after which the interview is closed as CANDIDATE_LEFT. */
  graceMinutes: number;
};

export const interviewChatApi = {
  /** Heartbeat while the chat room is open; clears a "left" mark. */
  presence: async (sessionId: string): Promise<ChatPresenceResponse> => {
    const res = await apiClient.post<ChatPresenceResponse>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/chat/presence`,
      { state: "here" }
    );
    return res.data;
  },

  /**
   * "The candidate closed the page", sent while the page unloads: a keepalive
   * fetch outlives the page (axios does not), and unlike sendBeacon it can
   * carry the Authorization header.
   */
  presenceLeft: (sessionId: string): void => {
    if (typeof window === "undefined") return;
    try {
      const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
      const token = localStorage.getItem("accessToken") ?? (match ? decodeURIComponent(match[1]) : null);
      const base = String(apiClient.defaults.baseURL ?? "").replace(/\/$/, "");
      void fetch(`${base}/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/chat/presence`, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ state: "left" }),
      }).catch(() => undefined);
    } catch {
      // Best effort: the missing heartbeat closes an abandoned room too.
    }
  },

  start: async (sessionId: string): Promise<ChatRuntimeResponse> => {
    const res = await apiClient.post<ChatRuntimeResponse>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/chat/start`
    );
    return res.data;
  },

  getRuntime: async (sessionId: string): Promise<ChatRuntimeResponse> => {
    const res = await apiClient.get<ChatRuntimeResponse>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/chat/runtime`
    );
    return res.data;
  },

  sendMessage: async (
    sessionId: string,
    payload: SendChatMessageRequest
  ): Promise<SendChatMessageResponse> => {
    const res = await apiClient.post<SendChatMessageResponse>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/chat/message`,
      payload
    );
    return res.data;
  },

  complete: async (
    sessionId: string,
    reason: EndReason = "USER_ENDED"
  ): Promise<CompleteChatResponse> => {
    const res = await apiClient.post<CompleteChatResponse>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/chat/complete`,
      { reason }
    );
    return res.data;
  },
};
