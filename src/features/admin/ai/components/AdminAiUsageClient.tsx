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
        title={t("admin.ai.usage.title") || "Token & Chi phí suy luận AI (Usage & Cost)"}
        description={t("admin.ai.usage.subtitle") || "Theo dõi chi tiết số lượng tokens tiêu thụ, phân bổ chi phí theo tính năng và độ trễ p50/p95"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview") || "AI Operations", href: "/admin/ai" },
          { label: t("admin.sidebar.aiUsage") || "Token & Chi phí" },
        ]}
        statusBadge={
          <AdminStatusBadge status="warning" label={t("admin.dashboard.observabilitySub") || "Observability Not Connected"} />
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
              {t("admin.ai.usage.7d") || "7 ngày qua"}
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("30d")}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                timeRange === "30d" ? "bg-[#204195] text-white" : "text-[#607096] hover:text-[#14244B]"
              }`}
            >
              {t("admin.ai.usage.30d") || "30 ngày qua"}
            </button>
          </div>
        }
      />

      {/* Metrics Row (Strict Rule 2 - No fake estimates) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title="Tổng Tokens tiêu thụ"
          value={null}
          subtitle="Prompt + Completion tokens"
          icon={Coins}
          isPending={!isConnected}
          pendingText="Chưa kết nối provider"
        />
        <AdminMetricCard
          title="Chi phí ước tính (USD)"
          value={null}
          subtitle="Tính theo bảng giá nhà cung cấp"
          icon={TrendingUp}
          isPending={!isConnected}
          pendingText="Chưa kết nối provider"
        />
        <AdminMetricCard
          title="Độ trễ p50 (Trung vị)"
          value={null}
          unit="ms"
          subtitle="50% request nhanh hơn mức này"
          icon={Clock}
          isPending={!isConnected}
          pendingText="Chưa kết nối provider"
        />
        <AdminMetricCard
          title="Độ trễ p95 (Đỉnh trễ)"
          value={null}
          unit="ms"
          subtitle="95% request hoàn thành trong mức này"
          icon={Clock}
          isPending={!isConnected}
          pendingText="Chưa kết nối provider"
        />
      </div>

      {/* Breakdown by Feature Section */}
      <AdminSection
        title="Phân bổ chi phí & Token theo từng tính năng (Feature Breakdown)"
        description="Đo lường mức tiêu hao tài nguyên AI của CV Parsing, Phỏng vấn trực tiếp và Đánh giá Rubrics"
      >
        <AdminEmptyState
          variant="pending"
          title="Chưa có dữ liệu phân bổ mức tiêu thụ (Observability Required)"
          description="Để theo dõi biểu đồ tiêu hao token theo từng tính năng sản phẩm (7 ngày hoặc 30 ngày), Core Backend cần tích hợp Langfuse/LangSmith proxy endpoint GET /admin/ai/usage."
        />
      </AdminSection>
    </div>
  );
}
