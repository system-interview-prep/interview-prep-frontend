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
};

export type EndReason =
  | "COMPLETED"
  | "NORMAL_COMPLETION"
  | "USER_ENDED"
  | "CANDIDATE_ABORT"
  | "HARD_TIMEOUT"
  | "FAST_FAIL_TECH"
  | "FAST_FAIL_VALIDATION"
  | "TECHNICAL_FAILURE";

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

export const interviewChatApi = {
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
