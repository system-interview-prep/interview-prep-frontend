import React from "react";
import { cn } from "@/utils";
import { X } from "lucide-react";

export interface MascotSpeechBubbleProps {
  text: string;
  className?: string;
  onDismiss?: () => void;
}

export function MascotSpeechBubble({
  text,
  className,
  onDismiss,
}: MascotSpeechBubbleProps) {
  if (!text) return null;

  return (
    <div
      role="region"
      aria-label="Mascot Guidance"
      aria-live="polite"
      className={cn(
        "group relative rounded-2xl border border-[#DCE4F3] bg-white/95 px-3.5 py-2.5 text-[11px] font-medium leading-relaxed text-[#14244B] shadow-[0_8px_24px_rgba(32,65,149,0.08)] backdrop-blur-xs transition-all duration-300 max-w-[280px]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#FCB625]" />
          <span>{text}</span>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Tắt hướng dẫn"
            className="mt-0.5 -mr-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#607096] opacity-60 transition-opacity hover:bg-[#F7F9FD] hover:opacity-100 cursor-pointer"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-[#DCE4F3] bg-white" />
    </div>
  );
}

export default MascotSpeechBubble;
