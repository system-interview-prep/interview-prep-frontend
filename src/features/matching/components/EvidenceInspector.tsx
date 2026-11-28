"use client";

import type { HumanizedRequirement } from "../types/match-details.types";
import { MatchStatusBadge } from "./MatchStatusBadge";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";

interface EvidenceInspectorProps {
  requirement: HumanizedRequirement | null;
  compact?: boolean;
}

const conceptStatusKey = {
  met: "fit.concept.met",
  unknown: "fit.status.unknown",
  not_met: "fit.status.notMet",
  not_applicable: "fit.status.notApplicable",
} as const;

export function EvidenceInspector({ requirement, compact = false }: EvidenceInspectorProps) {
  const { t } = useLanguage();
  if (!requirement) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl bg-[#F8FAFC] px-6 py-12 text-center">
        <p className="text-sm font-medium text-[#607096]">
          {t("fit.inspector.empty")}
        </p>
      </div>
    );
  }

  const hasCvEvidence = Boolean(requirement.cvEvidence?.length);
  const hasConceptResults = Boolean(requirement.conceptResults?.length);
  const pageNumbers = [
    ...new Set(
      requirement.cvEvidence
        ?.map((evidence) => evidence.pageNumber)
        .filter((page): page is number => page != null) ?? []
    ),
  ];
  const sections = [
    ...new Set(
      requirement.cvEvidence
        ?.map((evidence) => evidence.section)
        .filter((section): section is string => Boolean(section)) ?? []
    ),
  ];
  const hasMetadata = pageNumbers.length > 0 || sections.length > 0;

  return (
    <div className="space-y-5">
      {!compact && (
        <div className="border-b border-[#EAEFF8] pb-4">
          <p className="text-xs font-semibold text-[#607096]">
            {t("fit.pane.current")}
          </p>
          <h3 className="mt-1.5 text-xl font-semibold leading-snug text-[#14244B]">
            {requirement.label}
          </h3>
          {requirement.conditionText && (
            <p className="mt-1 text-sm leading-5 text-[#607096]">{requirement.conditionText}</p>
          )}
          <div className="mt-3">
            <MatchStatusBadge status={requirement.status} labelOverride={requirement.statusLabel} />
          </div>
          {requirement.conceptResults && requirement.conceptResults.length > 1 && requirement.groupOperator !== "atomic" && (
            <p className="mt-2 text-xs text-[#607096]">
              {requirement.groupOperator === "any_of"
                ? t("fit.inspector.anyOf")
                : t("fit.inspector.allOf")}
            </p>
          )}
        </div>
      )}

      {compact && <section>
        <h4 className="mb-2 text-xs font-semibold text-[#607096]">
          {t("fit.factors.status")}
        </h4>
        <MatchStatusBadge status={requirement.status} labelOverride={requirement.statusLabel} />
      </section>}

      <section>
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-[#14244B]">
            {t("fit.inspector.jd")}
          </h4>
        </div>
        <div className="rounded-2xl bg-[#F8FAFC] p-3 text-[13px] leading-5 text-[#607096]">
          {requirement.jdEvidenceText?.trim() ? (
            requirement.jdEvidenceText
          ) : (
            <span className="italic text-[#9AA6C2]">
              {t("fit.inspector.noJdQuote")}
            </span>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-[#14244B]">
            {t("fit.evidence.cv")}
          </h4>
        </div>
        {hasConceptResults ? (
          <div className="space-y-3">
            {requirement.conceptResults!.map((concept) => (
              <div key={concept.conceptId} className="rounded-2xl bg-white p-3 ring-1 ring-[#DCE4F3]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 break-words text-sm font-semibold text-[#14244B]">{concept.label}</p>
                  <MatchStatusBadge
                    status={concept.status}
                    labelOverride={
                      concept.status === "not_met" && concept.evidence.length === 0
                        ? t("fit.status.notFound")
                        : t(conceptStatusKey[concept.status])
                    }
                  />
                </div>
                {concept.evidence.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {concept.evidence.map((evidence, index) => (
                      <div key={evidence.evidenceId || index}>
                        {(evidence.pageNumber != null || evidence.section) && (
                          <p className="mb-1 text-[11px] text-[#607096]">
                            {evidence.pageNumber != null ? fmt(t("fit.evidence.page"), { page: evidence.pageNumber }) : ""}
                            {evidence.pageNumber != null && evidence.section ? " · " : ""}
                            {evidence.section ? fmt(t("fit.evidence.section"), { section: evidence.section }) : ""}
                          </p>
                        )}
                        <p className="text-[13px] italic leading-5 text-[#607096]">
                          &ldquo;{evidence.text || evidence.snippet}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-[#607096]">
                    {concept.status === "not_met"
                      ? fmt(t("fit.inspector.labelNotFound"), { label: concept.label })
                      : t("fit.reason.evidence_insufficient")}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : hasCvEvidence ? (
          <div className="space-y-2">
            {requirement.cvEvidence!.map((evidence, index) => (
              <div
                key={evidence.evidenceId || index}
                className="rounded-2xl bg-white p-3 text-[13px] ring-1 ring-[#DCE4F3]"
              >
                <p className="italic leading-5 text-[#14244B]">
                  &ldquo;{evidence.text || evidence.snippet}&rdquo;
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#F8FAFC] p-3 text-xs leading-relaxed text-[#607096]">
            {requirement.evidenceExplanation ||
              (requirement.reasonCode === "requirement_evaluator_unsupported"
                ? t("fit.inspector.unsupported")
                : requirement.status === "not_met"
                  ? fmt(t("fit.inspector.labelNotFound"), { label: requirement.label })
                  : t("fit.evidence.unclearCriterion"))}
          </div>
        )}
      </section>

      {hasMetadata && (
        <section>
          <h4 className="mb-2 text-sm font-semibold text-[#14244B]">{t("fit.inspector.source")}</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#607096]">
            {pageNumbers.length > 0 && <span>{fmt(t("fit.inspector.pages"), { pages: pageNumbers.join(", ") })}</span>}
            {sections.length > 0 && <span>{fmt(t("fit.inspector.sections"), { sections: sections.join(", ") })}</span>}
          </div>
        </section>
      )}

      {requirement.reasonText && (
        <section>
          <h4 className="mb-2 text-sm font-semibold text-[#14244B]">{t("fit.inspector.conclusion")}</h4>
          <p className="text-[13px] leading-5 text-[#607096]">{requirement.reasonText}</p>
        </section>
      )}
    </div>
  );
}

export default EvidenceInspector;
