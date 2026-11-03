"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { apiClient } from "@/lib/apiClient";

/** Latest CV–JD analysis summary returned by the authenticated backend. */
export type CandidateJobFit = {
  jobId: string;
  cvId: string;
  cvName?: string | null;
  met: number;
  total: number;
  analyzedAt: string;
};

type FitHistoryResponse = { items?: CandidateJobFit[] };
type FitState = { token: string; fits: Record<string, CandidateJobFit> };

function subscribeToAuth(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("authprofilechange", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("authprofilechange", onChange);
    window.removeEventListener("focus", onChange);
  };
}

function accessTokenSnapshot(): string | null {
  try {
    return localStorage.getItem("accessToken") ?? localStorage.getItem("access_token");
  } catch {
    return null;
  }
}

/**
 * Loads fit summaries from the database-backed API. Results are keyed by the
 * current auth token in memory so an account switch never displays a previous
 * account's data while the next request is pending.
 */
export function useFitHistory(enabled = true): Record<string, CandidateJobFit> {
  const token = useSyncExternalStore(subscribeToAuth, accessTokenSnapshot, () => null);
  const [state, setState] = useState<FitState | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem("candidate.fit_by_job");
    } catch {
      // Ignore unavailable browser storage; fit history is fetched from the API.
    }
  }, []);

  useEffect(() => {
    if (!enabled || !token) return;
    let current = true;
    void apiClient.get<FitHistoryResponse>("/api/v1/matching/fit-history")
      .then(({ data }) => {
        if (!current) return;
        const fits = Object.fromEntries(
          (data.items ?? [])
            .filter((fit) => fit.jobId && fit.total > 0)
            .map((fit) => [fit.jobId, fit]),
        );
        setState({ token, fits });
      })
      .catch(() => {
        if (current) setState({ token, fits: {} });
      });
    return () => { current = false; };
  }, [enabled, token]);

  return enabled && token && state?.token === token ? state.fits : {};
}
