"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Search, Plus, Star, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { EvalDatasetItem } from "../types/evaluation.types";

export default function AdminEvaluationDatasetsClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Strict Rule 2 & 43: No fake datasets
  const datasets: EvalDatasetItem[] = [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.eval.datasets.title")}
        description={t("admin.eval.datasets.subtitle")}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.evalOverview"), href: "/admin/evaluation" },
          { label: t("admin.sidebar.evalDatasets") },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending")} />
        }
        primaryAction={
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs opacity-60 cursor-not-allowed"
          >
            <Plus className="size-3.5" />
            <span>{t("fixAdmin.eval.datasets.create")}</span>
          </button>
        }
      />

      {/* Golden Dataset Policy (Rule 44) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096] flex items-center gap-3">
        <Star className="size-4 text-amber-500 shrink-0" />
        <p>
          <span className="font-bold text-[#14244B]">{t("fixAdmin.eval.datasets.policyTitle")}</span>{" "}
          {t("admin.eval.datasets.goldenPolicy")}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("fixAdmin.eval.datasets.total")}
          value={null}
          subtitle={t("fixAdmin.common.allFeatures")}
          icon={Database}
          isPending={true}
          pendingText={t("fixAdmin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("fixAdmin.eval.datasets.goldenTitle")}
          value={null}
          subtitle={t("fixAdmin.eval.datasets.goldenSub")}
          icon={Star}
          isPending={true}
          pendingText={t("fixAdmin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("fixAdmin.eval.datasets.testCases")}
          value={null}
          subtitle={t("fixAdmin.eval.datasets.testCasesSub")}
          icon={ShieldCheck}
          isPending={true}
          pendingText={t("fixAdmin.common.backendPending")}
        />
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#607096]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-colors"
            placeholder={t("fixAdmin.eval.datasets.search")}
            type="text"
          />
        </div>
      </div>

      {/* Table / Empty State */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("fixAdmin.eval.datasets.colName")}</th>
                <th className="px-6 py-4">{t("fixAdmin.eval.datasets.colFeature")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.eval.datasets.colVersion")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.eval.datasets.colCases")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.eval.datasets.goldenCol")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.common.status")}</th>
                <th className="px-6 py-4 text-right">{t("fixAdmin.common.details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {datasets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title={t("fixAdmin.eval.datasets.emptyTitle")}
                      description={t("fixAdmin.eval.datasets.emptyDesc")}
                    />
                  </td>
                </tr>
              ) : (
                datasets.map((ds) => (
                  <tr key={ds.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">{ds.name}</td>
                    <td className="px-6 py-4">{ds.feature}</td>
                    <td className="px-6 py-4 text-center font-mono">{ds.version}</td>
                    <td className="px-6 py-4 text-center font-bold">{ds.caseCount}</td>
                    <td className="px-6 py-4 text-center">{ds.isGolden ? t("fixAdmin.eval.datasets.goldenBadge") : "-"}</td>
                    <td className="px-6 py-4 text-center">{ds.status}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/evaluation/datasets/${ds.id}`} className="text-[#204195] font-semibold hover:underline">
                        {t("fixAdmin.common.view")}
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
