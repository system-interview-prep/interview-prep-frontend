"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  generateMatchClarificationQuestions,
  prepareMatchClarifications,
  rescoreMatchClarifications,
  type ClarificationAnswerOutcome,
  type MatchClarificationAnalysis,
  type CandidateClarificationAnswer,
  type ClarificationRequest,
} from "../services/clarification.service";
import type { MatchResult } from "@/lib/aiService";
import type { HumanizedRequirement, RequirementGroup } from "../types/match-details.types";
import { ClarificationPanel } from "./ClarificationPanel";
import { CvEvidencePane } from "./CvEvidencePane";
import { EvidenceInspector } from "./EvidenceInspector";
import { RequirementGroupCard } from "./RequirementGroupCard";
import { RequirementItemCard } from "./RequirementItemCard";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** True at the `lg` breakpoint, so the CV pane (and its PDF) mounts once, not twice. */
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

export interface CandidateMatchDetailsProps {
  requirements: HumanizedRequirement[];
  groups?: RequirementGroup[];
  emptyMessage?: string;
  candidateId?: string;
  jobId?: string;
  onMatchUpdated?: (result: MatchResult) => void;
  /** CV text the parser read; enables the side-by-side CV pane. */
  cvRawText?: string | null;
  cvContentType?: string;
  cvFileName?: string;
}

type StatusFilter = "all" | "met" | "unknown" | "not_met";

