"use client";

import { useEffect, useState } from "react";

const DURATION_MS = 700;

function prefersReducedMotion() {
  return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A number that counts up once when it first appears. Screen readers get the
 * final value only; the server and reduced-motion users get it immediately.
 * Later value changes show the new number directly.
 */
export function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  // 0 → 1 while the entrance plays; starts at 1 on the server and with reduced motion.
  const [progress, setProgress] = useState(() => (prefersReducedMotion() ? 1 : 0));

  useEffect(() => {
    if (progress >= 1) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Runs once on mount: the entrance plays a single time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = Number.isFinite(value) ? value * progress : value;
  return (
    <>
      <span aria-hidden="true" suppressHydrationWarning>
        {`${shown.toFixed(decimals)}${suffix}`}
      </span>
      <span className="sr-only">{`${value.toFixed(decimals)}${suffix}`}</span>
    </>
  );
}

export default CountUp;
