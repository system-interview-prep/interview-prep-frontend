"use client";

import { useEffect, useRef, useState } from "react";
import SpriteMascot from "./SpriteMascot";
import MascotSpeechBubble from "./MascotSpeechBubble";
import type { MascotContainerProps } from "../types";
import { cn } from "@/utils";
import { ChevronDown, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export function MascotContainer({
  mood = "idle",
  speechText,
  className,
}: MascotContainerProps) {
  const { t } = useLanguage();
  const mascotRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });
  const [anchorPos, setAnchorPos] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      const anchorEl = document.querySelector('[data-mascot-anchor="auth-coach"]');
      if (anchorEl && window.innerWidth >= 1024) {
        const rect = anchorEl.getBoundingClientRect();
        setAnchorPos({
          position: "fixed",
          top: `${Math.max(20, rect.top - 8)}px`,
          left: `${rect.right - 140}px`,
          bottom: "auto",
          right: "auto",
        });
      } else {
        setAnchorPos(null);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    const timer = setInterval(updatePosition, 400);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
      clearInterval(timer);
    };
  }, []);

  return (
    <div
      ref={mascotRef}
      style={anchorPos || undefined}
      className={cn(
        "z-40 hidden md:flex flex-col items-end gap-2 select-none transition-all duration-300",
        !anchorPos && "fixed bottom-6 right-6",
        prefersReducedMotion && "motion-reduce:transform-none motion-reduce:transition-none",
        className
      )}
    >
      {/* Toggle Minimize/Expand Button */}
      <button
        type="button"
        onClick={() => setIsMinimized((prev) => !prev)}
        aria-label={isMinimized ? t("mascot.expand") : t("mascot.minimize")}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#DCE4F3] bg-white text-[#204195] shadow-xs transition-all hover:bg-[#F7F9FD] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]"
      >
        {isMinimized ? <Sparkles className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>

      {!isMinimized && (
        <>
          {speechText && <MascotSpeechBubble text={speechText} />}
          <SpriteMascot mood={mood} />
        </>
      )}
    </div>
  );
}

export default MascotContainer;

