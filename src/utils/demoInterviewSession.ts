import { createSession, generateInterviewQuestions, startVideoCall } from '../lib/aiService';

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
export async function startDemoVideoInterviewRoom(
  lang: "en" | "vi",
  jobTitle?: string,
  params?: { candidateId?: string; jobId?: string }
): Promise<void> {
  try {
    // Create Call session (InterviewSessions)
    const languageParam = lang === "vi" ? "Vietnamese" : "English";
    const res = await createSession({ type: "Call", language: languageParam });
    const roomId = res.sessionId;

    // Generate interview questions before joining room (idempotent on BE)
    if (params?.candidateId && params?.jobId) {
      await generateInterviewQuestions({
        sessionId: roomId,
        candidateId: params.candidateId,
        jobId: params.jobId,
        language: languageParam,
        totalQuestions: 20,
        force: false,
      });
    }

    // Persist video-call metadata (InterviewVideoCalls)
    const call = await startVideoCall({ roomId, sessionId: roomId });
    try {
      sessionStorage.setItem("video.callId", call.callId);
    } catch {
      /* ignore */
    }
    
    // Lưu lịch sử Local (Frontend Helper)
    const startedAt = new Date().toISOString();
    const fallback = lang === "vi" ? "Phỏng vấn video AI" : "AI video interview";
    const topic = jobTitle?.trim() || fallback;
    const prev = safeParse(localStorage.getItem("demo.sessions"));
    const next = [{ roomId, startedAt, topic, mode: "video" as const }, ...prev].slice(0, 50);
    localStorage.setItem("demo.sessions", JSON.stringify(next));

    // Điều hướng vào phòng ảo
    window.location.assign(`/interview/room/${roomId}?language=${encodeURIComponent(languageParam)}`);
  } catch (error) {
    console.error("Lỗi khi tạo Session trên Backend:", error);
    alert("Lỗi: Không thể kết nối hoặc bạn chưa đăng nhập hợp lệ!");
    throw error;
  }
}
