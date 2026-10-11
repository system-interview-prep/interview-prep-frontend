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
      <ol aria-label={label} className="flex items-start gap-1 overflow-x-auto pb-1 sm:gap-0">
        {steps.map((step, index) => {
          const body = (
            <>
              <span
                className={cn(
                  "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold transition-colors",
                  step.state === "done" && "bg-[#204195] text-white",
                  step.state === "current" && "bg-[#FCB625] text-[#14244B] ring-4 ring-[#FCB625]/25",
                  step.state === "todo" && "bg-white text-[#607096] ring-1 ring-[#DCE4F3]",
                )}
              >
                {step.state === "done" ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  "mt-2 block text-center text-[12px] leading-tight",
                  step.state === "todo" ? "font-medium text-[#607096]" : "font-semibold text-[#14244B]",
                )}
              >
                {step.label}
              </span>
            </>
          );
          return (
            <li
              key={step.key}
              aria-current={step.state === "current" ? "step" : undefined}
              className="relative flex min-w-[76px] flex-1 flex-col items-center"
            >
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2",
                    steps[index - 1].state === "done" ? "bg-[#204195]" : "bg-[#DCE4F3]",
                  )}
                />
              )}
              {step.href && step.state !== "todo" ? (
                <Link href={step.href} className="flex flex-col items-center rounded-xl px-1 outline-offset-2 hover:opacity-85">
                  {body}
                </Link>
              ) : (
                <span className="flex flex-col items-center px-1">{body}</span>
              )}
            </li>
          );
        })}
      </ol>
      {hint ? (
        <div className="mt-3 rounded-xl bg-[#FFF8E6] px-3.5 py-2 text-[13px] leading-relaxed text-[#14244B]" role="status">
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
