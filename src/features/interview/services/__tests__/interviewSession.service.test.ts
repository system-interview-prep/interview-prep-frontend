import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  buildRuntimePlan,
  closeRuntimeSession,
  createRuntimeSession,
  selectRuntimeQuestions,
} = vi.hoisted(() => ({
  buildRuntimePlan: vi.fn(),
  closeRuntimeSession: vi.fn(),
  createRuntimeSession: vi.fn(),
  selectRuntimeQuestions: vi.fn(),
}));

vi.mock("../interviewRuntime.service", () => ({
  interviewRuntimeApi: {
    buildPlan: buildRuntimePlan,
    close: closeRuntimeSession,
    create: createRuntimeSession,
    selectQuestions: selectRuntimeQuestions,
  },
}));

import { startInterviewSession } from "../interviewSession.service";

describe("startInterviewSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectRuntimeQuestions.mockResolvedValue({
      sessionId: "runtime-default",
      planId: "plan-default",
      status: "LOCKED",
      turns: [{ turnId: "turn-1" }],
    });
  });

  it("uses the structured runtime when both CV and job ids are present", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-1" });
    buildRuntimePlan.mockResolvedValueOnce({
      planId: "plan-1",
      sessionId: "runtime-1",
      status: "READY",
    });

    const url = await startInterviewSession({
      mode: "chat",
      lang: "vi",
      candidateId: " cv-1 ",
      jobId: " job-1 ",
      durationMinutes: 30,
    });

    expect(createRuntimeSession).toHaveBeenCalledWith({
      resumeId: "cv-1",
      jobId: "job-1",
      mode: "text",
      experienceType: "question_practice",
      locale: "vi-VN",
      durationMinutes: 30,
    });
    expect(buildRuntimePlan).toHaveBeenCalledWith("runtime-1");
    expect(selectRuntimeQuestions).toHaveBeenCalledWith("runtime-1");
    expect(url).toContain("/practice/room/runtime-1");
    expect(url).toContain("runtime=structured");
    expect(url).toContain("experience=question_practice");
  });

  it("starts grounded interview_chat session and routes to interview room", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-chat-1" });
    buildRuntimePlan.mockResolvedValueOnce({
      planId: "plan-chat-1",
      sessionId: "runtime-chat-1",
      status: "READY",
    });

    const url = await startInterviewSession({
      mode: "chat",
      experience: "interview_chat",
      lang: "vi",
      candidateId: "cv-1",
      jobId: "job-1",
    });

    expect(createRuntimeSession).toHaveBeenCalledWith({
      resumeId: "cv-1",
      jobId: "job-1",
      mode: "text",
      experienceType: "interview_chat",
      locale: "vi-VN",
      durationMinutes: 25,
    });
    expect(url).toContain("/interview/room/runtime-chat-1");
    expect(url).toContain("experience=interview_chat");
    expect(url).not.toContain("/practice/room/");
  });

  it("rejects standalone sessions without grounded CV-JD context", async () => {
    await expect(startInterviewSession({ mode: "voice", lang: "en" })).rejects.toThrow(
      "Vui lòng chọn đủ CV và vị trí tuyển dụng",
    );
    expect(createRuntimeSession).not.toHaveBeenCalled();
  });



  it("closes a grounded session when question selection is unavailable", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-selector-fail" });
    buildRuntimePlan.mockResolvedValueOnce({
      planId: "plan-selector-fail",
      sessionId: "runtime-selector-fail",
      status: "READY",
    });
    selectRuntimeQuestions.mockRejectedValueOnce(new Error("question_unavailable"));
    closeRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-selector-fail" });

    await expect(
      startInterviewSession({
        mode: "chat",
        lang: "en",
        candidateId: "cv-1",
        jobId: "job-1",
      }),
    ).rejects.toThrow("question_unavailable");

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-selector-fail", "TECHNICAL_FAILURE");
  });

  it("enriches question_unavailable with Vietnamese explanation and code", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-selector-409" });
    buildRuntimePlan.mockResolvedValueOnce({
      planId: "plan-409",
      sessionId: "runtime-selector-409",
      status: "READY",
    });
    const axiosError = Object.assign(new Error("Request failed with status code 409"), {
      response: {
        status: 409,
        data: { detail: "question_unavailable: internal-2026.1:skill-ai requires 3 questions, 0 exist" },
      },
    });
    selectRuntimeQuestions.mockRejectedValueOnce(axiosError);
    closeRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-selector-409" });

    await expect(
      startInterviewSession({
        mode: "chat",
        lang: "vi",
        candidateId: "cv-1",
        jobId: "job-1",
      }),
    ).rejects.toThrow(/Ngân hàng câu hỏi chưa có đủ câu hỏi đã duyệt/);

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-selector-409", "TECHNICAL_FAILURE");
  });

  it("recognises Core's structured 409 payload for an insufficient question bank", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-selector-409-structured" });
    buildRuntimePlan.mockResolvedValueOnce({
      planId: "plan-409-structured",
      sessionId: "runtime-selector-409-structured",
      status: "READY",
    });
    // Exact shape of QuestionUnavailableError.to_payload() in Core.
    const axiosError = Object.assign(new Error("Request failed with status code 409"), {
      response: {
        status: 409,
        data: {
          detail: {
            errorCode: "question_bank_insufficient",
            message: "Question bank cannot satisfy interview plan requirements under fail-closed policy",
            details: {},
          },
        },
      },
    });
    selectRuntimeQuestions.mockRejectedValueOnce(axiosError);
    closeRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-selector-409-structured" });

    await expect(
      startInterviewSession({ mode: "chat", lang: "vi", candidateId: "cv-1", jobId: "job-1" }),
    ).rejects.toMatchObject({ code: "QUESTION_UNAVAILABLE" });
  });

  it("rejects an unlocked or empty selector response before room entry", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-selector-empty" });
    buildRuntimePlan.mockResolvedValueOnce({
      planId: "plan-selector-empty",
      sessionId: "runtime-selector-empty",
      status: "READY",
    });
    selectRuntimeQuestions.mockResolvedValueOnce({
      sessionId: "runtime-selector-empty",
      planId: "plan-selector-empty",
      status: "LOCKED",
      turns: [],
    });
    closeRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-selector-empty" });

    await expect(
      startInterviewSession({
        mode: "chat",
        lang: "en",
        candidateId: "cv-1",
        jobId: "job-1",
      }),
    ).rejects.toThrow("Interview question selection did not produce locked turns");

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-selector-empty", "TECHNICAL_FAILURE");
  });

  it("closes a grounded session when planner creation fails", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-plan-fail" });
    buildRuntimePlan.mockRejectedValueOnce(new Error("planner failed"));
    closeRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-plan-fail" });

    await expect(
      startInterviewSession({
        mode: "chat",
        lang: "en",
        candidateId: "cv-1",
        jobId: "job-1",
      }),
    ).rejects.toThrow("planner failed");

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-plan-fail", "TECHNICAL_FAILURE");
  });

  it("closes a grounded session when planner resolves non-READY", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-plan-draft" });
    buildRuntimePlan.mockResolvedValueOnce({
      planId: "plan-draft",
      sessionId: "runtime-plan-draft",
      status: "DRAFT",
    });
    closeRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-plan-draft" });

    await expect(
      startInterviewSession({
        mode: "video",
        lang: "en",
        candidateId: "cv-1",
        jobId: "job-1",
      }),
    ).rejects.toThrow("Interview plan is not READY: DRAFT");

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-plan-draft", "TECHNICAL_FAILURE");
  });

  it("routes grounded video directly to the canonical LiveKit room", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-video-1" });
    buildRuntimePlan.mockResolvedValueOnce({
      planId: "plan-video-1",
      sessionId: "runtime-video-1",
      status: "READY",
    });
    selectRuntimeQuestions.mockResolvedValueOnce({
      sessionId: "runtime-video-1",
      planId: "plan-video-1",
      status: "LOCKED",
      turns: [{ turnId: "turn-video-1" }],
    });

    const url = await startInterviewSession({
      mode: "video",
      lang: "en",
      candidateId: "cv-1",
      jobId: "job-1",
    });
    expect(url).toContain("/interview/room/runtime-video-1");
    expect(url).toContain("runtime=media");
    expect(url).toContain("experience=video_interview");
  });

  it.each([
    [{ candidateId: "cv-1" }],
    [{ jobId: "job-1" }],
  ])("rejects partial CV-JD context: %j", async (context) => {
    await expect(
      startInterviewSession({
        mode: "chat",
        lang: "en",
        ...context,
      }),
    ).rejects.toThrow("Vui lòng chọn đủ CV và vị trí tuyển dụng");

    expect(createRuntimeSession).not.toHaveBeenCalled();
  });
});
