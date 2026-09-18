"use client";

import { useState, useCallback } from 'react';
import type { MascotMood } from '../types';

export function useMascotMood(initialMood: MascotMood = 'idle') {
  const [mood, setMood] = useState<MascotMood>(initialMood);

  const triggerMood = useCallback((newMood: MascotMood, durationMs?: number) => {
    setMood(newMood);
    if (durationMs) {
      setTimeout(() => {
        setMood('idle');
      }, durationMs);
    }
  }, []);

  return { mood, setMood, triggerMood };
}

export default useMascotMood;
