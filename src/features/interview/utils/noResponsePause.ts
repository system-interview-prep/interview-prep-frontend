export const NO_RESPONSE_PAUSE_AFTER_MS = 90_000;

/** Returns when the inactivity pause should appear, or null without a question start time. */
export function noResponsePauseDeadline(
  questionStartedAt: string | null | undefined,
  lastCandidateActivityAt: number | null,
  thresholdMs = NO_RESPONSE_PAUSE_AFTER_MS,
): number | null {
  const questionStartMs = questionStartedAt ? Date.parse(questionStartedAt) : Number.NaN;
  if (!Number.isFinite(questionStartMs)) return null;
  return Math.max(questionStartMs, lastCandidateActivityAt ?? 0) + thresholdMs;
}
