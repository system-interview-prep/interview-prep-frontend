"use client";

import { Mascot } from "page-mascot";
import type { MascotMood } from "../types";

export interface SpriteMascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

const MOOD_TO_REACTION: Record<
  MascotMood,
  "delighted" | "sparkle" | "surprised" | "wink" | "dizzy" | null
> = {
  idle: null,
  happy: "delighted",
  thinking: "sparkle",
  surprised: "surprised",
  coaching: "wink",
  confused: "dizzy",
  encouraging: "delighted",
  listening: "sparkle",
  celebrating: "delighted",
};

export function SpriteMascot({
  mood = "idle",
  size = 96,
  className = "drop-shadow-md select-none pointer-events-auto",
}: SpriteMascotProps) {
  const reaction = MOOD_TO_REACTION[mood] ?? null;

  return (
    <Mascot
      directions="/mascot/intervia-fox-directions.webp?v=1"
      reactions="/mascot/intervia-fox-reactions.webp?v=1"
      reaction={reaction}
      size={size}
      className={className}
    />
  );
}

export default SpriteMascot;
