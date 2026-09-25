import { closeSession, createSession, startVideoCall } from "@/lib/aiService";
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

  const normalizedCandidateId = candidateId?.trim() || "";
  const normalizedJobId = jobId?.trim() || "";
  const hasCandidateId = Boolean(normalizedCandidateId);
  const hasJobId = Boolean(normalizedJobId);

  if (hasCandidateId !== hasJobId) {
    throw new Error("candidateId and jobId must be provided together");
  }

  if (hasCandidateId && hasJobId) {
    const session = await interviewRuntimeApi.create({
      resumeId: normalizedCandidateId,
      jobId: normalizedJobId,
      mode: runtimeMode,
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

  if (mode === "video") {
    try {
      const call = await startVideoCall({ roomId: sessionId, sessionId });
      if (typeof sessionStorage !== "undefined") {
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

  return `/interview/room/${encodeURIComponent(sessionId)}?${search.toString()}`;
}
