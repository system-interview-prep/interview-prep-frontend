import { createSession } from '../lib/aiService';

export type DemoSession = {
  roomId: string;
  topic: string;
  startedAt: string;
  mode: "video";
};

function safeParse(value: string | null): DemoSession[] {
  if (!value) return [];
  try {
    return JSON.parse(value) as DemoSession[];
  } catch {
    return [];
  }
}

/** Creates a video interview room using Backend API, appends to demo.sessions, then navigates to WebRTC room. */
export async function startDemoVideoInterviewRoom(lang: "en" | "vi", jobTitle?: string): Promise<void> {
  try {
    // Xin 1 Session ID hợp lệ và lưu vào DynamoDB (InterviewSessions) trước khi bắt đầu
    const res = await createSession();
    const roomId = res.sessionId;
    
    // Lưu lịch sử Local (Frontend Helper)
    const startedAt = new Date().toISOString();
    const fallback = lang === "vi" ? "Phỏng vấn video AI" : "AI video interview";
    const topic = jobTitle?.trim() || fallback;
    const prev = safeParse(localStorage.getItem("demo.sessions"));
    const next = [{ roomId, startedAt, topic, mode: "video" as const }, ...prev].slice(0, 50);
    localStorage.setItem("demo.sessions", JSON.stringify(next));

    // Điều hướng vào phòng ảo
    const languageParam = lang === "vi" ? "Vietnamese" : "English";
    window.location.assign(`/interview/room/${roomId}?language=${encodeURIComponent(languageParam)}`);
  } catch (error) {
    console.error("Lỗi khi tạo Session trên Backend:", error);
    alert("Lỗi: Không thể kết nối hoặc bạn chưa đăng nhập hợp lệ!");
    throw error;
  }
}
