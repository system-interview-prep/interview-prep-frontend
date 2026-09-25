"use client";

import { FileText, MousePointerClick } from "lucide-react";
import type { HumanizedRequirement } from "../types/match-details.types";
import { MatchStatusBadge } from "./MatchStatusBadge";

interface EvidenceInspectorProps {
  requirement: HumanizedRequirement | null;
  compact?: boolean;
}

const conceptStatusLabel = {
  met: "Có bằng chứng",
  unknown: "Chưa đủ bằng chứng",
  not_met: "Chưa đáp ứng",
  not_applicable: "Không áp dụng",
} as const;

export function EvidenceInspector({ requirement, compact = false }: EvidenceInspectorProps) {
  if (!requirement) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
        <MousePointerClick className="size-7 text-slate-300" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-500">
          Chọn một tiêu chí để xem bằng chứng đối chiếu.
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
        <div className="border-b border-slate-100 pb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Tiêu chí đang xem
          </p>
          <h3 className="mt-1.5 text-lg font-semibold leading-snug tracking-tight text-slate-900 xl:text-xl">
            {requirement.label}
          </h3>
          {requirement.conditionText && (
            <p className="mt-1 text-sm leading-5 text-slate-500">{requirement.conditionText}</p>
          )}
          <div className="mt-3">
            <MatchStatusBadge status={requirement.status} labelOverride={requirement.statusLabel} />
          </div>
          {requirement.conceptResults && requirement.conceptResults.length > 1 && requirement.groupOperator !== "atomic" && (
            <p className="mt-2 text-xs text-slate-500">
              {requirement.groupOperator === "any_of"
                ? "Chỉ cần đáp ứng một trong các nội dung"
                : "Cần đáp ứng tất cả nội dung"}
            </p>
          )}
        </div>
      )}

      {compact && <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Trạng thái
        </h4>
        <MatchStatusBadge status={requirement.status} labelOverride={requirement.statusLabel} />
      </section>}

      <section>
        <div className="mb-2 flex items-center gap-1.5">
          <FileText className="size-3.5 text-slate-400" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-800">
            Yêu cầu trong JD
          </h4>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] leading-5 text-slate-700">
          {requirement.jdEvidenceText?.trim() ? (
            requirement.jdEvidenceText
          ) : (
            <span className="italic text-slate-400">
              Chưa có trích dẫn cụ thể từ mô tả công việc.
            </span>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-1.5">
          <FileText className="size-3.5 text-[#204195]" aria-hidden="true" />
          <h4 className="text-sm font-semibold text-slate-800">
            Bằng chứng trong CV
          </h4>
        </div>
        {hasConceptResults ? (
          <div className="space-y-3">
            {requirement.conceptResults!.map((concept) => (
              <div key={concept.conceptId} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{concept.label}</p>
                  <MatchStatusBadge
                    status={concept.status}
                    labelOverride={conceptStatusLabel[concept.status]}
                  />
                </div>
                {concept.evidence.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {concept.evidence.map((evidence, index) => (
                      <div key={evidence.evidenceId || index}>
                        {(evidence.pageNumber != null || evidence.section) && (
                          <p className="mb-1 text-[11px] text-slate-500">
                            {evidence.pageNumber != null ? `Trang ${evidence.pageNumber}` : ""}
                            {evidence.pageNumber != null && evidence.section ? " · " : ""}
                            {evidence.section ? `Mục: ${evidence.section}` : ""}
                          </p>
                        )}
                        <p className="text-[13px] italic leading-5 text-slate-700">
                          &ldquo;{evidence.text || evidence.snippet}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {concept.status === "not_met"
                      ? "Không tìm thấy bằng chứng về nội dung này trong CV hiện tại."
                      : "Chưa tìm thấy bằng chứng đủ rõ để kết luận nội dung này."}
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
                className="rounded-lg border border-slate-200 bg-white p-3 text-[13px]"
              >
                <p className="italic leading-5 text-slate-800">
                  &ldquo;{evidence.text || evidence.snippet}&rdquo;
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-500">
            {requirement.evidenceExplanation || (requirement.status === "not_met"
              ? "Không tìm thấy bằng chứng về yêu cầu này trong CV hiện tại."
              : "Chưa tìm thấy bằng chứng đủ rõ để kết luận tiêu chí này.")}
          </div>
        )}
      </section>

      {hasMetadata && (
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-800">Nguồn</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {pageNumbers.length > 0 && <span>Trang: {pageNumbers.join(", ")}</span>}
            {sections.length > 0 && <span>Mục: {sections.join(", ")}</span>}
          </div>
        </section>
      )}

      {requirement.reasonText && (
        <section>
          <h4 className="mb-2 text-sm font-semibold text-slate-800">Kết luận</h4>
          <p className="text-[13px] leading-5 text-slate-600">{requirement.reasonText}</p>
        </section>
      )}
    </div>
  );
}

export default EvidenceInspector;
