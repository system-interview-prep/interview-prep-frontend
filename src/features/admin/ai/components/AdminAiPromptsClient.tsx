"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, Search, Plus, GitBranch, Lock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { AIPromptItem } from "../types/aiOps.types";

export default function AdminAiPromptsClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Since backend endpoint GET /admin/ai/prompts is missing,
  // we do not invent fake prompts.
  const prompts: AIPromptItem[] = [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.ai.prompts.title") || "Quản lý System Prompts & Templates"}
        description={t("admin.ai.prompts.subtitle") || "Theo dõi phiên bản, nội dung prompt và quy trình promote an toàn từ Staging sang Production"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview") || "AI Operations", href: "/admin/ai" },
          { label: t("admin.sidebar.aiPrompts") || "Quản lý Prompts" },
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
            <span>{t("admin.ai.prompts.createDraft") || "Tạo Draft Prompt (Pending BE)"}</span>
          </button>
        }
      />

      {/* Safety Notice (Rule 31) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096] flex items-start gap-3">
        <Lock className="size-4 text-[#204195] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#14244B]">Quy trình quản lý phiên bản Prompt chuẩn (Rule 31):</p>
          <p className="mt-0.5 leading-relaxed">
            {t("admin.ai.prompts.safetyNotice") || "Hệ thống không cho phép sửa đè trực tiếp lên Production prompt. Quy trình chuẩn bắt buộc: v1.0 Production → Tạo v1.1 Draft → Chạy Evaluation Benchmark → Review Phê duyệt → Promote sang Production."}
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title="Tổng số Prompts"
          value={null}
          subtitle="Tất cả các tính năng"
          icon={Terminal}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
        />
        <AdminMetricCard
          title="Bản nháp đang thử nghiệm"
          value={null}
          subtitle="Draft versions"
          icon={GitBranch}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
        />
        <AdminMetricCard
          title="Phiên bản Production"
          value={null}
          subtitle="Đang phục vụ người dùng"
          icon={Lock}
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
            placeholder="Tìm kiếm theo tên prompt, key hoặc capability..."
            type="text"
          />
        </div>
      </div>

      {/* Prompts Table / Empty State */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.ai.prompts.table.name") || "Tên Prompt & Key"}</th>
                <th className="px-6 py-4">{t("admin.ai.prompts.table.capability") || "Năng lực (Capability)"}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.prompts.table.version") || "Phiên bản"}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.prompts.table.env") || "Môi trường"}</th>
                <th className="px-6 py-4">{t("admin.ai.prompts.table.updatedBy") || "Người cập nhật"}</th>
                <th className="px-6 py-4">{t("admin.ai.prompts.table.updatedAt") || "Thời gian"}</th>
                <th className="px-6 py-4 text-right">{t("admin.ai.prompts.table.actions") || "Thao tác"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {prompts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title={t("admin.ai.prompts.emptyTitle") || "Chưa kết nối API Quản lý Prompts"}
                      description={t("admin.ai.prompts.emptyDesc") || "Giao diện theo dõi và quản trị prompt đã sẵn sàng. Core Backend cần triển khai endpoint GET /admin/ai/prompts để hiển thị danh sách prompt và lịch sử các phiên bản."}
                    />
                  </td>
                </tr>
              ) : (
                prompts.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">
                      {p.name}
                      <span className="block text-[11px] font-mono font-normal text-[#607096]">{p.promptKey}</span>
                    </td>
                    <td className="px-6 py-4">{p.capability}</td>
                    <td className="px-6 py-4 text-center font-mono font-semibold">{p.currentVersion}</td>
                    <td className="px-6 py-4 text-center">{p.environment}</td>
                    <td className="px-6 py-4">{p.updatedBy}</td>
                    <td className="px-6 py-4">{p.updatedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/ai/prompts/${p.id}`} className="text-[#204195] font-semibold hover:underline">
                        {t("admin.common.view") || "Xem chi tiết"}
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
