// Mirrors Core's `_question_budget` (planning/planner.py): presets take ~540s
// (warm-up, CV validation, behavioral, closing) and each technical question
// ~240s including one follow-up. The demo package is turn-driven in Core
// (core/demo_mode.py) and always freezes two: one deep-dive, one challenge.
const PRESET_SECONDS = 540;
const TECHNICAL_SECONDS = 240;
const MAX_TECHNICAL = 8;
// Warm-up, CV validation and behavioral are always asked.
export const PRESET_QUESTION_COUNT = 3;

/** Short duration for live demos: walks every stage, can run ~3 min over. */
export const DEMO_DURATION_MINUTES = 3;
const DEMO_TECHNICAL = 2;

export function technicalQuestionBudget(durationMinutes: number): number {
  if (durationMinutes > 0 && durationMinutes <= DEMO_DURATION_MINUTES) return DEMO_TECHNICAL;
  const available = durationMinutes * 60 - PRESET_SECONDS;
  return Math.max(1, Math.min(MAX_TECHNICAL, Math.floor(available / TECHNICAL_SECONDS)));
}

export function totalQuestionCount(durationMinutes: number): number {
  return technicalQuestionBudget(durationMinutes) + PRESET_QUESTION_COUNT;
}
