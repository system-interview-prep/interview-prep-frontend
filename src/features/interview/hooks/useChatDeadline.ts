'use client';

import { useEffect, useState } from 'react';
import { interviewChatApi, type ChatRuntimeResponse } from '../services/interviewChat.service';
import { chatDeadlineDelay } from '../utils/chatDeadline';

/** A local alarm asks Core to expire the room; only CLOSED permits grading. */
export function useChatDeadline(sessionId: string, runtime: ChatRuntimeResponse | null,
  onRuntime: (next: ChatRuntimeResponse) => void) {
  const [state, setState] = useState<{ sessionId: string; phase: 'active' | 'checking' | 'error' }>({ sessionId, phase: 'active' });
  const [retry, setRetry] = useState(0);
  const startedAt = runtime?.startedAt;
  const duration = runtime?.durationMinutes;
  const expiresAt = runtime?.expiresAt;
  const serverTime = runtime?.serverTime;
  const status = runtime?.sessionStatus;

  useEffect(() => {
    if (status !== 'OPEN') return;
    const snapshot = { sessionStatus: status, startedAt, durationMinutes: duration, expiresAt, serverTime };
    const delay = chatDeadlineDelay(snapshot, Date.now());
    if (delay === null) return;
    let active = true;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout>;
    // Wall time on return from a suspended/background tab must count too.
    const dueAt = Date.now() + delay;
    const check = async () => {
      if (!active || inFlight) return;
      clearTimeout(timer);
      inFlight = true;
      setState({ sessionId, phase: 'checking' });
      try {
        const next = await interviewChatApi.getRuntime(sessionId);
        if (!active) return;
        onRuntime(next);
        if (next.sessionStatus !== 'CLOSED') {
          const nextDelay = chatDeadlineDelay(next, Date.now());
          // Recheck rather than trusting an OPEN response at an expired clock.
          timer = setTimeout(() => void check(), Math.max(1000, nextDelay ?? 3000));
          if ((nextDelay ?? 0) > 0) setState({ sessionId, phase: 'active' });
        }
      } catch {
        if (!active) return;
        setState({ sessionId, phase: 'error' });
        timer = setTimeout(() => void check(), 3000);
      } finally {
        inFlight = false;
      }
    };
    timer = setTimeout(() => void check(), delay > 0 ? delay : 1000);
    const onReturn = () => {
      if (document.visibilityState !== 'hidden' && Date.now() >= dueAt) void check();
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [sessionId, startedAt, duration, expiresAt, serverTime, status, onRuntime, retry]);

  const phase = state.sessionId === sessionId && status === 'OPEN' ? state.phase : 'active';
  return { phase, expired: phase !== 'active', retry: () => setRetry((value) => value + 1) };
}
