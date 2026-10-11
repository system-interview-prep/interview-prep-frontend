import { describe, expect, it } from "vitest";
import {
  buildCvSegments,
  collectEvidenceMarks,
  mergeEvidenceSources,
  type EvidenceMark,
} from "../utils/cv-highlight";
import { nextStepHint } from "../utils/evidence-hints";
import type { HumanizedRequirement } from "../types/match-details.types";

const RAW = "Backend dev. Built REST APIs with FastAPI and Redis cache.";

function mark(partial: Partial<EvidenceMark> & Pick<EvidenceMark, "evidenceId" | "charStart" | "charEnd">): EvidenceMark {
  return {
    text: RAW.slice(partial.charStart, partial.charEnd),
    requirementIds: ["req-a"],
    status: "met",
    foundAtMatchTime: false,
    ...partial,
  };
}

function requirement(partial: Partial<HumanizedRequirement> & Pick<HumanizedRequirement, "id">): HumanizedRequirement {
  return { label: partial.id, priority: "must_have", status: "met", statusLabel: "Phù hợp", ...partial };
}

describe("buildCvSegments", () => {
  it("reassembles the exact raw text", () => {
    const { segments } = buildCvSegments(RAW, [mark({ evidenceId: "e1", charStart: 13, charEnd: 27 })]);
    expect(segments.map((s) => s.text).join("")).toBe(RAW);
  });

  it("splits overlapping spans into runs that list every covering span", () => {
    const fastapi = RAW.indexOf("FastAPI");
    const { segments } = buildCvSegments(RAW, [
      mark({ evidenceId: "e1", charStart: 13, charEnd: fastapi + 7, requirementIds: ["req-api"] }),
      mark({ evidenceId: "e2", charStart: fastapi, charEnd: fastapi + 7, requirementIds: ["req-python"], status: "unknown" }),
    ]);
    const overlap = segments.find((s) => s.text === "FastAPI");
    expect(overlap?.evidenceIds).toEqual(["e1", "e2"]);
    expect(overlap?.requirementIds).toEqual(["req-api", "req-python"]);
    expect(overlap?.status).toBe("met"); // strongest status wins the colour
    expect(segments.map((s) => s.text).join("")).toBe(RAW);
  });

  it("reports out-of-range or empty spans instead of clipping them", () => {
    const { segments, outOfRange } = buildCvSegments(RAW, [
      mark({ evidenceId: "past-end", charStart: RAW.length - 2, charEnd: RAW.length + 5, text: "xx" }),
      mark({ evidenceId: "negative", charStart: -1, charEnd: 3, text: "Bac" }),
      mark({ evidenceId: "empty", charStart: 5, charEnd: 5, text: "" }),
    ]);
    expect(outOfRange.map((m) => m.evidenceId)).toEqual(["past-end", "negative", "empty"]);
    expect(segments).toHaveLength(1);
    expect(segments[0].evidenceIds).toEqual([]);
  });

  it("returns a single empty-free result for empty text", () => {
    expect(buildCvSegments("", []).segments).toEqual([]);
  });
});

describe("collectEvidenceMarks", () => {
  it("groups every requirement that cites the same span", () => {
    const span = { evidenceId: "e1", text: "FastAPI", charStart: 33, charEnd: 40 };
    const { marks } = collectEvidenceMarks([
      requirement({ id: "req-python", cvEvidence: [span] }),
      requirement({
        id: "req-api",
        status: "unknown",
        conceptResults: [{ conceptId: "c", label: "API", status: "unknown", confidence: 0.5, evidence: [span] }],
      }),
    ]);
    expect(marks).toHaveLength(1);
    expect(marks[0].requirementIds).toEqual(["req-api", "req-python"]);
    expect(marks[0].status).toBe("met");
  });

  it("lists spans without offsets as unplaced and flags spans found at match time", () => {
    const { marks, unplaced } = collectEvidenceMarks([
      requirement({
        id: "req-a",
        cvEvidence: [
          { evidenceId: "no-offsets", text: "Redis" },
          { evidenceId: "fallback", text: "Redis", charStart: 45, charEnd: 50, section: "raw_text_fallback" },
        ],
      }),
    ]);
    expect(unplaced).toEqual([
      { evidenceId: "no-offsets", text: "Redis", requirementIds: ["req-a"], reason: "missing_offsets" },
    ]);
    expect(marks[0].foundAtMatchTime).toBe(true);
  });
});

describe("mergeEvidenceSources", () => {
  it("lets spans returned by the match override the stored parsed CV", () => {
    const merged = mergeEvidenceSources(
      [{ evidenceId: "e1", text: "old" }, { evidenceId: "e2", text: "kept" }],
      [{ evidenceId: "e1", text: "new" }, { evidenceId: "fallback-evidence-1", text: "found" }]
    );
    expect(merged.map((item) => [item.evidenceId, item.text])).toEqual([
      ["e1", "new"],
      ["e2", "kept"],
      ["fallback-evidence-1", "found"],
    ]);
  });
});

describe("nextStepHint", () => {
  it("gives no hint for met criteria and never promises a result change", () => {
    expect(nextStepHint(requirement({ id: "req-a" }))).toBeNull();
    const hint = nextStepHint(requirement({ id: "Kubernetes", status: "not_met", statusLabel: "Chưa đáp ứng" }));
    expect(hint).toContain("Đừng thêm điều bạn chưa làm");
    expect(hint).not.toMatch(/sẽ (được|chuyển) (phù hợp|đạt)/);
  });
});
