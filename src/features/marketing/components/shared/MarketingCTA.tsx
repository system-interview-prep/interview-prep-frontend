"use client";

import React from "react";
import Link from "next/link";

interface MarketingCTAProps {
  /** Kept for older callers; not rendered. */
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  description: string;
  primaryCtaText: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

/** Closing call to action: the featured brand card with a yellow button. */
export default function MarketingCTA({
  title,
  titleAccent,
  description,
  primaryCtaText,
  primaryCtaHref = "/signup",
  secondaryCtaText,
  secondaryCtaHref = "/pricing",
}: MarketingCTAProps) {
  return (
    <section className="relative w-full overflow-hidden rounded-[28px] bg-[#204195] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center">

        <h2 className="font-display text-[30px] font-semibold leading-[1.1] tracking-tight text-white sm:text-[36px] lg:text-[42px]">
          {title}{" "}
          {titleAccent && <span className="text-[#FCB625]">{titleAccent}</span>}
        </h2>

        <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/75 sm:text-base">
          {description}
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href={primaryCtaHref}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FCB625] px-7 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#E5A21D] sm:w-auto"
          >
            {primaryCtaText}
            <span aria-hidden="true">→</span>
          </Link>

          {secondaryCtaText && (
            <Link
              href={secondaryCtaHref}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-white/10 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/20 sm:w-auto"
            >
              {secondaryCtaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
