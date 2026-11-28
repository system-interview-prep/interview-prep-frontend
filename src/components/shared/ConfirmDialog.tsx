"use client";

import { useId, type ReactNode } from "react";
import { useDialogA11y } from "./useDialogA11y";
import { cn } from "@/utils";

/**
 * In-app replacement for window.confirm(): a small modal with a title, body,
 * a cancel and a confirm button. Escape / backdrop cancel; focus is trapped.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** "danger" paints the confirm button red (delete, leave without saving). */
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const panelRef = useDialogA11y<HTMLDivElement>(open, busy ? undefined : onCancel);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#14244B]/40 backdrop-blur-[2px]" onClick={busy ? undefined : onCancel} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="anim-pop relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_30px_80px_-30px_rgba(20,36,75,0.5)] ring-1 ring-[#DCE4F3] outline-none"
      >
        <h2 id={titleId} className="text-lg font-semibold text-[#14244B]">
          {title}
        </h2>
        {body ? <div className="mt-2 text-sm leading-6 text-[#607096]">{body}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            data-autofocus
            className="h-11 rounded-full px-5 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] transition-colors hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "h-11 rounded-full px-5 text-sm font-semibold text-white transition-colors disabled:opacity-60",
              tone === "danger" ? "bg-[#C43B3B] hover:bg-[#A93232]" : "bg-[#204195] hover:bg-[#183275]",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
