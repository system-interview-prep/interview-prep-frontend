"use client";

import { useEffect, useState } from "react";
import { interviewRuntimeApi } from "@features/interview/services/interviewRuntime.service";
import { DEFAULT_ENTRY_POLICY, type InterviewEntryPolicy } from "@features/interview/utils/entryGate";

/**
 * The match threshold the backend enforces when a session is created. Falls
 * back to the default rule if the request fails; the backend still decides.
 */
export function useInterviewEntryPolicy(): InterviewEntryPolicy {
  const [policy, setPolicy] = useState<InterviewEntryPolicy>(DEFAULT_ENTRY_POLICY);
  useEffect(() => {
    let active = true;
    interviewRuntimeApi
      .entryPolicy()
      .then((value) => {
        if (active && value && typeof value.minMatchPercent === "number") setPolicy(value);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return policy;
}
