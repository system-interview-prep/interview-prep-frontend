"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils";

export interface MascotSpeechBubbleProps {
  text: string;
  className?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
}

const CHAR_MS = 18;

/** Types the line out so the fox reads as speaking rather than posting a toast. */
export function MascotSpeechBubble({ text, className, onDismiss, dismissLabel }: MascotSpeechBubbleProps) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setShown(text.length));
      return;
    }
    queueMicrotask(() => setShown(0));
    const timer = window.setInterval(() => {
      setShown((value) => {
        if (value >= text.length) {
          window.clearInterval(timer);
          return value;
        }
        return value + 1;
      });
    }, CHAR_MS);
    return () => window.clearInterval(timer);
  }, [text]);

  if (!text) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative max-w-[280px] rounded-[20px] rounded-br-md bg-white px-4 py-3 text-[14px] leading-relaxed text-[#14244B] shadow-[0_12px_32px_-12px_rgba(20,36,75,0.35)] ring-1 ring-[#DCE4F3] mascot-pop",
        className,
      )}
    >
      {/* Full text for screen readers; the typed copy is visual only. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        <span className="invisible">{text.slice(shown)}</span>
      </span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="absolute -top-2 -left-2 grid h-6 w-6 place-items-center rounded-full bg-white text-[13px] leading-none text-[#607096] shadow ring-1 ring-[#DCE4F3] hover:text-[#14244B]"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default MascotSpeechBubble;
