"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertOctagon, AlertTriangle, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { dismissAlert, useAdminAlerts } from "../hooks/useAdminAlerts";
import type { AdminAlert } from "../services/pipeline.service";
import { alertKey, alertText, clock, fill } from "../utils/pipelineFormat";

const COLLAPSED = 2;
/** Interviews named per alert; the rest are counted ("+N buổi khác"). */
const SESSIONS_SHOWN = 3;

/** How many interviews an alert is about (live_errors counts errors, not interviews). */
function affectedSessions(alert: AdminAlert): number {
  return alert.kind === "live_errors" ? alert.sessions.length : Math.max(alert.count, alert.sessions.length);
}

/**
 * Problems an admin should act on, shown on every admin page: failed or stuck
 * grading, errors during live interviews, voice outages, and fallback rates,
 * model errors or latencies above their thresholds. Each names the affected
 * interviews; dismissing hides an alert until it happens again.
 */
export default function AdminAlertsBanner() {
  const { t } = useLanguage();
  const { visible } = useAdminAlerts();
  const [expanded, setExpanded] = useState(false);
  if (!visible.length) return null;
  const shown = expanded ? visible : visible.slice(0, COLLAPSED);

  return (
    <section aria-label={t("aiPipeline.alerts.title")} className="mb-6 space-y-2">
      {shown.map((alert) => {
        const { title, detail } = alertText(alert, t);
        const isError = alert.severity === "error";
        const Icon = isError ? AlertOctagon : AlertTriangle;
        return (
          <div
            key={alertKey(alert)}
            role={isError ? "alert" : "status"}
            className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
              isError ? "border-[#F3C4C4] bg-[#FFF8F8]" : "border-[#F3DFB0] bg-[#FFFBF2]"
            }`}
          >
            <Icon className={`mt-0.5 size-4 shrink-0 ${isError ? "text-[#C43B3B]" : "text-[#8A5A00]"}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${isError ? "text-[#9F2F2F]" : "text-[#7A4F00]"}`}>
                {title}
                {alert.lastAt ? <span className="ml-2 text-xs font-medium tabular-nums text-[#607096]">{clock(alert.lastAt)}</span> : null}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[#475569]">{detail}</p>
              {alert.sessions.length ? (
                <ul className="mt-1 space-y-0.5 text-xs">
                  {alert.sessions.slice(0, SESSIONS_SHOWN).map((session) => (
                    <li key={session.id} className="min-w-0 truncate">
                      <Link
                        href={`/admin/interviews/${encodeURIComponent(session.id)}`}
                        className="font-semibold text-[#204195] hover:underline"
                        title={[session.candidate, session.jobTitle].filter(Boolean).join(" · ")}
                      >
                        {session.candidate || session.id.slice(0, 8)}
                      </Link>
                      {session.jobTitle ? <span className="text-[#607096]"> · {session.jobTitle}</span> : null}
                    </li>
                  ))}
                  {affectedSessions(alert) > SESSIONS_SHOWN ? (
                    <li>
                      <Link href="/admin/interviews" className="font-semibold text-[#204195] hover:underline">
                        {fill(t("aiPipeline.alerts.more"), { n: affectedSessions(alert) - SESSIONS_SHOWN })}
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <Link href="/admin/ai" className="mt-1 inline-block text-xs font-semibold text-[#204195] hover:underline">
                  {t("aiPipeline.alerts.openHealth")}
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissAlert(alert)}
              className="shrink-0 rounded-full p-1 text-[#607096] transition-colors hover:bg-white hover:text-[#14244B]"
              aria-label={`${t("aiPipeline.alerts.dismiss")}: ${title}`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
      {visible.length > COLLAPSED ? (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-[#204195] hover:underline"
        >
          {expanded ? t("aiPipeline.alerts.showLess") : fill(t("aiPipeline.alerts.showAll"), { n: visible.length })}
        </button>
      ) : null}
    </section>
  );
}

/** Count of active alerts for the sidebar (red when any is an error). */
export function AdminAlertsNavBadge() {
  const { t } = useLanguage();
  const { errorCount, warningCount } = useAdminAlerts();
  const total = errorCount + warningCount;
  if (!total) return null;
  return (
    <span
      className={`ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
        errorCount ? "bg-[#C43B3B] text-white" : "bg-[#FCE3A6] text-[#7A4F00]"
      }`}
      aria-label={fill(t("aiPipeline.alerts.navLabel"), { n: total })}
      title={fill(t("aiPipeline.alerts.navLabel"), { n: total })}
    >
      {total}
    </span>
  );
}
