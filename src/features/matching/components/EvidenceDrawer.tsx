"use client";

import type { CvEvidenceItem, RequirementStatus } from "../types/match-details.types";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";

interface EvidenceDrawerProps {
  jdEvidenceText?: string;
  cvEvidence?: CvEvidenceItem[];
  reasonText?: string;
  status: RequirementStatus;
}

export function EvidenceDrawer({
  jdEvidenceText,
  cvEvidence,
  reasonText,
  status,
}: EvidenceDrawerProps) {
  const { t } = useLanguage();
  const hasCvEvidence = cvEvidence && cvEvidence.length > 0;

  return (
    <div className="mt-3.5 border-t border-[#DCE4F3] pt-3.5 text-xs text-[#607096] space-y-3">
      {/* 1. Yêu cầu công việc */}
      <div className="rounded-2xl bg-[#F8FAFC] p-3 ring-1 ring-[#DCE4F3]">
        <div className="flex items-center gap-1.5 font-semibold text-[#14244B]">
          <span>{t("fit.drawer.jd")}</span>
        </div>
        <div className="mt-1.5 whitespace-pre-wrap text-[#607096] leading-relaxed">
          {jdEvidenceText?.trim() ? (
            jdEvidenceText
          ) : (
            <span className="italic text-[#9AA6C2]">{t("fit.drawer.jdFallback")}</span>
          )}
        </div>
      </div>

      {/* 2. Bằng chứng trong CV */}
      <div className="rounded-2xl bg-white p-3 ring-1 ring-[#DCE4F3]">
        <div className="flex items-center gap-1.5 font-semibold text-[#14244B]">
          <span>{t("fit.evidence.cv")}</span>
        </div>

        {hasCvEvidence ? (
          <div className="mt-2 space-y-2.5">
            {cvEvidence.map((item, idx) => {
              return (
                <div
                  key={item.evidenceId || idx}
                  className="rounded-xl bg-[#F8FAFC] p-2.5 space-y-1.5"
                >
                  {/* Real provenance tags if provided directly on evidence object */}
                  {(item.pageNumber != null || item.section) && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#607096]">
                      {item.pageNumber != null && (
                        <span className="inline-flex items-center gap-1 font-medium text-[#607096] bg-[#F0F4FC] px-2 py-0.5 rounded-full">
                          {fmt(t("fit.evidence.page"), { page: item.pageNumber })}
                        </span>
                      )}
                      {item.section && (
                        <span className="inline-flex items-center gap-1 font-medium text-[#607096] bg-[#F0F4FC] px-2 py-0.5 rounded-full">
                          {fmt(t("fit.evidence.section"), { section: item.section })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Evidence Text */}
                  <p className="italic text-[#14244B] leading-relaxed">
                    &ldquo;{item.text || item.snippet}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-1.5">
            {status === "unknown" ? (
              <p className="text-[#607096]">
                {t("fit.evidence.unclearCriterion")}
              </p>
            ) : (
              <p className="text-[#607096]">
                {t("fit.drawer.notFound")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. Reason Text / Explanation if available */}
      {reasonText && (
        <div className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-[11px] text-[#607096] flex items-start gap-1.5">
          <span className="font-semibold text-[#607096] shrink-0">{t("fit.drawer.assessment")}</span>
          <span>{reasonText}</span>
        </div>
      )}
    </div>
  );
}

export default EvidenceDrawer;
