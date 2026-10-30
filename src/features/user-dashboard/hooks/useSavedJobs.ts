"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";

const STORAGE_KEY = "candidate.saved_job_ids";

function parse(raw: string | null): Set<string> {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

/** Saved (bookmarked) job ids, kept in this browser. Shared by the jobs page and the overview. */
export function useSavedJobs() {
  const [raw, setRaw] = useLocalStorageValue(STORAGE_KEY);
  const savedJobIds = useMemo(() => parse(raw), [raw]);

  const toggleSave = useCallback(
    (jobId: string, currentSaved: boolean) => {
      const next = new Set(savedJobIds);
      if (currentSaved) next.delete(jobId);
      else next.add(jobId);
      setRaw(JSON.stringify(Array.from(next)));
    },
    [savedJobIds, setRaw],
  );

  return { savedJobIds, toggleSave };
}
