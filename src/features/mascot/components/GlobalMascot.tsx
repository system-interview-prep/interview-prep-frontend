"use client";

import MascotContainer from "./MascotContainer";
import useMascotMood from "../hooks/useMascotMood";

export function GlobalMascot() {
  const { mood, speechText } = useMascotMood();
  return <MascotContainer mood={mood} speechText={speechText} />;
}

export default GlobalMascot;
