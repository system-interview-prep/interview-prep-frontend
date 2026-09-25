"use client";

import { FileText } from "lucide-react";
import type { CvEvidenceItem, RequirementStatus } from "../types/match-details.types";

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
  const hasCvEvidence = cvEvidence && cvEvidence.length > 0;

  return (
    <div className="mt-3.5 border-t border-slate-200/70 pt-3.5 text-xs text-slate-700 space-y-3">
      {/* 1. Yêu cầu công việc */}
      <div className="rounded-lg border border-slate-200/60 bg-slate-50/50 p-3">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <FileText className="size-3.5 text-slate-500" aria-hidden="true" />
          <span>Yêu cầu công việc (JD)</span>
        </div>
        <div className="mt-1.5 whitespace-pre-wrap text-slate-600 leading-relaxed pl-5">
          {jdEvidenceText?.trim() ? (
            jdEvidenceText
          ) : (
            <span className="italic text-slate-400">Tiêu chí được tổng hợp từ mô tả công việc.</span>
          )}
        </div>
      </div>

      {/* 2. Bằng chứng trong CV */}
      <div className="rounded-lg border border-slate-200/60 bg-white p-3">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <FileText className="size-3.5 text-[#204195]" aria-hidden="true" />
          <span>Bằng chứng trong CV</span>
        </div>

        {hasCvEvidence ? (
          <div className="mt-2 space-y-2.5 pl-5">
            {cvEvidence.map((item, idx) => {
              return (
                <div
                  key={item.evidenceId || idx}
                  className="rounded-md border border-slate-100 bg-slate-50/40 p-2.5 space-y-1.5"
                >
                  {/* Real provenance tags if provided directly on evidence object */}
                  {(item.pageNumber != null || item.section) && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {item.pageNumber != null && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          Trang {item.pageNumber}
                        </span>
                      )}
                      {item.section && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          Mục: {item.section}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Evidence Text */}
                  <p className="italic text-slate-800 leading-relaxed">
                    &ldquo;{item.text || item.snippet}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-1.5 pl-5">
            {status === "unknown" ? (
              <p className="text-slate-500">
                Trong CV hiện chưa tìm thấy thông tin đủ rõ để xác nhận tiêu chí này.
              </p>
            ) : (
              <p className="text-slate-500">
                Chưa tìm thấy bằng chứng phù hợp trong CV.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3. Reason Text / Explanation if available */}
      {reasonText && (
        <div className="rounded-lg border border-slate-100 bg-slate-50/30 px-3 py-2 text-[11px] text-slate-600 flex items-start gap-1.5">
          <span className="font-semibold text-slate-700 shrink-0">Nhận định đối chiếu:</span>
          <span>{reasonText}</span>
        </div>
      )}
    </div>
  );
}

export default EvidenceDrawer;
