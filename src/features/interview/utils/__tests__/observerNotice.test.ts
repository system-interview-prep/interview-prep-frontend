import { describe, expect, it } from 'vitest';
import { parseObserverNotice } from '../observerNotice';

const bytes = (value: unknown) => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));

describe('parseObserverNotice', () => {
  it('reads the observer notice sent by the backend', () => {
    expect(parseObserverNotice(bytes({ type: 'observer_joined', minutes: 10 }))).toEqual({ minutes: 10 });
  });

  it('falls back to ten minutes when the length is missing', () => {
    expect(parseObserverNotice(bytes({ type: 'observer_joined' }))).toEqual({ minutes: 10 });
  });

  it('ignores other messages and broken payloads', () => {
    expect(parseObserverNotice(bytes({ type: 'turn.state' }))).toBeNull();
    expect(parseObserverNotice(bytes('not json'))).toBeNull();
  });
});
