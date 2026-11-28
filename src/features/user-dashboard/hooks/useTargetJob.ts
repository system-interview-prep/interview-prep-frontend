"use client";

import { useCallback } from "react";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";

const TARGET_JOB_KEY = "candidate.target_job_id";

/** The selected job is shared by the dashboard overview and the progress page. */
export function useTargetJob() {
  const [targetJobId, setTargetJobId] = useLocalStorageValue(TARGET_JOB_KEY);
  const selectTargetJob = useCallback((jobId: string) => setTargetJobId(jobId), [setTargetJobId]);
  return { targetJobId, selectTargetJob };
}
