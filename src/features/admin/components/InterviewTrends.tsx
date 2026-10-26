"use client";

import type { AdminOverviewData } from "@/lib/apiClient";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminEmptyState from "./primitives/AdminEmptyState";

const EN_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** API months may arrive as English abbreviations ("May"); show them as "Th5". */
function monthLabel(month: string) {
  const idx = EN_MONTHS.indexOf(month.trim().slice(0, 3).toLowerCase());
  return idx >= 0 ? `Th${idx + 1}` : month;
}

const percentOf = (part: number | undefined, total: number | undefined) =>
  total && total > 0 ? Math.min(100, Math.round(((part || 0) / total) * 100)) : 0;

/**
 * Interview trends from /admin/overview: sessions per month, completed vs
 * in-progress share, and the breakdown by interview mode. Formerly the
 * separate "Phân tích" page; now part of the overview.
 */
export default function InterviewTrends({ data }: { data: AdminOverviewData | null }) {
  const { t } = useLanguage();

  const monthlyTrend = data?.monthlyTrend || [];
  const maxCount = monthlyTrend.length > 0 ? Math.max(...monthlyTrend.map((m) => m.count), 1) : 1;
  const total = data?.totalSessions;
  const graded = data?.gradedSessions ?? 0;
  const ungraded = Math.max(0, (data?.completedSessions ?? 0) - graded);
  const breakdown = [
    { label: t("adminOps.overview.graded"), n: graded, bar: "bg-emerald-600", text: "text-emerald-700" },
    { label: t("adminOps.overview.ungraded"), n: ungraded, bar: "bg-amber-500", text: "text-amber-700" },
    { label: t("admin.insights.active"), n: data?.activeSessions ?? 0, bar: "bg-blue-600", text: "text-blue-700" },
  ];
  const modes = [
    { key: "chat", label: t("aiPipeline.mode.chat"), n: data?.modes?.chat ?? 0 },
    { key: "voice", label: t("aiPipeline.mode.voice"), n: data?.modes?.voice ?? 0 },
    { key: "video", label: t("aiPipeline.mode.video"), n: data?.modes?.video ?? 0 },
  ];
  const modeTotal = modes.reduce((sum, m) => sum + m.n, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs sm:p-6 lg:col-span-8">
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#14244B]">{t("admin.insights.trendTitle")}</h3>
            <p className="mt-0.5 text-xs text-[#607096]">{t("admin.insights.trendDesc")}</p>
          </div>

          {monthlyTrend.length > 0 ? (
            <div className="relative flex h-56 items-end justify-between gap-2 pt-6 sm:gap-4">
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2 opacity-30">
                <div className="border-t border-[#EAEFF8]" />
                <div className="border-t border-[#EAEFF8]" />
                <div className="border-t border-[#EAEFF8]" />
                <div className="border-t border-[#EAEFF8]" />
              </div>
              {monthlyTrend.map((m, idx) => {
                // Empty months stay at zero (drawn as a hairline) so they never look non-zero.
                const heightPercent = m.count > 0 ? Math.max(4, Math.round((m.count / maxCount) * 100)) : 0;
                const isLatest = idx === monthlyTrend.length - 1;
                return (
                  <div key={m.month} className="group relative z-10 flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <div className="pointer-events-none absolute -top-7 whitespace-nowrap rounded-md bg-[#14244B] px-2 py-1 text-[11px] font-bold text-white opacity-0 shadow-xs transition-opacity group-hover:opacity-100">
                      {m.count} {t("admin.common.sessionUnit")}
                    </div>
                    <div
                      style={{ height: heightPercent > 0 ? `${heightPercent}%` : "2px" }}
                      className={`w-full max-w-[48px] transition-all duration-300 ${
                        heightPercent === 0
                          ? "rounded-full bg-[#DCE4F3]"
                          : isLatest
                            ? "rounded-t-lg bg-[#204195] shadow-xs"
                            : "rounded-t-lg bg-[#C9D7F1] hover:bg-[#AFC2E8]"
                      }`}
                    />
                    <span className="max-w-full truncate text-[11px] font-bold text-[#607096] sm:text-xs" title={m.month}>
                      {monthLabel(m.month)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <AdminEmptyState title={t("admin.insights.emptyTrendTitle")} description={t("admin.insights.emptyTrendDesc")} />
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs sm:p-6 lg:col-span-4">
          <div>
            <h3 className="mb-1 text-base font-bold text-[#14244B]">{t("admin.insights.breakdownTitle")}</h3>
            <p className="mb-6 text-xs text-[#607096]">{t("admin.insights.breakdownSubtitle")}</p>
            <div className="space-y-4">
              {breakdown.map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-xs font-semibold">
                    <span className="text-[#14244B]">{row.label}</span>
                    <span className={row.text}>
                      {row.n} · {percentOf(row.n, total)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#F2F5FC]">
                    <div style={{ width: `${percentOf(row.n, total)}%` }} className={`h-full rounded-full transition-all duration-500 ${row.bar}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096]">
            <p className="mb-1 font-semibold text-[#14244B]">{t("admin.insights.ruleTitle")}</p>
            <p>{t("admin.insights.ruleDesc")}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs sm:p-6">
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#14244B]">{t("admin.insights.modesTitle")}</h3>
          <p className="mt-0.5 text-xs text-[#607096]">{t("admin.insights.modesDesc")}</p>
        </div>
        {modeTotal > 0 ? (
          <ul className="space-y-3">
            {modes.map((mode) => (
              <li key={mode.key}>
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span className="text-[#14244B]">{mode.label}</span>
                  <span className="tabular-nums text-[#607096]">
                    {mode.n} · {percentOf(mode.n, modeTotal)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F2F5FC]">
                  <div style={{ width: `${percentOf(mode.n, modeTotal)}%` }} className="h-full rounded-full bg-[#204195]" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <AdminEmptyState title={t("admin.insights.emptyModesTitle")} description={t("admin.insights.emptyModesDesc")} />
        )}
      </div>
    </div>
  );
}
