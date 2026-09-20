"use client";

import React, { type ReactNode } from "react";
import AdminStatusBadge, { type AdminStatusType } from "./AdminStatusBadge";

export interface AdminMetricCardProps {
  title: string;
  value?: string | number | null;
  unit?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  delta?: {
    value: string;
    isPositive: boolean;
  };
  status?: AdminStatusType;
  statusLabel?: string;
  isPending?: boolean;
  pendingText?: string;
  tooltip?: string;
  className?: string;
  footerAction?: ReactNode;
}

export default function AdminMetricCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  delta,
  status,
  statusLabel,
  isPending = false,
  pendingText = "Backend pending",
  tooltip,
  className = "",
  footerAction,
}: AdminMetricCardProps) {
  const hasValue = value !== undefined && value !== null;

  return (
    <div
      title={tooltip}
      className={`rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#607096] truncate">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
            {hasValue && !isPending ? (
              <>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#14244B]">
                  {value}
                </span>
                {unit && (
                  <span className="text-xs font-semibold text-[#607096]">
                    {unit}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-semibold italic text-[#8A98B8]">
                {pendingText}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195]">
            <Icon className="size-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[#F1F5F9] text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {status && (
            <AdminStatusBadge status={status} label={statusLabel} size="sm" />
          )}
          {delta && !isPending && (
            <span
              className={`font-semibold ${
                delta.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {delta.isPositive ? "+" : ""}
              {delta.value}
            </span>
          )}
          {subtitle && (
            <span className="truncate text-[#607096] font-medium">
              {subtitle}
            </span>
          )}
        </div>

        {footerAction}
      </div>
    </div>
  );
}
