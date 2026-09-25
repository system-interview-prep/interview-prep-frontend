"use client";

import React from "react";
import { SearchX, RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

interface JobCardEmptyStateProps {
  title?: string;
  description?: string;
  onClearFilters?: () => void;
  className?: string;
}

export function JobCardEmptyState({
  title,
  description,
  onClearFilters,
  className = "",
}: JobCardEmptyStateProps) {
  const { t } = useLanguage();

  const defaultTitle =
    title || t("jobs.empty.title") || "Không tìm thấy công việc phù hợp với bộ lọc";
  const defaultDesc =
    description ||
    t("jobs.empty.desc") ||
    "Thử thay đổi từ khóa, địa điểm hoặc loại công việc.";

  return (
    <div
      className={`rounded-2xl border border-dashed border-[#DCE4F3] bg-white px-6 py-16 text-center shadow-2xs ${className}`}
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#EEF2FD] text-[#204195]">
        <SearchX className="size-7" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-base font-bold text-[#14244B] sm:text-lg">
        {defaultTitle}
      </h3>

      <p className="mx-auto mt-1.5 max-w-md text-sm text-[#607096]">
        {defaultDesc}
      </p>

      {onClearFilters && (
        <div className="mt-5">
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#183275] active:scale-95"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span>{t("jobs.empty.clear") || "Xóa bộ lọc"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default JobCardEmptyState;
