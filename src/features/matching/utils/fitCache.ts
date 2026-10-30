"use client";

import { useMemo } from "react";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";

/**
 * The latest CV–JD analysis per job, kept in this browser. Matching results
 * are not stored server-side and re-running them costs LLM budget, so job
 * cards show the last analysis the candidate opened, with the CV and date
 * that produced it so a stale result reads as stale.
 */
export type CachedFit = {
  jobId: string;
  cvId: string;
  cvName?: string | null;
  met: number;
  total: number;
  analyzedAt: string;
};

const STORAGE_KEY = "candidate.fit_by_job";

/** Requirements met out of those that apply (`not_applicable` is left out of both). */
export function countFit(results?: Array<{ status: string }> | null): { met: number; total: number } {
  const applicable = (results ?? []).filter((item) => item.status !== "not_applicable");
  return { met: applicable.filter((item) => item.status === "met").length, total: applicable.length };
}

function parseFits(raw: string | null): Record<string, CachedFit> {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function readFits(): Record<string, CachedFit> {
  try {
    return typeof window === "undefined" ? {} : parseFits(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {};
  }
}

export function saveFit(fit: CachedFit): void {
  if (!fit.jobId || !fit.cvId || fit.total <= 0) return;
  try {
    const all = readFits();
    all[fit.jobId] = fit;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/** Cached fits; empty on the server and first client render (no hydration mismatch). */
export function useFitCache(): Record<string, CachedFit> {
  const [raw] = useLocalStorageValue(STORAGE_KEY);
  return useMemo(() => parseFits(raw), [raw]);
}
