'use client';

import { useEffect, useRef, useState } from 'react';
import { bindTextInactivityEvents, TextInactivityMonitor, type TextInactivityPhase } from '../utils/textInactivity';

export function useTextInactivity({ enabled, scope, hasDraft }: {
  enabled: boolean; scope: string; hasDraft: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<TextInactivityPhase>('active');
  const [visible, setVisible] = useState(true);
  const [monitor] = useState(() => new TextInactivityMonitor(setPhase));

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState !== 'hidden');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    monitor.update({ enabled: enabled && visible, scope, hasDraft });
  }, [monitor, enabled, visible, scope, hasDraft]);

  useEffect(() => {
    if (!enabled || !visible || !rootRef.current) return;
    return bindTextInactivityEvents(rootRef.current, monitor);
  }, [monitor, enabled, visible, scope]);

  useEffect(() => () => monitor.dispose(), [monitor]);

  return {
    rootRef,
    phase: enabled && visible ? phase : 'active' as TextInactivityPhase,
    continueDraft: monitor.continue,
    activity: monitor.activity,
  };
}
