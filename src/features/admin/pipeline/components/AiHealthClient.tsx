"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Gauge, MessageSquareWarning, Mic, Repeat, Timer, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import AdminStatusBadge, { type AdminStatusType } from "@features/admin/components/primitives/AdminStatusBadge";
import { usePolledResource } from "../hooks/usePolledResource";
import { pipelineService, type AiHealth, type Rate } from "../services/pipeline.service";
import { compactNumber, eventLabel, fill, formatMs, percentText, purposeLabel, tr } from "../utils/pipelineFormat";
import { Muted, TableShell, Th, usePagedRows } from "./ui";

const WINDOWS = [1, 7, 30];
const BAR = "#204195";
const GRID = "#EAEFF8";
const MUTED = "#607096";

type DailyPoint = AiHealth["daily"][number] & { label: string };

function DailyTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const { t } = useLanguage();
  const point = active && payload?.length ? (payload[0].payload as DailyPoint) : null;
  if (!point) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs text-[#14244B] shadow-lg ring-1 ring-[#DCE4F3]">
      <p className="font-semibold">{point.label}</p>
      <p className="mt-0.5 tabular-nums">p95 {formatMs(point.turnP95Ms)}</p>
      <p className="mt-0.5 text-[#607096]">{fill(t("aiPipeline.health.dailyTurns"), { n: point.turns })}</p>
    </div>
  );
}

