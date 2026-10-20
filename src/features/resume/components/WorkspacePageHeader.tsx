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
        "anim-rise flex flex-col gap-3 border-b border-[#DCE4F3] pb-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-black tracking-tight text-[#14244B] sm:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 max-w-3xl text-xs leading-5 text-[#607096] sm:text-sm">{subtitle}</p> : null}
          {children ? <div className="mt-3 flex flex-wrap items-center gap-2.5">{children}</div> : null}
        </div>
      </div>
      {aside ? <div className="min-w-0 sm:max-w-sm sm:shrink-0">{aside}</div> : null}
    </header>
  );
}

export default WorkspacePageHeader;
