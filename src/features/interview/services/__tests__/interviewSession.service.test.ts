import { beforeEach, describe, expect, it, vi } from "vitest";

const { createLegacySession, startVideoCall, createRuntimeSession } = vi.hoisted(() => ({
  createLegacySession: vi.fn(),
  startVideoCall: vi.fn(),
  createRuntimeSession: vi.fn(),
}));

vi.mock("@/lib/aiService", () => ({
  createSession: createLegacySession,
  startVideoCall,
}));

vi.mock("../interviewRuntime.service", () => ({
  interviewRuntimeApi: {
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
