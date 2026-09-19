import { createSession, generateInterviewQuestions, startVideoCall } from "@/lib/aiService";

export type InterviewMode = "chat" | "voice" | "video";

export type StartInterviewParams = {
  mode: InterviewMode;
  lang: "en" | "vi";
  jobTitle?: string;
  candidateId?: string;
  jobId?: string;
};

/**
 * Initializes an end-to-end interview session with backend API services.
 * Returns the target room URL path to navigate to.
 */
export async function startInterviewSession({
  mode,
  lang,
  jobTitle,
  candidateId,
  jobId,
}: StartInterviewParams): Promise<string> {
  const languageParam = lang === "vi" ? "Vietnamese" : "English";
  const sessionType = mode === "video" ? "Call" : mode === "voice" ? "Voice" : "Chat";

  // 1. Create interview session on backend
  const res = await createSession({ type: sessionType, language: languageParam });
  const sessionId = res.sessionId;

  // 2. Generate interview questions if candidate & job context provided
  if (candidateId && jobId) {
    await generateInterviewQuestions({
      sessionId,
      candidateId,
      jobId,
      language: languageParam,
      totalQuestions: 20,
      force: false,
    });
  }

  // 3. If video mode, initialize WebRTC call metadata
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

  // 4. Return canonical room URL
  const search = new URLSearchParams({
    mode,
    language: languageParam,
  });
  if (jobTitle?.trim()) {
    search.set("topic", jobTitle.trim());
  }

  return `/interview/room/${encodeURIComponent(sessionId)}?${search.toString()}`;
}
