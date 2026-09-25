import { describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  default: { get, post },
}));

import { interviewRuntimeApi } from "../interviewRuntime.service";

describe("interview runtime API contract", () => {
  it("creates a grounded CV-JD interview session", async () => {
    post.mockResolvedValueOnce({
      data: {
        sessionId: "session-1",
        resumeId: "cv-1",
        jobId: "job-1",
        mode: "text",
        locale: "vi-VN",
        durationMinutes: 25,
        status: "OPEN",
        startedAt: "2026-09-25T00:00:00Z",
        endedAt: null,
        plan: { planId: "plan-1", schemaVersion: "1.0", status: "DRAFT" },
      },
    });

    const session = await interviewRuntimeApi.create({
      resumeId: "cv-1",
      jobId: "job-1",
      mode: "text",
      locale: "vi-VN",
    });

    expect(post).toHaveBeenCalledWith("/api/v1/interviews/sessions", {
      resumeId: "cv-1",
      jobId: "job-1",
      mode: "text",
      locale: "vi-VN",
      durationMinutes: 25,
    });
    expect(session.sessionId).toBe("session-1");
    expect(session.plan?.status).toBe("DRAFT");
  });

  it("reads one runtime session by id", async () => {
    get.mockResolvedValueOnce({ data: { sessionId: "session 1" } });

    await interviewRuntimeApi.get("session 1");

    expect(get).toHaveBeenCalledWith(
      "/api/v1/interviews/sessions/session%201",
    );
  });
  it("builds and reads a competency plan", async () => {
    post.mockResolvedValueOnce({
      data: {
        planId: "plan-1",
        sessionId: "session-1",
        schemaVersion: "1.0",
        status: "READY",
        policyVersion: "interview-planner-v1",
        questionBudget: 6,
        targetQuestionCount: 6,
        sourceContext: {},
        targets: [],
        createdAt: "2026-09-25T00:00:00Z",
        updatedAt: "2026-09-25T00:00:00Z",
      },
    });
    get.mockResolvedValueOnce({
      data: {
        planId: "plan-1",
        sessionId: "session-1",
        status: "READY",
      },
    });

    const built = await interviewRuntimeApi.buildPlan("session 1");
    const loaded = await interviewRuntimeApi.getPlan("session 1");

    expect(post).toHaveBeenCalledWith(
      "/api/v1/interviews/sessions/session%201/plan",
    );
    expect(get).toHaveBeenCalledWith(
      "/api/v1/interviews/sessions/session%201/plan",
    );
    expect(built.status).toBe("READY");
    expect(loaded.planId).toBe("plan-1");
  });

});
