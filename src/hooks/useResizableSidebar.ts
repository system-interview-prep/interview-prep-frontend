"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const STORAGE_KEY = "chat.sidebarWidth.v1";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 240;
const MAX_WIDTH = 420;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useResizableSidebar() {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_WIDTH;
      const parsed = Number(stored);
      return Number.isFinite(parsed) ? clamp(parsed, MIN_WIDTH, MAX_WIDTH) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });
  const sidebarWidthRef = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  const startResize = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = sidebarWidthRef.current;
    const body = document.body;
    const previousCursor = body.style.cursor;
    const previousUserSelect = body.style.userSelect;

    body.style.cursor = "col-resize";
    body.style.userSelect = "none";

    const handleMove = (moveEvent: PointerEvent) => {
      const nextWidth = clamp(startWidth + (moveEvent.clientX - startX), MIN_WIDTH, MAX_WIDTH);
      setSidebarWidth(nextWidth);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      body.style.cursor = previousCursor;
      body.style.userSelect = previousUserSelect;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(sidebarWidthRef.current));
      } catch {
        // ignore storage failures
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }, []);

  return {
    sidebarWidth,
    startResize,
  };
}
