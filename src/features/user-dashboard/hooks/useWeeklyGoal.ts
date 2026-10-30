"use client";

import { useCallback } from "react";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";

const STORAGE_KEY = "candidate.weekly_goal";
export const WEEKLY_GOAL_OPTIONS = [1, 2, 3, 4, 5, 7] as const;
const DEFAULT_GOAL = 3;

/** Sessions per week the candidate aims for; a suggestion, never a streak penalty. */
export function useWeeklyGoal() {
  const [raw, setRaw] = useLocalStorageValue(STORAGE_KEY);
  const stored = Number(raw);
  const goal = (WEEKLY_GOAL_OPTIONS as readonly number[]).includes(stored) ? stored : DEFAULT_GOAL;
  const setGoal = useCallback((next: number) => setRaw(String(next)), [setRaw]);
  return { goal, setGoal };
}
