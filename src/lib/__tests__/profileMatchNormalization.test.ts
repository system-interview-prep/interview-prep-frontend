import { describe, it, expect } from "vitest";
import { normalizeMatchResult } from "../aiService";

/**
 * The backend publishes two equal-standing numbers.  `suitabilityScore` is the
 * evidenced requirement fit and the normalizer withholds it whenever the
 * eligibility gate did not clear.  `profileMatchScore` is CV-JD overlap and is
 * published for *every* pair - so on a rejected run it is the only score there
 * is.  These tests pin that asymmetry: it used to be dropped silently, because
 * the normalizer rebuilds the result field by field and simply never read it.
 */
const base = {
  schemaVersion: "2.1",
  resumeId: "cv-1",
  jobId: "job-1",
  policyVersion: "balanced-v1",
  requirementResults: [],
  factorResults: [],
  warnings: [],
};

describe("profile match survives normalization", () => {
  it("is kept on an ineligible pair, where suitability is withheld", () => {
    const out = normalizeMatchResult(
      {
        ...base,
        eligibility: "ineligible",
        fitBand: "not_eligible",
        decision: "abstained",
        suitabilityScore: 0.42,
        profileMatchScore: 0.279,
        profileMatchBand: "typical",
      },
      "cv-1",
      "job-1",
    );

    expect(out.suitabilityScore).toBeNull();
    expect(out.profileMatchScore).toBe(0.279);
    expect(out.profileMatchBand).toBe("typical");
  });

  it("is kept alongside suitability on an eligible pair", () => {
    const out = normalizeMatchResult(
      {
        ...base,
        eligibility: "eligible",
        fitBand: "strong_fit",
        decision: "assessed",
        suitabilityScore: 0.8,
        profileMatchScore: 0.51,
        profileMatchBand: "above_typical",
      },
      "cv-1",
      "job-1",
    );

    expect(out.suitabilityScore).toBe(0.8);
    expect(out.profileMatchScore).toBe(0.51);
    expect(out.profileMatchBand).toBe("above_typical");
  });

  it("accepts the snake_case spelling a raw backend payload may carry", () => {
    const out = normalizeMatchResult(
      {
        ...base,
        eligibility: "eligible",
        fitBand: "partial_fit",
        decision: "assessed",
        suitability_score: 0.3,
        profile_match_score: 0.14,
        profile_match_band: "below_typical",
      },
      "cv-1",
      "job-1",
    );

    expect(out.profileMatchScore).toBe(0.14);
    expect(out.profileMatchBand).toBe("below_typical");
  });

  it("is null, not zero, when the backend omits it", () => {
    const out = normalizeMatchResult(
      { ...base, eligibility: "eligible", fitBand: "strong_fit", decision: "assessed", suitabilityScore: 0.8 },
      "cv-1",
      "job-1",
    );

    expect(out.profileMatchScore).toBeNull();
    expect(out.profileMatchBand).toBeNull();
  });

  it("rejects a band value outside the published set rather than passing it on", () => {
    const out = normalizeMatchResult(
      {
        ...base,
        eligibility: "eligible",
        fitBand: "strong_fit",
        decision: "assessed",
        suitabilityScore: 0.8,
        profileMatchScore: 0.9,
        profileMatchBand: "excellent",
      },
      "cv-1",
      "job-1",
    );

    expect(out.profileMatchScore).toBe(0.9);
    expect(out.profileMatchBand).toBeNull();
  });
});
