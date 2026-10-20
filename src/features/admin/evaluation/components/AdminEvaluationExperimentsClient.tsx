"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, Search, Plus, GitCompare, Scale } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { EvalExperimentItem } from "../types/evaluation.types";

export default function AdminEvaluationExperimentsClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Strict Rule 2 & 45: No fake experiments
  const experiments: EvalExperimentItem[] = [];

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={t("admin.eval.experiments.title")}
        description={t("admin.eval.experiments.subtitle")}
        breadcrumbs={[
          { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
          { label: t("admin.sidebar.evalOverview"), href: "/admin/evaluation" },
          { label: t("admin.sidebar.evalExperiments") },
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
            <span>{t("fixAdmin.eval.experiments.create")}</span>
          </button>
        }
      />

      {/* Strict Decision Rule (Rule 46) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096] flex items-center gap-3">
        <Scale className="size-4 text-[#204195] shrink-0" />
        <p>
          <span className="font-bold text-[#14244B]">{t("fixAdmin.eval.experiments.ruleTitle")}</span>{" "}
          {t("admin.eval.experiments.objectiveRule")}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("fixAdmin.eval.experiments.total")}
          value={null}
          subtitle={t("fixAdmin.eval.experiments.totalSub")}
          icon={FlaskConical}
          isPending={true}
          pendingText={t("fixAdmin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("fixAdmin.eval.experiments.completed")}
          value={null}
          subtitle={t("fixAdmin.eval.experiments.completedSub")}
          icon={FlaskConical}
          isPending={true}
          pendingText={t("fixAdmin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("fixAdmin.eval.experiments.regressionRate")}
          value={null}
          subtitle={t("fixAdmin.eval.experiments.regressionRateSub")}
          icon={GitCompare}
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
            placeholder={t("fixAdmin.eval.experiments.search")}
            type="text"
          />
        </div>
      </div>

      {/* Table / Empty State */}
      {experiments.length === 0 ? (
        <AdminEmptyState
          variant="pending"
          title={t("fixAdmin.eval.experiments.emptyTitle")}
          description={t("fixAdmin.eval.experiments.emptyDesc")}
        />
      ) : (
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("fixAdmin.eval.experiments.colName")}</th>
                <th className="px-6 py-4">{t("fixAdmin.eval.experiments.colDataset")}</th>
                <th className="px-6 py-4">{t("fixAdmin.eval.experiments.colVariantA")}</th>
                <th className="px-6 py-4">{t("fixAdmin.eval.experiments.colVariantB")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.eval.experiments.colRegressions")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.common.status")}</th>
                <th className="px-6 py-4 text-right">{t("fixAdmin.common.details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {experiments.map((exp) => (
                  <tr key={exp.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">{exp.name}</td>
                    <td className="px-6 py-4">{exp.datasetName}</td>
                    <td className="px-6 py-4">{exp.variantA.label}</td>
                    <td className="px-6 py-4">{exp.variantB.label}</td>
                    <td className="px-6 py-4 text-center text-rose-600 font-bold">{exp.regressionsCount}</td>
                    <td className="px-6 py-4 text-center">{exp.status}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/evaluation/experiments/${exp.id}`} className="text-[#204195] font-semibold hover:underline">
                        {t("fixAdmin.common.view")}
                      </Link>
                    </td>
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
