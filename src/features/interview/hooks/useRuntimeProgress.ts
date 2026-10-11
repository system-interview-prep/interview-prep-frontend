"use client";

import { useEffect, useRef, useState } from "react";
import { interviewChatApi, type ChatRuntimeResponse } from "../services/interviewChat.service";

export interface RuntimeProgress {
  /** 1-based number of the question being asked, or null before the first one. */
  questionNumber: number | null;
  totalQuestions: number;
  stage: string | null;
  startedAt: string | null;
  durationMinutes: number | null;
  isClosed: boolean;
  turns: ChatRuntimeResponse["turns"];
}

export function progressFromRuntime(runtime: ChatRuntimeResponse): RuntimeProgress {
  const isClosed = runtime.sessionStatus === "CLOSED";
  const index = Number.isFinite(runtime.currentTurnIndex) ? runtime.currentTurnIndex : -1;
  return {
    questionNumber: runtime.currentTurn && index >= 0 ? index + 1 : null,
    totalQuestions: runtime.totalTurns ?? 0,
    stage:
      (runtime.currentTurn?.stage as string | undefined) ??
      (runtime.workingMemory?.current_stage as string | undefined) ??
      null,
    startedAt: runtime.startedAt ?? null,
    durationMinutes: runtime.durationMinutes ?? null,
    isClosed,
    turns: runtime.turns,
  };
}

/**
 * Session progress for rooms whose conversation does not go through the chat
 * API (voice/video via LiveKit). Re-reads the runtime when `refreshKey`
 * changes, e.g. when a new transcript line arrives, at most every 3 seconds.
 */
export function useRuntimeProgress(sessionId: string, refreshKey: number): RuntimeProgress | null {
  const [progress, setProgress] = useState<RuntimeProgress | null>(null);
  const lastFetchRef = useRef(0);
  const pendingRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    const fetchNow = () => {
      lastFetchRef.current = Date.now();
      interviewChatApi
        .getRuntime(sessionId)
        .then((runtime) => {
          if (active) setProgress(progressFromRuntime(runtime));
        })
        .catch(() => {
          /* Progress is informational; the room keeps working without it. */
        });
    };
    const wait = Math.max(0, 3000 - (Date.now() - lastFetchRef.current));
    if (pendingRef.current) window.clearTimeout(pendingRef.current);
    pendingRef.current = window.setTimeout(fetchNow, wait);
    return () => {
      active = false;
      if (pendingRef.current) window.clearTimeout(pendingRef.current);
    };
  }, [sessionId, refreshKey]);

  return progress;
}
