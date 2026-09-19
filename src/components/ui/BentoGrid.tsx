"use client";

import { cn } from "@/utils";
import React from "react";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  name: string;
  className?: string;
  background?: React.ReactNode;
  Icon?: React.ElementType;
  description: string;
  badge?: string;
  href?: string;
  cta?: string;
  children?: React.ReactNode;
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  badge,
  children,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#FCB625]/50",
        className
      )}
    >
      {/* Background Graphic or Decorative element */}
      {background && (
        <div className="absolute inset-0 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
          {background}
        </div>
      )}

      {/* Top Header & Icon */}
      <div className="relative z-10 flex items-start justify-between">
        {Icon && (
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#204195]/10 text-[#204195] transition-colors duration-300">
            <Icon className="h-6 w-6 text-[#204195]" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#FCB625] border-2 border-white" />
          </div>
        )}
        {badge && (
          <span className="rounded-full bg-[#FCB625]/15 border border-[#FCB625]/40 px-3 py-1 text-xs font-bold text-[#204195]">
            {badge}
          </span>
        )}
      </div>

      {/* Middle Custom Content */}
      <div className="relative z-10 my-4 flex-1">{children}</div>

      {/* Bottom Text Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-[#204195] transition-colors">
          {name}
        </h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
