"use client";

import React from "react";
import MarketingEyebrow from "./MarketingEyebrow";

interface MarketingSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;

  as?: "h1" | "h2" | "h3";
  size?: "hero" | "section" | "compact";
}

export default function MarketingSectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
  as = "h2",
  size = "section",
}: MarketingSectionHeaderProps) {
  const isCenter = align === "center";
  const Heading = as;

  const headingClasses = {
    hero: `
      font-sans font-extrabold
      text-[clamp(2.6rem,3.85vw,4.25rem)]
      leading-[0.99]
      tracking-[-0.045em]
      text-[#14244B]
    `,

    section: `
      font-sans font-extrabold
      text-[30px]
      leading-[1.08]
      tracking-[-0.035em]
      text-[#14244B]
      sm:text-[34px]
      lg:text-[42px]
    `,

    compact: `
      font-sans font-extrabold
      text-2xl
      leading-[1.15]
      tracking-[-0.025em]
      text-[#14244B]
      sm:text-[28px]
    `,
  };

  const descriptionClasses = {
    hero: `
      mt-5
      max-w-[680px]
      text-base
      leading-7
      text-[#607096]
      sm:text-lg
      sm:leading-8
    `,

    section: `
      mt-4
      max-w-[680px]
      text-[15px]
      leading-7
      text-[#607096]
      sm:text-base
    `,

    compact: `
      mt-3
      max-w-2xl
      text-sm
      leading-6
      text-[#607096]
    `,
  };

  return (
    <div
      className={`
        flex flex-col
        ${
          isCenter
            ? "items-center text-center"
            : "items-start text-left"
        }
        ${className}
      `}
    >
      {eyebrow && (
        <MarketingEyebrow className="mb-4">
          {eyebrow}
        </MarketingEyebrow>
      )}

      <Heading className={headingClasses[size]}>
        {title}
      </Heading>

      {description && (
        <p className={descriptionClasses[size]}>
          {description}
        </p>
      )}
    </div>
  );
}
