import { describe, expect, it } from "vitest";
import { describeStartInterviewError } from "../services/interviewSession.service";
import { DEFAULT_ENTRY_POLICY, entryBlockFromError, evaluateEntry, nextTierHint } from "../utils/entryGate";

const result = (percentage: number | null, fitBand = "partial_fit", eligibility = "eligible") =>
  ({ score: { raw: null, max: 100, normalized: null, percentage }, fitBand, eligibility }) as never;

const SCREENING = { minMatchPercent: 40, blockNotEligible: true, requireMatchScore: true, lowFitPercent: 40, challengePercent: 70 };

describe("interview entry, practice mode (default)", () => {
  it("lets everyone with a match result in", () => {
    expect(evaluateEntry(result(12)).allowed).toBe(true);
    expect(evaluateEntry(result(80, "not_eligible", "ineligible")).allowed).toBe(true);
    expect(evaluateEntry(result(null, "insufficient_evidence", "review_required")).allowed).toBe(true);
    expect(DEFAULT_ENTRY_POLICY).toEqual({
      minMatchPercent: 0, blockNotEligible: false, requireMatchScore: false, lowFitPercent: 40, challengePercent: 70,
    });
  });

  it("asks to confirm a far CV, not a good one or an unscored one", () => {
    expect(evaluateEntry(result(12))).toMatchObject({ warnings: ["match_low_fit"], needsConfirmation: true });
    expect(evaluateEntry(result(80, "not_eligible", "ineligible"))).toMatchObject({
      warnings: ["match_not_eligible"],
      needsConfirmation: true,
    });
    expect(evaluateEntry(result(null, "insufficient_evidence", "review_required"))).toMatchObject({
      warnings: ["match_score_unavailable"],
      needsConfirmation: false,
    });
    expect(evaluateEntry(result(72))).toMatchObject({ warnings: [], needsConfirmation: false });
  });
});

describe("interview entry, screening mode (mirrors backend entry_gate.py)", () => {
  it("lets a score at or above the threshold in", () => {
    expect(evaluateEntry(result(40), SCREENING).allowed).toBe(true);
    expect(evaluateEntry(result(88, "strong_fit"), SCREENING).allowed).toBe(true);
  });

  it("blocks a score below the threshold", () => {
    expect(evaluateEntry(result(39), SCREENING)).toMatchObject({ allowed: false, reason: "match_below_threshold", percentage: 39 });
  });

  it("blocks a failed must-have and a missing score", () => {
    expect(evaluateEntry(result(80, "not_eligible", "ineligible"), SCREENING).reason).toBe("match_not_eligible");
    expect(evaluateEntry(result(null, "insufficient_evidence", "review_required"), SCREENING).reason).toBe(
      "match_score_unavailable",
    );
  });

  it("follows the policy the backend returns", () => {
    const relaxed = { minMatchPercent: 0, blockNotEligible: false, requireMatchScore: false, lowFitPercent: 40, challengePercent: 70 };
    expect(evaluateEntry(result(5), relaxed).allowed).toBe(true);
    expect(evaluateEntry(result(null, "not_eligible", "ineligible"), relaxed).allowed).toBe(true);
  });

  it("explains a 409 from session creation in the candidate's words", () => {
    const error = {
      response: {
        status: 409,
        data: {
          detail: {
            errorCode: "match_below_threshold",
            message: "…",
            details: { percentage: 31, minMatchPercent: 40, fitBand: "partial_fit" },
          },
        },
      },
    };
    expect(entryBlockFromError(error)).toEqual({ reason: "match_below_threshold", percentage: 31, minMatchPercent: 40 });
    expect(describeStartInterviewError(error)).toBe("Điểm phù hợp 31% thấp hơn mức tối thiểu 40% để vào phòng phỏng vấn.");
    expect(entryBlockFromError({ response: { data: { detail: "x" } } })).toBeNull();
  });
});

describe("practice tier (mirrors backend entry_gate.py)", () => {
  it("unlocks by score", () => {
    expect(evaluateEntry(result(39)).tier).toBe("basic");
    expect(evaluateEntry(result(55)).tier).toBe("standard");
    expect(evaluateEntry(result(70)).tier).toBe("challenge");
    expect(evaluateEntry(result(90, "not_eligible", "ineligible")).tier).toBe("basic");
    expect(evaluateEntry(result(85, "review_required", "review_required")).tier).toBe("standard");
  });

  it("tells how far the next tier is", () => {
    expect(nextTierHint(evaluateEntry(result(31)))).toEqual({ key: "picker.tier.next.toStandard", points: 9 });
    expect(nextTierHint(evaluateEntry(result(62)))).toEqual({ key: "picker.tier.next.toChallenge", points: 8 });
    expect(nextTierHint(evaluateEntry(result(75)))).toBeNull();
    expect(nextTierHint(evaluateEntry(result(80, "not_eligible", "ineligible")))?.key).toBe("picker.tier.next.needEligible");
    expect(nextTierHint(evaluateEntry(result(null, "insufficient_evidence", "review_required")))?.key).toBe(
      "picker.tier.next.needScore",
    );
  });
});
