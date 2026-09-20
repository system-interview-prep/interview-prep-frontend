"use client";

import React, { type ReactNode } from "react";
import { FolderSearch, AlertCircle, RefreshCw } from "lucide-react";

export interface AdminEmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "empty" | "pending" | "error";
  onRetry?: () => void;
  className?: string;
}

export default function AdminEmptyState({
  title,
  description,
  action,
  icon: CustomIcon,
  variant = "empty",
  onRetry,
  className = "",
}: AdminEmptyStateProps) {
  const Icon =
    CustomIcon ||
    (variant === "error"
      ? AlertCircle
      : variant === "pending"
      ? AlertCircle
      : FolderSearch);

  const iconBg =
    variant === "error"
      ? "bg-rose-50 text-rose-600 border-rose-200"
      : variant === "pending"
      ? "bg-amber-50 text-amber-600 border-amber-200"
      : "bg-[#EEF2FD] text-[#204195] border-[#DCE4F3]";

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCE4F3] bg-white p-8 sm:p-12 text-center ${className}`}
    >
      <div
        className={`flex size-14 items-center justify-center rounded-2xl border ${iconBg} mb-4`}
      >
        <Icon className="size-7 stroke-[1.75]" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-[#14244B]">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs sm:text-sm text-[#607096] leading-relaxed">
        {description}
      </p>

      {(action || onRetry) && (
        <div className="mt-6 flex items-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-4 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>Thử lại</span>
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
