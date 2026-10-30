"use client";

import Link from "next/link";
import { AlertOctagon, AlertTriangle, Info, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { dismissToast, markRead, useAdminNotifications } from "./useAdminNotifications";

const STYLE = {
  error: { Icon: AlertOctagon, frame: "border-[#F3C4C4]", icon: "text-[#C43B3B]" },
  warning: { Icon: AlertTriangle, frame: "border-[#F3DFB0]", icon: "text-[#8A5A00]" },
  info: { Icon: Info, frame: "border-[#DCE4F3]", icon: "text-[#204195]" },
} as const;

/** New notifications pop up in the corner for a few seconds (visible tab only). */
export default function AdminNotificationToasts() {
  const { t } = useLanguage();
  const { toasts } = useAdminNotifications();
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((toast) => {
        const style = STYLE[toast.severity as keyof typeof STYLE] ?? STYLE.info;
        return (
          <div
            key={toast.id}
            role={toast.severity === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-3.5 shadow-[0_20px_50px_-20px_rgba(20,36,75,0.45)] ${style.frame}`}
          >
            <style.Icon className={`mt-0.5 size-4 shrink-0 ${style.icon}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-snug text-[#14244B]">{toast.title}</p>
              {toast.message ? <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#475569]">{toast.message}</p> : null}
              {toast.link ? (
                <Link
                  href={toast.link}
                  onClick={() => {
                    void markRead(toast.id);
                    dismissToast(toast.id);
                  }}
                  className="mt-1 inline-block text-xs font-semibold text-[#204195] hover:underline"
                >
                  {t("adminNotify.open")}
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label={t("adminNotify.close")}
              className="shrink-0 rounded-full p-1 text-[#607096] transition-colors hover:bg-[#F1F5F9] hover:text-[#14244B]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
