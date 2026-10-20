"use client";

import { useState } from "react";
import { GitCompare, Search, AlertTriangle, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { EvalRegressionItem } from "../types/evaluation.types";

export default function AdminEvaluationRegressionClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Strict Rule 2 & 48: No fake regression cases
  const regressionCases: EvalRegressionItem[] = [];

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={t("admin.eval.regression.title")}
        description={t("admin.eval.regression.subtitle")}
        breadcrumbs={[
          { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
          { label: t("admin.sidebar.evalOverview"), href: "/admin/evaluation" },
          { label: t("admin.sidebar.evalRegression") },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending")} />
        }
      />

      {/* Purpose Banner (Rule 48) */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-[#14244B] flex items-center gap-3">
        <AlertTriangle className="size-4 text-rose-600 shrink-0" />
        <p>
          <span className="font-bold">{t("fixAdmin.eval.regression.bannerTitle")}</span> {t("fixAdmin.eval.regression.bannerBody")}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("fixAdmin.eval.regression.total")}
          value={null}
          subtitle={t("fixAdmin.eval.regression.totalSub")}
          icon={AlertTriangle}
          isPending={true}
          pendingText={t("fixAdmin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("fixAdmin.eval.regression.needsReview")}
          value={null}
          subtitle={t("fixAdmin.eval.regression.needsReviewSub")}
          icon={GitCompare}
          isPending={true}
          pendingText={t("fixAdmin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("fixAdmin.eval.regression.resolved")}
          value={null}
          subtitle={t("fixAdmin.eval.regression.resolvedSub")}
          icon={ShieldCheck}
          isPending={true}
          pendingText={t("fixAdmin.common.backendPending")}
        />
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#607096]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-colors"
            placeholder={t("fixAdmin.eval.regression.search")}
            type="text"
          />
        </div>
      </div>

      {/* Table / Empty State */}
      {regressionCases.length === 0 ? (
        <AdminEmptyState
          variant="pending"
          title={t("fixAdmin.eval.regression.emptyTitle")}
          description={t("fixAdmin.eval.regression.emptyDesc")}
        />
      ) : (
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("fixAdmin.eval.regression.colCase")}</th>
                <th className="px-6 py-4">{t("fixAdmin.eval.regression.colFeature")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.eval.regression.colOld")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.eval.regression.colNew")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.eval.regression.colDelta")}</th>
                <th className="px-6 py-4">{t("fixAdmin.eval.regression.colReason")}</th>
                <th className="px-6 py-4 text-right">{t("fixAdmin.eval.regression.colReview")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {regressionCases.map((rc) => (
                  <tr key={rc.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">{rc.caseTitle}</td>
                    <td className="px-6 py-4">{rc.feature}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{rc.previousScore}</td>
                    <td className="px-6 py-4 text-center font-bold text-rose-600">{rc.currentScore}</td>
                    <td className="px-6 py-4 text-center font-mono text-rose-600 font-bold">{rc.delta}</td>
                    <td className="px-6 py-4 text-[#607096]">{rc.reason}</td>
                    <td className="px-6 py-4 text-right">{rc.reviewStatus}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
