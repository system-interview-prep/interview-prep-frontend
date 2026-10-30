import { describe, expect, it } from "vitest";
import { SLOW_PROCESSING_MS, cvViewState, processingStep } from "../utils/cvStatus";

const NOW = Date.parse("2026-10-10T10:00:00Z");
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe("cvViewState", () => {
  it("is ready only when parsing is DONE", () => {
    expect(cvViewState({ status: "DONE", uploadedAt: ago(SLOW_PROCESSING_MS * 10) }, NOW)).toBe("ready");
    expect(cvViewState({ status: "AI_PROCESSING", uploadedAt: ago(1000) }, NOW)).toBe("processing");
  });

  it("calls a long parse slow, never failed — only the server can declare failure", () => {
    expect(cvViewState({ status: "PARSING", uploadedAt: ago(SLOW_PROCESSING_MS + 1) }, NOW)).toBe("slow");
    expect(cvViewState({ status: "FAILED", uploadedAt: ago(1000) }, NOW)).toBe("failed");
  });

  it("measures slowness from the last status change, so a re-parse of an old CV is not slow", () => {
    expect(
      cvViewState({ status: "PARSING", uploadedAt: ago(SLOW_PROCESSING_MS * 100), updatedAt: ago(1000) }, NOW)
    ).toBe("processing");
  });
});

describe("processingStep", () => {
  it("maps pipeline statuses to steps 1–3", () => {
    expect([processingStep("PENDING"), processingStep("PARSING"), processingStep("AI_PROCESSING")]).toEqual([1, 2, 3]);
  });
});
