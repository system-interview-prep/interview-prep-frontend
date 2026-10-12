"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/utils";

export type ProcessStepState = "done" | "current" | "todo";

export type ProcessStep = {
  key: string;
  label: string;
  state: ProcessStepState;
  /** Where the user goes to do (or redo) this step. */
  href?: string;
};

/**
 * Where the user is in the journey: done steps are ticked, the current one is
 * highlighted, and `hint` says in plain words what to do next.
 */
export function ProcessSteps({
  steps,
  hint,
  className,
  label,
}: {
  steps: ProcessStep[];
  hint?: ReactNode;
  className?: string;
  /** Accessible name of the list, e.g. "Tiến trình chuẩn bị". */
  label: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2.5 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#204195]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#204195]" />
          {label}
        </span>
        <span className="text-xs text-[#607096]">Lộ trình 4 bước chuẩn bị bài bản</span>
      </div>

      <ol aria-label={label} className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
        {steps.map((step, index) => {
          const isDone = step.state === "done";
          const isCurrent = step.state === "current";
          const isTodo = step.state === "todo";

          const pillContent = (
            <div
              className={cn(
                "group flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all",
                isDone && "bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-200/70 hover:bg-emerald-50",
                isCurrent && "bg-amber-50/90 text-[#14244B] ring-2 ring-amber-400 shadow-2xs",
                isTodo && "bg-slate-50/80 text-slate-500 ring-1 ring-slate-200/60",
                step.href && !isTodo && "cursor-pointer hover:shadow-2xs",
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-bold transition-all",
                  isDone && "bg-emerald-600 text-white shadow-2xs",
                  isCurrent && "bg-amber-500 text-white shadow-2xs animate-pulse",
                  isTodo && "bg-slate-200/70 text-slate-500",
                )}
              >
                {isDone ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-xs font-semibold leading-tight",
                    isDone && "text-[#14244B] group-hover:text-[#204195]",
                    isCurrent && "font-bold text-[#14244B]",
                    isTodo && "text-slate-500",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "block text-[10.5px] leading-tight",
                    isDone && "font-medium text-emerald-700",
                    isCurrent && "font-semibold text-amber-800",
                    isTodo && "text-slate-400",
                  )}
                >
                  {isDone ? "Đã xong" : isCurrent ? "Đang làm" : "Chưa làm"}
                </span>
              </div>
            </div>
          );

          return (
            <li key={step.key} aria-current={isCurrent ? "step" : undefined}>
              {step.href && !isTodo ? (
                <Link href={step.href} className="block outline-offset-2">
                  {pillContent}
                </Link>
              ) : (
                pillContent
              )}
            </li>
          );
        })}
      </ol>

      {hint ? (
        <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs leading-relaxed text-[#14244B]" role="status">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

/** The candidate journey, in order. Every page shows these same four steps. */
export const JOURNEY_STEPS = [
  { key: "cv", href: "/dashboard/cvs" },
  { key: "job", href: "/dashboard/jobs" },
  { key: "interview", href: "/interview/select" },
  { key: "report", href: "/dashboard/history" },
] as const;

/** Index of the current journey step; `JOURNEY_STEPS.length` means all done. */
export type JourneyIndex = 0 | 1 | 2 | 3 | 4;

/** `ProcessSteps` for the shared journey: earlier steps are done, `current` is highlighted. */
export function JourneySteps({
  current,
  hint,
  className,
}: {
  current: JourneyIndex;
  hint?: ReactNode;
  className?: string;
}) {
  const { t } = useLanguage();
  const steps: ProcessStep[] = JOURNEY_STEPS.map((step, index) => ({
    key: step.key,
    label: t(`journey.${step.key}`),
    href: step.href,
    state: index < current ? "done" : index === current ? "current" : "todo",
  }));
  return <ProcessSteps label={t("journey.label")} steps={steps} hint={hint} className={className} />;
}

export type ProcessStatusState = "running" | "done" | "error";

/**
 * Says what the system is doing right now, phase by phase, instead of a bare
 * spinner. Phases before `activeIndex` are ticked; the active one pulses.
 */
export function ProcessStatus({
  phases,
  activeIndex,
  state = "running",
  message,
  className,
}: {
  phases: string[];
  activeIndex: number;
  state?: ProcessStatusState;
  /** Shown under the list: the result, or what went wrong and what to do. */
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-[#DCE4F3] bg-white p-4", className)} role="status" aria-live="polite">
      <ul className="space-y-2">
        {phases.map((phase, index) => {
          const done = state === "done" || index < activeIndex;
          const active = state !== "done" && index === activeIndex;
          const failed = state === "error" && active;
          return (
            <li key={phase} className="flex items-center gap-2.5 text-sm">
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                  done && "bg-[#287A4B] text-white",
                  active && !failed && "bg-[#FCB625]/25",
                  failed && "bg-[#C43B3B] text-white",
                  !done && !active && "bg-[#F0F4FC]",
                )}
              >
                {done ? (
                  <Check className="size-3" strokeWidth={3.5} />
                ) : failed ? (
                  <span className="text-[11px] font-bold leading-none">!</span>
                ) : active ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#E5A21D] motion-reduce:animate-none" />
                ) : null}
              </span>
              <span
                className={cn(
                  done && "text-[#607096]",
                  active && !failed && "font-semibold text-[#14244B]",
                  failed && "font-semibold text-[#C43B3B]",
                  !done && !active && "text-[#9AA6C2]",
                )}
              >
                {phase}
                {active && !failed ? "…" : ""}
              </span>
            </li>
          );
        })}
      </ul>
      {message ? (
        <p className={cn("mt-3 border-t border-[#EAEFF8] pt-3 text-sm", state === "error" ? "text-[#C43B3B]" : "text-[#14244B]")}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default ProcessSteps;
