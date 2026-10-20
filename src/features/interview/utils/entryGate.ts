import type { CvScoringResponse } from "@/lib/aiService";

/**
 * Entering an interview room. Mirrors interview-prep-core `planning/entry_gate.py`,
 * which is the one enforced when the session is created.
 *
 * Default is practice mode: once the CV has been matched against the job,
 * everyone may practise. A low score or a failed must-have only warns (and the
 * candidate confirms); the session then starts one level easier. Screening
 * mode (backend env) turns the same rules into blocks.
 */
export type InterviewEntryPolicy = {
  minMatchPercent: number;
  blockNotEligible: boolean;
  requireMatchScore: boolean;
  /** Below this the candidate is warned and asked to confirm; never a block. */
  lowFitPercent: number;
  /** From this (and eligible) the challenge tier unlocks. */
  challengePercent: number;
};

/** basic: one level easier than the job; challenge: one level harder plus deeper follow-ups. */
export type PracticeTier = "basic" | "standard" | "challenge";

export const DEFAULT_ENTRY_POLICY: InterviewEntryPolicy = {
  minMatchPercent: 0,
  blockNotEligible: false,
  requireMatchScore: false,
  lowFitPercent: 40,
  challengePercent: 70,
};

export type EntryWarning = "match_not_eligible" | "match_low_fit" | "match_score_unavailable";

export type EntryBlockReason = "match_score_unavailable" | "match_not_eligible" | "match_below_threshold";

export type EntryDecision = {
  allowed: boolean;
  reason: EntryBlockReason | null;
  percentage: number | null;
  warnings: EntryWarning[];
  /** Low score or failed must-have: ask before opening the room. */
  needsConfirmation: boolean;
  tier: PracticeTier;
};

/** `score.percentage` of a normalized result is the percentage the fit report shows. */
export function evaluateEntry(
  result: Pick<CvScoringResponse, "score" | "fitBand" | "eligibility" | "matchingDecision">,
  policy: InterviewEntryPolicy = DEFAULT_ENTRY_POLICY,
): EntryDecision {
  const raw = result.score?.percentage;
  const percentage = typeof raw === "number" ? Math.max(0, Math.min(100, Math.round(raw))) : null;
  const notEligible = result.fitBand === "not_eligible" || result.eligibility === "ineligible";
  const lowFit = policy.lowFitPercent ?? DEFAULT_ENTRY_POLICY.lowFitPercent;
  const warnings: EntryWarning[] = [];
  if (notEligible) warnings.push("match_not_eligible");
  if (percentage === null) warnings.push("match_score_unavailable");
  else if (percentage < lowFit) warnings.push("match_low_fit");
  const challenge = policy.challengePercent ?? DEFAULT_ENTRY_POLICY.challengePercent;
  const tier: PracticeTier =
    warnings.includes("match_low_fit") || warnings.includes("match_not_eligible")
      ? "basic"
      : percentage !== null &&
          percentage >= challenge &&
          result.eligibility === "eligible" &&
          (result.matchingDecision ?? "assessed") === "assessed"
        ? "challenge"
        : "standard";
  const decide = (reason: EntryBlockReason | null): EntryDecision => ({
    tier,
    allowed: reason === null,
    reason,
    percentage,
    warnings,
    needsConfirmation: reason === null && (warnings.includes("match_low_fit") || warnings.includes("match_not_eligible")),
  });
  if (policy.blockNotEligible && notEligible) {
    return decide("match_not_eligible");
  }
  if (percentage === null) return decide(policy.requireMatchScore ? "match_score_unavailable" : null);
  if (percentage < policy.minMatchPercent) return decide("match_below_threshold");
  return decide(null);
}

/** i18n key for a blocked entry; fill {score} and {min} with fmt. */
export function entryBlockMessageKey(reason: EntryBlockReason): string {
  return `picker.entry.${reason}`;
}

const ENTRY_CODES: readonly string[] = ["match_score_unavailable", "match_not_eligible", "match_below_threshold"];

/** The backend's 409 detail when session creation was refused by the threshold. */
export function entryBlockFromError(
  error: unknown,
): { reason: EntryBlockReason; percentage: number | null; minMatchPercent: number | null } | null {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (!detail || typeof detail !== "object") return null;
  const { errorCode, details } = detail as {
    errorCode?: string;
    details?: { percentage?: number | null; minMatchPercent?: number | null };
  };
  if (!errorCode || !ENTRY_CODES.includes(errorCode)) return null;
  return {
    reason: errorCode as EntryBlockReason,
    percentage: typeof details?.percentage === "number" ? details.percentage : null,
    minMatchPercent: typeof details?.minMatchPercent === "number" ? details.minMatchPercent : null,
  };
}

/** i18n key explaining a warning; fill {score} and {low} with fmt. */
export function entryWarningMessageKey(warning: EntryWarning): string {
  return `picker.entry.warn.${warning}`;
}

/**
 * What the candidate can do to reach the next tier, as an i18n key plus the
 * points still needed. Null once the challenge tier is unlocked.
 */
export function nextTierHint(
  decision: EntryDecision,
  policy: InterviewEntryPolicy = DEFAULT_ENTRY_POLICY,
): { key: string; points: number | null } | null {
  if (decision.tier === "challenge") return null;
  if (decision.warnings.includes("match_not_eligible")) return { key: "picker.tier.next.needEligible", points: null };
  if (decision.percentage === null) return { key: "picker.tier.next.needScore", points: null };
  if (decision.tier === "basic") {
    return { key: "picker.tier.next.toStandard", points: Math.max(1, policy.lowFitPercent - decision.percentage) };
  }
  if (decision.percentage < policy.challengePercent) {
    return { key: "picker.tier.next.toChallenge", points: Math.max(1, policy.challengePercent - decision.percentage) };
  }
  // Score high enough but not a final score (review required): eligibility decides.
  return { key: "picker.tier.next.needEligible", points: null };
}
