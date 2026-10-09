import { describe, expect, it } from "vitest";
import { technicalQuestionBudget, totalQuestionCount } from "../questionBudget";

describe("question budget mirrors Core", () => {
  it("matches the planner's budget per duration", () => {
    expect([3, 15, 20, 25, 30, 45, 60].map(technicalQuestionBudget)).toEqual([2, 1, 2, 4, 5, 8, 8]);
  });

  it("adds the three preset questions", () => {
    expect(totalQuestionCount(25)).toBe(7);
    // Demo: warm-up, CV validation, deep-dive, challenge, behavioral.
    expect(totalQuestionCount(3)).toBe(5);
  });
});
