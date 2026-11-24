import { describe, expect, it } from "vitest";
import { progressFromRuntime } from "../hooks/useRuntimeProgress";
import type { ChatRuntimeResponse } from "../services/interviewChat.service";

function runtime(partial: Partial<ChatRuntimeResponse>): ChatRuntimeResponse {
  return {
    sessionId: "ses-1",
    sessionStatus: "OPEN",
    experienceType: "interview_chat",
    jobTitle: "Backend",
    totalTurns: 5,
    currentTurnIndex: 0,
    currentTurn: null,
    messages: [],
    isAwaitingCandidate: true,
    ...partial,
  };
}

describe("progressFromRuntime", () => {
  it("turns the 0-based turn index into a 1-based question number", () => {
    const progress = progressFromRuntime(
      runtime({ currentTurnIndex: 2, currentTurn: { turnId: "t3", turnIndex: 2, stage: "DEEP_DIVE" }, durationMinutes: 25 })
    );
    expect(progress).toMatchObject({ questionNumber: 3, totalQuestions: 5, stage: "DEEP_DIVE", durationMinutes: 25, isClosed: false });
  });

  it("has no question number before the first question and falls back to the working-memory stage", () => {
    const progress = progressFromRuntime(runtime({ workingMemory: { current_stage: "WARM_UP" } }));
    expect(progress.questionNumber).toBeNull();
    expect(progress.stage).toBe("WARM_UP");
  });

  it("marks closed sessions", () => {
    expect(progressFromRuntime(runtime({ sessionStatus: "CLOSED" })).isClosed).toBe(true);
  });
});
