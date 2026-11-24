"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import { Muted, TableShell, Th } from "@features/admin/pipeline/components/ui";
import { compactNumber, fill, formatUsd, tr } from "@features/admin/pipeline/utils/pipelineFormat";
import { aiAdminService, type AiCost } from "../services/aiAdmin.service";

const BAR = "#204195";
const GRID = "#EAEFF8";
const MUTED = "#607096";

type CostPoint = { day: string; cost: number; calls: number; label: string };

function CostTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const { t } = useLanguage();
  const point = active && payload?.length ? (payload[0].payload as CostPoint) : null;
  if (!point) return null;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs text-[#14244B] shadow-lg ring-1 ring-[#DCE4F3]">
      <p className="font-semibold">{point.label}</p>
      <p className="mt-0.5 tabular-nums">{formatUsd(point.cost)}</p>
      <p className="mt-0.5 text-[#607096]">{fill(t("aiCost.calls"), { n: point.calls })}</p>
    </div>
  );
}

/** Cost per day: one series, so no legend; days without calls stay on the axis. */
function DailyCost({ daily }: { daily: { day: string; cost: number; calls: number }[] }) {
  const points: CostPoint[] = daily.map((row) => ({ ...row, label: row.day.slice(8, 10) + "/" + row.day.slice(5, 7) }));
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} width={56} tickFormatter={(value: number) => formatUsd(value)} />
          <Tooltip content={CostTooltip} cursor={{ fill: "#F5F8FF" }} />
          <Bar dataKey="cost" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Share({ cost, total }: { cost: number; total: number }) {
  return <span className="text-[#8A98B8]">{total > 0 ? `${Math.round((cost / total) * 100)}%` : "—"}</span>;
}

/**
 * LLM cost as Langfuse prices it (Metrics API), for the window chosen on the AI
 * overview. Only calls traced to Langfuse are counted: interview turns, grading,
 * AI judges and golden-set runs, not OCR, embeddings or voice.
 */
export default function AiCostSection({ days }: { days: number }) {
  const { t } = useLanguage();
  // Keyed by window: a result for another window reads as loading, not as stale numbers.
  const [result, setResult] = useState<{ days: number; status: "error" } | { days: number; status: "ready"; data: AiCost } | null>(null);
  const state = result && result.days === days ? result : ({ status: "loading" } as const);

  useEffect(() => {
    let cancelled = false;
    aiAdminService
      .cost(days)
      .then((data) => !cancelled && setResult({ days, status: "ready", data }))
      .catch(() => !cancelled && setResult({ days, status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [days]);

  let body;
  if (state.status === "loading") body = <div className="h-32 animate-pulse rounded-xl bg-[#F7F9FD] motion-reduce:animate-none" aria-hidden="true" />;
  else if (state.status === "error") body = <Muted>{t("aiCost.error")}</Muted>;
  else if (!state.data.connected) body = <Muted>{tr(t, `langfuseUi.off.${state.data.reason}`, t("aiCost.error"))}</Muted>;
  else if (state.data.total.calls === 0) body = <Muted>{t("aiCost.empty")}</Muted>;
  else {
    const data = state.data;
    const total = data.total.cost;
    body = (
      <div className="space-y-5">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: t("aiCost.total"), value: formatUsd(total) },
            { label: t("aiCost.callsLabel"), value: data.total.calls.toLocaleString("vi-VN") },
            { label: t("aiCost.perCall"), value: formatUsd(data.total.calls ? total / data.total.calls : null) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#EAEFF8] bg-[#FBFCFE] px-4 py-3">
              <dt className="text-xs text-[#607096]">{item.label}</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-[#14244B]">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#607096]">{t("aiCost.byFeature")}</p>
            <TableShell minWidth={360}>
              <thead>
                <tr>
                  <Th>{t("aiCost.feature")}</Th>
                  <Th align="right">{t("aiCost.callsLabel")}</Th>
                  <Th align="right">{t("aiPipeline.health.tokens")}</Th>
                  <Th align="right">{t("aiCost.cost")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF8]">
                {data.byFeature.map((row) => (
                  <tr key={row.feature}>
                    <td className="py-2 pr-4 font-semibold text-[#14244B]">{tr(t, `aiCost.feature.${row.feature}`, row.feature)}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.calls}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{compactNumber(row.tokens)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatUsd(row.cost)} <Share cost={row.cost} total={total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#607096]">{t("aiCost.byModel")}</p>
            <TableShell minWidth={360}>
              <thead>
                <tr>
                  <Th>{t("aiCost.model")}</Th>
                  <Th align="right">{t("aiCost.callsLabel")}</Th>
                  <Th align="right">{t("aiPipeline.health.tokens")}</Th>
                  <Th align="right">{t("aiCost.cost")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEFF8]">
                {data.byModel.map((row) => (
                  <tr key={row.model ?? "unknown"}>
                    <td className="py-2 pr-4 font-mono text-xs text-[#14244B]">{row.model ?? "—"}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.calls}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{compactNumber(row.tokens)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {formatUsd(row.cost)} <Share cost={row.cost} total={total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </div>
        </div>

        {data.daily.length > 1 ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#607096]">{t("aiCost.daily")}</p>
            <DailyCost daily={data.daily} />
          </div>
        ) : null}
      </div>
    );
  }

  const dashboardUrl = state.status === "ready" && state.data.connected ? state.data.dashboardUrl : null;
  return (
    <AdminSection
      title={t("aiCost.title")}
      description={t("aiCost.note")}
      action={
        dashboardUrl ? (
          <a href={dashboardUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[#204195] hover:underline">
            {t("aiCost.openDashboard")}
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ) : undefined
      }
    >
      {body}
    </AdminSection>
  );
}
