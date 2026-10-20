"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { entryWarningMessageKey, type EntryDecision } from "@features/interview/utils/entryGate";

type Props = {
  /** The decision for the selected CV and job; the dialog shows when it is set. */
  decision: EntryDecision | null;
  lowFitPercent: number;
  detailsHref?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Practice mode: a CV far from the job still enters, after the candidate has
 * seen the score and what the session will adjust.
 */
export function EntryWarningDialog({ decision, lowFitPercent, detailsHref, onConfirm, onCancel }: Props) {
  const { t } = useLanguage();
  const ref = useDialogA11y<HTMLDivElement>(Boolean(decision), onCancel);
  if (!decision) return null;
  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center bg-[#14244B]/40 p-4 backdrop-blur-[2px]">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-warning-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_80px_-30px_rgba(20,36,75,0.5)] outline-none sm:p-7"
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="entry-warning-title" className="text-base font-bold text-[#14244B]">
              {t("picker.entry.warn.title")}
            </h2>
            <p className="mt-1 text-sm text-[#607096]">{t("picker.entry.warn.lead")}</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[#14244B]">
          {decision.warnings.map((warning) => (
            <li key={warning} className="rounded-xl bg-[#F8FAFC] px-3.5 py-2.5 ring-1 ring-[#EAEFF8]">
              {fmt(t(entryWarningMessageKey(warning)), { score: decision.percentage ?? "", low: lowFitPercent })}
            </li>
          ))}
        </ul>
        {detailsHref && (
          <Link href={detailsHref} className="mt-3 inline-block text-xs font-bold text-[#204195] hover:underline">
            {t("picker.entry.warn.details")} →
          </Link>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#DCE4F3] bg-white px-4 py-2.5 text-sm font-semibold text-[#14244B] hover:bg-[#F8FAFC]"
          >
            {t("picker.entry.warn.cancel")}
          </button>
          <button
            type="button"
            data-autofocus
            onClick={onConfirm}
            className="rounded-xl bg-[#204195] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#183275]"
          >
            {t("picker.entry.warn.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
