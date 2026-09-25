import { createSession, startVideoCall } from "@/lib/aiService";
import { interviewRuntimeApi } from "./interviewRuntime.service";

export type InterviewMode = "chat" | "voice" | "video";

export type StartInterviewParams = {
  mode: InterviewMode;
  lang: "en" | "vi";
  jobTitle?: string;
  /** CV/resume id used by the structured interview runtime. */
  candidateId?: string;
  /** Canonical job description id used by the structured interview runtime. */
  jobId?: string;
  durationMinutes?: number;
};

/**
 * Initialize an interview session.
 *
 * Grounded CV→JD flows use the structured runtime contract:
 * POST /api/v1/interviews/sessions
 *
 * Standalone practice without a selected CV/JD temporarily keeps the legacy
 * /ai/session path for backward compatibility until the planner supports a
 * general-practice context.
 */
export async function startInterviewSession({
  mode,
  lang,
  jobTitle,
  candidateId,
  jobId,
  durationMinutes = 25,
}: StartInterviewParams): Promise<string> {
  const languageParam = lang === "vi" ? "Vietnamese" : "English";
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const runtimeMode = mode === "chat" ? "text" : mode;

  let sessionId: string;

  if (candidateId?.trim() && jobId?.trim()) {
    const session = await interviewRuntimeApi.create({
      resumeId: candidateId.trim(),
      jobId: jobId.trim(),
      mode: runtimeMode,
      locale,
      durationMinutes,
    });
    sessionId = session.sessionId;
  } else {
    const sessionType = mode === "video" ? "Call" : mode === "voice" ? "Voice" : "Chat";
    const legacy = await createSession({
      type: sessionType,
      language: languageParam,
    });
    sessionId = legacy.sessionId;
  }

  if (mode === "video") {
    const call = await startVideoCall({ roomId: sessionId, sessionId });
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.setItem("video.callId", call.callId);
      } catch {
        /* ignore storage errors */
      }
    }
  }

  const search = new URLSearchParams({
    mode,
    language: languageParam,
  });
  if (jobTitle?.trim()) {
    search.set("topic", jobTitle.trim());
  }

  return `/interview/room/${encodeURIComponent(sessionId)}?${search.toString()}`;
}
