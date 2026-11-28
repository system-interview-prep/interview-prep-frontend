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
  size = "md",
}: {
  /** "lg" for report pages where the title is the main heading of a long page. */
  size?: "md" | "lg";
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
          <h1
            className={cn(
              "break-words font-black tracking-tight text-[#14244B]",
              size === "lg" ? "text-2xl leading-tight sm:text-3xl lg:text-4xl" : "text-xl sm:text-2xl",
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cn(
                "max-w-3xl text-[#607096]",
                size === "lg" ? "mt-2 text-sm leading-6 sm:text-base" : "mt-1 text-xs leading-5 sm:text-sm",
              )}
            >
              {subtitle}
            </p>
          ) : null}
          {children ? (
            <div className={cn("flex flex-wrap items-center gap-2.5", size === "lg" ? "mt-5" : "mt-3")}>{children}</div>
          ) : null}
        </div>
      </div>
      {aside ? <div className="min-w-0 sm:max-w-sm sm:shrink-0">{aside}</div> : null}
    </header>
  );
}

export default WorkspacePageHeader;
