"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface MarketingCTAProps {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description: string;
  primaryCtaText: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export default function MarketingCTA({
  eyebrow,
  title,
  titleAccent,
  description,
  primaryCtaText,
  primaryCtaHref = "/app",
  secondaryCtaText,
  secondaryCtaHref = "/pricing",
}: MarketingCTAProps) {
  return (
    <section className="relative w-full overflow-hidden rounded-[26px] border border-[#DCE4F3] bg-gradient-to-b from-[#F7F9FD] to-[#EEF3FC] px-6 py-12 text-center shadow-sm sm:px-12 sm:py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center">
        <span className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-[#204195]">
          <Sparkles className="size-3.5" />
          {eyebrow}
        </span>

        <h2 className="text-2xl font-black tracking-tight text-[#14244B] sm:text-4xl">
          {title}{" "}
          {titleAccent && (
            <span className="bg-gradient-to-r from-[#204195] to-[#3B66D4] bg-clip-text text-transparent">
              {titleAccent}
            </span>
          )}
        </h2>

        <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-[#506085] sm:text-base">
          {description}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={primaryCtaHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-[#204195] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[#183275] hover:shadow-lg active:scale-[0.98]"
          >
            {primaryCtaText}
            <ArrowRight className="size-4" />
          </Link>

          {secondaryCtaText && (
            <Link
              href={secondaryCtaHref}
              className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#DCE4F3] bg-white px-6 text-sm font-bold text-[#14244B] transition-colors hover:bg-[#F7F9FD]"
            >
              {secondaryCtaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
