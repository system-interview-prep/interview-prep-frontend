import { closeSession, createSession, startVideoCall } from "@/lib/aiService";
import { interviewRuntimeApi } from "./interviewRuntime.service";

export type InterviewMode = "chat" | "voice" | "video";
export type InterviewExperience =
  | "question_practice"
  | "interview_chat"
  | "voice_interview"
  | "video_interview";

export type StartInterviewParams = {
  mode: InterviewMode;
  experience?: InterviewExperience;
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
  experience,
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

  const normalizedCandidateId = candidateId?.trim() || "";
  const normalizedJobId = jobId?.trim() || "";
  const hasCandidateId = Boolean(normalizedCandidateId);
  const hasJobId = Boolean(normalizedJobId);

  if (hasCandidateId !== hasJobId) {
    throw new Error("candidateId and jobId must be provided together");
  }

  if (hasCandidateId && hasJobId) {
    const runtimeExperience =
      experience ??
      (mode === "voice"
        ? "voice_interview"
        : mode === "video"
        ? "video_interview"
        : "question_practice");
    const session = await interviewRuntimeApi.create({
      resumeId: normalizedCandidateId,
      jobId: normalizedJobId,
      mode: runtimeMode,
      experienceType: runtimeExperience,
      locale,
      durationMinutes,
    });
    sessionId = session.sessionId;

    try {
      const plan = await interviewRuntimeApi.buildPlan(sessionId);
      if (plan.status !== "READY") {
        throw new Error(`Interview plan is not READY: ${plan.status}`);
      }
      const selection = await interviewRuntimeApi.selectQuestions(sessionId);
      if (selection.status !== "LOCKED" || selection.turns.length === 0) {
        throw new Error("Interview question selection did not produce locked turns");
      }
    } catch (error) {
      try {
        await interviewRuntimeApi.close(sessionId);
      } catch {
        /* best-effort compensation; preserve the planner error */
      }
      const res = (error as { response?: { data?: { detail?: string } } })?.response;
      const rawMsg =
        typeof res?.data?.detail === "string"
          ? res.data.detail
          : error instanceof Error
          ? error.message
          : "";
      if (rawMsg.includes("question_unavailable")) {
        const enrichedError = Object.assign(
          new Error(
            "question_unavailable: Ngân hàng câu hỏi chưa có đủ câu hỏi đã duyệt phù hợp với vị trí này để bắt đầu phỏng vấn."
          ),
          {
            code: "QUESTION_UNAVAILABLE",
            response: (error as { response?: unknown })?.response,
          }
        );
        throw enrichedError;
      }
      throw error;
    }
  } else {
    const sessionType = mode === "video" ? "Call" : mode === "voice" ? "Voice" : "Chat";
    const legacy = await createSession({
      type: sessionType,
      language: languageParam,
    });
    sessionId = legacy.sessionId;
  }

  // Media rooms use the video-call record for their voice/TTS exchange too.
  // Starting it for voice prevents the room from opening without a callId.
  if (mode === "video" || mode === "voice") {
    try {
      const call = await startVideoCall({ roomId: sessionId, sessionId });
      if (call?.callId && typeof sessionStorage !== "undefined") {
        try {
          sessionStorage.setItem("video.callId", call.callId);
        } catch {
          /* ignore storage errors */
        }
      }
    } catch (error) {
      try {
        if (hasCandidateId && hasJobId) {
          await interviewRuntimeApi.close(sessionId);
        } else {
          await closeSession(sessionId);
        }
      } catch {
        /* best-effort compensation; preserve the original video-start error */
      }
      throw error;
    }
  }

  const search = new URLSearchParams({
    mode,
    language: languageParam,
  });
  if (jobTitle?.trim()) {
    search.set("topic", jobTitle.trim());
  }
  const isStructuredText = mode === "chat";
  if (hasCandidateId && hasJobId && isStructuredText) {
    search.set("runtime", "structured");
    search.set("experience", experience ?? "question_practice");
  } else if (hasCandidateId && hasJobId) {
    search.set("runtime", "media");
    search.set(
      "experience",
      experience ?? (mode === "voice" ? "voice_interview" : "video_interview"),
    );
  } else if (experience) {
    search.set("experience", experience);
  }

  if (
    hasCandidateId &&
    hasJobId &&
    mode === "chat" &&
    (experience === "question_practice" || !experience)
  ) {
    return `/practice/room/${encodeURIComponent(sessionId)}?${search.toString()}`;
  }

  return `/interview/room/${encodeURIComponent(sessionId)}?${search.toString()}`;
}
