"use client";

import { useEffect, useState } from "react";
import { Mascot } from "./Mascot";
import { FOX_DIRECTIONS_SHEET, FOX_REACTIONS_SHEET } from "./FoxAvatar";
import type { MascotMood } from "../types";

export interface SpriteMascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
  /** Alternate expressions so the fox looks like it is talking. */
  speaking?: boolean;
}

type Reaction = "delighted" | "sparkle" | "surprised" | "wink" | "dizzy" | "blink";

const MOOD_TO_REACTION: Record<MascotMood, Reaction | null> = {
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

// Open mouth, closed mouth, open mouth, look at you: reads as chatter.
const TALK_FRAMES: (Reaction | null)[] = ["delighted", "blink", "delighted", null];
const TALK_FRAME_MS = 170;

export function SpriteMascot({
  mood = "idle",
  size = 96,
  className = "drop-shadow-md select-none pointer-events-auto",
  speaking = false,
}: SpriteMascotProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!speaking) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % TALK_FRAMES.length), TALK_FRAME_MS);
    return () => window.clearInterval(timer);
  }, [speaking]);

  const reaction = speaking ? TALK_FRAMES[frame] : (MOOD_TO_REACTION[mood] ?? null);

  return (
    <Mascot
      directions={FOX_DIRECTIONS_SHEET}
      reactions={FOX_REACTIONS_SHEET}
      reaction={reaction}
      size={size}
      className={className}
      label="Intervia fox"
    />
  );
}

export default SpriteMascot;
