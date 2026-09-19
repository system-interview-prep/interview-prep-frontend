"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MascotMood } from "../types";

export interface MascotSceneConfig {
  mood: MascotMood;
  speechKey?: string;
  hidden?: boolean;
}

export function useMascotMood(initialMood: MascotMood = "idle") {
  const { t } = useLanguage();
  const pathname = usePathname();

  const [mood, setMood] = useState<MascotMood>(initialMood);
  const [speechText, setSpeechText] = useState<string | null>(null);
  const [isHidden, setIsHidden] = useState<boolean>(false);

  // Quiet mode count (quiet mode suppresses bubble after 3 auto speeches)
  const autoSpeechCount = useRef<number>(0);

  const resolveRouteScene = useCallback(
    (path: string): MascotSceneConfig => {
      if (path.startsWith("/admin")) {
        return { mood: "idle", hidden: true };
      }
      if (path.includes("/interview/room")) {
        return { mood: "idle", hidden: true };
      }
      if (path.includes("/interview/results")) {
        return { mood: "happy", speechKey: "mascot.speech.resultsComplete" };
      }
      if (path.includes("/interview/select")) {
        return { mood: "coaching", speechKey: "mascot.speech.interviewSelect" };
      }
      if (path.includes("/practice")) {
        return { mood: "happy", speechKey: "mascot.speech.practiceStart" };
      }
      if (path.includes("/dashboard/cvs")) {
        return { mood: "coaching", speechKey: "mascot.speech.cvEmpty" };
      }
      if (path.includes("/dashboard/jobs")) {
        return { mood: "thinking", speechKey: "mascot.speech.jobsEmpty" };
      }
      if (path.startsWith("/dashboard")) {
        return { mood: "happy", speechKey: "mascot.speech.dashboardWelcome" };
      }
      if (path.includes("/solutions")) {
        return { mood: "happy", speechKey: "mascot.speech.solutionsHero" };
      }
      if (path.includes("/pricing")) {
        return { mood: "thinking", speechKey: "mascot.speech.pricingHelp" };
      }
      if (path.includes("/resources")) {
        return { mood: "coaching", speechKey: "mascot.speech.resourcesCoach" };
      }
      if (path.includes("/login")) {
        return { mood: "happy", speechKey: "mascot.speech.loginWelcome" };
      }
      if (path.includes("/signup")) {
        return { mood: "happy", speechKey: "mascot.speech.signupWelcome" };
      }
      if (path === "/" || path === "") {
        return { mood: "happy", speechKey: "mascot.speech.hero" };
      }
      return { mood: "idle", speechKey: undefined };
    },
    []
  );

  useEffect(() => {
    if (!pathname) return;

    const scene = resolveRouteScene(pathname);
    setIsHidden(!!scene.hidden);
    setMood(scene.mood);

    if (scene.hidden) {
      setSpeechText(null);
      return;
    }

    // Apply quiet mode check
    if (autoSpeechCount.current >= 3) {
      setSpeechText(null);
    } else if (scene.speechKey) {
      autoSpeechCount.current += 1;
      setSpeechText(t(scene.speechKey));
    } else {
      setSpeechText(null);
    }
  }, [pathname, resolveRouteScene, t]);

  const triggerMood = useCallback(
    (newMood: MascotMood, durationMs?: number, customTextOrKey?: string) => {
      setMood(newMood);
      if (customTextOrKey) {
        const translated = customTextOrKey.startsWith("mascot.speech.")
          ? t(customTextOrKey)
          : customTextOrKey;
        setSpeechText(translated);
      }
      if (durationMs) {
        setTimeout(() => {
          setMood("idle");
          setSpeechText(null);
        }, durationMs);
      }
    },
    [t]
  );

  return { mood, setMood, speechText, setSpeechText, triggerMood, isHidden };
}

export default useMascotMood;
