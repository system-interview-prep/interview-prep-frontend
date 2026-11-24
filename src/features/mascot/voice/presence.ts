"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Tracks whether a page-level fox (MascotHero) is on screen, so the floating
 * corner fox steps aside instead of showing two foxes at once.
 */

let inlineCount = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRegisterInlineMascot() {
  useEffect(() => {
    inlineCount += 1;
    emit();
    return () => {
      inlineCount -= 1;
      emit();
    };
  }, []);
}

export function useInlineMascotPresent(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => inlineCount > 0,
    () => false,
  );
}
