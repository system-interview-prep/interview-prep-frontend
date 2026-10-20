'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { interviewChatApi } from '../services/interviewChat.service';

const HEARTBEAT_MS = 60_000;

/**
 * Tells Core whether the candidate still has the chat room open, like the
 * voice agent does for voice rooms: a heartbeat every minute, "left" when the
 * page closes. A candidate away longer than the grace period has their
 * interview closed as CANDIDATE_LEFT (backend session reaper).
 *
 * Returns `awaySince` when the candidate comes back to a room they had left,
 * so the page can say so, and `graceMinutes` for the warnings.
 */
export function useChatPresence(sessionId: string, open: boolean) {
  const [awaySince, setAwaySince] = useState<string | null>(null);
  const [graceMinutes, setGraceMinutes] = useState(5);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });

  const beat = useCallback(async () => {
    if (!openRef.current) return;
    try {
      const result = await interviewChatApi.presence(sessionId);
      setGraceMinutes(result.graceMinutes || 5);
      if (result.awaySince) setAwaySince(result.awaySince);
    } catch {
      // A missed heartbeat is fine: the next one (or the page's own requests) follows.
    }
  }, [sessionId]);

  useEffect(() => {
    if (!open) return;
    const first = window.setTimeout(() => void beat(), 0);
    const timer = window.setInterval(() => void beat(), HEARTBEAT_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void beat();
    };
    const onPageHide = () => interviewChatApi.presenceLeft(sessionId);
    // The browser's own "leave site?" prompt is the only thing allowed while a tab closes.
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [open, sessionId, beat]);

  return { awaySince, graceMinutes, dismissAway: () => setAwaySince(null) };
}
