"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { cn } from "@/utils";

/** Page numbers to show: first, last, current ±1, with gaps as null. */
function pageWindow(page: number, pages: number): Array<number | null> {
  const wanted = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: Array<number | null> = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

/** "Showing 11–20 of 37" plus previous / numbered / next page buttons. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  /** 1-based. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { t } = useLanguage();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const button = "grid h-9 min-w-9 place-items-center rounded-full px-2 text-[13px] font-semibold tabular-nums transition-colors";

  return (
    <nav aria-label={t("pagination.aria")} className={cn("flex flex-col items-center justify-between gap-3 sm:flex-row", className)}>
      <p className="text-[13px] text-[#607096] tabular-nums" aria-live="polite">
        {fmt(t("pagination.showing"), { from, to, total })}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={t("pagination.prev")}
          className={cn(button, "text-[#14244B] hover:bg-[#F0F4FC] disabled:cursor-not-allowed disabled:opacity-35")}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        {pageWindow(page, pages).map((n, i) =>
          n == null ? (
            <span key={`gap-${i}`} className="px-1 text-[13px] text-[#9AA6C2]" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={fmt(t("pagination.page"), { n })}
              className={cn(button, n === page ? "bg-[#204195] text-white" : "text-[#14244B] hover:bg-[#F0F4FC]")}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label={t("pagination.next")}
          className={cn(button, "text-[#14244B] hover:bg-[#F0F4FC] disabled:cursor-not-allowed disabled:opacity-35")}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
