"use client";

import { useState, type ReactNode } from "react";
import { Pagination } from "@components/shared/Pagination";

/** Small shared pieces of the admin pipeline views (admin palette). */

export function Fact({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#607096]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-[#14244B] break-words">{children}</dd>
      {hint ? <dd className="mt-0.5 text-xs text-[#607096]">{hint}</dd> : null}
    </div>
  );
}

/**
 * Chip colors. Statuses use the filled tones (one hue per meaning, as in
 * AdminStatusBadge); attributes such as stage or difficulty use "outline", so
 * an attribute never looks like a state.
 */
const CHIP_TONES = {
  neutral: "bg-[#F1F5F9] text-[#475569]",
  brand: "bg-[#EEF2FD] text-[#204195]",
  good: "bg-[#EEF7F1] text-[#287A4B]",
  warn: "bg-[#FFF7E6] text-[#8A5A00]",
  bad: "bg-[#FDF2F2] text-[#C43B3B]",
  live: "bg-[#204195] text-white",
  violet: "bg-violet-50 text-violet-700",
  teal: "bg-teal-50 text-teal-700",
  orange: "bg-orange-50 text-orange-700",
  sky: "bg-sky-50 text-sky-700",
  outline: "border border-[#DCE4F3] bg-white text-[#475569]",
} as const;

export type ChipTone = keyof typeof CHIP_TONES;

export function Chip({ tone = "neutral", children }: { tone?: ChipTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${CHIP_TONES[tone]}`}>
      {children}
    </span>
  );
}

/** A reason line: "why the AI did this". */
export function Reason({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "bad" }) {
  const color = tone === "bad" ? "text-[#C43B3B]" : tone === "warn" ? "text-[#8A5A00]" : "text-[#475569]";
  return <p className={`text-xs leading-5 ${color}`}>{children}</p>;
}

/** A labelled progress bar; the numbers are always printed next to it. */
export function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  const ratio = total > 0 ? Math.min(1, value / total) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-[#14244B]">
        <span>{label}</span>
        <span className="tabular-nums text-[#607096]">{Math.round(ratio * 100)}%</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#EAEFF8]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-[#204195] transition-[width] duration-500" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[#607096]">{children}</p>;
}

export function TableShell({ children, minWidth = 560 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function Th({ children, align = "left" }: { children: ReactNode; align?: keyof typeof ALIGN }) {
  return (
    <th
      className={`border-b border-[#EAEFF8] py-2 pr-4 text-[11px] font-bold uppercase tracking-wider text-[#607096] ${ALIGN[align]}`}
    >
      {children}
    </th>
  );
}

/** Client-side pages over a list: the rows of the current page and the pager to show under them. */
export function usePagedRows<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages);
  return {
    rows: items.slice((current - 1) * pageSize, current * pageSize),
    pager:
      items.length > pageSize ? (
        <Pagination page={current} pageSize={pageSize} total={items.length} onPageChange={setPage} className="mt-4" />
      ) : null,
  };
}
