import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindTextInactivityEvents, TextInactivityMonitor,
  TEXT_IDLE_DRAFT_MS, TEXT_IDLE_EMPTY_MS, TEXT_IDLE_WARNING_MS,
  type TextInactivityPhase,
} from '../textInactivity';

describe('draft-aware text interview inactivity', () => {
  let phases: TextInactivityPhase[];
  let monitor: TextInactivityMonitor;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-07T09:00:00+07:00'));
    phases = [];
    monitor = new TextInactivityMonitor((phase) => phases.push(phase));
  });
  afterEach(() => { monitor.dispose(); vi.useRealTimers(); });
  const config = (hasDraft = false, scope = 'session:question-1', enabled = true) => ({ hasDraft, scope, enabled });

  it('warns before pausing an empty composer, without submitting anything', () => {
    monitor.update(config());
    vi.advanceTimersByTime(TEXT_IDLE_EMPTY_MS - 1);
    expect(phases).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(phases).toEqual(['warning']);
    vi.advanceTimersByTime(TEXT_IDLE_WARNING_MS);
    expect(phases).toEqual(['warning', 'paused']);
  });

  it('gives an existing draft a longer window but does not treat it as activity forever', () => {
    monitor.update(config(true));
    vi.advanceTimersByTime(TEXT_IDLE_EMPTY_MS);
    expect(phases).toEqual([]);
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS - TEXT_IDLE_EMPTY_MS);
    expect(phases).toEqual(['warning']);
    vi.advanceTimersByTime(TEXT_IDLE_WARNING_MS);
    expect(phases).toEqual(['warning', 'paused']);
  });

  it('never interrupts a long answer while editing continues', () => {
    monitor.update(config(true));
    for (let minute = 0; minute < 60; minute += 1) {
      vi.advanceTimersByTime(60_000);
      monitor.activity();
    }
    expect(phases).toEqual([]);
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS);
    expect(phases).toEqual(['warning']);
  });

  it('editing a warned draft resets the window without losing its text', () => {
    let draft = 'Câu trả lời dài đã soạn';
    const root = new EventTarget();
    const unbind = bindTextInactivityEvents(root, monitor);
    monitor.update(config(true));
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS);
    draft += ' và phần bổ sung';
    root.dispatchEvent(new Event('input'));
    expect(phases).toEqual(['warning', 'active']);
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS - 1);
    expect(phases.at(-1)).toBe('active');
    expect(draft).toBe('Câu trả lời dài đã soạn và phần bổ sung');
    unbind();
  });

  it('protects a long IME composition even when the first character creates a draft', () => {
    monitor.update(config());
    monitor.compositionStart();
    monitor.update(config(true));
    vi.advanceTimersByTime(30 * 60_000);
    expect(phases).toEqual([]);
    monitor.compositionEnd();
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS - 1);
    expect(phases).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(phases).toEqual(['warning']);
  });

  it('clears composition on editor blur so a stranded IME cannot exempt the room forever', () => {
    const root = new EventTarget();
    const unbind = bindTextInactivityEvents(root, monitor);
    monitor.update(config(true));
    root.dispatchEvent(new Event('compositionstart'));
    vi.advanceTimersByTime(20 * 60_000);
    root.dispatchEvent(new Event('focusout'));
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS + TEXT_IDLE_WARNING_MS);
    expect(phases).toEqual(['warning', 'paused']);
    unbind();
  });

  it.each(['input', 'paste', 'cut', 'pointerdown', 'focusin', 'scroll'])('%s refreshes candidate activity', (event) => {
    const root = new EventTarget();
    const unbind = bindTextInactivityEvents(root, monitor);
    monitor.update(config(true));
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS - 1);
    root.dispatchEvent(new Event(event));
    vi.advanceTimersByTime(1);
    expect(phases).toEqual([]);
    unbind();
  });

  it('counts cursor navigation but ignores mouse movement and modifier-only keys', () => {
    const root = new EventTarget();
    const unbind = bindTextInactivityEvents(root, monitor);
    const key = (value: string) => {
      const event = new Event('keydown');
      Object.defineProperty(event, 'key', { value });
      root.dispatchEvent(event);
    };
    monitor.update(config(true));
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS - 1);
    key('ArrowLeft');
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS - 1);
    root.dispatchEvent(new Event('mousemove'));
    key('Shift');
    vi.advanceTimersByTime(1);
    expect(phases).toEqual(['warning']);
    unbind();
  });

  it('suspends timers while sending, loading, hidden, reviewing or another dialog is open', () => {
    monitor.update(config(true));
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS - 1);
    monitor.update(config(true, 'session:question-1', false));
    vi.advanceTimersByTime(60 * 60_000);
    expect(phases).toEqual([]);
    monitor.update(config(true));
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS - 1);
    expect(phases).toEqual([]);
  });

  it('resets for a new question and never opens an old question timer', () => {
    monitor.update(config());
    vi.advanceTimersByTime(TEXT_IDLE_EMPTY_MS - 1);
    monitor.update(config(false, 'session:question-2'));
    vi.advanceTimersByTime(1);
    expect(phases).toEqual([]);
    vi.advanceTimersByTime(TEXT_IDLE_EMPTY_MS - 1);
    expect(phases).toEqual(['warning']);
  });

  it('requires an explicit continue after pausing and preserves the draft', () => {
    const draft = 'Nội dung chưa gửi';
    monitor.update(config(true));
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS + TEXT_IDLE_WARNING_MS);
    monitor.activity();
    monitor.compositionStart();
    vi.advanceTimersByTime(10_000);
    expect(phases.at(-1)).toBe('paused');
    monitor.continue();
    expect(phases.at(-1)).toBe('active');
    expect(draft).toBe('Nội dung chưa gửi');
    vi.advanceTimersByTime(TEXT_IDLE_DRAFT_MS - 1);
    expect(phases.at(-1)).toBe('active');
  });

  it('does not restart timers on identical rerenders and cleans up on unmount/Strict Mode', () => {
    monitor.update(config());
    vi.advanceTimersByTime(TEXT_IDLE_EMPTY_MS - 1);
    monitor.update(config());
    vi.advanceTimersByTime(1);
    expect(phases).toEqual(['warning']);
    monitor.dispose();
    expect(vi.getTimerCount()).toBe(0);
    monitor.update(config()); // Strict Mode effect setup after cleanup.
    vi.advanceTimersByTime(TEXT_IDLE_EMPTY_MS - 1);
    expect(phases).toEqual(['warning']);
  });

  it('still offers a full warning window when browser timers execute late', () => {
    monitor.update(config());
    vi.setSystemTime(Date.now() + 60 * 60_000);
    vi.advanceTimersByTime(TEXT_IDLE_EMPTY_MS);
    expect(phases).toEqual(['warning']);
    vi.advanceTimersByTime(TEXT_IDLE_WARNING_MS - 1);
    expect(phases).toEqual(['warning']);
    vi.advanceTimersByTime(1);
    expect(phases).toEqual(['warning', 'paused']);
  });

  it('removes editor event subscriptions and does not extend the deadline after unbind', () => {
    const root = new EventTarget();
    const unbind = bindTextInactivityEvents(root, monitor);
    monitor.update(config());
    vi.advanceTimersByTime(TEXT_IDLE_EMPTY_MS - 1);
    unbind();
    root.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(1);
    expect(phases).toEqual(['warning']);
  });
});
