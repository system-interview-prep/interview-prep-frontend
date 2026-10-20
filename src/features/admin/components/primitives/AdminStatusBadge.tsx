"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  Ban,
  CheckCircle2,
  CircleSlash,
  Clock,
  Eye,
  HelpCircle,
  Info,
  PencilLine,
  RotateCcw,
  XCircle,
} from "lucide-react";

/**
 * One color and one icon per kind of status, so two different states never
 * look alike (and the icon tells them apart without color):
 *
 *   healthy/success  green   done, approved, working well
 *   active           blue    running, in progress, live
 *   info             sky     neutral information
 *   pending/review   violet  waiting (for the server, for a reviewer)
 *   warning          amber   needs a look
 *   degraded/revision orange worse than normal, needs changes
 *   error            red     failed
 *   rejected         rose    refused by a person
 *   unavailable      zinc    cannot be used
 *   draft            slate   not finished yet
 *   archived         stone   no longer used
 *   unknown          gray    no information
 */
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
  | "info"
  | "draft"
  | "review"
  | "revision"
  | "rejected"
  | "archived";

export interface AdminStatusBadgeProps {
  status: AdminStatusType;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

type StatusStyle = {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
};

const GREEN = { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };

export const statusConfig: Record<AdminStatusType, StatusStyle> = {
  healthy: { label: "Ổn định", ...GREEN, icon: CheckCircle2 },
  success: { label: "Thành công", ...GREEN, icon: CheckCircle2 },
  active: { label: "Đang hoạt động", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Activity },
  info: { label: "Thông tin", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", icon: Info },
  pending: { label: "Đang chờ", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: Clock },
  review: { label: "Đang duyệt", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: Eye },
  warning: { label: "Cảnh báo", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", icon: AlertTriangle },
  degraded: { label: "Suy giảm", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: AlertTriangle },
  revision: { label: "Cần chỉnh sửa", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: RotateCcw },
  error: { label: "Lỗi", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
  rejected: { label: "Bị từ chối", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: Ban },
  unavailable: { label: "Không khả dụng", bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300", icon: CircleSlash },
  draft: { label: "Bản nháp", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300", icon: PencilLine },
  archived: { label: "Đã lưu trữ", bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-300", icon: Archive },
  unknown: { label: "Chưa rõ", bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", icon: HelpCircle },
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
