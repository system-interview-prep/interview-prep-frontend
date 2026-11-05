import { describe, expect, it } from "vitest";
import { questionCountOf, type InterviewType } from "../interviewTypes.service";

const quick: InterviewType = {
  id: "quick",
  name: "Kỹ thuật nhanh",
  description: "",
  isDefault: false,
  presetQuestions: 1,
  preview: [
    { durationMinutes: 15, technicalQuestions: 3, expectedSeconds: 900, fits: true },
    { durationMinutes: 25, technicalQuestions: 5, expectedSeconds: 1380, fits: true },
  ],
};

describe("questionCountOf", () => {
  it("adds the type's preset turns to its technical questions for the package", () => {
    expect(questionCountOf(quick, 25)).toBe(6);
    expect(questionCountOf(quick, 15)).toBe(4);
  });

  it("returns null when the package or the type is unknown, so callers keep the old formula", () => {
    expect(questionCountOf(quick, 45)).toBeNull();
    expect(questionCountOf(null, 25)).toBeNull();
  });
});
