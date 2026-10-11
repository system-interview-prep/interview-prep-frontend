"use client";

import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HumanizedRequirement, RequirementStatus } from "../types/match-details.types";
import { buildCvSegments, collectEvidenceMarks } from "../utils/cv-highlight";
import { nextStepHint } from "../utils/evidence-hints";
import { MatchStatusBadge } from "./MatchStatusBadge";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt, localeOf } from "@/i18n/format";

const PdfEvidenceVisualizer = dynamic(
  () => import("@features/resume/components/PdfEvidenceVisualizer"),
  { ssr: false }
);

export interface CvEvidencePaneProps {
  requirements: HumanizedRequirement[];
  selectedRequirementId: string | null;
  onSelectRequirement: (id: string) => void;
  /** Normalized text the parser read; evidence offsets point into it. */
  rawText?: string | null;
  cvId?: string;
  contentType?: string;
  fileName?: string;
}

type PaneTab = "text" | "original";

const TINT: Record<RequirementStatus, string> = {
  met: "bg-[#287A4B]/15 decoration-[#287A4B]",
  unknown: "bg-[#FCB625]/20 decoration-[#E5A21D]",
  not_met: "bg-[#C43B3B]/15 decoration-[#C43B3B]",
  not_applicable: "bg-[#F0F4FC] decoration-[#9AA6C2]",
};

const ACTIVE: Record<RequirementStatus, string> = {
  met: "bg-[#287A4B]/30 ring-2 ring-[#287A4B]",
  unknown: "bg-[#FCB625]/45 ring-2 ring-[#E5A21D]",
  not_met: "bg-[#C43B3B]/30 ring-2 ring-[#C43B3B]",
  not_applicable: "bg-[#C9D7F1] ring-2 ring-[#607096]",
};

function evidenceOf(requirement: HumanizedRequirement | null) {
  if (!requirement) return [];
  const seen = new Map<string, { evidenceId: string; text: string }>();
  const add = (evidenceId?: string, text?: string) => {
    if (evidenceId && text && !seen.has(evidenceId)) seen.set(evidenceId, { evidenceId, text });
  };
  requirement.cvEvidence?.forEach((item) => add(item.evidenceId, item.text || item.snippet));
  requirement.conceptResults?.forEach((concept) =>
    concept.evidence.forEach((item) => add(item.evidenceId, item.text || item.snippet))
  );
  return [...seen.values()];
}

