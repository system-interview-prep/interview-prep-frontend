"use client";

import React from "react";

/** Console mock: nine bars, symmetric heights + opacity ramp */
const IDLE_BARS: { className: string }[] = [
  { className: "h-4 bg-tertiary/20" },
  { className: "h-8 bg-tertiary/40" },
  { className: "h-12 bg-tertiary/60" },
  { className: "h-10 bg-tertiary/80" },
  { className: "h-14 bg-tertiary" },
  { className: "h-10 bg-tertiary/80" },
  { className: "h-12 bg-tertiary/60" },
  { className: "h-8 bg-tertiary/40" },
  { className: "h-4 bg-tertiary/20" },
];

type VoiceWaveformProps = {
  active: boolean;
};

export function VoiceWaveform({ active }: VoiceWaveformProps) {
  return (
    <div className="flex h-12 items-end justify-center gap-1.5 sm:h-14" aria-hidden>
      {IDLE_BARS.map((bar, i) => (
        <span
          key={i}
          className={`w-1 rounded-full sm:w-1.5 ${
            active
              ? `min-h-[6px] bg-tertiary voice-wave-bar--active`
              : bar.className
          }`}
          style={active ? ({ animationDelay: `${i * 0.08}s` } as React.CSSProperties) : undefined}
        />
      ))}
    </div>
  );
}
