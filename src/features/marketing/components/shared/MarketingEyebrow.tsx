"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface MarketingEyebrowProps {
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}

export default function MarketingEyebrow({
  children,
  icon = true,
  className = "",
}: MarketingEyebrowProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-1.5 shadow-sm ${className}`}
    >
      {icon && <Sparkles className="size-3.5 text-[#204195]" />}
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#204195]">
        {children}
      </span>
    </div>
  );
}
