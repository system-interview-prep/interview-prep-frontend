"use client";

import Link from "next/link";
import {
  FlaskConical,
  GitCompare,
  Database,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminSection from "@features/admin/components/primitives/AdminSection";

export default function AdminEvaluationOverviewClient() {
  const { t } = useLanguage();
  const isConnected = false;

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={t("admin.eval.overview.title")}
        description={t("admin.eval.overview.subtitle")}
        breadcrumbs={[
          { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
          { label: t("admin.sidebar.evalOverview") },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending")} />
        }
      />

      {/* Safety Guideline Notice (Rule 50) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#EEF2FD] p-4 text-xs text-[#14244B] flex items-start gap-3">
        <ShieldCheck className="size-5 text-[#204195] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">{t("fixAdmin.eval.overview.safetyTitle")}</p>
          <p className="mt-0.5 text-[#607096] leading-relaxed">
            {t("admin.eval.safetyNotice")}
          </p>
        </div>
      </div>

      {/* Evaluation Core Questions (Rule 42) */}
      <AdminSection
        title={t("fixAdmin.eval.overview.goalsTitle")}
        description={t("fixAdmin.eval.overview.goalsDesc")}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("fixAdmin.eval.overview.q1")}</span>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">{t("fixAdmin.eval.overview.q1Ans")}</span>
              <AdminStatusBadge status="unknown" label={t("fixAdmin.common.pending")} size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">{t("fixAdmin.eval.overview.q1Note")}</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("fixAdmin.eval.overview.q2")}</span>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">{t("fixAdmin.eval.overview.q2Ans")}</span>
              <AdminStatusBadge status="unknown" label={t("fixAdmin.common.pending")} size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">{t("fixAdmin.eval.overview.q2Note")}</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("fixAdmin.eval.overview.q3")}</span>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">{fmt(t("fixAdmin.eval.overview.q3Ans"), { n: 0 })}</span>
              <AdminStatusBadge status="unknown" label={t("fixAdmin.common.empty")} size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">{t("fixAdmin.eval.overview.q3Note")}</p>
          </div>
        </div>
      </AdminSection>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("fixAdmin.eval.overview.datasets")}
          value={null}
          subtitle={t("fixAdmin.eval.overview.datasetsSub")}
          icon={Database}
          isPending={!isConnected}
          pendingText={t("fixAdmin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("fixAdmin.eval.overview.experiments")}
          value={null}
          subtitle={t("fixAdmin.eval.overview.experimentsSub")}
          icon={FlaskConical}
          isPending={!isConnected}
          pendingText={t("fixAdmin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("fixAdmin.eval.overview.regressions")}
          value={null}
          subtitle={t("fixAdmin.eval.overview.regressionsSub")}
          icon={GitCompare}
          isPending={!isConnected}
          pendingText={t("fixAdmin.common.backendPending")}
        />
      </div>

      {/* Evaluation Sub-modules */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/evaluation/datasets"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <Database className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">{t("fixAdmin.eval.overview.datasetsHeading")}</h4>
          <p className="text-xs text-[#607096] mt-1">
            {t("fixAdmin.eval.overview.datasetsLinkDesc")}
          </p>
        </Link>

        <Link
          href="/admin/evaluation/experiments"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <FlaskConical className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">{t("fixAdmin.eval.overview.experiments")}</h4>
          <p className="text-xs text-[#607096] mt-1">
            {t("fixAdmin.eval.overview.experimentsLinkDesc")}
          </p>
        </Link>

        <Link
          href="/admin/evaluation/regression"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <GitCompare className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">{t("fixAdmin.eval.overview.regressionLink")}</h4>
          <p className="text-xs text-[#607096] mt-1">
            {t("fixAdmin.eval.overview.regressionLinkDesc")}
          </p>
        </Link>
      </div>
    </div>
  );
}
