"use client";

import { useState } from "react";
import { CalendarCheck, Repeat, Target, Users } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminSection from "./primitives/AdminSection";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminEmptyState from "./primitives/AdminEmptyState";
import { usePolledResource } from "@features/admin/pipeline/hooks/usePolledResource";
import { Muted, TableShell, Th } from "@features/admin/pipeline/components/ui";
import { fill } from "@features/admin/pipeline/utils/pipelineFormat";
import { adminOpsService, type PracticeWeek } from "@features/admin/services/adminOps.service";

const WINDOWS = [4, 8, 12, 26] as const;

/** "20/10 – 26/10" for a week starting on `iso` (Monday). */
export function weekLabel(iso: string): string {
  const start = new Date(`${iso}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const dm = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `${dm(start)} – ${dm(end)}`;
}

export function share(part: number, whole: number): string {
  return whole ? `${Math.round((part / whole) * 100)}%` : "—";
}

/** Valid sessions per week as bars; the number is printed on every bar. */
function WeeklyBars({ weeks, label }: { weeks: PracticeWeek[]; label: (w: PracticeWeek) => string }) {
  const max = Math.max(1, ...weeks.map((w) => w.valid));
  return (
    <div className="flex h-40 items-end gap-2" role="img" aria-label={weeks.map(label).join("; ")}>
      {weeks.map((week) => (
        <div key={week.week} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-[11px] font-semibold tabular-nums text-[#14244B]">{week.valid}</span>
          <div className="flex w-full items-end" style={{ height: "100px" }}>
            <div
              className="w-full rounded-t-md bg-[#204195]"
              style={{ height: `${Math.max(week.valid ? 4 : 0, (week.valid / max) * 100)}%` }}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-[#607096]">{weekLabel(week.week).split(" – ")[0]}</span>
        </div>
      ))}
    </div>
  );
}

/** How candidates practise week by week: valid sessions, active users, weekly goals met. */
export default function PracticeStatsClient() {
  const { t } = useLanguage();
  const [weeks, setWeeks] = useState<number>(8);
  const [includeDemo, setIncludeDemo] = useState(false);
  const { state, refresh } = usePolledResource(
    () => adminOpsService.practice(weeks, includeDemo),
    () => null,
    [weeks, includeDemo],
  );

  const filters = (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <label className="flex items-center gap-2 font-semibold text-[#14244B]">
        {t("adminOps.quality.window")}
        <select
          value={weeks}
          onChange={(event) => setWeeks(Number(event.target.value))}
          className="rounded-lg border border-[#DCE4F3] bg-white px-2 py-1.5 text-xs"
        >
          {WINDOWS.map((value) => (
            <option key={value} value={value}>
              {fill(t("adminOps.practice.weeksOption"), { n: value })}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-[#607096]">
        <input type="checkbox" checked={includeDemo} onChange={(event) => setIncludeDemo(event.target.checked)} />
        {t("adminOps.quality.includeDemo")}
      </label>
    </div>
  );

  const header = (
    <AdminPageHeader
      title={t("adminOps.practice.title")}
      description={t("adminOps.practice.subtitle")}
      breadcrumbs={[
        { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
        { label: t("adminOps.practice.title") },
      ]}
      primaryAction={filters}
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
          <AdminEmptyState variant="error" title={t("adminOps.practice.loadError")} description="" onRetry={() => void refresh()} />
        )}
      </div>
    );
  }

  const data = state.data;
  const { totals } = data;
  // The current week has only just started on most days; the last full week is the fair measure.
  const current = data.weeks.length > 1 ? data.weeks[data.weeks.length - 2] : data.weeks[0];
  const rows = [...data.weeks].reverse();
  const goalEntries = Object.entries(data.goalDistribution);

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title={t("adminOps.practice.metric.practising")}
          value={String(totals.practisingUsers)}
          subtitle={fill(t("adminOps.practice.metric.practisingSub"), { users: totals.users })}
          icon={Users}
        />
        <AdminMetricCard
          title={t("adminOps.practice.metric.valid")}
          value={String(totals.valid)}
          subtitle={fill(t("adminOps.practice.metric.validSub"), { sessions: totals.sessions, short: totals.short })}
          icon={CalendarCheck}
        />
        <AdminMetricCard
          title={t("adminOps.practice.metric.goal")}
          value={current ? share(current.metGoal, current.practisingUsers) : "—"}
          subtitle={
            current
              ? fill(t("adminOps.practice.metric.goalSub"), { met: current.metGoal, users: current.practisingUsers })
              : ""
          }
          icon={Target}
        />
        <AdminMetricCard
          title={t("adminOps.practice.metric.returning")}
          value={String(totals.returningUsers)}
          subtitle={fill(t("adminOps.practice.metric.returningSub"), {
            median: totals.medianSessionsPerUser ?? "—",
          })}
          icon={Repeat}
        />
      </div>

      <AdminSection title={t("adminOps.practice.chart")} description={t("adminOps.practice.chartNote")}>
        {totals.sessions ? (
          <WeeklyBars
            weeks={data.weeks}
            label={(w) => fill(t("adminOps.practice.chartLabel"), { week: weekLabel(w.week), n: w.valid })}
          />
        ) : (
          <Muted>{t("adminOps.practice.empty")}</Muted>
        )}
      </AdminSection>

      <AdminSection title={t("adminOps.practice.byWeek")} description={fill(t("adminOps.practice.rules"), data.rules)}>
        <TableShell minWidth={720}>
          <thead>
            <tr>
              <Th>{t("adminOps.practice.col.week")}</Th>
              <Th align="right">{t("adminOps.practice.col.sessions")}</Th>
              <Th align="right">{t("adminOps.practice.col.graded")}</Th>
              <Th align="right">{t("adminOps.practice.col.valid")}</Th>
              <Th align="right">{t("adminOps.practice.col.users")}</Th>
              <Th align="right">{t("adminOps.practice.col.metGoal")}</Th>
              <Th align="right">{t("adminOps.practice.col.score")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFF8]">
            {rows.map((week) => (
              <tr key={week.week}>
                <td className="py-2 pr-4 text-xs font-semibold tabular-nums text-[#14244B]">{weekLabel(week.week)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{week.sessions}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{week.graded}</td>
                <td className="py-2 pr-4 text-right font-semibold tabular-nums text-[#14244B]">{week.valid}</td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {week.practisingUsers}
                  <span className="text-[11px] text-[#607096]"> / {week.activeUsers}</span>
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {week.metGoal}
                  <span className="text-[11px] text-[#607096]"> ({share(week.metGoal, week.practisingUsers)})</span>
                </td>
                <td className="py-2 text-right tabular-nums">{week.avgScore ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </AdminSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminSection title={t("adminOps.practice.goals")} description={t("adminOps.practice.goalsNote")}>
          {goalEntries.length ? (
            <ul className="space-y-1 text-xs">
              {goalEntries.map(([goal, count]) => (
                <li key={goal} className="flex justify-between">
                  <span className="text-[#14244B]">{fill(t("adminOps.user.weeklyGoalValue"), { n: goal })}</span>
                  <span className="tabular-nums text-[#607096]">{fill(t("adminOps.practice.usersCount"), { n: count })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Muted>{t("adminOps.practice.empty")}</Muted>
          )}
        </AdminSection>
        <AdminSection title={t("adminOps.user.realReports")} description={t("adminOps.practice.reportsNote")}>
          {data.realReports.total ? (
            <ul className="space-y-1 text-xs">
              {(["passed", "failed", "waiting"] as const).map((key) => (
                <li key={key} className="flex justify-between">
                  <span className="text-[#14244B]">{t(`adminOps.realResult.${key}`)}</span>
                  <span className="tabular-nums text-[#607096]">{data.realReports[key]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Muted>{t("adminOps.user.noReports")}</Muted>
          )}
        </AdminSection>
      </div>
    </div>
  );
}
