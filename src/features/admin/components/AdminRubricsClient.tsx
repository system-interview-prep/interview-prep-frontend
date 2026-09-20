"use client";

import { useState } from "react";
import { ClipboardCheck, Search, Plus, Award, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminEmptyState from "./primitives/AdminEmptyState";

export interface RubricCriterionItem {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

export interface RubricItem {
  id: string;
  name: string;
  version: string;
  status: "ACTIVE" | "DRAFT" | "DEPRECATED";
  linkedRole: string;
  linkedCompetency: string;
  criteriaCount: number;
  updatedAt: string;
}

export default function AdminRubricsClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Since backend endpoint GET /admin/rubrics is missing,
  // we follow strict rule 2: no fake rubrics.
  const rubrics: RubricItem[] = [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.rubrics.title") || "Tiêu chí chấm điểm (Rubrics Management)"}
        description={t("admin.rubrics.subtitle") || "Quản lý bộ khung tiêu chí đánh giá câu trả lời của AI và chuyên gia theo từng vị trí & năng lực"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.rubrics") || "Tiêu chí chấm điểm" },
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
            <span>{t("admin.rubrics.createRubric") || "Tạo Rubric mới (Pending BE)"}</span>
          </button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("admin.rubrics.stat.total") || "Tổng số Rubrics"}
          value={null}
          subtitle="Bộ tiêu chí trên hệ thống"
          icon={ClipboardCheck}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
        />
        <AdminMetricCard
          title={t("admin.rubrics.stat.active") || "Rubric đang áp dụng"}
          value={null}
          subtitle="Trạng thái Active"
          icon={CheckCircle2}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
        />
        <AdminMetricCard
          title={t("admin.rubrics.stat.latestVersion") || "Phiên bản mới nhất"}
          value={null}
          subtitle="Đang trong quá trình đánh giá"
          icon={Award}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
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
            placeholder={t("admin.rubrics.searchPlaceholder") || "Tìm theo tên rubric, vai trò hoặc năng lực..."}
            type="text"
          />
        </div>
      </div>

      {/* Rubrics Table / Empty State */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.rubrics.table.name") || "Tên Rubric & Phiên bản"}</th>
                <th className="px-6 py-4">{t("admin.rubrics.table.linked") || "Vị trí & Năng lực liên kết"}</th>
                <th className="px-6 py-4 text-center">{t("admin.rubrics.table.criteria") || "Số tiêu chí"}</th>
                <th className="px-6 py-4">{t("admin.rubrics.table.updated") || "Cập nhật lần cuối"}</th>
                <th className="px-6 py-4 text-right">{t("admin.rubrics.table.status") || "Trạng thái"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {rubrics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title={t("admin.rubrics.emptyTitle") || "Chưa kết nối API Rubrics"}
                      description={t("admin.rubrics.emptyDesc") || "Giao diện quản lý bộ tiêu chí rubric đã sẵn sàng. Core Backend cần triển khai endpoint GET /admin/rubrics để đồng bộ hệ thống thang điểm đánh giá."}
                    />
                  </td>
                </tr>
              ) : (
                rubrics.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">
                      {r.name} <span className="ml-1 text-[10px] text-[#607096]">v{r.version}</span>
                    </td>
                    <td className="px-6 py-4">{r.linkedRole} - {r.linkedCompetency}</td>
                    <td className="px-6 py-4 text-center">{r.criteriaCount}</td>
                    <td className="px-6 py-4">{r.updatedAt}</td>
                    <td className="px-6 py-4 text-right">{r.status}</td>
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