/** Turn latency p95 per day: one series, so no legend; the table below carries the same numbers. */
function DailyChart({ daily }: { daily: AiHealth["daily"] }) {
  const { t } = useLanguage();
  // Days without turns stay on the axis (no bar) so the spacing reads as time.
  const points: DailyPoint[] = daily.map((row) => ({ ...row, label: row.day ? row.day.slice(8, 10) + "/" + row.day.slice(5, 7) : "" }));
  if (!points.some((point) => point.turns > 0)) return <Muted>{t("aiPipeline.health.noData")}</Muted>;
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis
            tick={{ fontSize: 11, fill: MUTED }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(value: number) => formatMs(value)}
          />
          <Tooltip content={DailyTooltip} cursor={{ fill: "#F5F8FF" }} />
          <Bar dataKey="turnP95Ms" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function rateLevel(rate: Rate, warnAt: number, badAt: number): "error" | "warning" | "healthy" | undefined {
  if (rate.rate === null) return undefined;
  if (rate.rate >= badAt) return "error";
  if (rate.rate >= warnAt) return "warning";
  return "healthy";
}

/** One color per reason a session is stuck. */
const STUCK_TONE: Record<string, AdminStatusType> = {
  evaluation_failed: "error",
  evaluation_lease_expired: "degraded",
  plan_not_ready: "warning",
  interview_idle: "pending",
};

export default function AiHealthClient() {
  const { t } = useLanguage();
  const [days, setDays] = useState(7);
  // Refreshed every minute: the overview is watched, not just read once.
  const { state, refresh } = usePolledResource(() => pipelineService.health(days), () => 60_000, [days]);

  const header = (
    <AdminPageHeader
      title={t("aiPipeline.health.title")}
      description={t("aiPipeline.health.subtitle")}
      breadcrumbs={[
        { label: "Quản trị", href: "/admin/dashboard" },
        { label: t("admin.sidebar.aiOverview") },
      ]}
      primaryAction={
        <div className="flex items-center gap-1.5" role="group" aria-label={t("aiPipeline.health.window")}>
          {WINDOWS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={days === option}
              onClick={() => setDays(option)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === option ? "bg-[#204195] text-white" : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"
              }`}
            >
              {fill(t("aiPipeline.calls.days"), { n: option })}
            </button>
          ))}
        </div>
      }
    />
  );

  // Long lists are paged (10 rows); hooks run before the early returns below.
  const ready = state.status === "ready" ? state.data : null;
  const stuckRows = usePagedRows(ready?.stuck ?? [], 10);
  const warningRows = usePagedRows(ready?.warnings ?? [], 10);
  const purposeRows = usePagedRows(ready?.ai.byPurpose ?? [], 10);

  if (state.status !== "ready") {
    return (
      <div className="space-y-6">
        {header}
        {state.status === "loading" ? (
          <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
            <span className="sr-only">{t("aiPipeline.loading")}</span>
          </div>
        ) : (
          <AdminEmptyState
            variant="error"
            title={t(state.httpStatus === 503 ? "aiPipeline.notMigrated" : "aiPipeline.loadError")}
            description=""
            onRetry={() => void refresh()}
          />
        )}
      </div>
    );
  }

  const health = state.data;
  const ratioSub = (rate: Rate) => fill(t("aiPipeline.health.ratioSub"), { count: rate.count, total: rate.total });
  // Status badge in words, with the thresholds that set it.
  const rateStatus = (rate: Rate, warnAt: number, badAt: number) => {
    const level = rateLevel(rate, warnAt, badAt);
    return level
      ? {
          status: level,
          statusLabel: fill(t(`aiPipeline.health.level.${level}`), {
            warn: Math.round(warnAt * 100),
            bad: Math.round(badAt * 100),
          }),
        }
      : {};
  };

  const purposes = (
    <AdminSection
      title={t("aiPipeline.health.purposes")}
      action={
        <Link href="/admin/ai/traces?status=error" className="text-xs font-semibold text-[#204195] hover:underline">
          {t("aiPipeline.health.openErrors")}
        </Link>
      }
    >
      {/* Totals that used to live on a separate "AI usage" page. */}
      <p className="mb-3 text-xs text-[#607096]">
        {fill(t("aiPipeline.health.usageTotals"), {
          calls: health.ai.calls,
          input: compactNumber(health.ai.inputTokens),
          output: compactNumber(health.ai.outputTokens),
        })}
      </p>
      {health.ai.byPurpose.length ? (
        <TableShell>
          <thead>
            <tr>
              <Th>{t("aiPipeline.ai.purpose")}</Th>
              <Th align="right">{t("aiPipeline.ai.calls")}</Th>
              <Th align="right">{t("aiPipeline.ai.errors")}</Th>
              <Th align="right">{t("aiPipeline.ai.p50")}</Th>
              <Th align="right">{t("aiPipeline.ai.p95")}</Th>
              <Th align="right">{t("aiPipeline.health.tokens")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFF8]">
            {purposeRows.rows.map((row) => (
              <tr key={row.purpose}>
                <td className="py-2 pr-4">
                  <span className="font-semibold text-[#14244B]">{purposeLabel(row.purpose, t)}</span>
                  <span className="block font-mono text-[11px] text-[#8A98B8]">{row.purpose}</span>
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{row.calls}</td>
                <td className={`py-2 pr-4 text-right tabular-nums ${row.errors ? "text-[#C43B3B]" : ""}`}>{row.errors}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatMs(row.p50Ms)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{formatMs(row.p95Ms)}</td>
                <td className="py-2 text-right tabular-nums">{compactNumber(row.tokens)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : (
        <Muted>{t("aiPipeline.health.noData")}</Muted>
      )}
      {purposeRows.pager}
    </AdminSection>
  );

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title={t("aiPipeline.health.turnLatency")}
          value={formatMs(health.turns.p95Ms)}
          subtitle={fill(t("aiPipeline.health.turnLatencySub"), {
            p50: formatMs(health.turns.p50Ms),
            n: health.turns.count,
            s: health.turns.sessions,
          })}
          icon={Timer}
        />
        <AdminMetricCard
          title={t("aiPipeline.health.ackFallback")}
          value={percentText(health.turns.ackFallback)}
          subtitle={ratioSub(health.turns.ackFallback)}
          {...rateStatus(health.turns.ackFallback, 0.2, 0.4)}
          icon={MessageSquareWarning}
        />
        <AdminMetricCard
          title={t("aiPipeline.health.probeFallback")}
          value={percentText(health.turns.probeFallback)}
          subtitle={ratioSub(health.turns.probeFallback)}
          {...rateStatus(health.turns.probeFallback, 0.2, 0.4)}
          icon={AlertTriangle}
        />
        <AdminMetricCard
          title={t("aiPipeline.health.spokenRejected")}
          value={percentText(health.spokenRewriteRejected)}
          subtitle={ratioSub(health.spokenRewriteRejected)}
          {...rateStatus(health.spokenRewriteRejected, 0.2, 0.4)}
          icon={Mic}
        />
        <AdminMetricCard
          title={t("aiPipeline.health.repeatedAck")}
          value={percentText(health.turns.repeatedAck)}
          subtitle={ratioSub(health.turns.repeatedAck)}
          {...rateStatus(health.turns.repeatedAck, 0.05, 0.15)}
          icon={Repeat}
        />
        <AdminMetricCard
          title={t("aiPipeline.health.aiErrors")}
          value={percentText(health.ai.errors)}
          subtitle={ratioSub(health.ai.errors)}
          {...rateStatus(health.ai.errors, 0.02, 0.1)}
          icon={XCircle}
        />
        <AdminMetricCard
          title={t("aiPipeline.health.aiLatency")}
          value={formatMs(health.ai.p95Ms)}
          subtitle={`${t("aiPipeline.ai.p50")} ${formatMs(health.ai.p50Ms)}`}
          icon={Gauge}
        />
        <AdminMetricCard
          title={t("aiPipeline.health.gradingFailed")}
          value={percentText(health.evaluation.failureRate)}
          subtitle={ratioSub(health.evaluation.failureRate)}
          {...rateStatus(health.evaluation.failureRate, 0.05, 0.15)}
          icon={Activity}
        />
      </div>

      <AdminSection title={t("aiPipeline.health.stuck")}>
        {health.stuck.length ? (
          <TableShell>
            <thead>
              <tr>
                <Th>{t("aiPipeline.calls.session")}</Th>
                <Th>{t("aiPipeline.plan.why")}</Th>
                <Th>{t("aiPipeline.health.last")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {stuckRows.rows.map((row) => (
                <tr key={row.sessionId}>
                  <td className="py-2 pr-4">
                    <Link href={`/admin/interviews/${encodeURIComponent(row.sessionId)}`} className="font-semibold text-[#204195] hover:underline">
                      {row.candidateEmail ?? row.sessionId.slice(0, 8)}
                    </Link>
                    <span className="block text-xs text-[#607096]">{row.jobTitle ?? "—"}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <AdminStatusBadge
                      status={STUCK_TONE[row.reason] ?? "warning"}
                      label={t(`aiPipeline.health.stuck.${row.reason}`)}
                      size="sm"
                    />
                  </td>
                  <td className="py-2 text-xs tabular-nums text-[#607096]">
                    {row.updatedAt ? new Date(row.updatedAt).toLocaleString("vi-VN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <Muted>{t("aiPipeline.health.noStuck")}</Muted>
        )}
        {stuckRows.pager}
      </AdminSection>

      <AdminSection title={t("aiPipeline.health.daily")}>
        <DailyChart daily={health.daily} />
      </AdminSection>

      {/* One per row: side by side, the number columns were pushed out of view. */}
      <div className="space-y-6">
        <AdminSection title={t("aiPipeline.health.steps")}>
          {health.steps.length ? (
            <TableShell minWidth={420}>
              <thead>
                <tr>
                  <Th>{t("aiPipeline.health.step")}</Th>
                  <Th align="right">{t("aiPipeline.health.completed")}</Th>
                  <Th align="right">{t("aiPipeline.health.failed")}</Th>
                  <Th align="right">{t("aiPipeline.ai.p50")}</Th>
                  <Th align="right">{t("aiPipeline.ai.p95")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF8]">
                {health.steps.map((row) => (
                  <tr key={row.stage}>
                    <td className="py-2 pr-4 font-semibold text-[#14244B]">
                      {tr(t, `aiPipeline.stage.${row.stage === "session" ? "created" : row.stage}`, row.stage)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.completed}</td>
                    <td className={`py-2 pr-4 text-right tabular-nums ${row.errors ? "text-[#C43B3B]" : ""}`}>{row.errors}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatMs(row.p50Ms)}</td>
                    <td className="py-2 text-right tabular-nums">{formatMs(row.p95Ms)}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          ) : (
            <Muted>{t("aiPipeline.health.noData")}</Muted>
          )}
        </AdminSection>

        <AdminSection title={t("aiPipeline.health.warnings")}>
          {health.warnings.length ? (
            <TableShell minWidth={420}>
              <thead>
                <tr>
                  <Th>{t("aiPipeline.health.event")}</Th>
                  <Th align="right">{t("aiPipeline.health.count")}</Th>
                  <Th align="right">{t("aiPipeline.health.sessions")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF8]">
                {warningRows.rows.map((row) => (
                  <tr key={`${row.event}-${row.status}`}>
                    <td className="py-2 pr-4">
                      <AdminStatusBadge
                        status={row.status === "error" ? "error" : "warning"}
                        label={eventLabel(row.event, t)}
                        size="sm"
                      />
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.count}</td>
                    <td className="py-2 text-right tabular-nums">{row.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          ) : (
            <Muted>{t("aiPipeline.health.noData")}</Muted>
          )}
          {warningRows.pager}
        </AdminSection>
      </div>

      {purposes}
    </div>
  );
}
