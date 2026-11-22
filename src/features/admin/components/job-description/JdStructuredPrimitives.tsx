"use client";

import { type ReactNode } from "react";

export const EMPTY = "—";

/** A label/value pair in the structured field grids. */
export function JdField({
  label,
  value,
  hint,
  className = "",
}: {
  label: string;
  value: ReactNode;
  hint?: string | null;
  className?: string;
}) {
  const filled = value !== null && value !== undefined && value !== "" && value !== EMPTY;
  return (
    <div className={`min-w-0 rounded-xl border border-[#E8EEF9] bg-[#FAFCFF] px-3.5 py-2.5 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#607096]">{label}</p>
      <div
        className={`mt-1 text-sm [overflow-wrap:anywhere] ${
          filled ? "font-semibold text-[#14244B]" : "text-[#A3AFC6]"
        }`}
      >
        {filled ? value : EMPTY}
      </div>
      {hint ? <p className="mt-1 text-[11px] text-[#8A9ABA] [overflow-wrap:anywhere]">{hint}</p> : null}
    </div>
  );
}

/** Small pill used for keywords and enum values. */
export function JdChip({
  children,
  tone = "neutral",
  title,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "danger" | "warn" | "success";
  title?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-[#DCE4F3] bg-[#F8FAFC] text-[#607096]",
    brand: "border-[#204195]/20 bg-[#EEF2FD] text-[#204195]",
    danger: "border-[#C43B3B]/25 bg-[#FDF2F2] text-[#C43B3B]",
    warn: "border-[#FCB625]/40 bg-[#FFF8EB] text-[#8A5300]",
    success: "border-[#287A4B]/25 bg-[#287A4B]/10 text-[#287A4B]",
  };
  return (
    <span
      title={title}
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold [overflow-wrap:anywhere] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
