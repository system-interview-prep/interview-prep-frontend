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
        title={t("admin.eval.datasets.title") || "Quản lý Bộ dữ liệu kiểm thử (Evaluation Datasets)"}
        description={t("admin.eval.datasets.subtitle") || "Quản lý các tập dữ liệu mẫu chuẩn (Golden Sets) dùng để benchmark độ chính xác của AI và phát hiện hồi quy"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.evalOverview") || "Evaluation", href: "/admin/evaluation" },
          { label: t("admin.sidebar.evalDatasets") || "Datasets" },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending") || "Backend Integration Pending"} />
        }
        primaryAction={
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-xl bg-[#204195] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs opacity-60 cursor-not-allowed"
          >
            <Plus className="size-3.5" />
            <span>Tạo Dataset mới (Pending BE)</span>
          </button>
        }
      />

      {/* Golden Dataset Policy (Rule 44) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096] flex items-center gap-3">
        <Star className="size-4 text-amber-500 shrink-0" />
        <p>
          <span className="font-bold text-[#14244B]">Chính sách Golden Dataset (Rule 44):</span>{" "}
          {t("admin.eval.datasets.goldenPolicy") || "Dữ liệu người dùng trên môi trường production không bao giờ được tự động chuyển thành Golden Dataset. Mỗi tập dữ liệu vàng phải qua quy trình: Draft → Reviewed → Approved trước khi dùng làm tiêu chuẩn đánh giá."}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title="Tổng số Datasets"
          value={null}
          subtitle="Tất cả các tính năng"
          icon={Database}
          isPending={true}
          pendingText="Backend pending"
        />
        <AdminMetricCard
          title="Golden Datasets"
          value={null}
          subtitle="Đã duyệt làm chuẩn benchmark"
          icon={Star}
          isPending={true}
          pendingText="Backend pending"
        />
        <AdminMetricCard
          title="Tổng số Test Cases"
          value={null}
          subtitle="Mẫu đánh giá thực nghiệm"
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
            placeholder="Tìm theo tên dataset hoặc tính năng..."
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
                <th className="px-6 py-4">Tên Dataset</th>
                <th className="px-6 py-4">Tính năng (Feature)</th>
                <th className="px-6 py-4 text-center">Phiên bản</th>
                <th className="px-6 py-4 text-center">Số Cases</th>
                <th className="px-6 py-4 text-center">Golden Set</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {datasets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title="Chưa kết nối API Datasets"
                      description="Giao diện quản lý bộ dữ liệu đánh giá đã sẵn sàng. Core Backend cần triển khai endpoint GET /admin/eval/datasets để hiển thị danh sách tập dữ liệu kiểm thử."
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
                    <td className="px-6 py-4 text-center">{ds.isGolden ? "★ Golden" : "-"}</td>
                    <td className="px-6 py-4 text-center">{ds.status}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/evaluation/datasets/${ds.id}`} className="text-[#204195] font-semibold hover:underline">
                        Xem
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
