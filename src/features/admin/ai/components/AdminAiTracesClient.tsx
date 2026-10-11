"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Search, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { AITraceItem } from "../types/aiOps.types";

export default function AdminAiTracesClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Real data array - empty until backend connects observability provider
  const traces: AITraceItem[] = [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.ai.traces.title")}
        description={t("admin.ai.traces.subtitle")}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview"), href: "/admin/ai" },
          { label: t("admin.sidebar.aiTraces") },
        ]}
        statusBadge={
          <AdminStatusBadge status="warning" label={t("admin.dashboard.observabilitySub")} />
        }
      />

      {/* Privacy Notice (Rule 37) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096] flex items-center gap-3">
        <ShieldAlert className="size-4 text-[#204195] shrink-0" />
        <p>
          <span className="font-bold text-[#14244B]">{t("fixAdmin.ai.traces.privacyTitle")}</span>{" "}
          {t("admin.ai.traces.privacyNotice")}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("fixAdmin.ai.traces.total")}
          value={null}
          subtitle={t("fixAdmin.ai.traces.totalSub")}
          icon={Activity}
          isPending={true}
          pendingText={t("admin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("fixAdmin.ai.traces.avgLatency")}
          value={null}
          subtitle={t("fixAdmin.ai.traces.avgLatencySub")}
          icon={Activity}
          isPending={true}
          pendingText={t("admin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("admin.ai.overview.stat.successRate")}
          value={null}
          subtitle={t("fixAdmin.ai.traces.successSub")}
          icon={Activity}
          isPending={true}
          pendingText={t("admin.common.backendPending")}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#607096]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-colors"
            placeholder={t("fixAdmin.ai.traces.search")}
            type="text"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "SUCCESS", "ERROR"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-[#204195] text-white shadow-xs"
                  : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
              }`}
            >
              {st === "all" ? t("admin.common.all") : st}
            </button>
          ))}
        </div>
      </div>

      {/* Traces Table / Empty State */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.ai.traces.table.id")}</th>
                <th className="px-6 py-4">{t("admin.ai.traces.table.feature")}</th>
                <th className="px-6 py-4">{t("admin.ai.traces.table.model")}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.traces.table.latency")}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.traces.table.tokens")}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.traces.table.status")}</th>
                <th className="px-6 py-4">{t("admin.ai.traces.table.timestamp")}</th>
                <th className="px-6 py-4 text-right">{t("admin.ai.traces.table.detail")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {traces.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title={t("admin.ai.traces.emptyTitle")}
                      description={t("admin.ai.traces.emptyDesc")}
                    />
                  </td>
                </tr>
              ) : (
                traces.map((tr) => (
                  <tr key={tr.traceId} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-mono font-bold text-[#14244B]">{tr.traceId}</td>
                    <td className="px-6 py-4">{tr.feature}</td>
                    <td className="px-6 py-4 font-mono">{tr.model}</td>
                    <td className="px-6 py-4 text-center">{tr.latencyMs}ms</td>
                    <td className="px-6 py-4 text-center">{tr.tokens}</td>
                    <td className="px-6 py-4 text-center">{tr.status}</td>
                    <td className="px-6 py-4">{tr.timestamp}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/ai/traces/${tr.traceId}`} className="text-[#204195] font-semibold hover:underline">
                        {t("admin.common.view")}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
