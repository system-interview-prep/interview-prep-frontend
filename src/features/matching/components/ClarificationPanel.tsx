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
  answers?: Record<string, string>;
  onAnswerChange?: (requirementId: string, answerText: string) => void;
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
  answers: controlledAnswers,
  onAnswerChange,
  onSubmit,
  onRetry,
}: ClarificationPanelProps) {
  const { t } = useLanguage();
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const answers = controlledAnswers ?? localAnswers;

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] px-4 py-3 text-sm text-[#607096]" role="status">
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
  // A question that already came back with an outcome has been answered. Leaving
  // it in here kept the box editable and the button live, so the same answer
  // could be sent again and again with no sign it had landed the first time.
  const readyAnswers = requests.flatMap((request) => {
    if (outcomeById.has(request.requirementId)) return [];
    const answerText = (answers[request.requirementId] ?? "").trim();
    return answerText ? [{ requirementId: request.requirementId, answerText }] : [];
  });
  const hasUnanswered = requests.some((request) => !outcomeById.has(request.requirementId));

  const submitAnswers = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!submitting && readyAnswers.length > 0) onSubmit?.(readyAnswers);
  };

  return (
    <section
      className="space-y-4 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4"
      aria-label={t("fit.clar.aria")}
    >
      <div>
        <h3 className="text-sm font-semibold text-[#14244B]">{t("fit.clar.title")}</h3>
        <p className="mt-1 text-[11px] text-[#8A99B8]">{t("fit.clar.selfReported")}</p>
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
              className="rounded-xl border border-[#DCE4F3] bg-white p-3"
            >
              <label
                htmlFor={`clarification-answer-${request.requirementId}`}
                className="block text-xs font-semibold text-[#607096]"
              >
                {requirement?.label || request.requirementId}
              </label>
              <p className="mt-2 text-sm font-medium leading-6 text-[#14244B]">
                {request.questionText}
              </p>
              {outcome ? (
                <div className="mt-2 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A99B8]">
                    {t("fit.clar.answered")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#14244B]">
                    {answers[request.requirementId] ?? ""}
                  </p>
                </div>
              ) : (
                <textarea
                  id={`clarification-answer-${request.requirementId}`}
                  value={answers[request.requirementId] ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (onAnswerChange) onAnswerChange(request.requirementId, value);
                    else setLocalAnswers((current) => ({ ...current, [request.requirementId]: value }));
                  }}
                  rows={3}
                  maxLength={5000}
                  placeholder={t("fit.clar.placeholder")}
                  disabled={submitting}
                  className="mt-2 w-full resize-y rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 text-sm text-[#14244B] outline-none transition focus:border-[#204195] focus:ring-2 focus:ring-[#204195]/10 disabled:opacity-60"
                />
              )}
              {outcome && (
                <div className="mt-2 space-y-1" role="status">
                  <p className="text-xs text-[#607096]">
                    {fmt(t("fit.clar.outcomeLine"), {
                      status: t(STATUS_LABEL_KEYS[outcome.status]),
                    })}
                  </p>
                  {/* An `unknown` outcome used to look exactly like having been
                      ignored. Saying which fact was missing is the difference
                      between "we could not use this" and silence. */}
                  {outcome.status === "unknown" && outcome.explanation ? (
                    <p className="rounded-lg bg-[#FFF8E8] px-3 py-2 text-xs text-[#79520A]">
                      {outcome.explanation}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}

        <div className={`justify-end ${hasUnanswered ? "flex" : "hidden"}`}>
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
