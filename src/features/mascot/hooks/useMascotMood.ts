
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MascotMood } from "../types";

export interface MascotSceneConfig {
  mood: MascotMood;
  speechKey?: string;
  /** Extra lines the fox says when clicked, cycled in order. */
  tipKeys?: string[];
  hidden?: boolean;
}

export interface TriggerMascotOptions {
  mood?: MascotMood;
  speechKey?: string;
  speechText?: string;
  durationMs?: number;
}

export interface MascotLine {
  id: number;
  text: string;
}

export function triggerMascot(options: TriggerMascotOptions) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mascot:trigger", { detail: options }));
  }
}

const tips = (scene: string, count: number) =>
  Array.from({ length: count }, (_, i) => `mascot.tips.${scene}.${i + 1}`);

function greetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "mascot.speech.dashboardMorning";
  if (hour < 18) return "mascot.speech.dashboardAfternoon";
  return "mascot.speech.dashboardEvening";
}

// Rooms run their own interviewer; the fox must never get in the way there.
const SILENT_PATHS = ["/admin", "/interview/room", "/practice/room", "/login", "/signup", "/logout"];

export function resolveRouteScene(path: string): MascotSceneConfig {
  if (SILENT_PATHS.some((prefix) => path.startsWith(prefix))) {
    return { mood: "idle", hidden: true };
  }
  if (path.startsWith("/interview/results")) {
    return { mood: "celebrating", speechKey: "mascot.speech.resultsComplete", tipKeys: tips("results", 3) };
  }
  if (path.startsWith("/interview/select")) {
    return { mood: "coaching", speechKey: "mascot.speech.interviewSelect", tipKeys: tips("select", 3) };
  }
  if (path.startsWith("/interview/cv-score")) {
    return { mood: "thinking", speechKey: "mascot.speech.cvScore", tipKeys: tips("cvScore", 3) };
  }
  if (path.startsWith("/dashboard/cvs")) {
    return { mood: "coaching", speechKey: "mascot.speech.cvEmpty", tipKeys: tips("cvs", 3) };
  }
  if (path.startsWith("/dashboard/jobs")) {
    return { mood: "thinking", speechKey: "mascot.speech.jobsEmpty", tipKeys: tips("jobs", 3) };
  }
  if (path.startsWith("/dashboard/history")) {
    return { mood: "encouraging", speechKey: "mascot.speech.history", tipKeys: tips("history", 2) };
  }
  if (path.startsWith("/dashboard/settings") || path.startsWith("/dashboard/profile")) {
    return { mood: "idle", tipKeys: tips("dashboard", 3) };
  }
  if (path.startsWith("/dashboard")) {
    return { mood: "happy", speechKey: greetingKey(), tipKeys: tips("dashboard", 3) };
  }
  if (path.startsWith("/solutions")) {
    return { mood: "idle", speechKey: "mascot.speech.solutionsHero", tipKeys: tips("landing", 3) };
  }
  if (path.startsWith("/pricing")) {
    return { mood: "idle", speechKey: "mascot.speech.pricingHelp", tipKeys: tips("landing", 3) };
  }
  if (path.startsWith("/resources")) {
    return { mood: "idle", speechKey: "mascot.speech.resourcesCoach", tipKeys: tips("landing", 3) };
  }
  if (path === "/" || path === "") {
    return { mood: "happy", speechKey: "mascot.speech.hero", tipKeys: tips("landing", 3) };
  }
  return { mood: "idle" };
}

export function useMascotMood(initialMood: MascotMood = "idle") {
  const { t } = useLanguage();
  const pathname = usePathname();

  const [mood, setMood] = useState<MascotMood>(initialMood);
  const [line, setLine] = useState<MascotLine | null>(null);
  // Derived during render (not in an effect) so the corner fox never flashes
  // on silent routes such as /admin or /login before it hides.
  const isHidden = !!resolveRouteScene(pathname || "").hidden;

  const lineId = useRef(0);
  const tipIndex = useRef(0);
  const resetTimer = useRef<number | null>(null);

  const say = useCallback((text: string | null) => {
    lineId.current += 1;
    setLine(text ? { id: lineId.current, text } : null);
  }, []);

  const restoreScene = useCallback(() => {
    const scene = resolveRouteScene(pathname || "");
    setMood(scene.mood);
    say(null);
  }, [pathname, say]);

  const scheduleRestore = useCallback(
    (durationMs?: number) => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      if (durationMs) resetTimer.current = window.setTimeout(restoreScene, durationMs);
    },
    [restoreScene],
  );

  useEffect(() => {
    if (!pathname) return;
    const scene = resolveRouteScene(pathname);
    tipIndex.current = 0;
    queueMicrotask(() => {
      setMood(scene.mood);
      if (scene.hidden || !scene.speechKey) {
        say(null);
        return;
      }
      say(t(scene.speechKey));
    });
  }, [pathname, say, t]);

  useEffect(() => {
    const handleCustomTrigger = (e: Event) => {
      const detail = (e as CustomEvent<TriggerMascotOptions>).detail;
      if (!detail) return;
      const { mood: newMood = "idle", speechKey, speechText: customText, durationMs } = detail;
      setMood(newMood);
      const text = customText ?? (speechKey ? t(speechKey) : null);
      if (text) say(text);
      scheduleRestore(durationMs);
    };

    window.addEventListener("mascot:trigger", handleCustomTrigger);
    return () => window.removeEventListener("mascot:trigger", handleCustomTrigger);
  }, [say, scheduleRestore, t]);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  /** Called when the user pokes the fox: say the next tip for this page. */
  const nextTip = useCallback(() => {
    const scene = resolveRouteScene(pathname || "");
    const keys = scene.tipKeys?.length ? scene.tipKeys : tips("dashboard", 3);
    const key = keys[tipIndex.current % keys.length];
    tipIndex.current += 1;
    setMood("coaching");
    say(t(key));
  }, [pathname, say, t]);

  return { mood, line, isHidden, nextTip };
}

export default useMascotMood;
