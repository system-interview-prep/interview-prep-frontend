"use client";

import MascotContainer from "./MascotContainer";
import useMascotMood from "../hooks/useMascotMood";

export function GlobalMascot() {
  const { mood, speechText, isHidden } = useMascotMood();
  if (isHidden) return null;
  return <MascotContainer mood={mood} speechText={speechText} />;
}

export default GlobalMascot;
