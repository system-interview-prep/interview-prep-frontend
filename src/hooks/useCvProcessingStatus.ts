"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import { userCvApi } from "@/services/userCvApi";
import { emitJoinCv, getCvSocket, onCvSocketException, onCvStatus } from "@/services/cvSocket";
import {
  normalizeCvProcessingStatus,
  type CvProcessingStatus,
  type CvStatusPayload,
  isTerminalCvStatus,
} from "@/types/cvProcessing";
import { mapBackendErrorToI18nKey } from "@/utils/backendError";

const POLL_MS = 4000;
const POLL_MAX_MS = 5 * 60 * 1000;
const POLL_TIMEOUT_ERROR = "processing_timeout";

function friendlyCvError(raw?: string | null): string | undefined {
  const msg = String(raw ?? "").trim();
  if (!msg) return undefined;
  return mapBackendErrorToI18nKey(msg) ?? msg;
}

export type UseCvProcessingStatusResult = {
  status: CvProcessingStatus | null;
  lastPayload: CvStatusPayload | null;
  pollError: string | null;
  /** Đang theo dõi socket + poll cho cvId hiện tại */
  isTracking: boolean;
};

type Options = {
  /** Gọi khi nhận terminal DONE (từ socket hoặc poll) */
  onDone?: (payload: CvStatusPayload | null) => void;
  /** Gọi khi FAILED */
  onFailed?: (payload: CvStatusPayload | null, message?: string) => void;
};

/**
 * Sau upload: truyền `cvId` — join room `join-cv`, lắng nghe `cv.status`, đồng thời poll GET `/users/me/cvs/:id` dự phòng.
 * Dừng khi DONE/FAILED hoặc unmount / cvId = null.
 */
export function useCvProcessingStatus(
  cvId: string | null,
  options: Options = {}
): UseCvProcessingStatusResult {
  const { onDone, onFailed } = options;
  const onDoneRef = useRef(onDone);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onDoneRef.current = onDone;
    onFailedRef.current = onFailed;
  }, [onDone, onFailed]);

  const [status, setStatus] = useState<CvProcessingStatus | null>(null);
  const [lastPayload, setLastPayload] = useState<CvStatusPayload | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const terminalRef = useRef(false);
  const pollStartRef = useRef(0);

  const applyPayload = useCallback((p: CvStatusPayload) => {
    const rawStatus = typeof p.status === "string" ? p.status.trim() : "";
    const normalized = normalizeCvProcessingStatus(p.status, { hasError: Boolean(p.error) });
    const unknownStatus = Boolean(rawStatus) && !normalized && !p.error;
    const nextStatus = unknownStatus
      ? "FAILED"
      : p.error && normalized !== "DONE"
        ? "FAILED"
        : (normalized || "PENDING");
    const nextPayload =
      nextStatus === p.status && !unknownStatus
        ? p
        : {
            ...p,
            status: nextStatus,
            ...(unknownStatus ? { error: "userDash.myCvs.error.statusSync" } : {}),
          };
    const mappedError = friendlyCvError(nextPayload.error);
    const uiPayload =
      mappedError && nextStatus === "FAILED"
        ? { ...nextPayload, error: mappedError }
        : nextPayload;

    setLastPayload(uiPayload);
    setStatus(nextStatus);

    if (isTerminalCvStatus(nextStatus)) {
      terminalRef.current = true;
      setIsTracking(false);
      if (nextStatus === "DONE") onDoneRef.current?.(uiPayload);
      if (nextStatus === "FAILED") onFailedRef.current?.(uiPayload, uiPayload.error);
    }
  }, []);

  useEffect(() => {
    terminalRef.current = false;
    queueMicrotask(() => setPollError(null));
    if (!cvId) {
      queueMicrotask(() => {
        setStatus(null);
        setLastPayload(null);
        setIsTracking(false);
      });
      return;
    }

    setIsTracking(true);
    pollStartRef.current = Date.now();
    const socket = getCvSocket();
    const joinRoom = () => emitJoinCv(cvId);
    if (socket.connected) joinRoom();
    else socket.once("connect", joinRoom);

    const unsub = onCvStatus((payload) => {
      if (payload.cvId !== cvId) return;
      applyPayload(payload);
    });
    const unsubException = onCvSocketException((payload) => {
      const payloadCvId = String(payload.cvId || "").trim();
      if (payloadCvId && payloadCvId !== cvId) return;
      const err = payload.code || payload.message || "socket_exception";
      applyPayload({
        cvId,
        status: "FAILED",
        error: err,
      });
    });

    const pollInterval = window.setInterval(async () => {
      if (terminalRef.current) return;
      if (Date.now() - pollStartRef.current > POLL_MAX_MS) {
        applyPayload({
          cvId,
          status: "FAILED",
          error: POLL_TIMEOUT_ERROR,
        });
        setPollError(POLL_TIMEOUT_ERROR);
        window.clearInterval(pollInterval);
        return;
      }
      try {
        const { data } = await userCvApi.get(cvId);
        const rawPolledStatus = typeof data.status === "string" ? data.status.trim() : "";
        const st = normalizeCvProcessingStatus(data.status, { hasError: Boolean(data.error) });
        if (!st && rawPolledStatus && !data.error) {
          applyPayload({
            cvId,
            status: "FAILED",
            updatedAt: data.updatedAt,
            error: "userDash.myCvs.error.statusSync",
          });
          window.clearInterval(pollInterval);
          return;
        }
        if (st && (isTerminalCvStatus(st) || data.error)) {
          applyPayload({
            cvId,
            status: data.error && st !== "DONE" ? "FAILED" : st,
            updatedAt: data.updatedAt,
            error: data.error,
            score: data.score,
          });
          window.clearInterval(pollInterval);
          return;
        }
        if (st) {
          setStatus(data.error ? "FAILED" : st);
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
  }, [cvId, applyPayload]);

  return { status, lastPayload, pollError, isTracking };
}
