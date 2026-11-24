"use client";

import React, { type ReactNode } from "react";

export interface AdminSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}

export default function AdminSection({
  title,
  description,
  action,
  children,
  className = "",
  headerClassName = "",
}: AdminSectionProps) {
  return (
    <section className={`rounded-2xl border border-[#DCE4F3] bg-white p-5 sm:p-6 shadow-xs ${className}`}>
      <div className={`mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#F1F5F9] pb-4 ${headerClassName}`}>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#14244B]">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-[#607096]">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}
