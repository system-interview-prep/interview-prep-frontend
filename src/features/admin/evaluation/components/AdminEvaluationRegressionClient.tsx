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
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.eval.regression.title") || "Kiểm thử hồi quy chất lượng (Regression Detection)"}
        description={t("admin.eval.regression.subtitle") || "Nhận diện và rà soát các trường hợp cụ thể bị giảm điểm sau khi cập nhật mô hình, prompt hoặc rubric mới"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.evalOverview") || "Evaluation", href: "/admin/evaluation" },
          { label: t("admin.sidebar.evalRegression") || "Kiểm thử hồi quy" },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending") || "Backend Integration Pending"} />
        }
      />

      {/* Purpose Banner (Rule 48) */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-[#14244B] flex items-center gap-3">
        <AlertTriangle className="size-4 text-rose-600 shrink-0" />
        <p>
          <span className="font-bold">Mục tiêu phát hiện hồi quy (Rule 48):</span> Đảm bảo không có tính năng nào bị kém đi (made worse) khi nâng cấp. Bất kỳ ca nào có điểm số mới thấp hơn bản cũ phải được review nguyên nhân (prompt ambiguity, hallucination, rubric mismatch) trước khi release.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title="Tổng ca bị hồi quy"
          value={null}
          subtitle="Điểm số sụt giảm sau update"
          icon={AlertTriangle}
          isPending={true}
          pendingText="Backend pending"
        />
        <AdminMetricCard
          title="Cần rà soát (Needs Review)"
          value={null}
          subtitle="Chưa được chuyên gia duyệt"
          icon={GitCompare}
          isPending={true}
          pendingText="Backend pending"
        />
        <AdminMetricCard
          title="Đã xử lý (Resolved)"
          value={null}
          subtitle="Đã fix prompt hoặc cập nhật test"
          icon={ShieldCheck}
          isPending={true}
          pendingText="Backend pending"
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
            placeholder="Tìm theo ID ca kiểm thử hoặc lý do hồi quy..."
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
                <th className="px-6 py-4">Ca kiểm thử (Case)</th>
                <th className="px-6 py-4">Tính năng liên quan</th>
                <th className="px-6 py-4 text-center">Điểm cũ</th>
                <th className="px-6 py-4 text-center">Điểm mới</th>
                <th className="px-6 py-4 text-center">Độ lệch (Delta)</th>
                <th className="px-6 py-4">Lý do nhận định</th>
                <th className="px-6 py-4 text-right">Trạng thái duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {regressionCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title="Chưa có dữ liệu hồi quy (Regression Pending)"
                      description="Hệ thống sẽ tự động liệt kê các case sụt giảm điểm khi có thử nghiệm so sánh A/B được kích hoạt từ Core Backend."
                    />
                  </td>
                </tr>
              ) : (
                regressionCases.map((rc) => (
                  <tr key={rc.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">{rc.caseTitle}</td>
                    <td className="px-6 py-4">{rc.feature}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{rc.previousScore}</td>
                    <td className="px-6 py-4 text-center font-bold text-rose-600">{rc.currentScore}</td>
                    <td className="px-6 py-4 text-center font-mono text-rose-600 font-bold">{rc.delta}</td>
                    <td className="px-6 py-4 text-[#607096]">{rc.reason}</td>
                    <td className="px-6 py-4 text-right">{rc.reviewStatus}</td>
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
