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
    <div className={compact ? "mt-2" : "border border-[#E8E6DC] bg-white p-5"}>
      <div className="flex flex-wrap items-center gap-1.5" aria-label="Phân loại nghề nghiệp từ nội dung CV">
        {supporting.map((item) => (
          <span key={item.code} className="font-metadata text-[9px] text-[#87867F]">
            {item.label}<span className="ml-1 text-[#C9C6BA]">/</span>
          </span>
        ))}
        <span className="bg-[#EFF3EA] px-2 py-1 text-xs font-medium text-[#566844]">{primary.label}</span>
      </div>

      {!compact && (
        <p className="mt-3 text-xs leading-5 text-[#5E5D59]">Nhãn được suy luận từ bằng chứng trong CV và không phải quyết định tuyển dụng.</p>
      )}

      {evidence.length > 0 && (
        <details className="mt-2 text-xs text-[#5E5D59]">
          <summary className="cursor-pointer select-none font-medium text-[#87867F] hover:text-[#141413]">Vì sao có nhãn này?</summary>
          <ul className="mt-2 space-y-2 border-l border-[#E8E6DC] pl-3">
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

