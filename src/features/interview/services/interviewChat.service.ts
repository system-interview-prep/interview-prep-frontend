import apiClient from "@/lib/apiClient";

export type ChatRole = "user" | "assistant" | "system";

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
  stage?: string;
  competency?: string;
  questionVersionId?: string | null;
  questionType?: string;
  language?: string;
  starterCode?: string;
  testCasesCode?: string;
};

export type EndReason = "COMPLETED" | "USER_ENDED" | "TECHNICAL_FAILURE";

export type ChatRuntimeTurn = {
  turnId: string;
  turnIndex: number;
  stage?: string;
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
