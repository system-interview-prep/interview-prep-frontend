"use client";

import React, { useState } from "react";
import { Bookmark, CheckCircle2, Building2 } from "lucide-react";
import { JobCardCompany } from "./job-card.types";
import { getCompanyInitials } from "./job-card.utils";
import { useLanguage } from "@/i18n/LanguageProvider";

interface JobCardHeaderProps {
  title: string;
  company?: JobCardCompany;
  category?: string;
  saved?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
}

export function JobCardHeader({
  title,
  company,
  category,
  saved = false,
  onToggleSave,
}: JobCardHeaderProps) {
  const { t } = useLanguage();
  const [logoError, setLogoError] = useState(false);

  const saveAriaLabel = saved
    ? t("jobs.card.unsave") || "Bỏ lưu công việc"
    : t("jobs.card.save") || "Lưu công việc";

  return (
    <div className="flex items-start justify-between gap-3">
      {/* Left: Company Logo + Titles */}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {/* Company Logo / Fallback Avatar */}
        <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] shadow-2xs">
          {company?.logoUrl && !logoError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={company.logoUrl}
              alt={company.name || "Company logo"}
              onError={() => setLogoError(true)}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : company?.name ? (
            <div
              className="flex h-full w-full items-center justify-center bg-[#EEF2FD] font-bold text-xs text-[#204195] select-none"
              title={company.name}
            >
              {getCompanyInitials(company.name)}
            </div>
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-[#F1F5F9] text-[#64748B]"
              title={company?.name || undefined}
            >
              <Building2 className="size-5 text-[#64748B]" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Title & Company Info */}
        <div className="min-w-0 flex-1">
          <h3
            className="text-base font-bold leading-snug text-[#14244B] transition-colors group-hover:text-[#204195] sm:text-[17px] line-clamp-2"
            title={title}
          >
            {title}
          </h3>

          {(company?.name || category) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-[#607096] sm:text-sm">
              {company?.name && (
                <div className="inline-flex min-w-0 items-center gap-1">
                  <span className="truncate max-w-[170px] font-semibold text-[#1E293B] sm:max-w-[220px]" title={company.name}>
                    {company.name}
                  </span>
                  {company.verified === true && (
                    <span title="Verified Employer" className="inline-flex shrink-0 items-center">
                      <CheckCircle2
                        className="size-3.5 fill-[#204195] text-white"
                        aria-label="Verified employer"
                      />
                    </span>
                  )}
                </div>
              )}

              {company?.name && category && (
                <span className="text-[#CBD5E1] select-none font-bold text-xs" aria-hidden="true">·</span>
              )}

              {category && (
                <span className="inline-flex items-center rounded-md bg-[#EEF2FD] px-2 py-0.5 text-[11px] font-semibold text-[#204195]">
                  {category}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Save/Bookmark button */}
      <button
        type="button"
        onClick={onToggleSave}
        aria-label={saveAriaLabel}
        title={saveAriaLabel}
        className={`relative z-[3] -mr-1 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-150 active:scale-90 ${
          saved
            ? "bg-[#EEF2FD] text-[#204195] hover:bg-[#E0E8FA]"
            : "text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#14244B]"
        }`}
      >
        <Bookmark
          className={`size-4.5 transition-transform ${saved ? "fill-current scale-105" : ""}`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export default JobCardHeader;
