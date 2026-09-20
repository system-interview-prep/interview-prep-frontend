"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Server,
  Activity,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Layers,
  HelpCircle,
  Database,
  Cpu,
} from "lucide-react";
import { adminApi, AdminOverviewData } from "@/lib/apiClient";
import { jobProfileApi } from "../services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import AdminSection from "./primitives/AdminSection";

export default function AdminOverviewDashboard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState<AdminOverviewData | null>(null);
  const [jobProfileCount, setJobProfileCount] = useState<number | null>(null);
  const [backendStatus, setBackendStatus] = useState<"healthy" | "unavailable" | "unknown">("unknown");

  const loadDashboardData = async () => {
    try {
      // 1. Fetch Admin Overview
      const overviewRes = await adminApi.getOverview();
      if (overviewRes.data?.success && overviewRes.data.overview) {
        setOverviewData(overviewRes.data.overview);
        setBackendStatus("healthy");
      } else {
        setBackendStatus("unavailable");
      }
    } catch {
      setBackendStatus("unavailable");
    }

    try {
      // 2. Fetch Job profiles count
      const jpRes = await jobProfileApi.list({ limit: 1 });
      setJobProfileCount(jpRes.data.total ?? jpRes.data.items?.length ?? 0);
    } catch {
      setJobProfileCount(null);
    }

    finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  return (
    <div className="space-y-6">
      {/* 0. Header */}
      <AdminPageHeader
        title={t("admin.dashboard.title") || "Tổng quan vận hành sản phẩm"}
        description={t("admin.dashboard.subtitle") || "Theo dõi toàn diện trạng thái hệ thống, phiên phỏng vấn, hồ sơ năng lực và hoạt động AI"}
        breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: t("admin.sidebar.group.overview") || "Tổng quan" }]}
        statusBadge={
          <AdminStatusBadge
            status={backendStatus === "healthy" ? "healthy" : "unavailable"}
            label={backendStatus === "healthy" ? (t("admin.dashboard.systemOnline") || "Hệ thống hoạt động") : (t("admin.dashboard.systemOffline") || "Mất kết nối Backend")}
          />
        }
        primaryAction={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{t("admin.dashboard.refresh") || "Làm mới"}</span>
          </button>
        }
      />

      {/* 1. PRODUCT / SYSTEM STATUS (Strict Rule 16) */}
      <AdminSection
        title={t("admin.dashboard.healthSectionTitle") || "1. Trạng thái các dịch vụ cốt lõi (System Health)"}
        description={t("admin.dashboard.healthSectionSubtitle") || "Giám sát độ sẵn sàng của hạ tầng Backend, Dịch vụ Phỏng vấn, Xử lý CV, Nhà cung cấp AI và Observability"}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#14244B] flex items-center gap-1.5">
                <Server className="size-3.5 text-[#204195]" />
                {t("admin.dashboard.coreBackend") || "Core Backend"}
              </span>
              <AdminStatusBadge
                status={backendStatus === "healthy" ? "healthy" : "unavailable"}
                label={backendStatus === "healthy" ? "Healthy" : "Offline"}
                size="sm"
              />
            </div>
            <p className="text-[11px] text-[#607096]">{t("admin.dashboard.coreBackendSub") || "REST API & PostgreSQL"}</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#14244B] flex items-center gap-1.5">
                <Activity className="size-3.5 text-[#204195]" />
                {t("admin.dashboard.interviewEngine") || "Interview Engine"}
              </span>
              <AdminStatusBadge
                status={backendStatus === "healthy" ? "healthy" : "unknown"}
                label={backendStatus === "healthy" ? "Healthy" : "Unknown"}
                size="sm"
              />
            </div>
            <p className="text-[11px] text-[#607096]">{t("admin.dashboard.interviewEngineSub") || "WebSocket Session Hub"}</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#14244B] flex items-center gap-1.5">
                <FileText className="size-3.5 text-[#607096]" />
                {t("admin.dashboard.cvProcessing") || "CV Processing"}
              </span>
              <AdminStatusBadge status="unknown" label="Unknown" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096]">{t("admin.dashboard.cvProcessingSub") || "Chưa có health endpoint"}</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#14244B] flex items-center gap-1.5">
                <Cpu className="size-3.5 text-[#607096]" />
                {t("admin.dashboard.aiProvider") || "AI Provider"}
              </span>
              <AdminStatusBadge status="unknown" label="Unknown" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096]">{t("admin.dashboard.aiProviderSub") || "LLM Gateway status pending"}</p>
          </div>

          <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#14244B] flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-600" />
                {t("admin.dashboard.observability") || "Observability"}
              </span>
              <AdminStatusBadge status="warning" label="Not Connected" size="sm" />
            </div>
            <p className="text-[11px] text-[#607096]">{t("admin.dashboard.observabilitySub") || "Langfuse / LangSmith pending"}</p>
          </div>
        </div>
      </AdminSection>

      {/* 2. USAGE METRICS (Strict Rule 2 - Real Data from /admin/overview) */}
      <AdminSection
        title={t("admin.dashboard.usageSectionTitle") || "2. Vận hành phỏng vấn (Usage Metrics)"}
        description={t("admin.dashboard.usageSectionSubtitle") || "Thống kê thực tế các phiên phỏng vấn được thực hiện trên hệ thống"}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard
            title={t("admin.dashboard.totalSessions") || "Tổng số phiên phỏng vấn"}
            value={overviewData?.totalSessions}
            unit={t("admin.interviews.sessionUnit") || "phiên"}
            subtitle={t("admin.dashboard.totalSessionsSub") || "Toàn bộ lịch sử"}
            icon={MessageSquare}
            isPending={loading || overviewData === null}
            pendingText={t("admin.common.loading") || "Đang tải dữ liệu..."}
          />
          <AdminMetricCard
            title={t("admin.dashboard.activeSessions") || "Phiên đang diễn ra"}
            value={overviewData?.activeSessions}
            unit={t("admin.interviews.sessionUnit") || "phiên"}
            subtitle={t("admin.dashboard.activeSessionsSub") || "STARTED / IN_PROGRESS"}
            icon={Activity}
            status={overviewData?.activeSessions ? "active" : undefined}
            isPending={loading || overviewData === null}
            pendingText={t("admin.common.loading") || "Đang tải dữ liệu..."}
          />
          <AdminMetricCard
            title={t("admin.dashboard.completedSessions") || "Phiên đã hoàn thành"}
            value={overviewData?.completedSessions}
            unit={t("admin.interviews.sessionUnit") || "phiên"}
            subtitle={t("admin.dashboard.completedSessionsSub") || "Đã chốt kết quả"}
            icon={Clock}
            status={overviewData?.completedSessions ? "success" : undefined}
            isPending={loading || overviewData === null}
            pendingText={t("admin.common.loading") || "Đang tải dữ liệu..."}
          />
          <AdminMetricCard
            title={t("admin.dashboard.averageScore") || "Điểm AI trung bình"}
            value={overviewData?.averageScore ? `${overviewData.averageScore.toFixed(1)}/100` : null}
            subtitle={overviewData?.averageScore ? (t("admin.dashboard.averageScoreSub") || "Dựa trên session đã chấm") : (t("admin.dashboard.averageScoreEmpty") || "Chưa có session có điểm")}
            icon={Sparkles}
            isPending={loading || overviewData === null}
            pendingText={t("admin.common.noData") || "Chưa có dữ liệu"}
          />
        </div>
      </AdminSection>

      {/* 3. AI HEALTH & OBSERVABILITY STATUS (Strict Rules 24 & 25) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminSection
          title={t("admin.dashboard.aiHealthSectionTitle") || "3. Trạng thái AI Observability"}
          description={t("admin.dashboard.aiHealthSectionSubtitle") || "Tích hợp giám sát Traces, Latency, Token và Chi phí suy luận"}
        >
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#14244B]">AI Observability</h3>
                  <AdminStatusBadge status="warning" label="Not connected" size="sm" />
                </div>
                <p className="mt-1.5 text-xs text-[#607096] leading-relaxed">
                  {t("admin.dashboard.aiHealthDesc") || "Cần kết nối nhà cung cấp Observability (như Langfuse hoặc LangSmith) thông qua INTERVIA Backend để giám sát chi tiết Traces, Latency (p50/p95), Tokens, Chi phí và Đánh giá AI."}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Link
                    href="/admin/ai"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#204195] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#183275] transition-colors"
                  >
                    <span>{t("admin.dashboard.exploreAiOps") || "Khám phá AI Operations"}</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="text-xs font-semibold text-[#204195] hover:underline"
                  >
                    {t("admin.dashboard.configIntegration") || "Cấu hình tích hợp"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </AdminSection>

        {/* 4. CONTENT HEALTH */}
        <AdminSection
          title={t("admin.dashboard.contentSectionTitle") || "4. Tình trạng nội dung (Content Health)"}
          description={t("admin.dashboard.contentSectionSubtitle") || "Quản lý hồ sơ công việc, ngành nghề và cơ sở tri thức phục vụ phỏng vấn"}
        >
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#607096]">
                {t("admin.sidebar.jobBoard") || "Mô tả công việc (JD)"}
              </p>
              <div className="mt-2 flex items-baseline gap-1.5">
                {jobProfileCount !== null ? (
                  <span className="text-2xl font-black text-[#14244B]">{jobProfileCount}</span>
                ) : (
                  <span className="text-xs text-[#8A98B8]">{t("admin.common.loading") || "Đang tải..."}</span>
                )}
                <span className="text-xs text-[#607096]">{t("admin.jobProfile.unit") || "JD"}</span>
              </div>
              <Link
                href="/admin/job-descriptions"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#204195] hover:underline"
              >
                <span>{t("admin.common.viewList") || "Xem danh sách"}</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>

          </div>
        </AdminSection>
      </div>

      {/* 5. QUICK ACTIONS & RECENT MODULE ACCESS */}
      <AdminSection
        title={t("admin.dashboard.quickActionsTitle") || "5. Truy cập nhanh các nghiệp vụ quản trị"}
        description={t("admin.dashboard.quickActionsSubtitle") || "Điều hướng nhanh tới các phân hệ nghiệp vụ và vận hành chính"}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/admin/job-descriptions/create"
            className="group flex flex-col items-center rounded-xl border border-[#DCE4F3] bg-white p-4 text-center transition-all hover:border-[#204195] hover:shadow-xs"
          >
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <FileText className="size-5" />
            </div>
            <span className="text-xs font-bold text-[#14244B]">{t("admin.sidebar.createProfile") || "Tạo Job Description"}</span>
            <span className="text-[10.5px] text-[#607096] mt-0.5">{t("admin.dashboard.action.createProfileSub") || "Tải lên JD mới"}</span>
          </Link>

          <Link
            href="/admin/interviews"
            className="group flex flex-col items-center rounded-xl border border-[#DCE4F3] bg-white p-4 text-center transition-all hover:border-[#204195] hover:shadow-xs"
          >
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <MessageSquare className="size-5" />
            </div>
            <span className="text-xs font-bold text-[#14244B]">{t("admin.sidebar.interviews") || "Phiên phỏng vấn"}</span>
            <span className="text-[10.5px] text-[#607096] mt-0.5">{t("admin.dashboard.action.interviewsSub") || "Theo dõi phiên live"}</span>
          </Link>

          <Link
            href="/admin/question-bank"
            className="group flex flex-col items-center rounded-xl border border-[#DCE4F3] bg-white p-4 text-center transition-all hover:border-[#204195] hover:shadow-xs"
          >
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <HelpCircle className="size-5" />
            </div>
            <span className="text-xs font-bold text-[#14244B]">{t("admin.sidebar.questionBank") || "Ngân hàng câu hỏi"}</span>
            <span className="text-[10.5px] text-[#607096] mt-0.5">{t("admin.dashboard.action.questionBankSub") || "Bộ câu hỏi tuyển dụng"}</span>
          </Link>

          <Link
            href="/admin/knowledge-base"
            className="group flex flex-col items-center rounded-xl border border-[#DCE4F3] bg-white p-4 text-center transition-all hover:border-[#204195] hover:shadow-xs"
          >
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <Database className="size-5" />
            </div>
            <span className="text-xs font-bold text-[#14244B]">{t("admin.sidebar.knowledgeBase") || "Cơ sở tri thức"}</span>
            <span className="text-[10.5px] text-[#607096] mt-0.5">{t("admin.dashboard.action.knowledgeSub") || "RAG & Tài liệu mẫu"}</span>
          </Link>

          <Link
            href="/admin/ai"
            className="group flex flex-col items-center rounded-xl border border-[#DCE4F3] bg-white p-4 text-center transition-all hover:border-[#204195] hover:shadow-xs"
          >
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <Sparkles className="size-5" />
            </div>
            <span className="text-xs font-bold text-[#14244B]">{t("admin.sidebar.aiOverview") || "AI Operations"}</span>
            <span className="text-[10.5px] text-[#607096] mt-0.5">{t("admin.dashboard.action.aiOpsSub") || "Model & Prompts"}</span>
          </Link>

          <Link
            href="/admin/insights"
            className="group flex flex-col items-center rounded-xl border border-[#DCE4F3] bg-white p-4 text-center transition-all hover:border-[#204195] hover:shadow-xs"
          >
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195] group-hover:bg-[#204195] group-hover:text-white transition-colors">
              <Layers className="size-5" />
            </div>
            <span className="text-xs font-bold text-[#14244B]">{t("admin.sidebar.insights") || "Phân tích sản phẩm"}</span>
            <span className="text-[10.5px] text-[#607096] mt-0.5">{t("admin.dashboard.action.insightsSub") || "Insights & Xu hướng"}</span>
          </Link>
        </div>
      </AdminSection>
    </div>
  );
}
