"use client";

import { useSyncExternalStore } from "react";
import { pipelineService, type AdminAlert, type AdminAlerts } from "../services/pipeline.service";
import { alertKey } from "../utils/pipelineFormat";
import { usePipelineSocket } from "./usePipelineSocket";

/**
 * Proactive admin alerts (GET /admin/ai/alerts), shared by the banner and the
 * sidebar badge so the page fetches them once.
 *
 * Refreshed every minute, and soon after the backend pushes a notice that
 * reports a problem. A dismissed alert stays hidden in this browser until it
 * has a newer occurrence (its key includes the time of the latest one).
 */

const POLL_MS = 60_000;
const PUSH_DEBOUNCE_MS = 1500;
const STORAGE_KEY = "admin.alerts.dismissed";

type Snapshot = { data: AdminAlerts | null; dismissed: ReadonlySet<string> };

const SERVER_SNAPSHOT: Snapshot = { data: null, dismissed: new Set() };
let snapshot: Snapshot = { data: null, dismissed: readDismissed() };
const subscribers = new Set<() => void>();
let pollTimer: number | null = null;
let pushTimer: number | null = null;
let inFlight = false;

function readDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const keys = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(keys) ? keys.filter((key): key is string => typeof key === "string") : []);
  } catch {
    return new Set();
  }
}

function writeDismissed(keys: ReadonlySet<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys].slice(-50)));
  } catch {
    // Storage blocked: dismissals last until the page reloads.
  }
}

function emit(next: Snapshot) {
  snapshot = next;
  subscribers.forEach((notify) => notify());
}

async function load() {
  if (inFlight) return;
  inFlight = true;
  try {
    const data = await pipelineService.alerts();
    emit({ ...snapshot, data });
  } catch {
    // Keep the last alerts; the next poll retries.
  } finally {
    inFlight = false;
  }
}

function scheduleLoad() {
  if (typeof window === "undefined") return;
  if (pushTimer !== null) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void load();
  }, PUSH_DEBOUNCE_MS);
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  if (subscribers.size === 1) {
    void load();
    pollTimer = window.setInterval(() => void load(), POLL_MS);
  }
  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0 && pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

export function dismissAlert(alert: AdminAlert) {
  const dismissed = new Set(snapshot.dismissed);
  dismissed.add(alertKey(alert));
  writeDismissed(dismissed);
  emit({ ...snapshot, dismissed });
}

export function useAdminAlerts(): {
  visible: AdminAlert[];
  all: AdminAlert[];
  errorCount: number;
  warningCount: number;
} {
  const current = useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT);
  usePipelineSocket((summary) => {
    if (summary.problems > 0 || summary.aiErrors > 0) scheduleLoad();
  });
  const all = current.data?.alerts ?? [];
  const visible = all.filter((alert) => !current.dismissed.has(alertKey(alert)));
  return {
    visible,
    all,
    errorCount: visible.filter((alert) => alert.severity === "error").length,
    warningCount: visible.filter((alert) => alert.severity === "warning").length,
  };
}
