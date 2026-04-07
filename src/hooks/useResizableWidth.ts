"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useResizableWidth({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
}: {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
}) {
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return defaultWidth;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return defaultWidth;
      const parsed = Number(stored);
      return Number.isFinite(parsed) ? clamp(parsed, minWidth, maxWidth) : defaultWidth;
    } catch {
      return defaultWidth;
    }
  });
  const widthRef = useRef(defaultWidth);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  const startResize = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = widthRef.current;
    const body = document.body;
    const previousCursor = body.style.cursor;
    const previousUserSelect = body.style.userSelect;

    body.style.cursor = "col-resize";
    body.style.userSelect = "none";

    const handleMove = (moveEvent: PointerEvent) => {
      const nextWidth = clamp(startWidth + (moveEvent.clientX - startX), minWidth, maxWidth);
      setWidth(nextWidth);
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      body.style.cursor = previousCursor;
      body.style.userSelect = previousUserSelect;
      try {
        window.localStorage.setItem(storageKey, String(widthRef.current));
      } catch {
        // ignore storage failures
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  }, [maxWidth, minWidth, storageKey]);

  return {
    width,
    startResize,
  };
}
