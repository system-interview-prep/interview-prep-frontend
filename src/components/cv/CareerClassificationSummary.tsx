import type { ParsedCvData } from "@/types/careerClassification";
import {
  primarySpecialization,
  resolveClassificationEvidence,
  supportingClassifications,
} from "@/types/careerClassification";
import type { CvProcessingStatus } from "@/types/cvProcessing";

export default function CareerClassificationSummary({
  status,
  parsedData,
  compact = false,
}: {
  status?: CvProcessingStatus;
  parsedData?: ParsedCvData;
  compact?: boolean;
}) {
  if (status !== "DONE") return null;

  const classifications = parsedData?.careerClassifications ?? [];
  const primary = primarySpecialization(classifications);
  if (!primary) return null;

  const supporting = supportingClassifications(classifications);
  const evidence = resolveClassificationEvidence(primary, parsedData?.evidence ?? []);

  return (
    <div className={compact ? "mt-3" : "border-2 border-[#234196] bg-white p-5"}>
      <div className="flex flex-wrap items-center gap-1.5" aria-label="Phân loại nghề nghiệp từ nội dung CV">
        <span className="inline-flex items-center gap-1 rounded-md bg-[#EFF6E9] px-2 py-1 text-[11px] font-bold text-[#476038]">
          <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">work</span>
          {primary.label}
        </span>
        {supporting.map((item) => (
          <span key={item.code} className="rounded-md bg-[#F0F4FC] px-2 py-1 font-metadata text-[9px] text-[#5A6B8F]">
            {item.label}
          </span>
        ))}
      </div>

      {!compact && (
        <p className="mt-3 text-xs leading-5 text-[#5E5D59]">Nhãn được suy luận từ bằng chứng trong CV và không phải quyết định tuyển dụng.</p>
      )}

      {evidence.length > 0 && (
        <details className="group mt-2 text-xs text-[#5A6B8F]">
          <summary className="w-fit cursor-pointer select-none font-medium text-[#5A6B8F] hover:text-[#234196]">Vì sao có nhãn này?</summary>
          <ul className="mt-2 space-y-2 border-l border-[#FCB625] pl-3">
            {evidence.map((item) => (
              <li key={item.evidenceId}>
                <span>{item.text}</span>
                {item.pageNumber ? <span className="ml-1 font-metadata text-[9px] text-[#87867F]">· Trang {item.pageNumber}</span> : null}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-metadata text-[9px] text-[#87867F]">Độ tin cậy mô hình: {primary.confidence.toFixed(2)} · {primary.taxonomyVersion}</p>
        </details>
      )}
    </div>
  );
}

