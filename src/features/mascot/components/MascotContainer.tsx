"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";

import SpriteMascot from "./SpriteMascot";
import MascotSpeechBubble from "./MascotSpeechBubble";
import { useMascot } from "../MascotContext";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useMouseTracking } from "../hooks/useMouseTracking";
import { cn } from "@/utils";

export function MascotContainer({ className }: { className?: string }) {
  const mascotRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const prefersReduced = useReducedMotion();
  const { t } = useLanguage();
  const {
    sceneConfig,
    targetPos,
    isMinimized,
    setIsMinimized,
    showSpeechBubble,
    toggleSpeechBubble,
    reaction,
  } = useMascot();

  const eyePos = useMouseTracking(mascotRef);
  const [viewportMode, setViewportMode] = useState<"mobile" | "tablet" | "desktop">("desktop");

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) setViewportMode("mobile");
      else if (w < 1024) setViewportMode("tablet");
      else setViewportMode("desktop");
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  const isRoom = Boolean(pathname && pathname.includes("/interview/room"));

  // Sizing rules:
  // Desktop: 72px (scalable up to 80px for hero/final-cta)
  // Tablet: 60px
  // Mobile: 52px
  let baseSize = 72;
  if (viewportMode === "mobile") baseSize = 52;
  else if (viewportMode === "tablet") baseSize = 60;
  else if (sceneConfig.anchorId === "hero" || sceneConfig.anchorId === "final-cta") baseSize = 80;

  if (isRoom) baseSize = 56;
  const mascotSize = Math.round(baseSize * (sceneConfig.scale ?? 1));

  const speechText = sceneConfig.speechKey ? t(sceneConfig.speechKey) : null;

  // Eye/head shift calculation for desktop (max 3px, 1.5 deg)
  const isDesktop = viewportMode === "desktop";
  const eyeShiftX =
    isDesktop && !prefersReduced
      ? Math.cos((eyePos.angle * Math.PI) / 180) * Math.min(eyePos.distance, 3)
      : 0;
  const eyeShiftY =
    isDesktop && !prefersReduced
      ? Math.sin((eyePos.angle * Math.PI) / 180) * Math.min(eyePos.distance, 3)
      : 0;
  const headRotate =
    isDesktop && !prefersReduced
      ? Math.sin((eyePos.angle * Math.PI) / 180) * 1.5
      : 0;

  return (
    <motion.div
      ref={mascotRef}
      initial={false}
      animate={{
        x: targetPos.x,
        y: targetPos.y,
        opacity: 1,
      }}
      transition={
        prefersReduced
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 120,
              damping: 24,
              mass: 0.8,
            }
      }
      className={cn(
        "fixed top-0 left-0 z-30 flex flex-col items-end gap-1.5 select-none pointer-events-none",
        className
      )}
    >
      {/* Toggle Minimize/Expand Button */}
      <button
        type="button"
        onClick={() => setIsMinimized((prev) => !prev)}
        aria-label={isMinimized ? "Mở rộng Mascot" : "Thu nhỏ Mascot"}
        className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border border-[#DCE4F3] bg-white text-[#204195] shadow-xs transition-all hover:bg-[#F7F9FD] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] cursor-pointer"
      >
        {isMinimized ? (
          <Sparkles className="size-3.5 text-[#FCB625]" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </button>

      {!isMinimized && (
        <div className="flex flex-col items-end gap-1">
          {showSpeechBubble && speechText && (
            <MascotSpeechBubble
              text={speechText}
              className="pointer-events-auto cursor-pointer"
            />
          )}

          <motion.div
            aria-hidden="true"
            onClick={toggleSpeechBubble}
            style={{
              x: eyeShiftX,
              y: eyeShiftY,
              rotate: headRotate,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="pointer-events-auto cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title="Click to toggle coaching tip"
          >
            <SpriteMascot
              mood={sceneConfig.mood}
              size={mascotSize}
              reaction={reaction}
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default MascotContainer;
