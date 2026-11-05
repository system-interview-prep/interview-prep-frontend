import { describe, expect, it } from 'vitest';
import { NO_RESPONSE_PAUSE_AFTER_MS, noResponsePauseDeadline } from '../noResponsePause';

describe('no response pause timing', () => {
  it('waits 90 seconds from the current question when there is no candidate activity', () => {
    const startedAt = '2026-11-05T10:00:00.000Z';
    expect(noResponsePauseDeadline(startedAt, null)).toBe(Date.parse(startedAt) + NO_RESPONSE_PAUSE_AFTER_MS);
  });

  it('restarts the inactivity window from the candidate’s latest activity', () => {
    const startedAt = '2026-11-05T10:00:00.000Z';
    const activityAt = Date.parse(startedAt) + 45_000;
    expect(noResponsePauseDeadline(startedAt, activityAt)).toBe(activityAt + NO_RESPONSE_PAUSE_AFTER_MS);
  });

  it('does not show a pause prompt without a known question start time', () => {
    expect(noResponsePauseDeadline(null, null)).toBeNull();
  });
});
