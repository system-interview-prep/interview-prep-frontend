/** Draft-aware inactivity, independent of message submission and room presence. */
export const TEXT_IDLE_EMPTY_MS = 3 * 60_000;
export const TEXT_IDLE_DRAFT_MS = 5 * 60_000;
export const TEXT_IDLE_WARNING_MS = 30_000;

export type TextInactivityPhase = 'active' | 'warning' | 'paused';
type Configuration = { enabled: boolean; scope: string; hasDraft: boolean };

export class TextInactivityMonitor {
  private config: Configuration = { enabled: false, scope: '', hasDraft: false };
  private lastActivityAt = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private phase: TextInactivityPhase = 'active';
  private composing = false;
  private warnedAt: number | null = null;

  constructor(private onPhase: (phase: TextInactivityPhase) => void) {}

  update(next: Configuration) {
    const restart = next.scope !== this.config.scope || next.enabled !== this.config.enabled;
    const draftChanged = next.hasDraft !== this.config.hasDraft;
    this.config = next;
    if (restart) {
      this.composing = false;
      this.lastActivityAt = Date.now();
      this.setPhase('active');
    }
    if (restart || draftChanged) this.schedule();
  }

  activity = () => {
    if (!this.config.enabled || this.phase === 'paused') return;
    this.lastActivityAt = Date.now();
    this.setPhase('active');
    this.schedule();
  };

  compositionStart = () => {
    if (!this.config.enabled || this.phase === 'paused') return;
    this.composing = true;
    this.activity();
  };

  compositionEnd = () => {
    this.composing = false;
    this.activity();
  };

  blur = () => {
    if (this.composing) this.compositionEnd();
  };

  continue = () => {
    if (!this.config.enabled) return;
    this.composing = false;
    this.lastActivityAt = Date.now();
    this.setPhase('active');
    this.schedule();
  };

  dispose() {
    this.clearTimer();
    this.config = { ...this.config, enabled: false };
    this.phase = 'active';
    this.composing = false;
    this.warnedAt = null;
  }

  private clearTimer() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private setPhase(next: TextInactivityPhase) {
    if (next === this.phase) return;
    this.phase = next;
    this.warnedAt = next === 'warning' ? Date.now() : null;
    this.onPhase(next);
  }

  private schedule() {
    this.clearTimer();
    if (!this.config.enabled || this.composing || this.phase === 'paused') return;
    const warningAt = this.lastActivityAt + (this.config.hasDraft ? TEXT_IDLE_DRAFT_MS : TEXT_IDLE_EMPTY_MS);
    const now = Date.now();
    if (now >= warningAt) this.setPhase('warning');
    else this.setPhase('active');
    // A delayed browser timer must still show the warning for a full grace
    // period, rather than opening a modal immediately after the tab wakes up.
    const deadline = now < warningAt ? warningAt : (this.warnedAt ?? now) + TEXT_IDLE_WARNING_MS;
    if (now >= deadline) {
      this.setPhase('paused');
      return;
    }
    this.timer = setTimeout(() => this.schedule(), Math.max(0, deadline - now));
  }
}

/** Capture editor/reading activity, including Monaco's internal textarea. */
export function bindTextInactivityEvents(target: EventTarget, monitor: TextInactivityMonitor) {
  const onKey = (event: Event) => {
    const { key } = event as KeyboardEvent;
    if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock', 'Escape'].includes(key)) {
      monitor.activity();
    }
  };
  const handlers: Array<[string, EventListener]> = [
    ['input', monitor.activity], ['paste', monitor.activity], ['cut', monitor.activity],
    ['keydown', onKey], ['pointerdown', monitor.activity], ['focusin', monitor.activity],
    ['scroll', monitor.activity], ['compositionstart', monitor.compositionStart],
    ['compositionupdate', monitor.activity], ['compositionend', monitor.compositionEnd],
    ['focusout', monitor.blur],
  ];
  const options = { capture: true };
  handlers.forEach(([name, listener]) => target.addEventListener(name, listener, options));
  return () => handlers.forEach(([name, listener]) => target.removeEventListener(name, listener, options));
}
