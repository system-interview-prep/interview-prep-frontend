"use client";

import React from "react";
import { ArrowRight, Play } from "lucide-react";
import { formatRelativeTime } from "./job-card.utils";
import { useLanguage } from "@/i18n/LanguageProvider";

interface JobCardFooterProps {
  postedAt?: string;
  sourceName?: string;
  onInterview?: () => void;
  interviewCta?: string;
}

export function JobCardFooter({
  postedAt,
  sourceName,
  onInterview,
  interviewCta,
}: JobCardFooterProps) {
  const { t, lang } = useLanguage();

  const timeRelative = postedAt ? formatRelativeTime(postedAt, lang) : "";

  let postedText = "";
  if (timeRelative) {
    postedText = lang === "vi" ? `Đăng ${timeRelative}` : `Posted ${timeRelative}`;
  }

  const isInternal =
    !sourceName ||
    sourceName.trim().toLowerCase() === "internal upload" ||
    sourceName.trim().toLowerCase() === "internal_upload" ||
    sourceName.trim().toLowerCase() === "manual";

  let sourceText = "";
  if (!isInternal && sourceName) {
    sourceText = lang === "vi" ? `qua ${sourceName}` : `via ${sourceName}`;
  } else if (isInternal && !postedText) {
    sourceText = lang === "vi" ? "Đăng trực tiếp" : "Direct posting";
  }

  return (
    <div className="flex items-center justify-between gap-2 border-t border-[#EAEFF8] pt-3 text-xs">
      {/* Left: Posted Date + Optional Source */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] text-[#94A3B8]">
        {postedText && <span className="truncate">{postedText}</span>}
        {postedText && sourceText && <span>·</span>}
        {sourceText && (
          <span className="truncate" title={sourceText}>
            {sourceText}
          </span>
        )}
      </div>

      {/* Right: View Job or Interview CTA */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {onInterview && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInterview();
            }}
            title={interviewCta || t("userDash.jobProfiles.interviewNow") || (lang === "vi" ? "Luyện phỏng vấn" : "Practice Interview")}
            className="relative z-[3] inline-flex items-center gap-1 rounded-lg border border-[#204195]/20 bg-[#F0F4FC] px-2.5 py-1 text-[11px] font-bold text-[#204195] transition-all hover:border-[#204195] hover:bg-[#204195] hover:text-white active:scale-95"
          >
            <span>{interviewCta || t("userDash.jobProfiles.interviewNow") || (lang === "vi" ? "Luyện phỏng vấn" : "Practice Interview")}</span>
            <Play className="size-2.5 fill-current" aria-hidden="true" />
          </button>
        )}

        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#204195] transition-transform duration-150 group-hover:translate-x-0.5 sm:text-xs">
          <span className={onInterview ? "hidden sm:inline" : "inline"}>
            {t("jobs.card.viewJob") || "Xem chi tiết"}
          </span>
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

export default JobCardFooter;
