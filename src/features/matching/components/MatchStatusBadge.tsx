"use client";

import React from "react";
import { Check, Minus, HelpCircle, X } from "lucide-react";
import type { RequirementStatus } from "../types/match-details.types";
import { formatStatusLabel } from "../utils/match-formatters";

interface MatchStatusBadgeProps {
  status: RequirementStatus;
  labelOverride?: string;
  size?: "sm" | "md";
}

export function MatchStatusBadge({ status, labelOverride, size = "md" }: MatchStatusBadgeProps) {
  const label = labelOverride || formatStatusLabel(status);

  const config = (() => {
    switch (status) {
      case "met":
        return {
          icon: Check,
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
          iconClasses: "text-emerald-600",
        };
      case "not_applicable":
        return {
          icon: Minus,
          classes: "bg-slate-100 text-slate-600 border-slate-200",
          iconClasses: "text-slate-500",
        };
      case "unknown":
        return {
          icon: HelpCircle,
          classes: "bg-slate-50 text-slate-700 border-slate-200",
          iconClasses: "text-slate-500",
        };
      case "not_met":
        return {
          icon: X,
          classes: "bg-rose-50 text-rose-700 border-rose-200/80",
          iconClasses: "text-rose-600",
        };
      default:
        return {
          icon: HelpCircle,
          classes: "bg-slate-50 text-slate-700 border-slate-200",
          iconClasses: "text-slate-500",
        };
    }
  })();

  const Icon = config.icon;
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[11px] gap-1" : "px-2.5 py-1 text-xs gap-1.5";
  const iconSize = size === "sm" ? "size-3" : "size-3.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${config.classes} ${sizeClasses}`}
    >
      <Icon className={`${iconSize} shrink-0 ${config.iconClasses}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export default MatchStatusBadge;
