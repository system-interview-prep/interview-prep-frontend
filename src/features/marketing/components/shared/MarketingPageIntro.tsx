"use client";

import type { ReactNode } from "react";

/** Page intro card for marketing pages: the page h1, a short lead and actions. */
export default function MarketingPageIntro({
  title,
  body,
  children,
  aside,
}: {
  title: ReactNode;
  body?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#DCE4F3] bg-[#F0F4FC] px-5 py-7 sm:px-8 sm:py-9">
      <div className={`relative grid items-center gap-6 ${aside ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]" : ""}`}>
        <div className="min-w-0">
          <h1 className="max-w-3xl text-[clamp(1.6rem,2.6vw,2.35rem)] font-semibold leading-[1.12] text-[#14244B]">{title}</h1>
          {body ? <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#607096]">{body}</p> : null}
          {children ? <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>

        {aside ? <div className="relative">{aside}</div> : null}
      </div>
    </section>
  );
}
