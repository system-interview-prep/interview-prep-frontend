export type ChatRequest = {
  prompt: string;
};

export type ChatResponse = {
  reply: string;
};

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch("http://localhost:5000/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Network response was not ok");
  return res.json();
}
