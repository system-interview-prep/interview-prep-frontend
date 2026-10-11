"use client";

import React from "react";
import Link from "next/link";

interface CoachCalloutProps {
  /** Kept for older callers; not rendered. */
  eyebrow?: string;
  title: string;
  description: string;
  steps?: Array<{ num: string; text: string }>;
  ctaText?: string;
  ctaHref?: string;
}

/** A piece of advice: a plain callout with a yellow accent and an optional action. */
export default function CoachCallout({
  title,
  description,
  steps,
  ctaText,
  ctaHref = "/signup",
}: CoachCalloutProps) {
  return (
    <div className="w-full rounded-3xl border border-[#DCE4F3] border-l-4 border-l-[#FCB625] bg-white px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <h3 className="font-display text-[24px] font-semibold leading-tight tracking-tight text-[#14244B] sm:text-[28px]">
            {title}
          </h3>
          <p className="mt-2 text-[15px] leading-7 text-[#607096]">
            {description}
          </p>

          {steps && steps.length > 0 && (
            <ol className="mt-4 flex flex-wrap gap-2">
              {steps.map((step, idx) => (
                <li
                  key={idx}
                  className="inline-flex items-center gap-2 rounded-full bg-[#F7F9FD] px-3.5 py-1.5 text-[13px] font-medium text-[#14244B]"
                >
                  <span className="font-semibold text-[#204195]">{step.num}.</span>
                  <span>{step.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {ctaText && (
          <Link
            href={ctaHref}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
          >
            {ctaText}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}
