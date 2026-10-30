"use client";

import { useSyncExternalStore } from "react";
import { notificationsApi, type Notification } from "@/lib/api/notificationsApi";
import apiClient from "@/lib/apiClient";
import { useNotificationPush } from "@features/admin/pipeline/hooks/usePipelineSocket";

/**
 * The signed-in admin's notifications (GET /notifications), shared by the bell
 * and the toasts so the page loads them once.
 *
 * The backend creates one per new AI pipeline problem
 * (interviews/application/admin_notifier.py) and announces it on the admin
 * socket; the list is also polled every 30 s. A notification that appears
 * after the first load is shown as a toast while the tab is visible, or as a
 * system notification (Windows / browser) while it is hidden and the admin
 * has allowed them.
 */

const POLL_MS = 30_000;
const TOAST_MS = 8_000;
const LIMIT = 50;

export type Toast = { id: string; title: string; message: string; severity: string; link: string | null };

type Snapshot = {
  items: Notification[];
  loaded: boolean;
  toasts: Toast[];
  permission: NotificationPermission | "unsupported";
};

const SERVER: Snapshot = { items: [], loaded: false, toasts: [], permission: "unsupported" };
let snapshot: Snapshot = { ...SERVER, permission: currentPermission() };
const subscribers = new Set<() => void>();
const known = new Set<string>();
let pollTimer: number | null = null;
let loading = false;

function currentPermission(): Snapshot["permission"] {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return window.Notification.permission;
}

function emit(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  subscribers.forEach((notify) => notify());
}

export function linkOf(item: Pick<Notification, "data">): string | null {
  const link = item.data?.link;
  return typeof link === "string" && link.startsWith("/") ? link : null;
}

export function severityOf(item: Pick<Notification, "data">): "error" | "warning" | "info" {
  const severity = item.data?.severity;
  return severity === "error" || severity === "warning" ? severity : "info";
}

function announce(fresh: Notification[]) {
  if (!fresh.length) return;
  const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
  if (hidden && snapshot.permission === "granted") {
    for (const item of fresh.slice(0, 3)) {
      try {
        const shown = new window.Notification(item.title, { body: item.message, tag: item.id });
        shown.onclick = () => {
          window.focus();
          const link = linkOf(item);
          if (link) window.location.assign(link);
          void markRead(item.id);
          shown.close();
        };
      } catch {
        // Some browsers only allow notifications from a service worker.
      }
    }
    return;
  }
  const toasts = fresh.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    severity: severityOf(item),
    link: linkOf(item),
  }));
  emit({ toasts: [...toasts, ...snapshot.toasts].slice(0, 4) });
  for (const toast of toasts) window.setTimeout(() => dismissToast(toast.id), TOAST_MS);
}

export async function load() {
  if (loading) return;
  loading = true;
  try {
    const { data } = await notificationsApi.list({ limit: LIMIT });
    const items = data.items ?? [];
    const firstLoad = !snapshot.loaded;
    const fresh = items.filter((item) => !item.read && !known.has(item.id));
    items.forEach((item) => known.add(item.id));
    emit({ items, loaded: true });
    if (!firstLoad) announce(fresh);
  } catch {
    // Keep the last list; the next poll retries.
  } finally {
    loading = false;
  }
}

export function dismissToast(id: string) {
  if (!snapshot.toasts.some((toast) => toast.id === id)) return;
  emit({ toasts: snapshot.toasts.filter((toast) => toast.id !== id) });
}

export async function markRead(id: string) {
  emit({
    items: snapshot.items.map((item) => (item.id === id ? { ...item, read: true, readAt: new Date().toISOString() } : item)),
  });
  try {
    await notificationsApi.markRead(id);
  } catch {
    void load();
  }
}

export async function markAllRead() {
  const now = new Date().toISOString();
  emit({ items: snapshot.items.map((item) => (item.read ? item : { ...item, read: true, readAt: now })) });
  try {
    await apiClient.post("/notifications/read-all");
  } catch {
    void load();
  }
}

/** Ask to show system notifications while the admin tab is in the background. */
export async function requestPermission() {
  if (currentPermission() === "unsupported") return;
  try {
    const result = await window.Notification.requestPermission();
    emit({ permission: result });
  } catch {
    emit({ permission: currentPermission() });
  }
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

/** The current state, outside React (tests). */
export function notificationsSnapshot(): Snapshot {
  return snapshot;
}

export function useAdminNotifications(): Snapshot & { unread: number } {
  const current = useSyncExternalStore(subscribe, () => snapshot, () => SERVER);
  // A push means new rows exist: load them now instead of at the next poll.
  useNotificationPush(() => void load());
  return { ...current, unread: current.items.filter((item) => !item.read).length };
}
