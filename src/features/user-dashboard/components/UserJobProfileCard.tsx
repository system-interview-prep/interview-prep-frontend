"use client";

import Link from "next/link";
import { Briefcase, Play } from "lucide-react";

type UserJobProfileCardProps = {
  jobId: string;
  viewDetailAria: string;
  title: string;
  categoryLabel: string;
  keywordsLine: string;
  updatedShort: string;
  updatedPrefix: string;
  interviewCta: string;
  onInterview: () => void;
  showKeywords?: boolean;
};

export function UserJobProfileCard({
  jobId,
  viewDetailAria,
  title,
  categoryLabel,
  keywordsLine,
  updatedShort,
  updatedPrefix,
  interviewCta,
  onInterview,
  showKeywords = true,
}: UserJobProfileCardProps) {
  const hasKeywords = showKeywords && keywordsLine && keywordsLine !== "—";

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#204195]/40 hover:shadow-md">
      <Link
        href={`/dashboard/jobs/${jobId}`}
        className="absolute inset-0 z-[1] rounded-2xl"
        aria-label={viewDetailAria}
      />
      <div className="relative z-[2] flex min-h-0 flex-1 flex-col pointer-events-none">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-[#204195]/8 border border-[#204195]/15 px-3 py-1 text-xs font-semibold text-[#204195] truncate max-w-[85%]">
            {categoryLabel}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F4FC] text-[#204195]">
            <Briefcase className="size-4" aria-hidden="true" />
          </span>
          <h3 className="line-clamp-2 text-lg font-bold text-[#14244B] leading-snug transition-colors group-hover:text-[#204195]">
            {title}
          </h3>
        </div>
        {hasKeywords && (
          <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-[#607096]">{keywordsLine}</p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EAEFF8] pt-4">
          <p className="text-[11px] text-[#607096]">
            <span className="font-semibold text-[#14244B]">{updatedPrefix}</span> {updatedShort}
          </p>
          <button
            type="button"
            onClick={onInterview}
            className="pointer-events-auto relative z-[3] inline-flex items-center gap-1.5 rounded-xl bg-[#204195] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#183275] active:scale-95"
          >
            {interviewCta}
            <Play className="size-3.5 fill-current" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}


