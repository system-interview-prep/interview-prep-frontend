"use client";

import { useId, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import { cn } from "@/utils";

/**
 * In-app modal for admin forms (create / edit). Never use the browser's own
 * dialogs (alert / confirm / prompt) — they show "localhost says" and cannot
 * be styled. Escape and the backdrop close it unless `busy`; focus is trapped.
 * With `onSubmit` the body is a <form>, so Enter submits.
 */
export default function AdminModal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  onSubmit,
  busy = false,
  size = "md",
  closeLabel = "Đóng",
}: {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Buttons, right-aligned at the bottom. */
  footer?: ReactNode;
  onClose: () => void;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  busy?: boolean;
  size?: "sm" | "md" | "lg";
  closeLabel?: string;
}) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useDialogA11y<HTMLDivElement>(open, busy ? undefined : onClose);
  if (!open) return null;

  const body = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
      {footer ? (
        <div className="flex flex-col-reverse gap-2 border-t border-[#EAEFF8] bg-[#F8FAFC] px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      ) : null}
    </>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#14244B]/40 backdrop-blur-[2px]" onClick={busy ? undefined : onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "anim-pop relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_30px_80px_-30px_rgba(20,36,75,0.5)] ring-1 ring-[#DCE4F3] outline-none sm:rounded-3xl",
          size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-xl",
        )}
      >
        <div className="flex items-start gap-3 border-b border-[#EAEFF8] px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold text-[#14244B] [overflow-wrap:anywhere]">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-xs leading-5 text-[#607096]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={closeLabel}
            className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-[#607096] transition-colors hover:bg-[#F0F4FC] hover:text-[#14244B] disabled:opacity-50"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            {body}
          </form>
        ) : (
          body
        )}
      </div>
    </div>
  );
}

/** Standard footer buttons for AdminModal. */
export function AdminModalButton({
  children,
  variant = "secondary",
  type = "button",
  onClick,
  disabled,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[#204195] text-white hover:bg-[#183275]",
        variant === "danger" && "bg-[#C43B3B] text-white hover:bg-[#A93232]",
        variant === "secondary" && "bg-white text-[#14244B] ring-1 ring-[#DCE4F3] hover:bg-[#F8FAFC]",
      )}
    >
      {children}
    </button>
  );
}
