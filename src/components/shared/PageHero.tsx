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
        "anim-rise relative overflow-hidden rounded-[28px] border border-[#DCE4F3] bg-gradient-to-br from-[#F0F4FC] to-white px-5 py-6 sm:px-8 sm:py-8",
        className,
      )}
    >
      <div className={cn("relative grid items-stretch gap-6", aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]" : "")}>
        <div className="relative min-w-0 rounded-3xl bg-white px-5 py-5 shadow-[0_18px_40px_-24px_rgba(20,36,75,0.35)] ring-1 ring-[#DCE4F3] sm:px-7 sm:py-6">
          <h1 className="text-[clamp(1.6rem,2.6vw,2.3rem)] font-semibold leading-[1.12] text-[#14244B]">{title}</h1>
          {body ? <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-[#607096]">{body}</p> : null}
          {children ? <div className="mt-5 flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>

        {aside ? <div className="relative">{aside}</div> : null}
      </div>

      {steps ? <div className="relative mt-7 border-t border-[#DCE4F3] pt-6">{steps}</div> : null}
    </section>
  );
}

export default PageHero;
