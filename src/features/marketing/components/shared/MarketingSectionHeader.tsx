"use client";

import React from "react";

interface MarketingSectionHeaderProps {
  /** Kept for older callers; section titles no longer carry an eyebrow. */
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;

  as?: "h1" | "h2" | "h3";
  size?: "hero" | "section" | "compact";
}

const headingClasses = {
  hero: "font-display text-[clamp(2.3rem,3.6vw,3.6rem)] font-semibold leading-[1.05] tracking-tight text-[#14244B]",
  section: "font-display text-[28px] font-semibold leading-tight tracking-tight text-[#14244B] sm:text-[34px] lg:text-[40px]",
  compact: "font-display text-2xl font-semibold leading-tight tracking-tight text-[#14244B] sm:text-[28px]",
};

const descriptionClasses = {
  hero: "mt-5 max-w-[680px] text-base leading-7 text-[#607096] sm:text-lg sm:leading-8",
  section: "mt-3 max-w-[640px] text-[15px] leading-7 text-[#607096] sm:text-base",
  compact: "mt-2.5 max-w-2xl text-sm leading-6 text-[#607096]",
};

/** Plain section title (Fraunces) + optional subtitle. */
export default function MarketingSectionHeader({
  title,
  description,
  align = "center",
  className = "",
  as = "h2",
  size = "section",
}: MarketingSectionHeaderProps) {
  const isCenter = align === "center";
  const Heading = as;

  return (
    <div
      className={`flex flex-col ${
        isCenter ? "items-center text-center" : "items-start text-left"
      } ${className}`}
    >
      <Heading className={headingClasses[size]}>{title}</Heading>

      {description && (
        <p className={descriptionClasses[size]}>{description}</p>
      )}
    </div>
  );
}
