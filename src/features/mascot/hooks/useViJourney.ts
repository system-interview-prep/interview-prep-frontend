"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import { userCvApi } from "@features/resume/services/userCv.service";
import { interviewRuntimeApi } from "@features/interview/services/interviewRuntime.service";
import { useSavedJobs } from "@features/user-dashboard/hooks/useSavedJobs";
import { buildViJourney, reportIdFromPath, type ViCv, type ViJourney, type ViSession } from "../utils/viJourney";

const SEEN_REPORTS_KEY = "vi.seen_reports";
/** Poll quickly only while a CV is being read; otherwise a slow heartbeat. */
const BUSY_POLL_MS = 5_000;
const IDLE_POLL_MS = 60_000;

/** Ask Vi to look again right away (after an upload, say). */
export function refreshVi() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("vi:refresh"));
}

function parseIds(raw: string | null): Set<string> {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function hasToken(): boolean {
  try {
    return Boolean(localStorage.getItem("accessToken"));
  } catch {
    return false;
  }
}

/**
 * The signed-in candidate's journey for Vi. Loads the newest CVs and the
 * interview sessions, re-checks on navigation, on focus and on `refreshVi()`,
 * and marks a report seen when its results page is opened.
 * Returns null while disabled or before the first load.
 */
export function useViJourney(enabled: boolean, pathname: string): ViJourney | null {
  const { savedJobIds } = useSavedJobs();
  const [seenRaw, setSeenRaw] = useLocalStorageValue(SEEN_REPORTS_KEY);
  const seenReports = useMemo(() => parseIds(seenRaw), [seenRaw]);
  const [data, setData] = useState<{ cvs: ViCv[]; sessions: ViSession[] } | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    const id = reportIdFromPath(pathname);
    if (!id || seenReports.has(id)) return;
    setSeenRaw(JSON.stringify([...seenReports, id].slice(-200)));
  }, [pathname, seenReports, setSeenRaw]);

  const load = useCallback(async () => {
    const [cvsResult, sessionsResult] = await Promise.allSettled([userCvApi.list(5), interviewRuntimeApi.list()]);
    setData((previous) => {
      const cvs = cvsResult.status === "fulfilled" ? cvsResult.value.data.items : (previous?.cvs ?? []);
      const sessions =
        sessionsResult.status === "fulfilled"
          ? [...sessionsResult.value].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
          : (previous?.sessions ?? []);
      busy.current = cvs[0] ? cvs[0].status !== "DONE" && cvs[0].status !== "FAILED" : false;
      return { cvs, sessions };
    });
  }, []);

  const active = enabled && hasToken();

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer: number | undefined;
    const tick = async () => {
      await load();
      if (cancelled) return;
      timer = window.setTimeout(() => void tick(), busy.current ? BUSY_POLL_MS : IDLE_POLL_MS);
    };
    const now = () => {
      window.clearTimeout(timer);
      void tick();
    };
    void tick();
    window.addEventListener("focus", now);
    window.addEventListener("vi:refresh", now);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("focus", now);
      window.removeEventListener("vi:refresh", now);
    };
  }, [active, load, pathname]);

  return useMemo(() => {
    if (!active || !data) return null;
    return buildViJourney({
      cvs: data.cvs,
      sessions: data.sessions,
      savedJobCount: savedJobIds.size,
      seenReports,
    });
  }, [active, data, savedJobIds, seenReports]);
}
