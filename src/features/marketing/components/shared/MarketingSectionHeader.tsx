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
}

export default function MarketingSectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
  as = "h2",
}: MarketingSectionHeaderProps) {
  const isCenter = align === "center";
  const Component = as;

  return (
    <div
      className={`flex flex-col ${
        isCenter ? "items-center text-center" : "items-start text-left"
      } ${className}`}
    >
      {eyebrow && (
        <MarketingEyebrow className="mb-4">{eyebrow}</MarketingEyebrow>
      )}

      <Component className="text-2xl font-black tracking-tight text-[#14244B] sm:text-3xl md:text-4xl">
        {title}
      </Component>

      {description && (
        <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-[#506085] sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
