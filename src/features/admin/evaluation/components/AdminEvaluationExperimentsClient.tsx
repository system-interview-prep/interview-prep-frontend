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
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.eval.experiments.title") || "Thử nghiệm so sánh đối đầu (A/B Experiments)"}
        description={t("admin.eval.experiments.subtitle") || "So sánh hiệu năng giữa Variant A và Variant B (Model, Prompt, Rubric) trên cùng một bộ dữ liệu kiểm thử"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.evalOverview") || "Evaluation", href: "/admin/evaluation" },
          { label: t("admin.sidebar.evalExperiments") || "Thử nghiệm so sánh" },
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
            <span>Tạo Thử nghiệm mới (Pending BE)</span>
          </button>
        }
      />

      {/* Strict Decision Rule (Rule 46) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096] flex items-center gap-3">
        <Scale className="size-4 text-[#204195] shrink-0" />
        <p>
          <span className="font-bold text-[#14244B]">Nguyên tắc thẩm định khách quan (Rule 46):</span>{" "}
          {t("admin.eval.experiments.objectiveRule") || "Giao diện tuyệt đối không tự ý gán nhãn \"Winner\" (Người chiến thắng) thiên kiến. INTERVIA hiển thị đầy đủ các chiều: Điểm chất lượng, Độ trễ p50/p95, Chi phí suy luận, Số ca hồi quy để Quản trị viên đưa ra quyết định toàn diện."}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title="Tổng số thử nghiệm"
          value={null}
          subtitle="Các đợt chạy A/B benchmark"
          icon={FlaskConical}
          isPending={true}
          pendingText="Backend pending"
        />
        <AdminMetricCard
          title="Thử nghiệm hoàn tất"
          value={null}
          subtitle="Đã có kết quả đối chiếu"
          icon={FlaskConical}
          isPending={true}
          pendingText="Backend pending"
        />
        <AdminMetricCard
          title="Tỷ lệ hồi quy trung bình"
          value={null}
          subtitle="Tỷ lệ ca suy giảm chất lượng"
          icon={GitCompare}
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
            placeholder="Tìm theo tên thử nghiệm hoặc dataset..."
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
                <th className="px-6 py-4">Tên thử nghiệm</th>
                <th className="px-6 py-4">Bộ Dataset đối chiếu</th>
                <th className="px-6 py-4">Biến thể A (Baseline)</th>
                <th className="px-6 py-4">Biến thể B (Candidate)</th>
                <th className="px-6 py-4 text-center">Ca hồi quy</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {experiments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title="Chưa kết nối API Thử nghiệm (Experiments)"
                      description="Giao diện đối chiếu đa chiều A/B đã hoàn thiện. Core Backend cần triển khai endpoint GET /admin/eval/experiments để nạp dữ liệu chạy thử nghiệm."
                    />
                  </td>
                </tr>
              ) : (
                experiments.map((exp) => (
                  <tr key={exp.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">{exp.name}</td>
                    <td className="px-6 py-4">{exp.datasetName}</td>
                    <td className="px-6 py-4">{exp.variantA.label}</td>
                    <td className="px-6 py-4">{exp.variantB.label}</td>
                    <td className="px-6 py-4 text-center text-rose-600 font-bold">{exp.regressionsCount}</td>
                    <td className="px-6 py-4 text-center">{exp.status}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/evaluation/experiments/${exp.id}`} className="text-[#204195] font-semibold hover:underline">
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
