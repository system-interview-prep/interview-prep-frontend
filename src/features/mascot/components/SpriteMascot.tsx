"use client";

import { Mascot } from "page-mascot";
import type { MascotMood } from "../types";

export interface SpriteMascotProps {
  mood?: MascotMood;
  size?: number;
  reaction?: string | null;
  className?: string;
}

export function SpriteMascot({
  mood = "idle",
  size = 72,
  reaction = null,
  className = "drop-shadow-sm select-none pointer-events-auto",
}: SpriteMascotProps) {
  const activeReaction = (reaction as any) ?? null;

  return (
    <Mascot
      directions="/mascot/intervia-fox-directions.webp?v=1"
      reactions="/mascot/intervia-fox-reactions.webp?v=1"
      reaction={activeReaction}
      size={size}
      className={className}
    />
  );
}

export default SpriteMascot;
