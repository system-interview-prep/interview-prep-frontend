"use client";

import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { questionCountOf, type InterviewType } from "@features/interview/services/interviewTypes.service";

/**
 * Choose the interview type (designed by interview experts, approved by an
 * admin). Hidden when there is nothing to choose: one type, or the demo package.
 */
export function InterviewTypePicker({
  items,
  selectedId,
  onSelect,
  durationMinutes,
}: {
  items: InterviewType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The chosen package; its question count is shown per type. */
  durationMinutes?: number;
}) {
  const { t } = useLanguage();
  if (items.length < 2) return null;
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-[#607096]">{t("picker.type.title")}</legend>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const active = item.id === selectedId;
          const count = durationMinutes ? questionCountOf(item, durationMinutes) : null;
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-3 transition-colors ${
                active ? "border-[#204195] bg-[#F5F8FF]" : "border-[#DCE4F3] bg-white hover:border-[#C5D2E7]"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="interview-type"
                    className="accent-[#204195]"
                    checked={active}
                    onChange={() => onSelect(item.id)}
                  />
                  <span className="text-sm font-bold text-[#14244B]">{item.name}</span>
                </span>
                {count !== null && (
                  <span className="shrink-0 text-xs font-semibold text-[#607096] tabular-nums">
                    {fmt(t("picker.type.questions"), { n: count })}
                  </span>
                )}
              </span>
              {item.description && <span className="text-xs leading-5 text-[#607096]">{item.description}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
