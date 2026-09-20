import { createSession, generateInterviewQuestions, startVideoCall } from "@/lib/aiService";

export type InterviewMode = "chat" | "voice" | "video";

export type StartInterviewParams = {
  mode: InterviewMode;
  lang: "en" | "vi";
  jobTitle?: string;
  /** @deprecated Không còn được dùng – BE nhận position thay vì candidateId/jobId */
  candidateId?: string;
  /** @deprecated Không còn được dùng – BE nhận position thay vì candidateId/jobId */
  jobId?: string;
};

/**
 * Initializes an end-to-end interview session with backend API services.
 * Returns the target room URL path to navigate to.
 *
 * BE endpoint: POST /ai/session → POST /ai/session/{id}/questions/generate
 */
export async function startInterviewSession({
  mode,
  lang,
  jobTitle,
}: StartInterviewParams): Promise<string> {
  const languageParam = lang === "vi" ? "Vietnamese" : "English";
  const sessionType = mode === "video" ? "Call" : mode === "voice" ? "Voice" : "Chat";

  // 1. Tạo interview session trên backend
  const res = await createSession({ type: sessionType, language: languageParam });
  const sessionId = res.sessionId;

  // 2. Generate interview questions nếu có jobTitle (dùng làm position)
  // BE nhận: { count, position, language } – không nhận candidateId/jobId
  if (jobTitle?.trim()) {
    await generateInterviewQuestions({
      sessionId,
      position: jobTitle.trim(),
      count: 10,
      language: languageParam,
    });
  }

  // 3. Nếu video mode, khởi tạo video call metadata
  if (mode === "video") {
    const call = await startVideoCall({ roomId: sessionId, sessionId });
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.setItem("video.callId", call.callId);
      } catch {
        /* ignore */
      }
    }
  }

  // 4. Trả về URL phòng phỏng vấn
  const search = new URLSearchParams({
    mode,
    language: languageParam,
  });
  if (jobTitle?.trim()) {
    search.set("topic", jobTitle.trim());
  }

  return `/interview/room/${encodeURIComponent(sessionId)}?${search.toString()}`;
}
