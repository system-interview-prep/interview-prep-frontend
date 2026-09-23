"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";
import type { RequirementGroup } from "../types/match-details.types";
import { MatchStatusBadge } from "./MatchStatusBadge";
import { RequirementItemCard } from "./RequirementItemCard";

interface RequirementGroupCardProps {
  group: RequirementGroup;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function RequirementGroupCard({ group, selectedId, onSelect }: RequirementGroupCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/40 p-3.5">
      {/* Group Header */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
              <Layers className="size-3 text-slate-500" aria-hidden="true" />
              <span>{group.operator === "any_of" ? "Tiêu chí thay thế" : "Tiêu chí kết hợp"}</span>
            </span>

            <h4 className="font-semibold text-sm text-slate-900 leading-snug">
              {group.title}
            </h4>
          </div>

          <div className="mt-1 text-xs text-slate-500 font-normal">
            {group.subtext}
          </div>
        </div>

        {/* Group Parent Status & Toggle Children */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {/* Only render group-level badge when backend has provided a result */}
          {group.status != null ? (
            <MatchStatusBadge status={group.status} labelOverride={group.statusLabel ?? undefined} />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
              —
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            <span>{group.items.length} tiêu chí</span>
            {isOpen ? (
              <ChevronUp className="size-3.5 text-slate-500" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-3.5 text-slate-500" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Children list */}
      {isOpen && (
        <div className="space-y-2 pl-2 border-l-2 border-slate-200">
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
