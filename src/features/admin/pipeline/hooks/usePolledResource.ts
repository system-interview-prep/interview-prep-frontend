"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PolledState<T> =
  | { status: "loading" }
  | { status: "error"; httpStatus: number | null }
  | { status: "ready"; data: T; fetchedAt: number; refreshing: boolean };

/**
 * Load a resource, then poll it while `intervalOf(data)` returns a number.
 * Polling pauses while the tab is hidden and resumes (with an immediate
 * refresh) when it is visible again, so an admin leaving a live session open
 * does not keep hitting the API. A failed refresh keeps the last data.
 */
export function usePolledResource<T>(
  load: () => Promise<T>,
  intervalOf: (data: T | null) => number | null,
  deps: unknown[],
) {
  const [state, setState] = useState<PolledState<T>>({ status: "loading" });
  const [hidden, setHidden] = useState(false);
  const loadRef = useRef(load);
  loadRef.current = load;
  const intervalRef = useRef(intervalOf);
  intervalRef.current = intervalOf;
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setState((prev) => (prev.status === "ready" ? { ...prev, refreshing: true } : prev));
    try {
      const data = await loadRef.current();
      if (current === generation.current) setState({ status: "ready", data, fetchedAt: Date.now(), refreshing: false });
    } catch (error) {
      if (current !== generation.current) return;
      const httpStatus = (error as { response?: { status?: number } })?.response?.status ?? null;
      setState((prev) =>
        prev.status === "ready" ? { ...prev, refreshing: false } : { status: "error", httpStatus },
      );
    }
  }, []);

  useEffect(() => {
    setState({ status: "loading" });
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const onVisibility = () => {
      const isHidden = document.visibilityState === "hidden";
      setHidden(isHidden);
      if (!isHidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refresh]);

  const data = state.status === "ready" ? state.data : null;
  const fetchedAt = state.status === "ready" ? state.fetchedAt : 0;
  const interval = intervalRef.current(data);
  useEffect(() => {
    if (interval === null || hidden) return;
    const timer = window.setTimeout(() => void refresh(), interval);
    return () => window.clearTimeout(timer);
  }, [interval, hidden, fetchedAt, refresh]);

  return { state, refresh, polling: interval !== null && !hidden, paused: interval !== null && hidden };
}
