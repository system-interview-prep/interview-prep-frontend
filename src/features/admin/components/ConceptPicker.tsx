"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Search, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import { cn } from "@/utils";
import type { TaxonomyConcept } from "@features/admin/services/taxonomy.service";

/** Options rendered at once; typing narrows the list further. */
const MAX_OPTIONS = 60;

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();

type BaseProps = {
  /** Concepts the admin may pick from (already filtered by kind / active). */
  concepts: TaxonomyConcept[];
  label: string;
  hint?: string;
  error?: string | null;
  /** Red border without an own message (the error is shown elsewhere, e.g. shared by two pickers). */
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

type SingleProps = BaseProps & { mode: "single"; value: string; onChange: (value: string) => void };
type MultiProps = BaseProps & { mode: "multi"; value: string[]; onChange: (value: string[]) => void };

/**
 * Searchable concept picker (combobox + listbox) for the active taxonomy.
 * `single` keeps one concept, `multi` keeps a list shown as removable chips.
 * Search matches label, concept id and aliases, ignoring Vietnamese diacritics.
 */
export default function ConceptPicker(props: SingleProps | MultiProps) {
  const { concepts, label, hint, error, invalid, disabled, placeholder } = props;
  const { t } = useLanguage();
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const selected = useMemo(() => (props.mode === "single" ? (props.value ? [props.value] : []) : props.value), [props.mode, props.value]);
  const byId = useMemo(() => new Map(concepts.map((concept) => [concept.concept_id, concept])), [concepts]);

  const matches = useMemo(() => {
    const needle = normalize(query.trim());
    const pool = props.mode === "multi" ? concepts.filter((concept) => !selected.includes(concept.concept_id)) : concepts;
    const filtered = needle
      ? pool.filter((concept) =>
          [concept.label, concept.concept_id, ...(concept.aliases ?? [])].some((text) => normalize(text).includes(needle)))
      : pool;
    return { items: filtered.slice(0, MAX_OPTIONS), total: filtered.length };
  }, [concepts, query, selected, props.mode]);

  const activeIndex = Math.min(active, Math.max(0, matches.items.length - 1));
  const kindLabel = (kind: string) => {
    const key = `fixAdmin.taxonomy.kind.${kind}`;
    const text = t(key);
    return text && text !== key ? text : kind;
  };

  const pick = (conceptId: string) => {
    if (props.mode === "single") {
      props.onChange(conceptId);
      setOpen(false);
    } else {
      props.onChange([...props.value, conceptId]);
    }
    setQuery("");
    setActive(0);
  };
  const remove = (conceptId: string) => {
    if (props.mode === "single") props.onChange("");
    else props.onChange(props.value.filter((id) => id !== conceptId));
    inputRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActive((index) => Math.min(index + 1, matches.items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      if (open && matches.items[activeIndex]) {
        event.preventDefault();
        pick(matches.items[activeIndex].concept_id);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
      }
    } else if (event.key === "Backspace" && query === "" && selected.length > 0) {
      remove(selected[selected.length - 1]);
    }
  };

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const optionId = (index: number) => `${baseId}-opt-${index}`;

  return (
    <div className="block min-w-0 text-xs font-semibold text-[#14244B]">
      <label htmlFor={inputId}>{label}</label>
      {hint && <span id={hintId} className="mt-0.5 block font-normal text-[#607096]">{hint}</span>}
      <div
        className={cn(
          "relative mt-1 min-w-0 rounded-xl border bg-white text-sm font-normal",
          error || invalid ? "border-[#C43B3B]" : "border-[#DCE4F3] focus-within:border-[#204195]",
          disabled && "cursor-not-allowed bg-[#F8FAFC] opacity-70",
        )}
      >
        {selected.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 px-2 pt-2" aria-label={fmt(t("fixAdmin.ops.qb.picker.selected"), { label })}>
            {selected.map((conceptId) => {
              const concept = byId.get(conceptId);
              const name = concept?.label ?? conceptId;
              return (
                <li key={conceptId} className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-lg border border-[#C9D6F2] bg-[#F5F8FF] py-0.5 pl-2 pr-0.5 text-xs text-[#14244B]">
                  <span className="min-w-0 truncate font-semibold" title={name}>{name}</span>
                  <span className="min-w-0 shrink-[3] truncate font-mono text-[10px] text-[#607096]" title={conceptId}>{conceptId}</span>
                  {!concept && <span className="shrink-0 text-[10px] font-semibold text-[#B42323]">{t("fixAdmin.ops.qb.picker.unknown")}</span>}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => remove(conceptId)}
                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[#607096] hover:bg-[#EAF0FD] hover:text-[#B42323] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]/40"
                    aria-label={fmt(t("fixAdmin.ops.qb.picker.remove"), { label: name })}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[#607096]" aria-hidden="true" />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={open && matches.items[activeIndex] ? optionId(activeIndex) : undefined}
            aria-describedby={describedBy}
            aria-invalid={error || invalid ? true : undefined}
            disabled={disabled}
            value={query}
            placeholder={placeholder ?? t("fixAdmin.ops.qb.picker.placeholder")}
            onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            className="w-full min-w-0 rounded-xl bg-transparent py-2 pl-8 pr-2 text-sm text-[#14244B] placeholder:text-[#8A97B5] focus:outline-none disabled:cursor-not-allowed"
          />
        </div>
        {open && !disabled && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-[#DCE4F3] bg-white shadow-lg">
            <ul id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto py-1">
              {matches.items.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[#607096]">{t("fixAdmin.ops.qb.picker.noMatch")}</li>
              ) : matches.items.map((concept, index) => {
                const isSelected = selected.includes(concept.concept_id);
                return (
                  <li
                    key={concept.concept_id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    // Keep focus in the input so blur does not close the list before the click lands.
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(concept.concept_id)}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex min-w-0 cursor-pointer items-start gap-2 px-3 py-2",
                      index === activeIndex ? "bg-[#EEF2FD]" : "bg-white",
                    )}
                  >
                    <Check className={cn("mt-0.5 size-3.5 shrink-0 text-[#204195]", isSelected ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm text-[#14244B]">{concept.label}</span>
                      <span className="block break-all font-mono text-[11px] text-[#607096]">{concept.concept_id}</span>
                    </span>
                    <span className="shrink-0 rounded-md bg-[#F1F4FA] px-1.5 py-0.5 text-[10px] font-semibold text-[#607096]">{kindLabel(concept.kind)}</span>
                  </li>
                );
              })}
            </ul>
            {matches.total > matches.items.length && (
              <p className="border-t border-[#EAEFF8] px-3 py-1.5 text-[11px] text-[#607096]">
                {fmt(t("fixAdmin.ops.qb.picker.truncated"), { shown: matches.items.length, total: matches.total })}
              </p>
            )}
          </div>
        )}
      </div>
      {error && <span id={errorId} role="alert" className="mt-1 block font-normal text-[#C43B3B]">{error}</span>}
    </div>
  );
}
