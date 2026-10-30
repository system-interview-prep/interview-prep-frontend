"use client";

import { Activity, Database, MessagesSquare, Mic, RefreshCw, Radio, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminSection from "./primitives/AdminSection";
import AdminEmptyState from "./primitives/AdminEmptyState";
import { usePolledResource } from "@features/admin/pipeline/hooks/usePolledResource";
import { Chip, TableShell, Th, type ChipTone } from "@features/admin/pipeline/components/ui";
import { clock, fill, tr } from "@features/admin/pipeline/utils/pipelineFormat";
import { adminOpsService, type HealthCheck, type HealthStatus } from "@features/admin/services/adminOps.service";

export const HEALTH_TONE: Record<HealthStatus, ChipTone> = { ok: "good", warn: "warn", down: "bad", off: "neutral" };
const ICONS: Record<string, LucideIcon> = {
  database: Database,
  rabbitmq: MessagesSquare,
  livekit: Radio,
  voiceAgent: Mic,
  langfuse: Activity,
};
const POLL_MS = 30_000;

type Translate = (key: string) => string;

function ago(iso: string | null | undefined, t: Translate): string {
  if (!iso) return "—";
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (Number.isNaN(minutes)) return "—";
  if (minutes < 1) return t("adminOps.health.justNow");
  if (minutes < 60) return fill(t("adminOps.health.minutesAgo"), { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 48) return fill(t("adminOps.health.hoursAgo"), { n: hours });
  return fill(t("adminOps.health.daysAgo"), { n: Math.round(hours / 24) });
}

/** One line of facts under a check, in plain words. */
export function healthFacts(check: HealthCheck, t: Translate): string[] {
  const d = check.data ?? {};
  switch (check.key) {
    case "database":
      return [
        d.latencyMs !== undefined ? fill(t("adminOps.health.fact.latency"), { ms: d.latencyMs }) : null,
        d.applied ? fill(t("adminOps.health.fact.migration"), { applied: d.applied, head: d.head ?? "?" }) : null,
      ].filter((x): x is string => Boolean(x));
    case "livekit":
      return d.rooms !== undefined ? [fill(t("adminOps.health.fact.rooms"), { rooms: d.rooms, active: d.activeRooms ?? 0 })] : [];
    case "voiceAgent":
      return [fill(t("adminOps.health.fact.lastVoice"), { when: ago(d.lastEventAt, t) })];
    case "langfuse":
      return Array.isArray(d.llmConnections)
        ? [
            d.llmConnections.length
              ? fill(t("adminOps.health.fact.llmConnections"), { providers: d.llmConnections.join(", ") })
              : t("adminOps.health.fact.noLlmConnection"),
          ]
        : [];
    default:
      return d.error ? [d.error] : [];
  }
}

/** Database, queues and workers, LiveKit, voice agent and Langfuse, refreshed every 30 s. */
export default function SystemHealthClient() {
  const { t } = useLanguage();
  const { state, refresh } = usePolledResource(() => adminOpsService.systemHealth(), () => POLL_MS, []);

  const header = (
    <AdminPageHeader
      title={t("adminOps.health.title")}
      description={t("adminOps.health.subtitle")}
      breadcrumbs={[
        { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
        { label: t("adminOps.health.title") },
      ]}
      statusBadge={
        state.status === "ready" ? (
          <Chip tone={HEALTH_TONE[state.data.overall]}>{t(`adminOps.health.overall.${state.data.overall}`)}</Chip>
        ) : undefined
      }
      primaryAction={
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs transition-colors hover:bg-[#F8FAFC]"
        >
          <RefreshCw
            className={`size-3.5 ${state.status === "ready" && state.refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden="true"
          />
          {t("aiPipeline.refresh")}
        </button>
      }
    />
  );

  if (state.status !== "ready") {
    return (
      <div className="space-y-6">
        {header}
        {state.status === "loading" ? (
          <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
            <span className="sr-only">{t("admin.common.loading")}</span>
          </div>
        ) : (
          <AdminEmptyState variant="error" title={t("adminOps.health.loadError")} description="" onRetry={() => void refresh()} />
        )}
      </div>
    );
  }

  const { checks, checkedAt } = state.data;
  const rabbit = checks.find((c) => c.key === "rabbitmq");

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {checks.map((check) => {
          const Icon = ICONS[check.key] ?? Activity;
          const facts = healthFacts(check, t);
          return (
            <div key={check.key} className="rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-[#EEF2FD] p-2 text-[#204195]">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold text-[#14244B]">{tr(t, `adminOps.health.check.${check.key}`, check.key)}</span>
                </div>
                <Chip tone={HEALTH_TONE[check.status]}>{t(`adminOps.health.status.${check.status}`)}</Chip>
              </div>
              {check.detail ? (
                <p className={`mt-3 text-xs leading-5 ${check.status === "down" ? "text-[#C43B3B]" : "text-[#8A5A00]"}`}>
                  {tr(t, `adminOps.health.detail.${check.detail}`, check.detail)}
                </p>
              ) : null}
              {facts.length ? (
                <ul className="mt-2 space-y-0.5 text-[11px] text-[#607096]">
                  {facts.map((fact) => (
                    <li key={fact} className="[overflow-wrap:anywhere]">
                      {fact}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-[10px] text-[#8A98B8]">{tr(t, `adminOps.health.what.${check.key}`, "")}</p>
            </div>
          );
        })}
      </div>

      {rabbit?.data.queues?.length ? (
        <AdminSection title={t("adminOps.health.queues")} description={t("adminOps.health.queuesNote")}>
          <TableShell minWidth={480}>
            <thead>
              <tr>
                <Th>{t("adminOps.health.col.queue")}</Th>
                <Th align="right">{t("adminOps.health.col.waiting")}</Th>
                <Th align="right">{t("adminOps.health.col.workers")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {rabbit.data.queues.map((queue) => (
                <tr key={queue.key}>
                  <td className="py-2 pr-4">
                    <span className="font-semibold text-[#14244B]">{tr(t, `adminOps.health.queue.${queue.key}`, queue.key)}</span>
                    <span className="block font-mono text-[11px] text-[#8A98B8]">{queue.name}</span>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{queue.messages ?? "—"}</td>
                  <td className={`py-2 text-right tabular-nums ${queue.consumers === 0 ? "font-semibold text-[#C43B3B]" : ""}`}>
                    {queue.missing ? t("adminOps.health.queueMissing") : queue.consumers}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </AdminSection>
      ) : null}

      <p className="text-[11px] text-[#607096]">{fill(t("adminOps.health.checkedAt"), { time: clock(checkedAt) })}</p>
    </div>
  );
}
