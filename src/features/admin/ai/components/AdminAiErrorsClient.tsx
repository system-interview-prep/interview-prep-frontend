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
        title={t("admin.ai.errors.title") || "Nhật ký Sự cố AI (AI Errors & Exceptions)"}
        description={t("admin.ai.errors.subtitle") || "Tổng hợp và phân nhóm các lỗi phát sinh từ LLM Gateway: Timeout, Rate limit, Invalid JSON output, Schema mismatch"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview") || "AI Operations", href: "/admin/ai" },
          { label: t("admin.sidebar.aiErrors") || "Sự cố AI" },
        ]}
        statusBadge={
          <AdminStatusBadge status="warning" label={t("admin.dashboard.observabilitySub") || "Observability Not Connected"} />
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title="Tổng số lỗi ghi nhận"
          value={null}
          subtitle="Exceptions từ LLM Gateway"
          icon={AlertOctagon}
          isPending={true}
          pendingText="Chưa kết nối provider"
        />
        <AdminMetricCard
          title="Loại lỗi phổ biến"
          value={null}
          subtitle="Tần suất xuất hiện cao nhất"
          icon={AlertTriangle}
          isPending={true}
          pendingText="Chưa kết nối provider"
        />
        <AdminMetricCard
          title="Tỷ lệ yêu cầu thử lại"
          value={null}
          subtitle="Retry rate sau lỗi"
          icon={ShieldCheck}
          isPending={true}
          pendingText="Chưa kết nối provider"
        />
      </div>

      {/* Errors Table / Empty State */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">Tính năng phát sinh lỗi</th>
                <th className="px-6 py-4">Nhà cung cấp & Mô hình</th>
                <th className="px-6 py-4">Loại lỗi (Error Type)</th>
                <th className="px-6 py-4 text-center">Số lần (Count)</th>
                <th className="px-6 py-4">Lần gần nhất</th>
                <th className="px-6 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {errors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title="Chưa có dữ liệu sự cố AI (Observability Not Connected)"
                      description="INTERVIA Backend cần kết nối với nhà cung cấp Observability để tự động gom cụm các lỗi gọi LLM (như 429 Rate Limit, 504 Gateway Timeout, Bad JSON response) và hiển thị tại đây."
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
                    <td className="px-6 py-4 text-right">Xem</td>
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
