"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils";

/**
 * Page header for workspace pages: the page h1, a subtitle, optional actions and an optional right-hand aside.
 * Uses the original Intervia palette (brand blue on white / cool gray).
 */
export function WorkspacePageHeader({
  title,
  subtitle,
  children,
  aside,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Primary page actions. */
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "anim-rise flex flex-col gap-5 border-b border-[#EAEFF8] pb-6 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-extrabold tracking-tight text-[#14244B] sm:text-3xl md:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607096]">{subtitle}</p> : null}
          {children ? <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>
      </div>
      {aside ? <div className="min-w-0 lg:max-w-sm lg:shrink-0">{aside}</div> : null}
    </header>
  );
}

export default WorkspacePageHeader;
