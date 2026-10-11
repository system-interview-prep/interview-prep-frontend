"use client";

import { useState, type FormEvent } from "react";
import type { HumanizedRequirement } from "../types/match-details.types";
import type {
  CandidateClarificationAnswer,
  ClarificationAnswerOutcome,
  ClarificationRequest,
} from "../services/clarification.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";

export interface ClarificationPanelProps {
  requests: ClarificationRequest[];
  requirements: HumanizedRequirement[];
  loading?: boolean;
  submitting?: boolean;
  error?: string | null;
  submissionError?: string | null;
  processedAnswers?: ClarificationAnswerOutcome[];
  onSubmit?: (answers: CandidateClarificationAnswer[]) => void;
  /** Shown as "Thử lại" when loading the questions failed. */
  onRetry?: () => void;
}

const STATUS_LABEL_KEYS: Record<ClarificationAnswerOutcome["status"], string> = {
  met: "fit.clar.outcome.met",
  not_met: "fit.clar.outcome.notMet",
  unknown: "fit.clar.outcome.unknown",
  not_applicable: "fit.status.notApplicable",
};

export function ClarificationPanel({
  requests,
  requirements,
  loading = false,
  submitting = false,
  error = null,
  submissionError = null,
  processedAnswers = [],
  onSubmit,
  onRetry,
}: ClarificationPanelProps) {
  const { t } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#FCB625]/40 bg-[#FFF8E6]/60 px-4 py-3 text-sm text-[#8A5A00]" role="status">
        {t("fit.clar.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col gap-2 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm text-[#607096] ring-1 ring-[#DCE4F3] sm:flex-row sm:items-center sm:justify-between"
        role="status"
      >
        <span>
          {error === "clarification_generation_unavailable"
            ? t("fit.clar.genUnavailable")
            : t("fit.clar.loadError")}
        </span>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 w-fit shrink-0 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] transition-colors hover:bg-[#F0F4FC]"
          >
            {t("fixApp.common.retry")}
          </button>
        ) : null}
      </div>
    );
  }

  if (requests.length === 0) return null;

  const byId = new Map(requirements.map((item) => [item.id, item]));
  const outcomeById = new Map(processedAnswers.map((item) => [item.requirementId, item]));
  const readyAnswers = requests.flatMap((request) => {
    const answerText = (answers[request.requirementId] ?? "").trim();
    return answerText ? [{ requirementId: request.requirementId, answerText }] : [];
  });

  const submitAnswers = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!submitting && readyAnswers.length > 0) onSubmit?.(readyAnswers);
  };

  return (
    <section
      className="space-y-4 rounded-3xl border border-[#FCB625]/40 bg-[#FFF8E6]/50 p-4 sm:p-5"
      aria-label={t("fit.clar.aria")}
    >
      <div>
        <h3 className="text-sm font-semibold text-[#8A5A00]">{t("fit.clar.title")}</h3>
        <p className="mt-1 text-xs leading-5 text-[#8A5A00]">
          {t("fit.clar.intro")}
        </p>
      </div>

      {submissionError && (
        <p className="rounded-2xl bg-[#FDF2F2] px-3 py-2 text-xs text-[#C43B3B]" role="alert">
          {submissionError}
        </p>
      )}

      <form className="space-y-3" onSubmit={submitAnswers}>
        {requests.map((request) => {
          const requirement = byId.get(request.requirementId);
          const outcome = outcomeById.get(request.requirementId);
          return (
            <div
              key={request.requirementId}
              className="rounded-2xl bg-white p-3 ring-1 ring-[#FCB625]/40"
            >
              <label
                htmlFor={`clarification-answer-${request.requirementId}`}
                className="block text-xs font-medium text-[#607096]"
              >
                {requirement?.label || request.requirementId}
              </label>
              <p className="mt-2 text-sm font-medium leading-6 text-[#14244B]">
                {request.questionText}
              </p>
              <textarea
                id={`clarification-answer-${request.requirementId}`}
                value={answers[request.requirementId] ?? ""}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [request.requirementId]: event.target.value,
                  }))
                }
                rows={3}
                maxLength={5000}
                placeholder={t("fit.clar.placeholder")}
                disabled={submitting}
                className="mt-2 w-full resize-y rounded-2xl border-0 bg-[#F8FAFC] px-3 py-2 text-sm text-[#14244B] outline-none ring-1 ring-[#DCE4F3] transition focus:bg-white focus:ring-2 focus:ring-[#204195] disabled:opacity-60"
              />
              {outcome && (
                <p className="mt-2 text-xs text-[#607096]" role="status">
                  {fmt(t("fit.clar.outcomeLine"), { status: t(STATUS_LABEL_KEYS[outcome.status]) })}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-[#607096]">
            {t("fit.clar.note")}
          </p>
          <button
            type="submit"
            disabled={submitting || readyAnswers.length === 0}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? t("fit.clar.submitting") : t("fit.clar.submit")}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ClarificationPanel;
