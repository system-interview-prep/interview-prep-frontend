"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface CoachCalloutProps {
  eyebrow: string;
  title: string;
  description: string;
  steps?: Array<{ num: string; text: string }>;
  ctaText?: string;
  ctaHref?: string;
}

export default function CoachCallout({
  eyebrow,
  title,
  description,
  steps,
  ctaText,
  ctaHref = "/app",
}: CoachCalloutProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-[26px] border border-[#DCE4F3] bg-white p-6 shadow-[0_10px_34px_rgba(32,65,149,0.04)] sm:p-8">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-xl">
          <span className="mb-2 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#FCB625]">
            <Sparkles className="size-3.5 fill-[#FCB625] text-[#FCB625]" />
            {eyebrow}
          </span>
          <h3 className="text-xl font-bold tracking-tight text-[#14244B] sm:text-2xl">
            {title}
          </h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[#506085]">
            {description}
          </p>

          {steps && steps.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 sm:gap-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-[12px] border border-[#DCE4F3] bg-[#F7F9FD] px-3 py-1.5 text-xs font-semibold text-[#204195]"
                >
                  <span className="grid size-4 place-items-center rounded-full bg-[#204195] text-[10px] font-bold text-white">
                    {step.num}
                  </span>
                  <span>{step.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {ctaText && (
          <Link
            href={ctaHref}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#204195] px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#183275] active:scale-[0.98]"
          >
            {ctaText}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
