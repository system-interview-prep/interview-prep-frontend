
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


export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function createSession(): Promise<{ sessionId: string }> {
  const res = await fetch(`${API_BASE_URL}/ai/session`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function getChatHistory(sessionId: string = "default-session"): Promise<ChatHistoryResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/history?sessionId=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

export async function getAllSessions(): Promise<{ sessions: string[] }> {
  const res = await fetch(`${API_BASE_URL}/ai/sessions`);
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}
