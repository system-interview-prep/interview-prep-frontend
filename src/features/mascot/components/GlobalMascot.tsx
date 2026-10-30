"use client";

import { usePathname } from "next/navigation";
import MascotContainer from "./MascotContainer";
import useMascotMood from "../hooks/useMascotMood";
import { useViJourney } from "../hooks/useViJourney";
import { useInlineMascotPresent } from "../voice/presence";
import { isWorkspacePath } from "../utils/viJourney";

export function GlobalMascot() {
  const pathname = usePathname() || "";
  const { mood, line, isHidden, nextTip } = useMascotMood();
  // A page-level fox is already on screen; don't show a second one in the corner.
  const inlinePresent = useInlineMascotPresent();
  // Signed in, in the workspace: Vi guides through the candidate's own journey.
  const journey = useViJourney(!isHidden && isWorkspacePath(pathname), pathname);

  if (isHidden || inlinePresent) return null;
  return <MascotContainer mood={mood} line={line} journey={journey} onPoke={nextTip} />;
}

export default GlobalMascot;
