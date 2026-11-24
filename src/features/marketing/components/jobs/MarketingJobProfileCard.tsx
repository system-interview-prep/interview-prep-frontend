"use client";

import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import MorphIcon from "../../graphics/MorphIcon";

interface MarketingJobProfileCardProps {
  title: string;
  categoryLabel: string;
  keywordsLine: string;
  requirementCount: number;
  matchedCount: number;
}

export function MarketingJobProfileCard({
  title,
  categoryLabel,
  keywordsLine,
  requirementCount,
  matchedCount,
}: MarketingJobProfileCardProps) {
  return (
    <article className="group relative flex h-full flex-col rounded-3xl border border-[#DCE4F3] bg-white p-6 shadow-xs hover:shadow-md hover:border-[#204195]/40 transition-all duration-200 text-left">
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="rounded-full bg-[#EEF3FC] border border-[#DCE4F3] px-3 py-1 font-mono text-xs font-bold text-[#204195]">
          {categoryLabel}
        </span>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F7F9FD] border border-[#DCE4F3]">
          <MorphIcon currentKey="target" size={24} color="#204195" />
        </div>
      </div>

      <h3 className="font-sans text-lg font-extrabold text-[#14244B] leading-snug group-hover:text-[#204195] transition-colors">
        {title}
      </h3>

      <p className="mt-3 text-xs leading-relaxed text-[#607096] font-medium flex-1">
        {keywordsLine}
      </p>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#DCE4F3] pt-4">
        <div className="text-xs font-mono">
          <span className="text-[#607096]">Evidence Status:</span>{" "}
          <span className="font-bold text-emerald-700">Khớp {matchedCount}/{requirementCount}</span>
        </div>

        <Link
          href="/signup"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#204195] px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#183275] active:scale-95 transition-all cursor-pointer"
        >
          <span>Chọn công việc</span>
          <Play className="size-3.5 fill-current ml-0.5" />
        </Link>
      </div>
    </article>
  );
}

export default MarketingJobProfileCard;
