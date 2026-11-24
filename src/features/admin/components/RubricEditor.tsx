"use client";

import { Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import type { RubricCriterionInput } from "@features/admin/services/questionBank.service";

const LEVELS = [0, 1, 2, 3] as const;

export function validateRubric(criteria: RubricCriterionInput[]): string | null {
  if (criteria.length === 0) return "fixAdmin.ops.qb.author.rubricRequired";
  if (criteria.some((criterion) => !criterion.name.trim() || !criterion.description.trim())) {
    return "fixAdmin.ops.qb.author.rubricCriterionRequired";
  }
  if (criteria.some((criterion) => criterion.weight <= 0)) return "fixAdmin.ops.qb.author.rubricWeightPositive";
  if (Math.abs(criteria.reduce((sum, criterion) => sum + criterion.weight, 0) - 1) > 0.0001) {
    return "fixAdmin.ops.qb.author.rubricWeightTotal";
  }
  if (criteria.some((criterion) => LEVELS.some((level) => !criterion.anchors.find((anchor) => anchor.level === level)?.description.trim()))) {
    return "fixAdmin.ops.qb.author.rubricAnchorsRequired";
  }
  const keys = criteria.map((criterion) => criterion.stableKey.trim());
  if (keys.some((key) => !key) || new Set(keys).size !== keys.length) {
    return "fixAdmin.ops.qb.author.rubricKeysInvalid";
  }
  return null;
}

function distributeWeights(count: number): number[] {
  const portion = Math.floor((100 / count) * 100) / 100;
  return Array.from({ length: count }, (_, index) =>
    index === count - 1 ? Number((100 - portion * (count - 1)).toFixed(2)) : portion,
  );
}

export default function RubricEditor({
  criteria,
  onChange,
  error,
  disabled = false,
  title,
  hint,
}: {
  criteria: RubricCriterionInput[];
  onChange: (criteria: RubricCriterionInput[]) => void;
  error?: string;
  disabled?: boolean;
  title?: string;
  hint?: string;
}) {
  const { t } = useLanguage();
  const totalPercent = criteria.reduce((sum, criterion) => sum + criterion.weight * 100, 0);
  const totalValid = Math.abs(totalPercent - 100) < 0.01;
  const inputClass = "mt-1 w-full rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#5474C8] focus:ring-2 focus:ring-[#5474C8]/15 disabled:bg-slate-50";

  function updateCriterion(index: number, patch: Partial<RubricCriterionInput>) {
    onChange(criteria.map((criterion, current) => current === index ? { ...criterion, ...patch } : criterion));
  }

  function addCriterion() {
    const count = criteria.length + 1;
    const weights = distributeWeights(count);
    const next = criteria.map((criterion, index) => ({ ...criterion, weight: weights[index] / 100 }));
    let stableKey = `criterion-${count}`;
    let suffix = 2;
    while (criteria.some((criterion) => criterion.stableKey === stableKey)) {
      stableKey = `criterion-${count}-${suffix++}`;
    }
    next.push({
      stableKey,
      name: "",
      description: "",
      weight: weights[count - 1] / 100,
      critical: false,
      anchors: LEVELS.map((level) => ({ level, description: "" })),
    });
    onChange(next);
  }

  function removeCriterion(index: number) {
    const remaining = criteria.filter((_, current) => current !== index);
    const weights = distributeWeights(remaining.length);
    onChange(remaining.map((criterion, current) => ({ ...criterion, weight: weights[current] / 100 })));
  }

  return (
    <section className="min-w-0 space-y-3 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 sm:p-5" aria-labelledby="question-rubric-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id="question-rubric-title" className="text-sm font-bold text-[#14244B]">{title ?? t("fixAdmin.ops.qb.author.rubric")}</h2>
          <p className="mt-1 text-xs leading-5 text-[#607096]">{hint ?? t("fixAdmin.ops.qb.author.rubricHint")}</p>
        </div>
        <div className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold tabular-nums ${totalValid ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`} aria-live="polite">
          {fmt(t("fixAdmin.ops.qb.author.rubricTotal"), { total: totalPercent.toFixed(2) })}
        </div>
      </div>

      <div className="space-y-3">
        {criteria.map((criterion, index) => (
          <article key={criterion.stableKey} className="min-w-0 space-y-3 rounded-xl border border-[#DCE4F3] bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#14244B]">{fmt(t("fixAdmin.ops.qb.author.rubricCriterion"), { n: index + 1 })}</h3>
              <button
                type="button"
                disabled={disabled || criteria.length <= 1}
                onClick={() => removeCriterion(index)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#8A3540] hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={fmt(t("fixAdmin.ops.qb.author.rubricRemove"), { n: index + 1 })}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />{fmt(t("fixAdmin.ops.qb.author.rubricRemove"), { n: index + 1 })}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <label className="block min-w-0 text-xs font-semibold text-[#14244B]">
                {t("fixAdmin.ops.qb.author.rubricName")}
                <input className={inputClass} value={criterion.name} onChange={(event) => updateCriterion(index, { name: event.target.value })} maxLength={160} disabled={disabled} />
              </label>
              <label className="block text-xs font-semibold text-[#14244B]">
                {t("fixAdmin.ops.qb.author.rubricWeight")}
                <div className="relative mt-1">
                  <input
                    className={`${inputClass} mt-0 pr-9 tabular-nums`}
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={(criterion.weight * 100).toFixed(2)}
                    onChange={(event) => updateCriterion(index, { weight: Number(event.target.value) / 100 })}
                    disabled={disabled}
                    aria-label={t("fixAdmin.ops.qb.author.rubricWeight")}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-[#607096]">%</span>
                </div>
              </label>
            </div>

            <label className="block text-xs font-semibold text-[#14244B]">
              {t("fixAdmin.ops.qb.author.rubricDescription")}
              <textarea className={inputClass} rows={2} value={criterion.description} onChange={(event) => updateCriterion(index, { description: event.target.value })} disabled={disabled} />
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#33446B]">
              <input type="checkbox" checked={Boolean(criterion.critical)} onChange={(event) => updateCriterion(index, { critical: event.target.checked })} disabled={disabled} className="size-4 rounded border-[#B8C5DD] accent-[#204195]" />
              {t("fixAdmin.ops.qb.author.rubricCritical")}
            </label>

            <fieldset className="min-w-0 space-y-2 border-t border-[#EAEFF8] pt-3">
              <legend className="px-1 text-xs font-semibold text-[#33446B]">{t("fixAdmin.ops.qb.author.rubricAnchors")}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {LEVELS.map((level) => {
                  const anchor = criterion.anchors.find((item) => item.level === level);
                  return (
                    <label key={level} className="block min-w-0 text-xs font-medium text-[#33446B]">
                      {t(`fixAdmin.ops.qb.author.rubricLevel${level}`)}
                      <textarea
                        className={inputClass}
                        rows={2}
                        value={anchor?.description ?? ""}
                        onChange={(event) => updateCriterion(index, {
                          anchors: LEVELS.map((current) => current === level
                            ? { level: current, description: event.target.value }
                            : criterion.anchors.find((item) => item.level === current) ?? { level: current, description: "" }),
                        })}
                        disabled={disabled}
                      />
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </article>
        ))}
      </div>

      <button type="button" onClick={addCriterion} disabled={disabled} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-dashed border-[#AFC0E2] bg-white px-3.5 py-2 text-xs font-semibold text-[#204195] hover:border-[#5474C8] hover:bg-[#F6F8FF] disabled:opacity-50">
        <Plus className="size-4" aria-hidden="true" />{t("fixAdmin.ops.qb.author.rubricAdd")}
      </button>
      {error && <p role="alert" className="rounded-xl border border-[#F3C4C4] bg-[#FFF8F8] p-3 text-xs text-[#B42323]">{error}</p>}
    </section>
  );
}
