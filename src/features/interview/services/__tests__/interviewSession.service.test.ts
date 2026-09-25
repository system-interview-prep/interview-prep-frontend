import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  closeLegacySession,
  createLegacySession,
  startVideoCall,
  buildRuntimePlan,
  closeRuntimeSession,
  createRuntimeSession,
} = vi.hoisted(() => ({
  closeLegacySession: vi.fn(),
  createLegacySession: vi.fn(),
  startVideoCall: vi.fn(),
  buildRuntimePlan: vi.fn(),
  closeRuntimeSession: vi.fn(),
  createRuntimeSession: vi.fn(),
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
  },
}));

import { startInterviewSession } from "../interviewSession.service";

describe("startInterviewSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      locale: "vi-VN",
      durationMinutes: 30,
    });
    expect(buildRuntimePlan).toHaveBeenCalledWith("runtime-1");
    expect(createLegacySession).not.toHaveBeenCalled();
    expect(url).toContain("/interview/room/runtime-1");
  });

  it("keeps legacy standalone practice when neither id is present", async () => {
    createLegacySession.mockResolvedValueOnce({ sessionId: "legacy-1" });

    await startInterviewSession({ mode: "voice", lang: "en" });

    expect(createLegacySession).toHaveBeenCalledWith({
      type: "Voice",
      language: "English",
    });
    expect(createRuntimeSession).not.toHaveBeenCalled();
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
    [{ candidateId: "cv-1" }, "missing job id"],
    [{ jobId: "job-1" }, "missing candidate id"],
  ])("rejects partial CV-JD context: %s", async (context, _caseName) => {
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
