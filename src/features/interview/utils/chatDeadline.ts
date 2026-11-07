import type { ChatRuntimeResponse } from '../services/interviewChat.service';

/** Relative server timestamps avoid treating a wrong browser clock as expiry. */
export function chatDeadlineDelay(runtime: Pick<ChatRuntimeResponse, 'sessionStatus' | 'expiresAt' | 'serverTime' | 'startedAt' | 'durationMinutes'>, nowMs: number): number | null {
  if (runtime.sessionStatus === 'CLOSED') return null;
  const expires = runtime.expiresAt ? Date.parse(runtime.expiresAt) : Number.NaN;
  const serverNow = runtime.serverTime ? Date.parse(runtime.serverTime) : Number.NaN;
  if (Number.isFinite(expires)) return Math.max(0, expires - (Number.isFinite(serverNow) ? serverNow : nowMs));
  const started = runtime.startedAt ? Date.parse(runtime.startedAt) : Number.NaN;
  const duration = runtime.durationMinutes;
  if (!Number.isFinite(started) || !duration || !Number.isFinite(duration) || duration <= 0) return null;
  return Math.max(0, started + duration * 60_000 - nowMs);
}
