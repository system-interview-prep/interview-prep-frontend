import { pickerVi } from "@/i18n/dicts/picker.dict";
import { interviewRuntimeApi } from "./interviewRuntime.service";
import { fmt } from "@/i18n/format";
import { entryBlockFromError, entryBlockMessageKey } from "@features/interview/utils/entryGate";

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
 * Every interview uses the grounded runtime contract. A CV and JD are required
 * so all modes share CREATE -> PLAN -> LOCK before entering a room.
 */
type Translate = (key: string) => string;

/** Vietnamese wording used when no UI translator is passed (keeps old callers unchanged). */
const translateVi: Translate = (key) => pickerVi[key] ?? key;

export const QUESTION_UNAVAILABLE_MESSAGE = translateVi("picker.startError.questionUnavailable");

/** True when startInterviewSession failed because the question bank cannot cover this position. */
export function isQuestionUnavailableError(error: unknown): boolean {
  return (error as { code?: string } | null | undefined)?.code === "QUESTION_UNAVAILABLE";
}

/**
 * A sentence the candidate can act on for any failure of startInterviewSession.
 * Never surface raw backend codes or English developer messages.
 */
export function describeStartInterviewError(error: unknown, t: Translate = translateVi): string {
  const code = (error as { code?: string })?.code;
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (isQuestionUnavailableError(error)) return t("picker.startError.questionUnavailable");
  const entryBlock = entryBlockFromError(error);
  if (entryBlock) {
    return fmt(t(entryBlockMessageKey(entryBlock.reason)), {
      score: entryBlock.percentage ?? "",
      min: entryBlock.minMatchPercent ?? "",
    });
  }
  if (code === "PLAN_NOT_READY") return t("picker.startError.planNotReady");
  if (status === 401) return t("picker.startError.sessionExpired");
  if (status === 404) return t("picker.startError.notFound");
  if (status === 422) return t("picker.startError.notReady");
  if (code === "MISSING_SELECTION") return t("picker.startError.missingSelection");
  return t("picker.startError.generic");
}

export async function startInterviewSession({
  mode,
  experience,
  jobTitle,
  candidateId,
  jobId,
  durationMinutes = 25,
}: StartInterviewParams): Promise<string> {
  // Interviews are Vietnamese-only; the backend enforces it as well.
  const languageParam = "Vietnamese";
  const locale = "vi-VN";
  const runtimeMode = mode === "chat" ? "text" : mode;

  const normalizedCandidateId = candidateId?.trim() || "";
  const normalizedJobId = jobId?.trim() || "";

  if (!normalizedCandidateId || !normalizedJobId) {
    throw Object.assign(new Error(translateVi("picker.startError.missingSelection")), {
      code: "MISSING_SELECTION",
    });
  }

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
  const sessionId = session.sessionId;

  try {
    const plan = await interviewRuntimeApi.buildPlan(sessionId);
    if (plan.status !== "READY") {
      throw Object.assign(new Error(`Interview plan is not READY: ${plan.status}`), { code: "PLAN_NOT_READY" });
    }
    const selection = await interviewRuntimeApi.selectQuestions(sessionId);
    if (selection.status !== "LOCKED" || selection.turns.length === 0) {
      throw Object.assign(new Error("Interview question selection did not produce locked turns"), { code: "QUESTION_UNAVAILABLE" });
    }
  } catch (error) {
    try {
      // The candidate did nothing wrong here: planning or question selection
      // failed, so the compensating close must not read as USER_ENDED.
      await interviewRuntimeApi.close(sessionId, "TECHNICAL_FAILURE");
    } catch {
      /* best-effort compensation; preserve the planner error */
    }
    // Core reports a fail-closed selection as 409 with
    // detail = { errorCode: "question_bank_insufficient", message, details }.
    type ErrorDetail = string | { errorCode?: string; message?: string; error?: string };
    const res = (error as { response?: { data?: { detail?: ErrorDetail } } })?.response;
    const detail = res?.data?.detail;
    const rawMsg =
      typeof detail === "string"
        ? detail
        : [detail?.errorCode, detail?.message ?? detail?.error].filter(Boolean).join(": ") ||
          (error instanceof Error ? error.message : "");
    if (rawMsg.includes("question_unavailable") || rawMsg.includes("question_bank_insufficient")) {
      throw Object.assign(
        new Error(
          "question_unavailable: Ngân hàng câu hỏi chưa có đủ câu hỏi đã duyệt phù hợp với vị trí này để bắt đầu phỏng vấn."
        ),
        { code: "QUESTION_UNAVAILABLE", response: (error as { response?: unknown })?.response }
      );
    }
    throw error;
  }

  const search = new URLSearchParams({
    mode,
    language: languageParam,
  });
  if (jobTitle?.trim()) {
    search.set("topic", jobTitle.trim());
  }
  const isStructuredText = mode === "chat";
  if (isStructuredText) {
    search.set("runtime", "structured");
    search.set("experience", experience ?? "question_practice");
  } else {
    search.set("runtime", "media");
    search.set(
      "experience",
      experience ?? (mode === "voice" ? "voice_interview" : "video_interview"),
    );
  }

  if (
    mode === "chat" &&
    (experience === "question_practice" || !experience)
  ) {
    return `/practice/room/${encodeURIComponent(sessionId)}?${search.toString()}`;
  }

  return `/interview/room/${encodeURIComponent(sessionId)}?${search.toString()}`;
}
