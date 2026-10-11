"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Activity,
  Clock,
  Coins,
  ShieldCheck,
  ArrowUpRight,
  Terminal,
  Box,
  GitBranch,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import { aiOpsService } from "../services/aiOps.service";
import { AIOverviewStats, ObservabilityConnectionStatus } from "../types/aiOps.types";

export default function AdminAiOverviewClient() {
  const { t } = useLanguage();
  const [connectionStatus, setConnectionStatus] = useState<ObservabilityConnectionStatus>("NOT_CONNECTED");
  const [stats, setStats] = useState<AIOverviewStats | null>(null);

  useEffect(() => {
    async function loadData() {
      const [conn, st] = await Promise.all([
        aiOpsService.getConnectionStatus(),
        aiOpsService.getOverview(),
      ]);
      setConnectionStatus(conn);
      setStats(st);
    }
    loadData();
  }, []);

  const isConnected = connectionStatus === "CONNECTED";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.ai.overview.title")}
        description={t("admin.ai.overview.subtitle")}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview") },
        ]}
        statusBadge={
          <AdminStatusBadge
            status={isConnected ? "healthy" : "warning"}
            label={isConnected ? t("fixAdmin.ai.overview.connected") : t("admin.dashboard.observabilitySub")}
          />
        }
      />

      {/* Observability Connection Banner (Rule 25) */}
      {!isConnected && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <Sparkles className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#14244B]">AI Observability</h3>
                  <AdminStatusBadge status="warning" label={t("fixAdmin.common.notConnected")} size="sm" />
                </div>
                <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#607096] leading-relaxed">
                  {t("fixAdmin.ai.overview.bannerDesc")}
                </p>
              </div>
            </div>

            <Link
              href="/admin/settings"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#204195] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#183275] transition-all"
            >
              <span>{t("fixAdmin.ai.overview.viewGuide")}</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* AI Health & Operational Questions (Rule 24) */}
      <AdminSection
        title={t("admin.ai.overview.checklistTitle")}
        description={t("admin.ai.overview.checklistDesc")}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("admin.ai.overview.q1")}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-black text-[#14244B]">{t("admin.ai.overview.q1Ans")}</span>
              <AdminStatusBadge status="healthy" label={t("fixAdmin.common.online")} size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">{t("fixAdmin.ai.overview.q1Note")}</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("admin.ai.overview.q2")}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">{t("admin.ai.overview.q2Ans")}</span>
              <AdminStatusBadge status="unknown" label={t("fixAdmin.common.unknown")} size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">{t("fixAdmin.ai.overview.q2Note")}</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("admin.ai.overview.q3")}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">{t("admin.ai.overview.q3Ans")}</span>
              <AdminStatusBadge status="unknown" label={t("fixAdmin.common.unknown")} size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">{t("fixAdmin.ai.overview.q3Note")}</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("admin.ai.overview.q4")}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">{t("admin.ai.overview.q4Ans")}</span>
              <AdminStatusBadge status="unknown" label={t("fixAdmin.common.unknown")} size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">{t("fixAdmin.ai.overview.q4Note")}</p>
          </div>
        </div>
      </AdminSection>

      {/* Overview Metrics (Rule 24 & Strict Rule 2 - No hardcoded zeroes or fake numbers) */}
      <AdminSection
        title={t("admin.ai.overview.metricsTitle")}
        description={t("admin.ai.overview.metricsDesc")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard
            title={t("admin.ai.overview.stat.runs")}
            value={stats?.runs}
            subtitle={t("fixAdmin.ai.overview.runsSub")}
            icon={Activity}
            isPending={!isConnected}
            pendingText={t("admin.common.backendPending")}
          />
          <AdminMetricCard
            title={t("admin.ai.overview.stat.successRate")}
            value={stats?.successRate ? `${stats.successRate}%` : null}
            subtitle={t("fixAdmin.ai.overview.successSub")}
            icon={ShieldCheck}
            isPending={!isConnected}
            pendingText={t("admin.common.backendPending")}
          />
          <AdminMetricCard
            title={t("admin.ai.overview.stat.latency")}
            value={stats?.p50LatencyMs ? `${stats.p50LatencyMs}ms / ${stats.p95LatencyMs}ms` : null}
            subtitle={t("fixAdmin.ai.overview.latencySub")}
            icon={Clock}
            isPending={!isConnected}
            pendingText={t("admin.common.backendPending")}
          />
          <AdminMetricCard
            title={t("admin.ai.overview.stat.tokensCost")}
            value={stats?.totalTokens ? `${stats.totalTokens.toLocaleString()} tokens` : null}
            subtitle={stats?.estimatedCostUsd ? `$${stats.estimatedCostUsd.toFixed(2)} USD` : t("fixAdmin.ai.overview.costSub")}
            icon={Coins}
            isPending={!isConnected}
            pendingText={t("admin.common.backendPending")}
          />
        </div>
      </AdminSection>

      {/* Sub-module Shortcuts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/ai/models"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <Box className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">{t("admin.sidebar.aiModels")}</h4>
          <p className="text-xs text-[#607096] mt-1">
            {t("admin.ai.models.subtitle")}
          </p>
        </Link>

        <Link
          href="/admin/ai/prompts"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <Terminal className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">{t("admin.sidebar.aiPrompts")}</h4>
          <p className="text-xs text-[#607096] mt-1">
            {t("admin.ai.prompts.subtitle")}
          </p>
        </Link>

        <Link
          href="/admin/ai/traces"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <GitBranch className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">{t("admin.sidebar.aiTraces")}</h4>
          <p className="text-xs text-[#607096] mt-1">
            {t("admin.ai.traces.subtitle")}
          </p>
        </Link>
      </div>
    </div>
  );
}