export function CandidateMatchDetails({
  requirements,
  groups = [],
  emptyMessage,
  candidateId = "",
  jobId = "",
  onMatchUpdated,
  cvRawText,
  cvContentType,
  cvFileName,
}: CandidateMatchDetailsProps) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(() =>
    requirements[0]?.id ?? groups[0]?.items[0]?.id ?? null
  );
  const [clarificationRequests, setClarificationRequests] = useState<ClarificationRequest[]>([]);
  const [clarificationAnalysis, setClarificationAnalysis] = useState<MatchClarificationAnalysis | null>(null);
  const [clarificationLoading, setClarificationLoading] = useState(false);
  const [clarificationPhase, setClarificationPhase] = useState<"idle" | "generating" | "ready" | "unavailable" | "error">("idle");
  const [clarificationError, setClarificationError] = useState<string | null>(null);
  const [clarificationSubmitting, setClarificationSubmitting] = useState(false);
  const [clarificationSubmitError, setClarificationSubmitError] = useState<string | null>(null);
  const [processedAnswers, setProcessedAnswers] = useState<ClarificationAnswerOutcome[]>([]);
  /** Bumped by "Thử lại" to load the clarification questions again. */
  const [clarificationReload, setClarificationReload] = useState(0);
  const isDesktop = useIsDesktop();

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

  const unknownRequirementKey = useMemo(
    () =>
      requirements
        .filter((item) => item.status === "unknown")
        .map((item) => item.id)
        .sort()
        .join("|"),
    [requirements]
  );

  useEffect(() => {
    if (!unknownRequirementKey || !candidateId || !jobId) {
      setClarificationRequests([]);
      setClarificationAnalysis(null);
      setClarificationError(null);
      setClarificationLoading(false);
      setClarificationPhase("idle");
      return;
    }

    let cancelled = false;
    const loadClarifications = async () => {
      // Jev runs first. Do not show a question-generation spinner while the
      // system is still deciding whether asking the candidate is appropriate.
      setClarificationLoading(false);
      setClarificationPhase("idle");
      setClarificationError(null);
      try {
        const preparation = await prepareMatchClarifications({ candidateId, jobId });
        if (cancelled) return;

        const clarificationCandidates = preparation.clarificationCandidates ?? [];
        if (preparation.clarificationStatus !== "ready" || clarificationCandidates.length === 0) {
          setClarificationRequests([]);
          setClarificationAnalysis(null);
          setClarificationPhase("idle");
          return;
        }

        // Jev has passed the ask-candidate gate (confidence >= 0.75).
        // Only now should the FE tell the user that a question is being made.
        setClarificationPhase("generating");
        setClarificationLoading(true);
        const analysis = await generateMatchClarificationQuestions({
          candidateId,
          jobId,
          requirementIds: clarificationCandidates.map((item) => item.requirementId),
          clarificationToken: preparation.clarificationToken,
        });
        const actualUnknownIds = new Set(
          analysis.matchResult.requirementResults
            .filter((item) => item.status === "unknown")
            .map((item) => item.requirementId)
        );
        if (!cancelled) {
          setClarificationAnalysis(analysis);
          setClarificationRequests(
            analysis.clarificationRequests.filter((request) => actualUnknownIds.has(request.requirementId))
          );
          setClarificationPhase(
            analysis.clarificationRequests.length > 0 ? "ready" : "unavailable"
          );
        }
      } catch {
        if (!cancelled) {
          setClarificationRequests([]);
          setClarificationAnalysis(null);
          setClarificationError("clarification_unavailable");
          setClarificationPhase("error");
        }
      } finally {
        if (!cancelled) setClarificationLoading(false);
      }
    };

    void loadClarifications();
    return () => {
      cancelled = true;
    };
  }, [candidateId, jobId, unknownRequirementKey, clarificationReload]);

  const submitClarificationAnswers = async (answers: CandidateClarificationAnswer[]) => {
    if (!clarificationAnalysis || !candidateId || !jobId || answers.length === 0) return;
    setClarificationSubmitting(true);
    setClarificationSubmitError(null);
    try {
      const result = await rescoreMatchClarifications({
        candidateId,
        jobId,
        initialAnalysis: clarificationAnalysis,
        answers,
      });
      setProcessedAnswers(result.processedAnswers);
      onMatchUpdated?.(result.finalMatchResult);
    } catch {
      setClarificationSubmitError("fit.details.rescoreError");
    } finally {
      setClarificationSubmitting(false);
    }
  };

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
  const showCvPane = Boolean((cvRawText && cvRawText.trim()) || candidateId);
  const cvPane = showCvPane ? (
    <CvEvidencePane
      requirements={allRequirements}
      selectedRequirementId={selectedRequirementId}
      onSelectRequirement={setSelectedRequirementId}
      rawText={cvRawText}
      cvId={candidateId}
      contentType={cvContentType}
      fileName={cvFileName}
    />
  ) : null;
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
      label: t("fit.details.filterAll"),
      count: summaryCounts.met + summaryCounts.unknown + summaryCounts.notMet,
    },
    { id: "met", label: t("fit.status.met"), count: summaryCounts.met },
    { id: "unknown", label: t("fit.status.needsVerification"), count: summaryCounts.unknown },
    { id: "not_met", label: t("fit.status.notMet"), count: summaryCounts.notMet },
  ];

  const renderSection = (
    label: string,
    section: { standalone: HumanizedRequirement[]; groups: RequirementGroup[] },
    summary?: { met: number; total: number }
  ) => {
    if (section.standalone.length === 0 && section.groups.length === 0) return null;

    return (
      <section className="space-y-2" aria-label={label}>
        <div className="flex items-center justify-between gap-4 border-b border-[#EAEFF8] pb-3">
          <h2 className="text-base font-semibold text-[#14244B]">{label}</h2>
          {summary && (
            <span className="shrink-0 pt-0.5 text-xs font-medium text-[#607096]">
              {fmt(t("fit.details.sectionMatched"), { met: summary.met, total: summary.total })}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {section.groups.map((group) => (
            group.items.length === 1 ? (
              <RequirementItemCard
                key={group.groupId}
                item={group.items[0]}
                selectedId={selectedRequirementId ?? undefined}
                onSelect={setSelectedRequirementId}
              />
            ) : (
              <RequirementGroupCard
                key={group.groupId}
                group={group}
                selectedId={selectedRequirementId ?? undefined}
                onSelect={setSelectedRequirementId}
              />
            )
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
      <div className="rounded-3xl bg-[#F8FAFC] p-8 text-center text-sm text-[#607096] ring-1 ring-[#DCE4F3]">
        {emptyMessage ?? t("fit.details.empty")}
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-[#DCE4F3]">
      <div className="border-b border-[#EAEFF8] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="text-xl font-semibold text-[#14244B]">{t("fit.details.title")}</h2>
          <div className="flex flex-wrap items-center gap-1" aria-label={t("fit.details.filterAria")}>
            {statusFilters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#14244B] text-white"
                      : "text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`rounded-full px-1.5 text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-[#F0F4FC] text-[#607096]"
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

      <div
        className={`grid min-h-[640px] lg:divide-x lg:divide-[#EAEFF8] ${
          showCvPane
            ? "lg:grid-cols-[minmax(420px,0.95fr)_minmax(0,1.25fr)]"
            : "lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]"
        }`}
      >
        <div className="min-w-0 space-y-5 p-4 sm:p-5">
          {hasVisibleCriteria ? (
            <>
              {renderSection(
                t("fit.details.mustHave"),
                mustHave,
                mustHaveSummary
              )}
              {renderSection(
                t("fit.details.preferred"),
                preferred,
                preferredSummary
              )}
              {renderSection(t("fit.details.other"), other)}
            </>
          ) : (
            <div className="flex items-center justify-center py-16 text-xs text-[#9AA6C2]">
              {t("fit.details.noFilterMatch")}
            </div>
          )}

          {summaryCounts.unknown > 0 && clarificationPhase !== "idle" && (
            <ClarificationPanel
              requests={clarificationRequests}
              requirements={allRequirements}
              loading={clarificationLoading}
              error={
                clarificationError ||
                (clarificationPhase === "unavailable" ? "clarification_generation_unavailable" : null)
              }
              submitting={clarificationSubmitting}
              submissionError={clarificationSubmitError ? t(clarificationSubmitError) : null}
              processedAnswers={processedAnswers}
              onSubmit={(answers) => void submitClarificationAnswers(answers)}
              onRetry={
                clarificationError === "clarification_unavailable"
                  ? () => setClarificationReload((n) => n + 1)
                  : undefined
              }
            />
          )}
        </div>

        <aside className="hidden min-w-0 lg:block" aria-label={t("fit.details.evidenceAria")}>
          {cvPane ? (
            isDesktop ? <div className="min-h-[720px]">{cvPane}</div> : null
          ) : (
            <div className="p-5">
              <EvidenceInspector requirement={selectedRequirement} />
            </div>
          )}
        </aside>

        {/* Narrow screens: the CV pane stacks under the criteria. */}
        {cvPane && !isDesktop && (
          <div className="min-h-[680px] border-t border-[#EAEFF8] lg:hidden" aria-label={t("fit.details.cvAria")}>
            {cvPane}
          </div>
        )}
      </div>
    </section>
  );
}

export default CandidateMatchDetails;
