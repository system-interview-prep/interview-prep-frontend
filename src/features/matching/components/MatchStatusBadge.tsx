"use client";

import React from "react";
import { Check, Minus, HelpCircle, X } from "lucide-react";
import type { RequirementStatus } from "../types/match-details.types";
import { formatStatusLabel } from "../utils/match-formatters";
import { useLanguage } from "@/i18n/LanguageProvider";

interface MatchStatusBadgeProps {
  status: RequirementStatus;
  labelOverride?: string;
  size?: "sm" | "md";
}

export function MatchStatusBadge({ status, labelOverride, size = "md" }: MatchStatusBadgeProps) {
  const { t } = useLanguage();
  const label = labelOverride || formatStatusLabel(status, t);

  const config = (() => {
    switch (status) {
      case "met":
        return {
          icon: Check,
          classes: "bg-[#EAF5EE] text-[#287A4B] ring-1 ring-[#287A4B]/25",
          iconClasses: "text-[#287A4B]",
        };
      case "not_applicable":
        return {
          icon: Minus,
          classes: "bg-[#F0F4FC] text-[#607096] ring-1 ring-[#DCE4F3]",
          iconClasses: "text-[#607096]",
        };
      case "unknown":
        return {
          icon: HelpCircle,
          classes: "bg-[#F8FAFC] text-[#14244B] ring-1 ring-[#DCE4F3]",
          iconClasses: "text-[#607096]",
        };
      case "not_met":
        return {
          icon: X,
          classes: "bg-[#FDF2F2] text-[#C43B3B] ring-1 ring-[#F5C2C2]",
          iconClasses: "text-[#C43B3B]",
        };
      default:
        return {
          icon: HelpCircle,
          classes: "bg-[#F8FAFC] text-[#14244B] ring-1 ring-[#DCE4F3]",
          iconClasses: "text-[#607096]",
        };
    }
  })();

  const Icon = config.icon;
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-[11px] gap-1" : "px-2.5 py-1 text-xs gap-1.5";
  const iconSize = size === "sm" ? "size-3" : "size-3.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.classes} ${sizeClasses}`}
    >
      <Icon className={`${iconSize} shrink-0 ${config.iconClasses}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export default MatchStatusBadge;
