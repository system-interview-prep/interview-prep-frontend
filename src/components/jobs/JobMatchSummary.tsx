"use client";

import React from "react";
import { Check } from "lucide-react";
import { JobCardMatch } from "./job-card.types";
import { useLanguage } from "@/i18n/LanguageProvider";

interface JobMatchSummaryProps {
  match?: JobCardMatch;
}

export function JobMatchSummary({ match }: JobMatchSummaryProps) {
  const { t } = useLanguage();

  if (!match || typeof match.score !== "number" || match.score <= 0) {
    return null;
  }

  const score = Math.min(100, Math.max(0, Math.round(match.score)));

  // Resolve 2-3 key signals
  const signals: string[] = [];
  if (match.labels && match.labels.length > 0) {
    signals.push(...match.labels.slice(0, 3));
  } else {
    const s = match.signals || {};
    if (s.experience === true || s.experience === "strong" || s.experience === "match") {
      signals.push(t("jobs.match.experience") || "Experience fit");
    }
    if (s.skills === true || s.skills === "strong" || s.skills === "match") {
      signals.push(t("jobs.match.skills") || "Skills fit");
    }
    if (s.location === true || s.location === "strong" || s.location === "match") {
      signals.push(t("jobs.match.location") || "Location fit");
    }

    // Default fallback signals if score is high but no specific signals provided
    if (signals.length === 0 && score >= 70) {
      signals.push(t("jobs.match.skills") || "Skills fit");
      signals.push(t("jobs.match.experience") || "Experience fit");
    }
  }

  const isHighMatch = score >= 80;

  return (
    <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-2.5 transition-colors group-hover:border-[#C5D2E7] group-hover:bg-[#F4F7FC]">
      {/* Top row: Score + Optional Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-extrabold text-[#14244B] sm:text-[13px]">
            {score}%
          </span>
          <span className="text-[11px] font-semibold text-[#607096]">
            {t("jobs.match.label") || "Match"}
          </span>
        </div>

        {isHighMatch && (
          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            {t("jobs.match.strong") || "Strong match"}
          </span>
        )}
      </div>

      {/* Slim Modern Progress Bar */}
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isHighMatch ? "bg-[#204195]" : "bg-[#64748B]"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Bottom signals (max 2-3) */}
      {signals.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {signals.slice(0, 3).map((sig, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 font-medium text-[#475569]"
            >
              <Check className="size-3 text-emerald-600 stroke-[2.5]" aria-hidden="true" />
              <span>{sig}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobMatchSummary;
