"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  MASCOT_SCENES,
  type MascotScene,
  type MascotSceneConfig,
} from "./config";
import type { MascotMood } from "./types";

const MOOD_TO_REACTION: Record<
  MascotMood,
  "delighted" | "sparkle" | "surprised" | "wink" | "dizzy" | "bashful" | "blink" | "heart" | null
> = {
  idle: null,
  happy: "delighted",
  thinking: "sparkle",
  surprised: "surprised",
  coaching: "wink",
  confused: "dizzy",
  typing_password: "bashful",
  listening: "wink",
  encouraging: "delighted",
};

interface TargetPosition {
  x: number;
  y: number;
  isDocked: boolean;
}

interface SceneRegistration {
  id: string;
  scene: MascotScene;
  priority: number;
}

interface MascotContextType {
  activeScene: MascotScene;
  setActiveScene: (scene: MascotScene, priority?: number) => void;
  sceneConfig: MascotSceneConfig;
  targetPos: TargetPosition;
  isMinimized: boolean;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  showSpeechBubble: boolean;
  toggleSpeechBubble: () => void;
  dismissSpeechBubble: () => void;
  isDismissed: boolean;
  reaction: string | null;
  guideCount: number;
  registerScene: (id: string, scene: MascotScene, priority?: number) => void;
  unregisterScene: (id: string) => void;
}

const defaultScene: MascotScene = "marketing-hero";
const defaultConfig = MASCOT_SCENES["marketing-hero"];

const MascotContext = createContext<MascotContextType>({
  activeScene: defaultScene,
  setActiveScene: () => {},
  sceneConfig: defaultConfig,
  targetPos: { x: 0, y: 0, isDocked: true },
  isMinimized: false,
  setIsMinimized: () => {},
  showSpeechBubble: false,
  toggleSpeechBubble: () => {},
  dismissSpeechBubble: () => {},
  isDismissed: false,
  reaction: null,
  guideCount: 0,
  registerScene: () => {},
  unregisterScene: () => {},
});

export function MascotProvider({ children }: { children: React.ReactNode }) {
  const [registrations, setRegistrations] = useState<SceneRegistration[]>([]);
  const [fallbackScene, setFallbackScene] = useState<MascotScene>("marketing-hero");
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [guideCount, setGuideCount] = useState(0);

  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reactionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [targetPos, setTargetPos] = useState<TargetPosition>({
    x: typeof window !== "undefined" ? window.innerWidth - 100 : 0,
    y: typeof window !== "undefined" ? window.innerHeight - 100 : 0,
    isDocked: true,
  });

  // Determine highest priority active scene
  let activeScene = fallbackScene;
  if (registrations.length > 0) {
    const sorted = [...registrations].sort((a, b) => b.priority - a.priority);
    activeScene = sorted[0].scene;
  }

  const sceneConfig = MASCOT_SCENES[activeScene] || {
    mood: "idle" as MascotMood,
    speechKey: "",
    anchorId: "",
    intensity: "NONE",
    priority: 0,
    scale: 1,
  };

  const registerScene = useCallback((id: string, scene: MascotScene, priority?: number) => {
    const scenePriority = priority ?? MASCOT_SCENES[scene]?.priority ?? 40;
    setRegistrations((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      return [...filtered, { id, scene, priority: scenePriority }];
    });
  }, []);

  const unregisterScene = useCallback((id: string) => {
    setRegistrations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const setActiveScene = useCallback((scene: MascotScene, priority?: number) => {
    setFallbackScene(scene);
  }, []);

  // Handle reaction and speech timing when activeScene changes
  const prevSceneRef = useRef<MascotScene>(activeScene);
  useEffect(() => {
    if (prevSceneRef.current === activeScene) return;
    prevSceneRef.current = activeScene;

    const config = MASCOT_SCENES[activeScene];
    if (config && config.intensity !== "NONE") {
      // 1-time short reaction (350ms)
      const reactName = MOOD_TO_REACTION[config.mood] ?? null;
      setReaction(reactName);
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = setTimeout(() => {
        setReaction(null);
      }, 350);

      // Speech bubble logic with quiet mode and user dismissal checks
      if (config.speechKey && !isDismissed) {
        setGuideCount((count) => {
          if (count < 3) {
            setShowSpeechBubble(true);
            if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
            bubbleTimerRef.current = setTimeout(() => {
              setShowSpeechBubble(false);
            }, 4500);
            return count + 1;
          } else {
            setShowSpeechBubble(false);
            return count;
          }
        });
      } else {
        setShowSpeechBubble(false);
      }
    } else {
      setShowSpeechBubble(false);
    }
  }, [activeScene, isDismissed]);

  const toggleSpeechBubble = useCallback(() => {
    setShowSpeechBubble((prev) => !prev);
    if (isDismissed) setIsDismissed(false);
  }, [isDismissed]);

  const dismissSpeechBubble = useCallback(() => {
    setShowSpeechBubble(false);
    setIsDismissed(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (typeof window === "undefined") return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Mobile (width < 768px): compact dock at bottom-right
    if (width < 768) {
      setTargetPos({
        x: width - 72,
        y: height - 72,
        isDocked: true,
      });
      return;
    }

    if (!sceneConfig.anchorId) {
      setTargetPos({
        x: width - 100,
        y: height - 100,
        isDocked: true,
      });
      return;
    }

    const anchorEl =
      document.querySelector(`[data-mascot-anchor="${sceneConfig.anchorId}"]`) ||
      document.getElementById(sceneConfig.anchorId);

    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const isVisibleInViewport =
        rect.bottom >= -150 && rect.top <= height + 150;

      if (isVisibleInViewport) {
        let posX = rect.right + 24 + (sceneConfig.offsetX ?? 0);
        let posY = rect.top + rect.height / 2 - 36 + (sceneConfig.offsetY ?? 0);

        if (posX + 160 > width) {
          posX = Math.max(16, rect.left - 100 + (sceneConfig.offsetX ?? 0));
        }

        posY = Math.max(80, Math.min(height - 110, posY));

        setTargetPos({
          x: Math.round(posX),
          y: Math.round(posY),
          isDocked: false,
        });
        return;
      }
    }

    setTargetPos({
      x: width - 100,
      y: height - 100,
      isDocked: true,
    });
  }, [sceneConfig]);

  useEffect(() => {
    updatePosition();

    let timeoutId: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(updatePosition, 100);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutId) clearTimeout(timeoutId);
      if (bubbleTimerRef.current) clearTimeout(bubbleTimerRef.current);
      if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
    };
  }, [updatePosition]);

  return (
    <MascotContext.Provider
      value={{
        activeScene,
        setActiveScene,
        sceneConfig,
        targetPos,
        isMinimized,
        setIsMinimized,
        showSpeechBubble,
        toggleSpeechBubble,
        dismissSpeechBubble,
        isDismissed,
        reaction,
        guideCount,
        registerScene,
        unregisterScene,
      }}
    >
      {children}
    </MascotContext.Provider>
  );
}

export function useMascot() {
  return useContext(MascotContext);
}

/**
 * Custom hook to declaratively attach a mascot scene from any page or component.
 */
export function useMascotScene({
  scene,
  active = true,
  priority,
}: {
  scene: MascotScene;
  active?: boolean;
  priority?: number;
}) {
  const { registerScene, unregisterScene } = useMascot();
  const idRef = useRef(`scene-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const id = idRef.current;
    if (active) {
      registerScene(id, scene, priority);
    } else {
      unregisterScene(id);
    }

    return () => {
      unregisterScene(id);
    };
  }, [scene, active, priority, registerScene, unregisterScene]);
}
