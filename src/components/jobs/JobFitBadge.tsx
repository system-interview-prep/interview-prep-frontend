"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt, localeOf } from "@/i18n/format";
import type { JobCardFit } from "./job-card.types";

/**
 * "6/9 criteria met" from the candidate's last CV–JD analysis of this job,
 * with the CV and date it came from. Opens that analysis again.
 */
export function JobFitBadge({ jobId, fit }: { jobId: string; fit?: JobCardFit }) {
  const { t, lang } = useLanguage();
  if (!fit || fit.total <= 0) return null;

  const ratio = fit.met / fit.total;
  const date = new Date(fit.analyzedAt).toLocaleDateString(localeOf(lang), { day: "2-digit", month: "2-digit" });
  const href = `/interview/cv-score?${new URLSearchParams({ candidateId: fit.cvId, jobId }).toString()}`;

  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className="relative z-[2] block rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-2 transition-colors hover:border-[#204195]/40 hover:bg-[#F0F4FC]"
      aria-label={fmt(t("jobs.fit.aria"), { met: fit.met, total: fit.total })}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-bold text-[#14244B] tabular-nums">
          {fmt(t("jobs.fit.label"), { met: fit.met, total: fit.total })}
        </span>
        <span className="truncate text-[11px] text-[#607096]">
          {fit.cvName ? `${fit.cvName} · ${date}` : date}
        </span>
      </span>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
        <span
          className={`anim-grow-x block h-full rounded-full ${ratio >= 0.7 ? "bg-[#287A4B]" : ratio >= 0.4 ? "bg-[#204195]" : "bg-[#E5A21D]"}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>
    </Link>
  );
}

export default JobFitBadge;
