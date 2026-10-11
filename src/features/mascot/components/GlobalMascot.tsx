"use client";

import MascotContainer from "./MascotContainer";
import useMascotMood from "../hooks/useMascotMood";
import { useInlineMascotPresent } from "../voice/presence";

export function GlobalMascot() {
  const { mood, line, isHidden, nextTip } = useMascotMood();
  // A page-level fox is already on screen; don't show a second one in the corner.
  const inlinePresent = useInlineMascotPresent();

  if (isHidden || inlinePresent) return null;
  return <MascotContainer mood={mood} line={line} onPoke={nextTip} />;
}

export default GlobalMascot;
