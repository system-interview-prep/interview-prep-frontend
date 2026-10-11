import {
  primarySpecialization,
  resolveClassificationEvidence,
  supportingClassifications,
  type ParsedCvData,
  type CvProcessingStatus,
} from "@features/resume/types";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";

/** Plain-words confidence for candidates instead of the raw model score. */
function confidenceKey(confidence: number): string {
  if (confidence >= 0.85) return "picker.career.conf.high";
  if (confidence >= 0.6) return "picker.career.conf.medium";
  return "picker.career.conf.low";
}

export default function CareerClassificationSummary({
  status,
  parsedData,
  compact = false,
}: {
  status?: CvProcessingStatus;
  parsedData?: ParsedCvData;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  if (status !== "DONE") return null;

  const classifications = parsedData?.careerClassifications ?? [];
  const primary = primarySpecialization(classifications);
  if (!primary) return null;

  const supporting = supportingClassifications(classifications);
  const evidence = resolveClassificationEvidence(primary, parsedData?.evidence ?? []);

  return (
    <div className={compact ? "mt-3" : "rounded-3xl bg-white p-5 border border-[#DCE4F3]"}>
      <div className="flex flex-wrap items-center gap-1.5" aria-label={t("picker.career.ariaLabel")}>
        <span className="inline-flex items-center rounded-full bg-[#F0F4FC] px-2.5 py-0.5 text-xs font-semibold text-[#204195]">
          {primary.label}
        </span>
        {supporting.map((item) => (
          <span key={item.code} className="rounded-full bg-[#F0F4FC] px-2.5 py-0.5 text-[11px] text-[#607096]">
            {item.label}
          </span>
        ))}
      </div>

      {!compact && (
        <p className="mt-3 text-xs leading-5 text-[#607096]">{t("picker.career.note")}</p>
      )}

      {evidence.length > 0 && (
        <details className="group mt-2 text-xs text-[#607096]">
          <summary className="w-fit cursor-pointer select-none font-medium text-[#607096] hover:text-[#204195]">{t("picker.career.why")}</summary>
          <ul className="mt-2 space-y-2 border-l-2 border-[#FCB625] pl-3">
            {evidence.map((item) => (
              <li key={item.evidenceId}>
                <span>{item.text}</span>
                {item.pageNumber ? <span className="ml-1 text-[10px] text-[#204195]">{fmt(t("picker.career.page"), { n: item.pageNumber })}</span> : null}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-[#607096]">
            {fmt(t("picker.career.confidence"), { level: t(confidenceKey(primary.confidence)) })}
          </p>
        </details>
      )}
    </div>
  );
}

