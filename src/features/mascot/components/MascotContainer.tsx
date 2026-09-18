"use client";

import { useEffect, useRef, useState } from "react";
import SpriteMascot from "./SpriteMascot";
import MascotSpeechBubble from "./MascotSpeechBubble";
import type { MascotContainerProps } from "../types";
import { cn } from "@/utils";
import { ChevronDown, Sparkles } from "lucide-react";

export function MascotContainer({
  mood = "idle",
  speechText,
  className,
}: MascotContainerProps) {
  const mascotRef = useRef<HTMLDivElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div
      ref={mascotRef}
      className={cn(
        "fixed bottom-6 right-6 z-40 hidden md:flex flex-col items-end gap-2 select-none transition-all duration-300",
        prefersReducedMotion && "motion-reduce:transform-none motion-reduce:transition-none",
        className
      )}
    >
      {/* Toggle Minimize/Expand Button */}
      <button
        type="button"
        onClick={() => setIsMinimized((prev) => !prev)}
        aria-label={isMinimized ? "Mở rộng Mascot" : "Thu nhỏ Mascot"}
        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#204195] bg-[#FCB625] text-[#204195] shadow-[2px_2px_0_#204195] transition-all hover:bg-[#ffc33f] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]"
      >
        {isMinimized ? <Sparkles className="size-4" /> : <ChevronDown className="size-4" />}
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
