"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  Timer,
  BadgeCheck,
  MessageSquare,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { adminApi, AdminOverviewData } from "@/lib/apiClient";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminEmptyState from "./primitives/AdminEmptyState";
import { useLanguage } from "@/i18n/LanguageProvider";

interface AdminInsightsClientProps {
  initialLang?: string;
  dictionary?: Record<string, string>;
}

export default function AdminInsightsClient({
  dictionary,
}: AdminInsightsClientProps) {
  const { t: hookT } = useLanguage();
  const t = (key: string) => {
    const val = hookT(key);
    if (val && val !== key) return val;
    return dictionary?.[key] ?? key;
  };

  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await adminApi.getOverview();
      if (res.data?.success && res.data.overview) {
        setData(res.data.overview);
      }
    } catch (err) {
      console.error("Failed to load admin overview:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOverview();
  };

  const monthlyTrend = data?.monthlyTrend || [];
  const maxCount = monthlyTrend.length > 0 ? Math.max(...monthlyTrend.map((m) => m.count), 1) : 1;
  const cohorts = data?.cohorts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title={t("admin.insights.systemPerformanceTitle")}
        description={t("admin.insights.systemPerformanceSubtitle")}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.insights") },
        ]}
        statusBadge={
          <AdminStatusBadge status="healthy" label={t("admin.common.realTime")} />
        }
        primaryAction={
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-[#204195]" : "text-[#607096]"}`} />
            <span>{t("admin.common.refresh")}</span>
          </button>
        }
      />

      {/* Metric Cards Row (Strict Rule 2 - No fake metrics) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title={t("admin.insights.stat.totalSessions")}
          value={data?.totalSessions}
          unit={t("admin.common.sessionUnit")}
          subtitle={t("admin.insights.stat.allTime")}
          icon={MessageSquare}
          isPending={loading || data === null}
          pendingText={t("admin.common.loading")}
        />
        <AdminMetricCard
          title={t("admin.insights.stat.activeSessions")}
          value={data?.activeSessions}
          unit={t("admin.common.sessionUnit")}
          subtitle={t("admin.insights.stat.inProgress")}
          icon={Timer}
          status={data?.activeSessions ? "active" : undefined}
          isPending={loading || data === null}
          pendingText={t("admin.common.loading")}
        />
        <AdminMetricCard
          title={t("admin.insights.stat.completedSessions")}
          value={data?.completedSessions}
          unit={t("admin.common.sessionUnit")}
          subtitle={t("admin.insights.stat.finalized")}
          icon={BadgeCheck}
          status={data?.completedSessions ? "success" : undefined}
          isPending={loading || data === null}
          pendingText={t("admin.common.loading")}
        />
        <AdminMetricCard
          title={t("admin.insights.stat.avgAiScore")}
          value={data?.averageScore ? `${data.averageScore.toFixed(1)}/100` : null}
          subtitle={data?.averageScore ? t("admin.insights.stat.scoredByAi") : t("admin.insights.stat.noScoredSession")}
          icon={Brain}
          isPending={loading || data === null}
          pendingText={t("admin.common.noData")}
        />
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Trend Card */}
        <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs lg:col-span-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-base font-bold text-[#14244B]">
                  {t("admin.insights.trendTitle")}
                </h3>
                {data?.totalSessions !== undefined && (
                  <span className="text-xl font-black text-[#204195]">
                    {data.totalSessions} {t("admin.common.sessionUnit")}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#607096] mt-0.5">
                {t("admin.insights.trendDesc")}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg bg-[#EEF2FD] px-2.5 py-1 text-xs font-semibold text-[#204195] border border-[#DCE4F3]">
              <TrendingUp className="size-3.5" />
              <span>{t("admin.common.realTime")}</span>
            </div>
          </div>

          {/* Dynamic Bar Chart based on DB data */}
          {monthlyTrend.length > 0 ? (
            <div className="relative flex h-56 items-end justify-between gap-4 pt-6">
              <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-30">
                <div className="border-t border-[#EAEFF8]"></div>
                <div className="border-t border-[#EAEFF8]"></div>
                <div className="border-t border-[#EAEFF8]"></div>
                <div className="border-t border-[#EAEFF8]"></div>
              </div>

              {monthlyTrend.map((m, idx) => {
                const heightPercent = Math.max(15, Math.round((m.count / maxCount) * 100));
                const isLatest = idx === monthlyTrend.length - 1;
                return (
                  <div key={m.month} className="group relative z-10 flex flex-1 flex-col items-center gap-2 h-full justify-end">
                    <div className="absolute -top-7 rounded-md bg-[#14244B] px-2 py-1 text-[11px] font-bold text-white shadow-xs opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                      {m.count} {t("admin.common.sessionUnit")}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 ${
                        isLatest
                          ? "bg-[#204195] shadow-xs"
                          : "bg-[#EEF2FD] hover:bg-[#DCE4F3]"
                      }`}
                    />
                    <span className="text-xs font-bold text-[#607096]">
                      {m.month}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <AdminEmptyState
              title={t("admin.insights.emptyTrendTitle")}
              description={t("admin.insights.emptyTrendDesc")}
            />
          )}
        </div>

        {/* Breakdown Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs lg:col-span-4">
          <div>
            <h3 className="text-base font-bold text-[#14244B] mb-1">
              {t("admin.insights.breakdownTitle")}
            </h3>
            <p className="text-xs text-[#607096] mb-6">
              {t("admin.insights.breakdownSubtitle")}
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#14244B]">{t("admin.insights.completed")}</span>
                  <span className="text-[#204195]">
                    {data?.totalSessions && data.totalSessions > 0
                      ? `${Math.round(((data.completedSessions || 0) / data.totalSessions) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F2F5FC] overflow-hidden">
                  <div
                    style={{
                      width: data?.totalSessions && data.totalSessions > 0
                        ? `${Math.min(100, Math.round(((data.completedSessions || 0) / data.totalSessions) * 100))}%`
                        : "0%",
                    }}
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#14244B]">{t("admin.insights.active")}</span>
                  <span className="text-amber-600">
                    {data?.totalSessions && data.totalSessions > 0
                      ? `${Math.round(((data.activeSessions || 0) / data.totalSessions) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F2F5FC] overflow-hidden">
                  <div
                    style={{
                      width: data?.totalSessions && data.totalSessions > 0
                        ? `${Math.min(100, Math.round(((data.activeSessions || 0) / data.totalSessions) * 100))}%`
                        : "0%",
                    }}
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096]">
            <p className="font-semibold text-[#14244B] mb-1">{t("admin.insights.ruleTitle")}</p>
            <p>{t("admin.insights.ruleDesc")}</p>
          </div>
        </div>
      </div>

      {/* Cohorts / Breakdown by mode */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#14244B]">
            {t("admin.insights.modesTitle")}
          </h3>
          <p className="text-xs text-[#607096] mt-0.5">
            {t("admin.insights.modesDesc")}
          </p>
        </div>

        {cohorts.length > 0 ? (
          <div className="divide-y divide-[#F1F5F9]">
            {cohorts.map((cohort) => (
              <div key={cohort.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#14244B]">{cohort.name}</p>
                  <p className="text-[11px] text-[#607096]">{cohort.engagement}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#204195]">{cohort.avgScore}</span>
                  <p className="text-[10px] text-[#607096]">{cohort.growth}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title={t("admin.insights.emptyModesTitle")}
            description={t("admin.insights.emptyModesDesc")}
          />
        )}
      </div>
    </div>
  );
}
