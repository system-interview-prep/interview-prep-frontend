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

  // Compact tile: label + small icon on one line, the number, then one short meta line.
  return (
    <div
      title={tooltip}
      className={`min-w-0 rounded-xl border border-[#DCE4F3] bg-white px-4 py-3 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-semibold text-[#607096]" title={title}>
          {title}
        </p>
        {Icon && (
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#EEF2FD] text-[#204195]">
            <Icon className="size-3.5" />
          </span>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-baseline gap-1">
        {hasValue && !isPending ? (
          <>
            <span className="text-xl font-bold tabular-nums tracking-tight text-[#14244B] sm:text-2xl">{value}</span>
            {unit && <span className="text-xs font-medium text-[#607096]">{unit}</span>}
          </>
        ) : (
          <span className="text-sm font-medium text-[#8A98B8]">{pendingText}</span>
        )}
      </div>

      {status || (delta && !isPending) || subtitle || footerAction ? (
        <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2 text-[11px]">
          <div className="flex min-w-0 items-center gap-1.5">
            {status && <AdminStatusBadge status={status} label={statusLabel} size="sm" className="whitespace-nowrap" />}
            {delta && !isPending && (
              <span className={`font-semibold ${delta.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {delta.isPositive ? "+" : ""}
                {delta.value}
              </span>
            )}
            {subtitle && (
              <span className="truncate text-[#607096]" title={subtitle}>
                {subtitle}
              </span>
            )}
          </div>
          {footerAction}
        </div>
      ) : null}
    </div>
  );
}