export function CvEvidencePane({
  requirements,
  selectedRequirementId,
  onSelectRequirement,
  rawText,
  cvId,
  contentType,
  fileName,
}: CvEvidencePaneProps) {
  const { t, lang } = useLanguage();
  const isPdf = (contentType || "").includes("pdf") || /\.pdf$/i.test(fileName || "");
  const hasText = Boolean(rawText && rawText.trim());
  const [tab, setTab] = useState<PaneTab>(hasText ? "text" : "original");
  // Which evidence span of the selected criterion is in focus; resets per criterion.
  const [cursorState, setCursorState] = useState<{ id: string | null; index: number }>({ id: null, index: 0 });
  const [located, setLocated] = useState<Set<string>>(new Set());
  const textRef = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => new Map(requirements.map((item) => [item.id, item])), [requirements]);
  const selected = selectedRequirementId ? byId.get(selectedRequirementId) ?? null : null;

  const { marks, unplaced } = useMemo(() => collectEvidenceMarks(requirements), [requirements]);
  const { segments, outOfRange } = useMemo(
    () => buildCvSegments(rawText || "", marks),
    [rawText, marks]
  );

  const selectedEvidence = useMemo(() => evidenceOf(selected), [selected]);
  const selectedIds = useMemo(() => new Set(selectedEvidence.map((item) => item.evidenceId)), [selectedEvidence]);
  const placedIds = useMemo(
    () => new Set(marks.filter((mark) => !outOfRange.includes(mark)).map((mark) => mark.evidenceId)),
    [marks, outOfRange]
  );
  const selectedPlaced = useMemo(
    () => selectedEvidence.filter((item) => placedIds.has(item.evidenceId)),
    [selectedEvidence, placedIds]
  );
  const foundAtMatchTime = marks.filter((mark) => mark.foundAtMatchTime).length;
  const coveredRequirements = new Set(marks.flatMap((mark) => mark.requirementIds)).size;
  const hint = selected ? nextStepHint(selected, t) : null;

  const cursor = cursorState.id === selectedRequirementId ? cursorState.index : 0;
  const setCursor = (next: (value: number) => number) =>
    setCursorState({ id: selectedRequirementId, index: next(cursor) });

  // Scroll the text view to the current evidence span of the selected requirement.
  useEffect(() => {
    if (tab !== "text" || selectedPlaced.length === 0) return;
    const target = selectedPlaced[Math.min(cursor, selectedPlaced.length - 1)];
    const node = textRef.current?.querySelector<HTMLElement>(`[data-evidence~="${CSS.escape(target.evidenceId)}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [tab, cursor, selectedPlaced]);

  const pdfSnippets = useMemo(
    () => selectedEvidence.map((item) => item.text.trim()).filter((text) => text.length >= 2),
    [selectedEvidence]
  );
  const handleLocated = useCallback((next: Set<string>) => setLocated(next), []);
  const notOnPdf = pdfSnippets.filter((text) => !located.has(text));

  const labelsFor = (ids: string[]) =>
    ids.map((id) => byId.get(id)?.label).filter(Boolean).join(" · ");

  const onMarkClick = (requirementIds: string[]) => {
    if (requirementIds.length === 0) return;
    const index = selectedRequirementId ? requirementIds.indexOf(selectedRequirementId) : -1;
    // Clicking a span cited by several criteria cycles through them.
    onSelectRequirement(requirementIds[(index + 1) % requirementIds.length]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* What the system did — real counts from this match */}
      <div className="border-b border-[#EAEFF8] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[#14244B]">
            {t("fit.pane.title")}
          </h3>
          <div className="flex rounded-full bg-[#F8FAFC] p-0.5 text-xs ring-1 ring-[#DCE4F3]" role="group" aria-label={t("fit.pane.viewAria")}>
            <button
              type="button"
              aria-pressed={tab === "text"}
              onClick={() => setTab("text")}
              disabled={!hasText}
              className={`rounded-full px-3 py-1 font-medium ${tab === "text" ? "bg-[#14244B] text-white" : "text-[#607096] hover:bg-[#F0F4FC] disabled:opacity-40"}`}
            >
              {t("fit.pane.tabText")}
            </button>
            <button
              type="button"
              aria-pressed={tab === "original"}
              onClick={() => setTab("original")}
              disabled={!isPdf || !cvId}
              title={!isPdf ? t("fit.pane.originalPdfOnly") : undefined}
              className={`rounded-full px-3 py-1 font-medium ${tab === "original" ? "bg-[#14244B] text-white" : "text-[#607096] hover:bg-[#F0F4FC] disabled:opacity-40"}`}
            >
              {t("fit.pane.tabOriginal")}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#607096]">
          {hasText
            ? fmt(t("fit.pane.charsRead"), { count: rawText!.length.toLocaleString(localeOf(lang)) })
            : ""}
          {fmt(t("fit.pane.spansUsed"), {
            marks: marks.length,
            covered: coveredRequirements,
            total: requirements.length,
          })}
          {foundAtMatchTime > 0 ? fmt(t("fit.pane.foundAtMatch"), { count: foundAtMatchTime }) : ""}.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#607096]" aria-label={t("fit.pane.legendAria")}>
          <span className="flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-[#287A4B]/35" />{t("fit.status.met")}</span>
          <span className="flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-[#FCB625]/50" />{t("fit.status.needsVerification")}</span>
          <span className="flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm bg-[#C43B3B]/35" />{t("fit.status.notMet")}</span>
          <span className="flex items-center gap-1"><i className="inline-block size-2.5 rounded-sm ring-2 ring-[#607096]" />{t("fit.pane.current")}</span>
        </div>
      </div>

      {/* Selected criterion */}
      {selected && (
        <div className="border-b border-[#EAEFF8] bg-[#F8FAFC] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#607096]">{t("fit.pane.current")}</p>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-[#14244B]">{selected.label}</p>
            </div>
            <MatchStatusBadge status={selected.status} labelOverride={selected.statusLabel} />
          </div>
          {selected.jdEvidenceText?.trim() && (
            <p className="mt-1.5 text-xs leading-5 text-[#607096]">
              <span className="font-semibold text-[#607096]">{t("fit.pane.jdSays")}</span>“{selected.jdEvidenceText.trim()}”
            </p>
          )}
          {selectedEvidence.length > 0 ? (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[#607096]">
              <span>
                {selectedPlaced.length > 0
                  ? fmt(t("fit.pane.evidenceCount"), {
                      index: Math.min(cursor, selectedPlaced.length - 1) + 1,
                      total: selectedPlaced.length,
                    })
                  : t("fit.pane.evidenceUnplaced")}
              </span>
              {selectedPlaced.length > 1 && tab === "text" && (
                <span className="flex gap-1">
                  <button
                    type="button"
                    aria-label={t("fit.pane.prev")}
                    onClick={() => setCursor((value) => (value - 1 + selectedPlaced.length) % selectedPlaced.length)}
                    className="rounded-full bg-white p-1.5 ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
                  >
                    <ChevronLeft className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={t("fit.pane.next")}
                    onClick={() => setCursor((value) => (value + 1) % selectedPlaced.length)}
                    className="rounded-full bg-white p-1.5 ring-1 ring-[#DCE4F3] hover:bg-[#F0F4FC]"
                  >
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-[#607096]">
              {t("fit.pane.noEvidence")}
            </p>
          )}
          {selected.reasonText && (
            <p className="mt-1.5 text-xs leading-5 text-[#607096]">
              <span className="font-semibold text-[#607096]">{t("fit.pane.why")}</span>
              {selected.reasonText}
            </p>
          )}
          {hint && (
            <p className="mt-1.5 text-xs leading-5 text-[#204195]">
              <span>{hint}</span>
            </p>
          )}
        </div>
      )}

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "text" ? (
          hasText ? (
            <div
              ref={textRef}
              className="whitespace-pre-wrap break-words px-4 py-4 font-mono text-[12.5px] leading-6 text-[#607096]"
            >
              {segments.map((segment) => {
                if (segment.evidenceIds.length === 0 || !segment.status) {
                  return <React.Fragment key={segment.start}>{segment.text}</React.Fragment>;
                }
                const isActive = segment.evidenceIds.some((id) => selectedIds.has(id));
                return (
                  <mark
                    key={segment.start}
                    data-evidence={segment.evidenceIds.join(" ")}
                    title={fmt(t("fit.pane.markTitle"), { labels: labelsFor(segment.requirementIds) })}
                    role="button"
                    tabIndex={0}
                    onClick={() => onMarkClick(segment.requirementIds)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onMarkClick(segment.requirementIds);
                      }
                    }}
                    className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-[#204195] rounded-sm px-0.5 text-[#14244B] underline decoration-2 underline-offset-2 transition-colors ${
                      isActive ? ACTIVE[segment.status] : TINT[segment.status]
                    }`}
                  >
                    {segment.text}
                  </mark>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-[#607096]">
              {t("fit.pane.noText")}
            </div>
          )
        ) : cvId && isPdf ? (
          <div className="p-3">
            {notOnPdf.length > 0 && (
              <p className="mb-2 rounded-2xl bg-[#FFF8E6] px-3 py-2 text-xs leading-5 text-[#8A5A00]">
                {fmt(t("fit.pane.notOnPdf"), { count: notOnPdf.length })}
              </p>
            )}
            <PdfEvidenceVisualizer
              candidateId={cvId}
              matchedSnippets={pdfSnippets}
              onLocatedChange={handleLocated}
              autoScrollToFirstHit
            />
          </div>
        ) : null}

        {tab === "text" && (unplaced.length > 0 || outOfRange.length > 0) && (
          <div className="border-t border-[#EAEFF8] px-4 py-3">
            <p className="text-xs font-semibold text-[#607096]">
              {fmt(t("fit.pane.unplacedTitle"), { count: unplaced.length + outOfRange.length })}
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {[...unplaced, ...outOfRange].map((item) => (
                <li key={item.evidenceId} className="text-xs leading-5 text-[#607096]">
                  <button
                    type="button"
                    onClick={() => onSelectRequirement(item.requirementIds[0])}
                    className="text-left hover:underline"
                  >
                    “{item.text}” <span className="text-[#9AA6C2]">· {labelsFor(item.requirementIds)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default CvEvidencePane;
