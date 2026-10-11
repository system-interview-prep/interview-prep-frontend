"use client";

import { useState } from "react";
import { Coins, Clock, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import AdminSection from "@features/admin/components/primitives/AdminSection";

export default function AdminAiUsageClient() {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

  // Strict Rule 2 & 38: No arbitrary estimates or fake numbers.
  const isConnected = false;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.ai.usage.title")}
        description={t("admin.ai.usage.subtitle")}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview"), href: "/admin/ai" },
          { label: t("admin.sidebar.aiUsage") },
        ]}
        statusBadge={
          <AdminStatusBadge status="warning" label={t("admin.dashboard.observabilitySub")} />
        }
        primaryAction={
          <div className="flex items-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-white p-1">
            <button
              type="button"
              onClick={() => setTimeRange("7d")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                timeRange === "7d" ? "bg-[#204195] text-white" : "text-[#607096] hover:text-[#14244B]"
              }`}
            >
              {t("admin.ai.usage.7d")}
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("30d")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                timeRange === "30d" ? "bg-[#204195] text-white" : "text-[#607096] hover:text-[#14244B]"
              }`}
            >
              {t("admin.ai.usage.30d")}
            </button>
          </div>
        }
      />

      {/* Metrics Row (Strict Rule 2 - No fake estimates) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title={t("fixAdmin.ai.usage.tokens")}
          value={null}
          subtitle={t("fixAdmin.ai.usage.tokensSub")}
          icon={Coins}
          isPending={!isConnected}
          pendingText={t("fixAdmin.ai.providerNotConnected")}
        />
        <AdminMetricCard
          title={t("fixAdmin.ai.usage.cost")}
          value={null}
          subtitle={t("fixAdmin.ai.usage.costSub")}
          icon={TrendingUp}
          isPending={!isConnected}
          pendingText={t("fixAdmin.ai.providerNotConnected")}
        />
        <AdminMetricCard
          title={t("fixAdmin.ai.usage.p50")}
          value={null}
          unit="ms"
          subtitle={t("fixAdmin.ai.usage.p50Sub")}
          icon={Clock}
          isPending={!isConnected}
          pendingText={t("fixAdmin.ai.providerNotConnected")}
        />
        <AdminMetricCard
          title={t("fixAdmin.ai.usage.p95")}
          value={null}
          unit="ms"
          subtitle={t("fixAdmin.ai.usage.p95Sub")}
          icon={Clock}
          isPending={!isConnected}
          pendingText={t("fixAdmin.ai.providerNotConnected")}
        />
      </div>

      {/* Breakdown by Feature Section */}
      <AdminSection
        title={t("fixAdmin.ai.usage.breakdownTitle")}
        description={t("fixAdmin.ai.usage.breakdownDesc")}
      >
        <AdminEmptyState
          variant="pending"
          title={t("fixAdmin.ai.usage.emptyTitle")}
          description={t("fixAdmin.ai.usage.emptyDesc")}
        />
      </AdminSection>
    </div>
  );
}
