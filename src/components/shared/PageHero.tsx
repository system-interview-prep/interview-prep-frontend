"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils";

/**
 * Page intro: a card holding the page h1, a short body and the page's next
 * step as actions, an optional right-hand `aside`, and an optional `steps`
 * slot below. The fox lives in the corner assistant, not here.
 */
export function PageHero({
  title,
  body,
  children,
  aside,
  steps,
  className,
}: {
  title: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
  /** Optional right-hand column (stats, context). */
  aside?: ReactNode;
  /** Optional process indicator shown under the hero (e.g. <JourneySteps />). */
  steps?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "anim-rise relative overflow-hidden rounded-[28px] border border-[#DCE4F3] bg-gradient-to-br from-[#F0F4FC] via-[#F8FAFC] to-white p-5 sm:p-7 md:p-8",
        className,
      )}
    >
      <div className={cn("relative grid items-stretch gap-6", aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]" : "")}>
        <div className="relative flex flex-col justify-between min-w-0 rounded-3xl bg-white p-6 sm:p-7 shadow-[0_18px_40px_-24px_rgba(20,36,75,0.2)] ring-1 ring-[#DCE4F3]">
          <div>
            <h1 className="text-[clamp(1.5rem,2.4vw,2.2rem)] font-bold tracking-tight leading-[1.2] text-[#14244B]">{title}</h1>
            {body ? <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-[#607096]">{body}</p> : null}
          </div>
          {children ? <div className="mt-6 flex flex-wrap items-center gap-3.5">{children}</div> : null}
        </div>

        {aside ? <div className="relative">{aside}</div> : null}
      </div>

      {steps ? (
        <div className="relative mt-6 rounded-2xl border border-[#DCE4F3]/80 bg-white/85 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
          {steps}
        </div>
      ) : null}
    </section>
  );
}

export default PageHero;
