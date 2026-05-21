"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { jobProfileApi } from "@/services/jobProfileApi";
import { emitJoinJp, getJpSocket, onJpSocketException, onJpStatus } from "@/services/jpSocket";
import { isTerminalJpStatus, normalizeJpUploadStatus, type JpStatusPayload, type JpUploadStatus } from "@/types/jpUpload";

const POLL_MS = 4000;
const POLL_MAX_MS = 5 * 60 * 1000;

export type UseJpUploadStatusResult = {
  status: JpUploadStatus | null;
  lastPayload: JpStatusPayload | null;
  pollError: string | null;
  isTracking: boolean;
  latestUpload: Awaited<ReturnType<typeof jobProfileApi.getUpload>>["data"] | null;
};

type Options = {
  onDone?: () => void;
  onFailed?: (message?: string) => void;
};

export function useJpUploadStatus(uploadId: string | null, options: Options = {}): UseJpUploadStatusResult {
  const { onDone, onFailed } = options;
  const onDoneRef = useRef(onDone);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onDoneRef.current = onDone;
    onFailedRef.current = onFailed;
  }, [onDone, onFailed]);

  const [status, setStatus] = useState<JpUploadStatus | null>(null);
  const [lastPayload, setLastPayload] = useState<JpStatusPayload | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [latestUpload, setLatestUpload] = useState<UseJpUploadStatusResult["latestUpload"]>(null);

  const terminalRef = useRef(false);
  const pollStartRef = useRef(0);
  const uploadIdRef = useRef<string | null>(uploadId);

  useEffect(() => {
    uploadIdRef.current = uploadId;
  }, [uploadId]);

  const applyPayload = useCallback((p: JpStatusPayload) => {
    const rawStatus = typeof p.status === "string" ? p.status.trim() : "";
    const normalized = normalizeJpUploadStatus(p.status, { hasError: Boolean(p.error) });
    const unknownStatus = Boolean(rawStatus) && !normalized && !p.error;
    const nextStatus = unknownStatus ? "FAILED" : p.error ? "FAILED" : (normalized || "PENDING");

    const nextPayload = nextStatus === p.status && !unknownStatus ? p : { ...p, status: nextStatus };
    setLastPayload(nextPayload);
    setStatus(nextStatus);

    if (isTerminalJpStatus(nextStatus)) {
      terminalRef.current = true;
      setIsTracking(false);
      if (nextStatus === "DONE") onDoneRef.current?.();
      if (nextStatus === "FAILED") onFailedRef.current?.(nextPayload.error);

      // Hydrate latestUpload once when reaching terminal state via socket
      // (polling might not have fetched the final record yet).
      const id = uploadIdRef.current;
      if (id) {
        void jobProfileApi
          .getUpload(id)
          .then(({ data }) => {
            if (uploadIdRef.current === id) setLatestUpload(data);
          })
          .catch(() => {
            // ignore
          });
      }
    }
  }, []);

  useEffect(() => {
    terminalRef.current = false;
    queueMicrotask(() => setPollError(null));
    if (!uploadId) {
      queueMicrotask(() => {
        setStatus(null);
        setLastPayload(null);
        setIsTracking(false);
        setLatestUpload(null);
      });
      return;
    }

    setIsTracking(true);
    pollStartRef.current = Date.now();
    const socket = getJpSocket();
    const joinRoom = () => emitJoinJp(uploadId);
    if (socket.connected) joinRoom();
    else socket.once("connect", joinRoom);

    const unsub = onJpStatus((payload) => {
      if (payload.uploadId !== uploadId) return;
      applyPayload(payload);
    });
    const unsubException = onJpSocketException((payload) => {
      const payloadId = String(payload.uploadId || "").trim();
      if (payloadId && payloadId !== uploadId) return;
      applyPayload({
        uploadId,
        status: "FAILED",
        error: payload.code || payload.message || "socket_exception",
      });
    });

    const pollInterval = window.setInterval(async () => {
      if (terminalRef.current) return;
      if (Date.now() - pollStartRef.current > POLL_MAX_MS) {
        applyPayload({ uploadId, status: "FAILED", error: "processing_timeout" });
        setPollError("processing_timeout");
        window.clearInterval(pollInterval);
        return;
      }
      try {
        const { data } = await jobProfileApi.getUpload(uploadId);
        setLatestUpload(data);
        const st = normalizeJpUploadStatus(data.status, { hasError: Boolean(data.error) });
        if (st) setStatus(data.error ? "FAILED" : st);
        if (st && (isTerminalJpStatus(st) || data.error)) {
          applyPayload({
            uploadId,
            status: data.error && st !== "DONE" ? "FAILED" : st,
            updatedAt: data.updatedAt,
            error: data.error ?? undefined,
            parseSource: data.parseSource ?? undefined,
          });
          window.clearInterval(pollInterval);
        }
      } catch {
        setPollError("poll");
      }
    }, POLL_MS);

    return () => {
      socket.off("connect", joinRoom);
      unsub();
      unsubException();
      window.clearInterval(pollInterval);
      setIsTracking(false);
    };
  }, [uploadId, applyPayload]);

  return { status, lastPayload, pollError, isTracking, latestUpload };
}

