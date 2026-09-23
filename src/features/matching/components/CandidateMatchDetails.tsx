"use client";

import React, { useMemo, useState } from "react";
import type { HumanizedRequirement, RequirementGroup } from "../types/match-details.types";
import { EvidenceInspector } from "./EvidenceInspector";
import { RequirementGroupCard } from "./RequirementGroupCard";
import { RequirementItemCard } from "./RequirementItemCard";

export interface CandidateMatchDetailsProps {
  requirements: HumanizedRequirement[];
  groups?: RequirementGroup[];
  emptyMessage?: string;
}

type StatusFilter = "all" | "met" | "unknown" | "not_met";

export function CandidateMatchDetails({
  requirements,
  groups = [],
  emptyMessage = "Chưa có kết quả đối chiếu cho vị trí này.",
}: CandidateMatchDetailsProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(() =>
    requirements[0]?.id ?? groups[0]?.items[0]?.id ?? null
  );

  const summaryCounts = useMemo(
    () =>
      requirements.reduce(
        (counts, requirement) => {
          if (requirement.status === "met") counts.met += 1;
          else if (requirement.status === "not_met") counts.notMet += 1;
          else if (requirement.status === "unknown") counts.unknown += 1;
          else counts.notApplicable += 1;
          return counts;
        },
        { met: 0, unknown: 0, notMet: 0, notApplicable: 0 }
      ),
    [requirements]
  );

  const groupedRequirementIds = useMemo(
    () => new Set(groups.flatMap((group) => group.items.map((item) => item.id))),
    [groups]
  );

  const standaloneRequirements = useMemo(
    () => requirements.filter((item) => !groupedRequirementIds.has(item.id)),
    [groupedRequirementIds, requirements]
  );

  const allRequirements = useMemo(() => {
    const byId = new Map<string, HumanizedRequirement>();
    requirements.forEach((item) => byId.set(item.id, item));
    groups.flatMap((group) => group.items).forEach((item) => byId.set(item.id, item));
    return [...byId.values()];
  }, [groups, requirements]);

  const selectedRequirement =
    allRequirements.find((item) => item.id === selectedRequirementId) ?? null;
  const matchesFilter = (item: HumanizedRequirement) =>
    activeFilter === "all" || item.status === activeFilter;

  const buildSection = (priority: HumanizedRequirement["priority"]) => ({
    standalone: standaloneRequirements.filter(
      (item) => item.priority === priority && matchesFilter(item)
    ),
    groups: groups
      .filter((group) => group.priority === priority)
      .map((group) => ({ ...group, items: group.items.filter(matchesFilter) }))
      .filter((group) => group.items.length > 0),
  });

  const mustHave = buildSection("must_have");
  const preferred = buildSection("preferred");
  const other = buildSection("unknown");
  const hasVisibleCriteria = [mustHave, preferred, other].some(
    (section) => section.standalone.length > 0 || section.groups.length > 0
  );

  const sectionSummary = (priority: HumanizedRequirement["priority"]) => {
    const items = requirements.filter(
      (item) => item.priority === priority && item.status !== "not_applicable"
    );
    return { met: items.filter((item) => item.status === "met").length, total: items.length };
  };

  const mustHaveSummary = sectionSummary("must_have");
  const preferredSummary = sectionSummary("preferred");
  const statusFilters: Array<{ id: StatusFilter; label: string; count: number }> = [
    {
      id: "all",
      label: "Tất cả",
      count: summaryCounts.met + summaryCounts.unknown + summaryCounts.notMet,
    },
    { id: "met", label: "Phù hợp", count: summaryCounts.met },
    { id: "unknown", label: "Cần xác minh", count: summaryCounts.unknown },
    { id: "not_met", label: "Chưa đáp ứng", count: summaryCounts.notMet },
  ];

  const renderSection = (
    label: string,
    subtext: string,
    section: { standalone: HumanizedRequirement[]; groups: RequirementGroup[] },
    summary?: { met: number; total: number }
  ) => {
    if (section.standalone.length === 0 && section.groups.length === 0) return null;

    return (
      <section className="space-y-2" aria-label={label}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{label}</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">{subtext}</p>
          </div>
          {summary && (
            <span className="shrink-0 pt-0.5 text-xs font-medium text-slate-500">
              {summary.met} / {summary.total} phù hợp
            </span>
          )}
        </div>
        <div className="space-y-2">
          {section.groups.map((group) => (
            <RequirementGroupCard
              key={group.groupId}
              group={group}
              selectedId={selectedRequirementId ?? undefined}
              onSelect={setSelectedRequirementId}
            />
          ))}
          {section.standalone.map((item) => (
            <RequirementItemCard
              key={item.id}
              item={item}
              selectedId={selectedRequirementId ?? undefined}
              onSelect={setSelectedRequirementId}
            />
          ))}
        </div>
      </section>
    );
  };

  if (requirements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Tiêu chí tuyển dụng</h2>
          <div className="flex flex-wrap items-center gap-1" aria-label="Lọc theo trạng thái">
            {statusFilters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
                      isActive ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] lg:divide-x lg:divide-slate-200">
        <div className="min-w-0 space-y-5 p-4 sm:p-5">
          {hasVisibleCriteria ? (
            <>
              {renderSection(
                "Yêu cầu bắt buộc",
                "Những điều kiện chính của vị trí",
                mustHave,
                mustHaveSummary
              )}
              {renderSection(
                "Tiêu chí ưu tiên",
                "Những tiêu chí giúp hồ sơ phù hợp hơn",
                preferred,
                preferredSummary
              )}
              {renderSection("Tiêu chuẩn khác", "Các điều kiện bổ sung của vị trí", other)}
            </>
          ) : (
            <div className="flex items-center justify-center py-16 text-xs text-slate-400">
              Không có tiêu chí nào phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>

        <aside className="hidden min-w-0 lg:block" aria-label="Bằng chứng đối chiếu">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto p-5">
            <EvidenceInspector requirement={selectedRequirement} />
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CandidateMatchDetails;
