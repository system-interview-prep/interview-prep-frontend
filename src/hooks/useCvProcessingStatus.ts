"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { userCvApi } from "@/services/userCvApi";
import { emitJoinCv, getCvSocket, onCvStatus } from "@/services/cvSocket";
import {
  type CvProcessingStatus,
  type CvStatusPayload,
  isTerminalCvStatus,
} from "@/types/cvProcessing";

const POLL_MS = 4000;
const POLL_MAX_MS = 5 * 60 * 1000;

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
  onDoneRef.current = onDone;
  onFailedRef.current = onFailed;

  const [status, setStatus] = useState<CvProcessingStatus | null>(null);
  const [lastPayload, setLastPayload] = useState<CvStatusPayload | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const terminalRef = useRef(false);
  const pollStartRef = useRef(0);

  const applyPayload = useCallback((p: CvStatusPayload) => {
    setLastPayload(p);
    setStatus(p.status);
    if (isTerminalCvStatus(p.status)) {
      terminalRef.current = true;
      setIsTracking(false);
      if (p.status === "DONE") onDoneRef.current?.(p);
      if (p.status === "FAILED") onFailedRef.current?.(p, p.error);
    }
  }, []);

  useEffect(() => {
    terminalRef.current = false;
    setPollError(null);
    if (!cvId) {
      setStatus(null);
      setLastPayload(null);
      setIsTracking(false);
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

    const pollInterval = window.setInterval(async () => {
      if (terminalRef.current) return;
      if (Date.now() - pollStartRef.current > POLL_MAX_MS) {
        window.clearInterval(pollInterval);
        return;
      }
      try {
        const { data } = await userCvApi.get(cvId);
        const st = data.status;
        if (st && isTerminalCvStatus(st)) {
          applyPayload({
            cvId,
            status: st,
            updatedAt: data.updatedAt,
            error: data.error,
            score: data.score,
          });
          window.clearInterval(pollInterval);
          return;
        }
        if (st) {
          setStatus(st);
        }
      } catch {
        setPollError("poll");
      }
    }, POLL_MS);

    return () => {
      socket.off("connect", joinRoom);
      unsub();
      window.clearInterval(pollInterval);
      setIsTracking(false);
    };
  }, [cvId, applyPayload]);

  return { status, lastPayload, pollError, isTracking };
}
