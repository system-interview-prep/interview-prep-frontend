"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { RequirementGroup } from "../types/match-details.types";
import { MatchStatusBadge } from "./MatchStatusBadge";
import { RequirementItemCard } from "./RequirementItemCard";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";

interface RequirementGroupCardProps {
  group: RequirementGroup;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function RequirementGroupCard({ group, selectedId, onSelect }: RequirementGroupCardProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-3 rounded-2xl bg-[#F8FAFC] p-3.5 ring-1 ring-[#DCE4F3]">
      {/* Group Header */}
      <div className="space-y-3">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full bg-[#F0F4FC] px-2 py-0.5 text-[11px] font-semibold text-[#607096]">
            {group.operator === "any_of" ? t("fit.group.alternative") : t("fit.group.combined")}
          </span>
          <h4 className="mt-2 text-[13px] font-semibold leading-5 text-[#14244B] [overflow-wrap:anywhere]">{group.title}</h4>
          <p className="mt-1 text-[11px] leading-4 text-[#8A99B8] [overflow-wrap:anywhere]">{group.subtext}</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E3E8F2] pt-3">
          {/* Only render group-level badge when backend has provided a result */}
          {group.status != null ? (
            <MatchStatusBadge status={group.status} labelOverride={group.statusLabel ?? undefined} />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#607096]">
              —
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className="inline-flex h-9 items-center gap-1 text-xs font-medium text-[#607096] hover:text-[#14244B] px-2 rounded-full hover:bg-[#F0F4FC] transition-colors"
          >
            <span>{fmt(t("fit.group.count"), { count: group.items.length })}</span>
            {isOpen ? (
              <ChevronUp className="size-3.5 text-[#607096]" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3.5 text-[#607096]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Children list */}
      {isOpen && (
        <div className="space-y-2 pl-2 border-l-2 border-[#DCE4F3]">
          {group.items.map((child) => (
            <RequirementItemCard
              key={child.id}
              item={child}
              isNestedChild={true}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RequirementGroupCard;
