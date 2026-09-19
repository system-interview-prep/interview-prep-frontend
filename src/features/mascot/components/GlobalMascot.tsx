"use client";

import { usePathname } from "next/navigation";
import MascotContainer from "./MascotContainer";
import useMascotMood from "../hooks/useMascotMood";

export function GlobalMascot() {
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/logout" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/logout");

  const { mood, speechText, isHidden } = useMascotMood();
  if (isAuthRoute || isHidden) return null;
  return <MascotContainer mood={mood} speechText={speechText} />;
}

export default GlobalMascot;
