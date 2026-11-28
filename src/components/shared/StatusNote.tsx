"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils";

/**
 * A one-line status message shown right next to what just happened (upload
 * done, analysis finished, an error), so the system says what it did and what
 * comes next. A coloured edge carries the tone; the text says it in words.
 */
export function StatusNote({
  text,
  hint,
  tone = "info",
  onDismiss,
  dismissLabel,
  className,
}: {
  text: string;
  /** Optional next-step line under the message. */
  hint?: ReactNode;
  tone?: "info" | "success" | "error";
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cn(
        "anim-rise relative min-w-0 rounded-2xl border border-l-4 px-4 py-2.5 text-sm leading-6",
        tone === "error"
          ? "border-[#F5C2C2] border-l-[#C43B3B] bg-[#FDF2F2] text-[#8F2A2A]"
          : tone === "success"
            ? "border-[#BFE0CC] border-l-[#287A4B] bg-[#EAF5EE] text-[#1F5E3A]"
            : "border-[#C9D7F1] border-l-[#204195] bg-[#F0F4FC] text-[#14244B]",
        className,
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0 break-words">
          {text}
          {hint ? <span className="mt-0.5 block text-xs opacity-80">{hint}</span> : null}
        </span>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="-mr-1 shrink-0 rounded-full px-1.5 text-base leading-6 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]"
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </span>
    </div>
  );
}

export default StatusNote;
