"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Clock } from "lucide-react";

export type AdminStatusType =
  | "healthy"
  | "active"
  | "success"
  | "degraded"
  | "warning"
  | "error"
  | "unavailable"
  | "pending"
  | "unknown"
  | "info";

export interface AdminStatusBadgeProps {
  status: AdminStatusType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const statusConfig: Record<
  AdminStatusType,
  { label: string; bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }
> = {
  healthy: {
    label: "Healthy",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  active: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  success: {
    label: "Success",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  degraded: {
    label: "Degraded",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: AlertTriangle,
  },
  warning: {
    label: "Warning",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: AlertTriangle,
  },
  error: {
    label: "Error",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: XCircle,
  },
  unavailable: {
    label: "Unavailable",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: XCircle,
  },
  pending: {
    label: "Backend Pending",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Clock,
  },
  unknown: {
    label: "Unknown",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: HelpCircle,
  },
  info: {
    label: "Info",
    bg: "bg-[#EEF2FD]",
    text: "text-[#204195]",
    border: "border-[#DCE4F3]",
    icon: HelpCircle,
  },
};

export default function AdminStatusBadge({
  status,
  label,
  size = "sm",
  className = "",
}: AdminStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.unknown;
  const displayLabel = label || config.label;
  const Icon = config.icon;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1.5"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <Icon className={size === "sm" ? "size-3 shrink-0" : "size-3.5 shrink-0"} />
      <span className="truncate">{displayLabel}</span>
    </span>
  );
}
