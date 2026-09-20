"use client";

import React, { type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: AdminBreadcrumbItem[];
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  statusBadge?: ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  primaryAction,
  secondaryAction,
  statusBadge,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6 pb-4 border-b border-[#DCE4F3]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-[#607096]">
          {breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="size-3 text-[#A0AEC0]" />}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="transition-colors hover:text-[#204195] font-medium"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-semibold text-[#14244B]" : ""}>
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#14244B]">
              {title}
            </h1>
            {statusBadge}
          </div>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-[#607096] max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-2.5 shrink-0">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
