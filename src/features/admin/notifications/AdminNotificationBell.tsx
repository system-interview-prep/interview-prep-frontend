"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AlertOctagon, AlertTriangle, Bell, BellRing, CheckCheck, Info } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useNow } from "@features/admin/pipeline/hooks/useNow";
import { fill } from "@features/admin/pipeline/utils/pipelineFormat";
import {
  linkOf,
  markAllRead,
  markRead,
  requestPermission,
  severityOf,
  useAdminNotifications,
} from "./useAdminNotifications";

const SEVERITY = {
  error: { Icon: AlertOctagon, color: "text-[#C43B3B]" },
  warning: { Icon: AlertTriangle, color: "text-[#8A5A00]" },
  info: { Icon: Info, color: "text-[#204195]" },
} as const;

/** "vừa xong", "5 phút trước", "2 giờ trước", "19/10". */
export function timeAgo(iso: string, now: number, t: (key: string) => string): string {
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return "";
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return t("adminNotify.justNow");
  if (minutes < 60) return fill(t("adminNotify.minutesAgo"), { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return fill(t("adminNotify.hoursAgo"), { n: hours });
  const date = new Date(at);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Bell with the unread count; opens the latest notifications. Clicking one
 * marks it read and opens the interview (or page) it is about.
 */
export default function AdminNotificationBell({ align = "right" }: { align?: "right" | "left" }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { items, unread, permission, loaded } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const now = useNow(60_000, open);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = unread ? fill(t("adminNotify.bellUnread"), { n: unread }) : t("adminNotify.bell");
  const RingIcon = unread ? BellRing : Bell;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={panelId}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-[#DCE4F3] bg-white text-[#14244B] shadow-[0_2px_8px_rgba(20,36,75,0.08)] transition-colors hover:bg-[#F5F8FF]"
      >
        <RingIcon className={`size-4 ${unread ? "text-[#204195]" : ""}`} aria-hidden="true" />
        {unread ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#C43B3B] px-1 text-[10px] font-bold leading-[18px] text-white tabular-nums">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("adminNotify.title")}
          className={`absolute top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-[0_20px_50px_-20px_rgba(20,36,75,0.35)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#EAEFF8] px-4 py-3">
            <p className="text-sm font-bold text-[#14244B]">{t("adminNotify.title")}</p>
            {unread ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#204195] hover:underline"
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                {t("adminNotify.markAll")}
              </button>
            ) : null}
          </div>

          <ul className="max-h-[min(26rem,60vh)] divide-y divide-[#EAEFF8] overflow-y-auto overscroll-contain">
            {!loaded ? (
              <li className="px-4 py-6 text-center text-sm text-[#607096]">{t("adminNotify.loading")}</li>
            ) : items.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-[#607096]">{t("adminNotify.empty")}</li>
            ) : (
              items.map((item) => {
                const { Icon, color } = SEVERITY[severityOf(item)];
                const link = linkOf(item);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!item.read) void markRead(item.id);
                        setOpen(false);
                        if (link) router.push(link);
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F8FAFC] ${
                        item.read ? "" : "bg-[#F5F8FF]"
                      }`}
                    >
                      <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm leading-snug text-[#14244B] ${item.read ? "font-medium" : "font-bold"}`}>
                          {item.title}
                        </span>
                        {item.message ? (
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[#475569]">{item.message}</span>
                        ) : null}
                        <span className="mt-0.5 block text-[11px] text-[#8A98B8]">{timeAgo(item.createdAt, now, t)}</span>
                      </span>
                      {!item.read ? (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#204195]" aria-label={t("adminNotify.unread")} />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="border-t border-[#EAEFF8] bg-[#FBFCFE] px-4 py-2.5 text-xs text-[#607096]">
            {permission === "default" ? (
              <button
                type="button"
                onClick={() => void requestPermission()}
                className="font-semibold text-[#204195] hover:underline"
              >
                {t("adminNotify.enableDesktop")}
              </button>
            ) : permission === "granted" ? (
              t("adminNotify.desktopOn")
            ) : permission === "denied" ? (
              t("adminNotify.desktopBlocked")
            ) : (
              t("adminNotify.desktopUnsupported")
            )}
            <Link
              href="/admin/ai"
              onClick={() => setOpen(false)}
              className="mt-1.5 block font-semibold text-[#204195] hover:underline"
            >
              {t("adminNotify.openHealth")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
