"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Search, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { AITraceItem } from "../types/aiOps.types";

export default function AdminAiTracesClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Real data array - empty until backend connects observability provider
  const traces: AITraceItem[] = [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.ai.traces.title") || "Traces & Execution Logs"}
        description={t("admin.ai.traces.subtitle") || "Theo dõi dòng thực thi chi tiết của từng request gọi mô hình AI: Spans, thời gian suy luận, token và chi phí"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview") || "AI Operations", href: "/admin/ai" },
          { label: t("admin.sidebar.aiTraces") || "Traces & Logs" },
        ]}
        statusBadge={
          <AdminStatusBadge status="warning" label={t("admin.dashboard.observabilitySub") || "Observability Not Connected"} />
        }
      />

      {/* Privacy Notice (Rule 37) */}
      <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096] flex items-center gap-3">
        <ShieldAlert className="size-4 text-[#204195] shrink-0" />
        <p>
          <span className="font-bold text-[#14244B]">Bảo mật dữ liệu vết (Rule 37):</span>{" "}
          {t("admin.ai.traces.privacyNotice") || "Dữ liệu trace tuyệt đối không lưu trữ hay hiển thị API key, bearer token hay cookies. Dữ liệu nhạy cảm của ứng viên luôn được ẩn danh/rút gọn theo chính sách bảo mật."}
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title="Tổng số Traces"
          value={null}
          subtitle="Ghi nhận qua Backend proxy"
          icon={Activity}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Chưa kết nối provider"}
        />
        <AdminMetricCard
          title="Độ trễ trung bình"
          value={null}
          subtitle="Thời gian phản hồi hoàn tất"
          icon={Activity}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Chưa kết nối provider"}
        />
        <AdminMetricCard
          title={t("admin.ai.overview.stat.successRate") || "Tỷ lệ thành công"}
          value={null}
          subtitle="Success / Total Traces"
          icon={Activity}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Chưa kết nối provider"}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#607096]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-colors"
            placeholder="Tìm theo Trace ID, Session ID hoặc Model..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "SUCCESS", "ERROR"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-[#204195] text-white shadow-xs"
                  : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
              }`}
            >
              {st === "all" ? (t("admin.common.all") || "Tất cả trạng thái") : st}
            </button>
          ))}
        </div>
      </div>

      {/* Traces Table / Empty State */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.ai.traces.table.id") || "Trace ID"}</th>
                <th className="px-6 py-4">{t("admin.ai.traces.table.feature") || "Tính năng (Feature)"}</th>
                <th className="px-6 py-4">{t("admin.ai.traces.table.model") || "Mô hình (Model)"}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.traces.table.latency") || "Độ trễ (Latency)"}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.traces.table.tokens") || "Tokens"}</th>
                <th className="px-6 py-4 text-center">{t("admin.ai.traces.table.status") || "Trạng thái"}</th>
                <th className="px-6 py-4">{t("admin.ai.traces.table.timestamp") || "Thời gian"}</th>
                <th className="px-6 py-4 text-right">{t("admin.ai.traces.table.detail") || "Chi tiết"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {traces.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title={t("admin.ai.traces.emptyTitle") || "Chưa có dữ liệu Traces (Observability Not Connected)"}
                      description={t("admin.ai.traces.emptyDesc") || "INTERVIA Backend cần được kết nối với nhà cung cấp Observability (như Langfuse hoặc LangSmith) để gửi dữ liệu traces về giao diện quản trị."}
                    />
                  </td>
                </tr>
              ) : (
                traces.map((tr) => (
                  <tr key={tr.traceId} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-mono font-bold text-[#14244B]">{tr.traceId}</td>
                    <td className="px-6 py-4">{tr.feature}</td>
                    <td className="px-6 py-4 font-mono">{tr.model}</td>
                    <td className="px-6 py-4 text-center">{tr.latencyMs}ms</td>
                    <td className="px-6 py-4 text-center">{tr.tokens}</td>
                    <td className="px-6 py-4 text-center">{tr.status}</td>
                    <td className="px-6 py-4">{tr.timestamp}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/ai/traces/${tr.traceId}`} className="text-[#204195] font-semibold hover:underline">
                        {t("admin.common.view") || "Chi tiết"}
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
