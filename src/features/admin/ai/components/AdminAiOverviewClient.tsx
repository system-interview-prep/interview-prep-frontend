"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Activity,
  Clock,
  Coins,
  ShieldCheck,
  ArrowUpRight,
  Terminal,
  Box,
  GitBranch,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import { aiOpsService } from "../services/aiOps.service";
import { AIOverviewStats, ObservabilityConnectionStatus } from "../types/aiOps.types";

export default function AdminAiOverviewClient() {
  const { t } = useLanguage();
  const [connectionStatus, setConnectionStatus] = useState<ObservabilityConnectionStatus>("NOT_CONNECTED");
  const [stats, setStats] = useState<AIOverviewStats | null>(null);

  useEffect(() => {
    async function loadData() {
      const [conn, st] = await Promise.all([
        aiOpsService.getConnectionStatus(),
        aiOpsService.getOverview(),
      ]);
      setConnectionStatus(conn);
      setStats(st);
    }
    loadData();
  }, []);

  const isConnected = connectionStatus === "CONNECTED";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.ai.overview.title") || "AI Operations Console"}
        description={t("admin.ai.overview.subtitle") || "Bảng điều khiển vận hành trí tuệ nhân tạo: Giám sát độ ổn định, hiệu năng suy luận, độ trễ và chi phí token"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview") || "AI Operations" },
        ]}
        statusBadge={
          <AdminStatusBadge
            status={isConnected ? "healthy" : "warning"}
            label={isConnected ? "Observability Connected" : (t("admin.dashboard.observabilitySub") || "Provider Not Connected")}
          />
        }
      />

      {/* Observability Connection Banner (Rule 25) */}
      {!isConnected && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <Sparkles className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#14244B]">AI Observability</h3>
                  <AdminStatusBadge status="warning" label="Not connected" size="sm" />
                </div>
                <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#607096] leading-relaxed">
                  Kết nối nhà cung cấp Observability (Langfuse hoặc LangSmith) thông qua INTERVIA Backend
                  để tự động thu thập Traces, đo đạc độ trễ p50/p95, số lượng token, chi phí và chất lượng đánh giá.
                </p>
              </div>
            </div>

            <Link
              href="/admin/settings"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#204195] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#183275] transition-all"
            >
              <span>Xem hướng dẫn kết nối</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* AI Health & Operational Questions (Rule 24) */}
      <AdminSection
        title={t("admin.ai.overview.checklistTitle") || "Tình trạng vận hành AI (AI Health Checklist)"}
        description={t("admin.ai.overview.checklistDesc") || "Giải đáp các câu hỏi trọng tâm về độ sẵn sàng và chất lượng của hệ thống AI"}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("admin.ai.overview.q1") || "1. AI có hoạt động bình thường?"}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-black text-[#14244B]">{t("admin.ai.overview.q1Ans") || "Gateway Sẵn sàng"}</span>
              <AdminStatusBadge status="healthy" label="Online" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">Gemini 2.5 active trên Core Backend</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("admin.ai.overview.q2") || "2. Chất lượng có suy giảm?"}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">{t("admin.ai.overview.q2Ans") || "Chưa đo lường"}</span>
              <AdminStatusBadge status="unknown" label="Unknown" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">Cần kết nối Evaluation Suite</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("admin.ai.overview.q3") || "3. Độ trễ có tăng cao?"}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">{t("admin.ai.overview.q3Ans") || "Chưa có dữ liệu"}</span>
              <AdminStatusBadge status="unknown" label="Unknown" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">Cần kết nối Tracing provider</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
            <span className="text-xs font-bold text-[#607096] block mb-1">{t("admin.ai.overview.q4") || "4. Có request bị lỗi?"}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold italic text-[#8A98B8]">{t("admin.ai.overview.q4Ans") || "Chưa có log"}</span>
              <AdminStatusBadge status="unknown" label="Unknown" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096] mt-2">Cần thu thập qua proxy endpoint</p>
          </div>
        </div>
      </AdminSection>

      {/* Overview Metrics (Rule 24 & Strict Rule 2 - No hardcoded zeroes or fake numbers) */}
      <AdminSection
        title={t("admin.ai.overview.metricsTitle") || "Chỉ số hiệu năng & Chi phí (Observability Metrics)"}
        description={t("admin.ai.overview.metricsDesc") || "Các số đo thực tế từ hạ tầng giám sát mô hình ngôn ngữ"}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard
            title={t("admin.ai.overview.stat.runs") || "Số lượt chạy (AI Runs)"}
            value={stats?.runs}
            subtitle="Tổng số lượt gọi LLM"
            icon={Activity}
            isPending={!isConnected}
            pendingText={t("admin.common.backendPending") || "Chưa kết nối provider"}
          />
          <AdminMetricCard
            title={t("admin.ai.overview.stat.successRate") || "Tỷ lệ thành công"}
            value={stats?.successRate ? `${stats.successRate}%` : null}
            subtitle="Tỷ lệ phản hồi hợp lệ"
            icon={ShieldCheck}
            isPending={!isConnected}
            pendingText={t("admin.common.backendPending") || "Chưa kết nối provider"}
          />
          <AdminMetricCard
            title={t("admin.ai.overview.stat.latency") || "Độ trễ p50 / p95"}
            value={stats?.p50LatencyMs ? `${stats.p50LatencyMs}ms / ${stats.p95LatencyMs}ms` : null}
            subtitle="Thời gian phản hồi suy luận"
            icon={Clock}
            isPending={!isConnected}
            pendingText={t("admin.common.backendPending") || "Chưa kết nối provider"}
          />
          <AdminMetricCard
            title={t("admin.ai.overview.stat.tokensCost") || "Tổng Tokens & Chi phí"}
            value={stats?.totalTokens ? `${stats.totalTokens.toLocaleString()} tokens` : null}
            subtitle={stats?.estimatedCostUsd ? `$${stats.estimatedCostUsd.toFixed(2)} USD` : "Ước tính tiêu thụ"}
            icon={Coins}
            isPending={!isConnected}
            pendingText={t("admin.common.backendPending") || "Chưa kết nối provider"}
          />
        </div>
      </AdminSection>

      {/* Sub-module Shortcuts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/ai/models"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <Box className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">{t("admin.sidebar.aiModels") || "Model Registry"}</h4>
          <p className="text-xs text-[#607096] mt-1">
            {t("admin.ai.models.subtitle") || "Cấu hình các mô hình AI cho từng tính năng: CV Parser, Matching, Phỏng vấn và Chấm điểm"}
          </p>
        </Link>

        <Link
          href="/admin/ai/prompts"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <Terminal className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">{t("admin.sidebar.aiPrompts") || "Quản lý Prompts"}</h4>
          <p className="text-xs text-[#607096] mt-1">
            {t("admin.ai.prompts.subtitle") || "Theo dõi phiên bản, template và quy trình promote prompt từ Staging lên Production"}
          </p>
        </Link>

        <Link
          href="/admin/ai/traces"
          className="group rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs hover:border-[#204195] transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <GitBranch className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-[#607096] group-hover:text-[#204195]" />
          </div>
          <h4 className="text-sm font-bold text-[#14244B]">{t("admin.sidebar.aiTraces") || "Traces & Sự cố (Errors)"}</h4>
          <p className="text-xs text-[#607096] mt-1">
            {t("admin.ai.traces.subtitle") || "Tra cứu vết thực thi (Spans, Tokens, Latency) và phân tích các lỗi phát sinh trong quá trình gọi LLM"}
          </p>
        </Link>
      </div>
    </div>
  );
}
