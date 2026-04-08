
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
  metadata?: {
    scoringVersion?: string;
    timestamp?: string;
  };
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

export async function scoreCvAgainstJobProfile(params: {
  candidateId: string;
  jobId: string;
}): Promise<CvScoringResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/score-cv-jp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let message = "Network response was not ok";
    try {
      const payload = (await res.json()) as { message?: string; error?: string };
      message = payload.message || payload.error || message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
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

export async function getInterviewQuestions(sessionId: string, limit: number = 200): Promise<{ sessionId: string; questions: InterviewQuestionItem[] }> {
  const res = await fetch(
    `${API_BASE_URL}/ai/session/${encodeURIComponent(sessionId)}/questions?limit=${encodeURIComponent(String(limit))}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    }
  );
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}
