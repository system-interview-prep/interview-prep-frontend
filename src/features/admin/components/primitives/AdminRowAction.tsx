"use client";

import type { ButtonHTMLAttributes, ComponentType, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils";

export type AdminRowActionTone = "primary" | "danger" | "neutral";

const TONES: Record<AdminRowActionTone, string> = {
  primary: "border-[#C9D6F2] bg-[#F5F8FF] text-[#204195] hover:border-[#204195] hover:bg-[#EAF0FD]",
  danger: "border-[#F3C4C4] bg-[#FFF8F8] text-[#B42323] hover:border-[#C43B3B] hover:bg-[#FDECEC]",
  neutral: "border-[#DCE4F3] bg-white text-[#14244B] hover:border-[#204195] hover:text-[#204195]",
};

/**
 * Action button for a table row or card (Sửa, Xóa, Quản lý...): bordered,
 * colored by what it does, with an icon. `iconOnly` keeps the label for
 * screen readers and the tooltip only.
 */
export default function AdminRowAction({
  icon: Icon,
  label,
  tone = "primary",
  iconOnly = false,
  busy = false,
  busyLabel,
  className,
  disabled,
  ...rest
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  label: ReactNode;
  tone?: AdminRowActionTone;
  iconOnly?: boolean;
  busy?: boolean;
  busyLabel?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  const text = busy && busyLabel ? busyLabel : label;
  const title = typeof label === "string" ? label : undefined;
  return (
    <button
      type="button"
      title={rest.title ?? title}
      aria-label={rest["aria-label"] ?? (iconOnly ? title : undefined)}
      disabled={disabled || busy}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border text-xs font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]/40 disabled:cursor-not-allowed disabled:opacity-50",
        iconOnly ? "w-8" : "px-2.5",
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        <Icon className="size-3.5" aria-hidden="true" />
      )}
      {iconOnly ? <span className="sr-only">{text}</span> : <span>{text}</span>}
    </button>
  );
}

/** Row of actions, right-aligned in a table cell. */
export function AdminRowActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-end gap-1.5", className)}>{children}</div>;
}
