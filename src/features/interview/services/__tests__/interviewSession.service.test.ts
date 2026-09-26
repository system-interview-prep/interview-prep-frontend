import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  closeLegacySession,
  createLegacySession,
  startVideoCall,
  buildRuntimePlan,
  closeRuntimeSession,
  createRuntimeSession,
  selectRuntimeQuestions,
} = vi.hoisted(() => ({
  closeLegacySession: vi.fn(),
  createLegacySession: vi.fn(),
  startVideoCall: vi.fn(),
  buildRuntimePlan: vi.fn(),
  closeRuntimeSession: vi.fn(),
  createRuntimeSession: vi.fn(),
  selectRuntimeQuestions: vi.fn(),
}));

vi.mock("@/lib/aiService", () => ({
  closeSession: closeLegacySession,
  createSession: createLegacySession,
  startVideoCall,
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
    expect(createLegacySession).not.toHaveBeenCalled();
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

  it("keeps legacy standalone practice when neither id is present", async () => {
    createLegacySession.mockResolvedValueOnce({ sessionId: "legacy-1" });

    const url = await startInterviewSession({ mode: "voice", lang: "en" });

    expect(createLegacySession).toHaveBeenCalledWith({
      type: "Voice",
      language: "English",
    });
    expect(createRuntimeSession).not.toHaveBeenCalled();
    expect(url).not.toContain("runtime=structured");
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

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-selector-fail");
    expect(startVideoCall).not.toHaveBeenCalled();
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

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-selector-409");
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

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-selector-empty");
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

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-plan-fail");
    expect(startVideoCall).not.toHaveBeenCalled();
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

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-plan-draft");
    expect(startVideoCall).not.toHaveBeenCalled();
  });

  it("closes a grounded session when video setup fails", async () => {
    createRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-video-1" });
    buildRuntimePlan.mockResolvedValueOnce({
      planId: "plan-video-1",
      sessionId: "runtime-video-1",
      status: "READY",
    });
    startVideoCall.mockRejectedValueOnce(new Error("video setup failed"));
    closeRuntimeSession.mockResolvedValueOnce({ sessionId: "runtime-video-1" });

    await expect(
      startInterviewSession({
        mode: "video",
        lang: "en",
        candidateId: "cv-1",
        jobId: "job-1",
      }),
    ).rejects.toThrow("video setup failed");

    expect(closeRuntimeSession).toHaveBeenCalledWith("runtime-video-1");
    expect(closeLegacySession).not.toHaveBeenCalled();
  });

  it("closes a legacy session when standalone video setup fails", async () => {
    createLegacySession.mockResolvedValueOnce({ sessionId: "legacy-video-1" });
    startVideoCall.mockRejectedValueOnce(new Error("video setup failed"));
    closeLegacySession.mockResolvedValueOnce({
      sessionId: "legacy-video-1",
      status: "CLOSED",
      endedAt: "2026-09-25T00:00:00Z",
    });

    await expect(
      startInterviewSession({ mode: "video", lang: "en" }),
    ).rejects.toThrow("video setup failed");

    expect(closeLegacySession).toHaveBeenCalledWith("legacy-video-1");
    expect(closeRuntimeSession).not.toHaveBeenCalled();
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
    ).rejects.toThrow("candidateId and jobId must be provided together");

    expect(createRuntimeSession).not.toHaveBeenCalled();
    expect(createLegacySession).not.toHaveBeenCalled();
  });
});
