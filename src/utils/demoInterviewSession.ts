export type DemoSession = {
  roomId: string;
  topic: string;
  startedAt: string;
};

function safeParse(value: string | null): DemoSession[] {
  if (!value) return [];
  try {
    return JSON.parse(value) as DemoSession[];
  } catch {
    return [];
  }
}

/** Creates a video interview room, appends to demo.sessions, then navigates to WebRTC room. */
export function startDemoVideoInterviewRoom(lang: "en" | "vi"): void {
  const roomId = `room_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();
  const topic = lang === "vi" ? "Phỏng vấn video AI" : "AI video interview";
  const prev = safeParse(localStorage.getItem("demo.sessions"));
  const next = [{ roomId, startedAt, topic }, ...prev].slice(0, 50);
  localStorage.setItem("demo.sessions", JSON.stringify(next));

  const languageParam = lang === "vi" ? "Vietnamese" : "English";
  window.location.assign(`/interview/room/${roomId}?language=${encodeURIComponent(languageParam)}`);
}
