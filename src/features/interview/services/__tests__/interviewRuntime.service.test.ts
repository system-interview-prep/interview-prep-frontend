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

  it("selects and reads frozen P2 turns", async () => {
    post.mockResolvedValueOnce({
      data: {
        sessionId: "session-1",
        planId: "plan-1",
        status: "LOCKED",
        selectorPolicyVersion: "interview-question-selector-v1",
        turns: [{ turnId: "turn-1", turnIndex: 0, status: "PLANNED", question: {} }],
      },
    });
    get.mockResolvedValueOnce({
      data: {
        sessionId: "session-1",
        turns: [{ turnId: "turn-1", turnIndex: 0, status: "PLANNED", question: {} }],
      },
    });

    const selected = await interviewRuntimeApi.selectQuestions("session 1");
    const turns = await interviewRuntimeApi.getTurns("session 1");

    expect(post).toHaveBeenCalledWith(
      "/api/v1/interviews/sessions/session%201/questions/select",
    );
    expect(get).toHaveBeenCalledWith(
      "/api/v1/interviews/sessions/session%201/turns",
    );
    expect(selected.status).toBe("LOCKED");
    expect(turns[0]?.turnId).toBe("turn-1");
  });

  it("drives the P3 text turn lifecycle", async () => {
    get.mockResolvedValueOnce({
      data: {
        sessionId: "session-1",
        sessionStatus: "OPEN",
        completed: false,
        progress: { answered: 0, total: 2 },
        currentTurn: { turnId: "turn-1", status: "PLANNED", question: {} },
        turns: [],
      },
    });
    post
      .mockResolvedValueOnce({ data: { turnId: "turn-1", status: "ASKED", question: {} } })
      .mockResolvedValueOnce({
        data: {
          turnId: "turn-1",
          status: "ANSWERED",
          answerText: "My grounded answer",
          question: {},
        },
      })
      .mockResolvedValueOnce({
        data: {
          sessionId: "session-1",
          sessionStatus: "CLOSED",
          completed: true,
          progress: { answered: 2, total: 2 },
          currentTurn: null,
          turns: [],
        },
      });

    const runtime = await interviewRuntimeApi.getTextRuntime("session 1");
    const asked = await interviewRuntimeApi.askTurn("session 1", "turn 1");
    const answered = await interviewRuntimeApi.answerTurn(
      "session 1",
      "turn 1",
      "My grounded answer",
    );
    const completed = await interviewRuntimeApi.completeTextRuntime("session 1");

    expect(get).toHaveBeenCalledWith(
      "/api/v1/interviews/sessions/session%201/runtime",
    );
    expect(post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/interviews/sessions/session%201/turns/turn%201/ask",
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/interviews/sessions/session%201/turns/turn%201/answer",
      { answerText: "My grounded answer" },
    );
    expect(post).toHaveBeenNthCalledWith(
      3,
      "/api/v1/interviews/sessions/session%201/complete",
    );
    expect(runtime.currentTurn?.status).toBe("PLANNED");
    expect(asked.status).toBe("ASKED");
    expect(answered.answerText).toBe("My grounded answer");
    expect(completed.completed).toBe(true);
  });

});
