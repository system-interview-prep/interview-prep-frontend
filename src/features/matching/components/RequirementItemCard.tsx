"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { HumanizedRequirement } from "../types/match-details.types";
import { MatchStatusBadge } from "./MatchStatusBadge";
import { EvidenceInspector } from "./EvidenceInspector";

interface RequirementItemCardProps {
  item: HumanizedRequirement;
  isNestedChild?: boolean;
  /** Desktop: id of currently selected requirement (drives right panel) */
  selectedId?: string;
  /** Desktop: callback to update right panel */
  onSelect?: (id: string) => void;
}

export function RequirementItemCard({
  item,
  isNestedChild = false,
  selectedId,
  onSelect,
}: RequirementItemCardProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const isSelected = selectedId === item.id;
  const handleClick = () => {
    onSelect?.(item.id);
    setMobileExpanded((prev) => !prev);
  };

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isSelected
          ? "border-[#204195] bg-[#F0F4FC]"
          : isNestedChild
          ? "border-slate-200/60 bg-white hover:border-slate-300 hover:bg-slate-50/50"
          : "border-slate-200 bg-white shadow-2xs hover:border-slate-300 hover:bg-slate-50/40"
      }`}
    >
      {/* Slim Row — target 56-68px */}
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={mobileExpanded}
      >
        {/* Status icon dot */}
        <span
          className={`mt-0.5 size-2 shrink-0 rounded-full ${
            item.status === "met"
              ? "bg-emerald-500"
              : item.status === "not_met"
              ? "bg-rose-500"
              : item.status === "not_applicable"
              ? "bg-slate-300"
              : "bg-amber-400"
          }`}
          aria-hidden="true"
        />

        {/* Label + condition */}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-snug text-slate-900">
            {item.label}
          </span>
          {item.conditionText && (
            <span className="block truncate text-xs text-slate-500 mt-0.5">
              {item.conditionText}
            </span>
          )}
        </div>

        {/* Status badge */}
        <div className="shrink-0">
          <MatchStatusBadge status={item.status} labelOverride={item.statusLabel} size="sm" />
        </div>

        {/* Chevron */}
        <ChevronRight
          className={`size-4 shrink-0 text-slate-400 transition-transform ${
            mobileExpanded ? "rotate-90 lg:rotate-0" : ""
          } ${isSelected ? "text-[#204195]" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Mobile inline evidence — only shown when no desktop panel handler */}
      {mobileExpanded && (
        <div className="px-4 pb-4 lg:hidden">
          <div className="border-t border-slate-200 pt-4">
            <EvidenceInspector requirement={item} compact />
          </div>
        </div>
      )}
    </div>
  );
}

export default RequirementItemCard;


