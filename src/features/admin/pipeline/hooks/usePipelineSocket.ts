"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constants";
import type { PipelineLiveSummary } from "../services/pipeline.service";

/**
 * One socket.io connection to /admin-pipeline shared by every admin component
 * on the page (backend: interviews/application/pipeline_live.py).
 *
 * The backend pushes a short summary a few hundred milliseconds after it
 * stores pipeline events; components refetch what they show. Pages keep a
 * slower poll as a fallback, so a refused or lost socket only makes them
 * slower, never stale. It also carries "notification.new" when the backend
 * creates admin notifications (interviews/application/admin_notifier.py).
 */

type Listener = (summary: PipelineLiveSummary) => void;

/** Pushed when new admin notifications were created (backend: publish_notifications). */
export type AdminNotificationPush = {
  count: number;
  items: { title: string; message: string; kind: string | null; severity: string | null; link: string | null }[];
};

let socket: Socket | null = null;
let users = 0;
let connected = false;
const listeners = new Set<Listener>();
const notificationListeners = new Set<(payload: AdminNotificationPush) => void>();
const statusListeners = new Set<() => void>();

function readToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = localStorage.getItem("accessToken");
    if (stored) return stored;
  } catch {
    // Storage blocked: fall back to the cookie.
  }
  const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function setConnected(value: boolean) {
  if (connected === value) return;
  connected = value;
  statusListeners.forEach((notify) => notify());
}

function acquire() {
  users += 1;
  if (socket || typeof window === "undefined" || !readToken()) return;
  const client = io(`${SOCKET_URL.replace(/\/$/, "")}/admin-pipeline`, {
    transports: ["websocket", "polling"],
    // A function, so a reconnect sends the current token.
    auth: (cb) => cb({ token: readToken() }),
    reconnectionDelayMax: 10_000,
  });
  client.on("connect", () => setConnected(true));
  client.on("disconnect", () => setConnected(false));
  client.on("connect_error", () => setConnected(false));
  client.on("pipeline.event", (summary: PipelineLiveSummary) => {
    listeners.forEach((listener) => listener(summary));
  });
  client.on("notification.new", (payload: AdminNotificationPush) => {
    notificationListeners.forEach((listener) => listener(payload));
  });
  socket = client;
}

function release() {
  users = Math.max(0, users - 1);
  if (users === 0 && socket) {
    socket.disconnect();
    socket = null;
    setConnected(false);
  }
}

function subscribeStatus(notify: () => void) {
  statusListeners.add(notify);
  return () => statusListeners.delete(notify);
}

/**
 * Calls `onEvent` for every pushed summary (all sessions, or only `sessionId`
 * when given). Returns whether the socket is connected, so callers can poll
 * less often while it is.
 */
export function usePipelineSocket(onEvent: Listener, sessionId?: string | null): { connected: boolean } {
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  });

  useEffect(() => {
    acquire();
    const listener: Listener = (summary) => {
      if (sessionId && summary.sessionId !== sessionId) return;
      handler.current(summary);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      release();
    };
  }, [sessionId]);

  const isConnected = useSyncExternalStore(
    subscribeStatus,
    () => connected,
    () => false,
  );
  return { connected: isConnected };
}

/** Calls `onPush` when the backend announces new admin notifications. */
export function useNotificationPush(onPush: (payload: AdminNotificationPush) => void): { connected: boolean } {
  const handler = useRef(onPush);
  useEffect(() => {
    handler.current = onPush;
  });
  useEffect(() => {
    acquire();
    const listener = (payload: AdminNotificationPush) => handler.current(payload);
    notificationListeners.add(listener);
    return () => {
      notificationListeners.delete(listener);
      release();
    };
  }, []);
  const isConnected = useSyncExternalStore(
    subscribeStatus,
    () => connected,
    () => false,
  );
  return { connected: isConnected };
}

/** A function that runs `fn` once, `delayMs` after the last call. */
export function useDebounced(fn: () => void, delayMs: number): () => void {
  const fnRef = useRef(fn);
  const timer = useRef<number | null>(null);
  useEffect(() => {
    fnRef.current = fn;
  });
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  return useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      fnRef.current();
    }, delayMs);
  }, [delayMs]);
}
