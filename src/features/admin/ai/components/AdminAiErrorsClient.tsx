"use client";

import { AlertOctagon, AlertTriangle, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { AIErrorGroup } from "../types/aiOps.types";

export default function AdminAiErrorsClient() {
  const { t } = useLanguage();
  // Strict Rule 2 & 40: No fabricated errors.
  const errors: AIErrorGroup[] = [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.ai.errors.title")}
        description={t("admin.ai.errors.subtitle")}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview"), href: "/admin/ai" },
          { label: t("admin.sidebar.aiErrors") },
        ]}
        statusBadge={
          <AdminStatusBadge status="warning" label={t("admin.dashboard.observabilitySub")} />
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("fixAdmin.ai.errors.total")}
          value={null}
          subtitle={t("fixAdmin.ai.errors.totalSub")}
          icon={AlertOctagon}
          isPending={true}
          pendingText={t("fixAdmin.ai.providerNotConnected")}
        />
        <AdminMetricCard
          title={t("fixAdmin.ai.errors.commonType")}
          value={null}
          subtitle={t("fixAdmin.ai.errors.commonTypeSub")}
          icon={AlertTriangle}
          isPending={true}
          pendingText={t("fixAdmin.ai.providerNotConnected")}
        />
        <AdminMetricCard
          title={t("fixAdmin.ai.errors.retryRate")}
          value={null}
          subtitle={t("fixAdmin.ai.errors.retryRateSub")}
          icon={ShieldCheck}
          isPending={true}
          pendingText={t("fixAdmin.ai.providerNotConnected")}
        />
      </div>

      {/* Errors Table / Empty State */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("fixAdmin.ai.errors.colFeature")}</th>
                <th className="px-6 py-4">{t("fixAdmin.ai.errors.colProviderModel")}</th>
                <th className="px-6 py-4">{t("fixAdmin.ai.errors.colType")}</th>
                <th className="px-6 py-4 text-center">{t("fixAdmin.ai.errors.colCount")}</th>
                <th className="px-6 py-4">{t("fixAdmin.ai.errors.colLast")}</th>
                <th className="px-6 py-4 text-right">{t("fixAdmin.common.details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {errors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title={t("fixAdmin.ai.errors.emptyTitle")}
                      description={t("fixAdmin.ai.errors.emptyDesc")}
                    />
                  </td>
                </tr>
              ) : (
                errors.map((err) => (
                  <tr key={err.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">{err.feature}</td>
                    <td className="px-6 py-4">{err.provider} - {err.model}</td>
                    <td className="px-6 py-4 font-mono text-rose-600">{err.errorType}</td>
                    <td className="px-6 py-4 text-center font-bold">{err.count}</td>
                    <td className="px-6 py-4">{err.lastOccurrence}</td>
                    <td className="px-6 py-4 text-right">{t("fixAdmin.common.view")}</td>
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
