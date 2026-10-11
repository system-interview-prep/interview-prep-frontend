"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Video,
  Search,
  MessageSquare,
  Mic,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { Pagination } from "@components/shared/Pagination";
import { adminApi, AdminSessionItem, type AdminSessionStats } from "@/lib/apiClient";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminEmptyState from "./primitives/AdminEmptyState";

const PAGE_SIZE = 10;

type InterviewType = "video" | "chat" | "voice";
type InterviewStatus = "completed" | "scheduled" | "action_needed";

function renderTypeIcon(type: InterviewType) {
  if (type === "video") return <Video className="size-3.5" aria-hidden="true" />;
  if (type === "chat") return <MessageSquare className="size-3.5" aria-hidden="true" />;
  return <Mic className="size-3.5" aria-hidden="true" />;
}

const PILL_BASE =
  "inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide";

function statusPill(status: InterviewStatus, t: (key: string) => string) {
  if (status === "completed") {
    return {
      className: `${PILL_BASE} bg-[#EEF7F1] text-[#287A4B] border-[#CFE6D8]`,
      label: t("fixAdmin.ops.interviews.status.completed"),
    };
  }
  if (status === "scheduled") {
    return {
      className: `${PILL_BASE} bg-[#F0F4FC] text-[#204195] border-[#DCE4F3]`,
      label: t("fixAdmin.ops.interviews.status.scheduled"),
    };
  }
  return {
    className: `${PILL_BASE} bg-[#FFF7E3] text-[#8A5A00] border-[#FCE3A6]`,
    label: t("fixAdmin.ops.interviews.status.actionNeeded"),
  };
}

interface AdminInterviewsClientProps {
  dictionary?: Record<string, string>;
}

export default function AdminInterviewsClient({
  dictionary,
}: AdminInterviewsClientProps) {
  const { t: hookT } = useLanguage();
  const t = (key: string) => hookT(key) || dictionary?.[key] || key;

  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<AdminSessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchSessions = useCallback(async (mode: string, search: string, pageNumber = 1) => {
    try {
      setIsLoading(true);
      setLoadError(false);
      const res = await adminApi.getSessions({
        mode,
        search: search.trim() || undefined,
        limit: PAGE_SIZE,
        offset: (pageNumber - 1) * PAGE_SIZE,
      });
      if (res.data?.success) {
        setSessions(res.data.sessions || []);
        setTotalCount(res.data.total || 0);
        setStats(res.data.stats ?? null);
        setPage(pageNumber);
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error("Failed to fetch admin sessions:", err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(selectedMode, searchQuery, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSessions, selectedMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(selectedMode, searchQuery, 1);
  };

  // Stats cover every matching session (computed by the API), not just this page.
  const activeSessionsCount = stats?.active ?? 0;
  const completedSessionsCount = stats?.completed ?? 0;
  const avgScore = stats?.avgScore ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title={t("admin.interviews.title") || "Quản lý Phiên Phỏng vấn"}
        description={t("admin.interviews.subtitle") || "Theo dõi và đánh giá toàn bộ các phiên phỏng vấn diễn ra trên hệ thống."}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.interviews") || "Phiên phỏng vấn" },
        ]}
        primaryAction={
          <button
            onClick={() => fetchSessions(selectedMode, searchQuery)}
            className="inline-flex items-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-[#204195]" : "text-[#607096]"}`} />
            <span>{t("admin.common.refresh") || "Làm mới"}</span>
          </button>
        }
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("admin.interviews.stat.activeSessions") || "Phiên đang hoạt động"}
          value={activeSessionsCount}
          unit={`/ ${totalCount} ${t("admin.common.sessionUnit")}`}
          subtitle={t("admin.dashboard.stat.activeSessionsSub") || "STARTED / IN_PROGRESS"}
          status={activeSessionsCount > 0 ? "active" : undefined}
          icon={Video}
        />
        <AdminMetricCard
          title={t("admin.interviews.stat.avgAiScore") || "Điểm AI trung bình"}
          value={avgScore > 0 ? `${avgScore}%` : null}
          subtitle={avgScore > 0 ? (t("admin.dashboard.stat.avgAiScoreSub") || "Toàn bộ phiên đã chấm") : (t("admin.common.noData") || "Chưa có session có điểm")}
          icon={MessageSquare}
          isPending={avgScore === 0}
          pendingText={t("admin.common.noData") || "Chưa có dữ liệu"}
        />
        <AdminMetricCard
          title={t("admin.interviews.stat.avgTurnaround") || "Đã hoàn thành"}
          value={completedSessionsCount}
          unit={t("admin.common.sessionUnit")}
          subtitle={t("admin.dashboard.stat.completedSessionsSub") || "Đã chốt kết quả"}
          status={completedSessionsCount > 0 ? "success" : undefined}
          icon={Mic}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <label htmlFor="admin-interviews-search" className="sr-only">
            {t("fixAdmin.ops.interviews.searchLabel")}
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#607096]" aria-hidden="true" />
          <input
            id="admin-interviews-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-colors"
            placeholder={t("admin.search.sessionsCandidates") || "Tìm theo tên hoặc email ứng viên..."}
            type="text"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedMode("all")}
            aria-pressed={selectedMode === "all"}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedMode === "all"
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
            }`}
          >
            {t("admin.filter.allModes") || "Tất cả"}
          </button>
          <button
            onClick={() => setSelectedMode("video")}
            aria-pressed={selectedMode === "video"}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedMode === "video"
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
            }`}
          >
            {t("admin.filter.videoOnly") || "Video"}
          </button>
          <button
            onClick={() => setSelectedMode("chat")}
            aria-pressed={selectedMode === "chat"}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedMode === "chat"
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
            }`}
          >
            {t("admin.filter.chatOnly") || "Chat"}
          </button>
          <button
            onClick={() => setSelectedMode("voice")}
            aria-pressed={selectedMode === "voice"}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedMode === "voice"
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
            }`}
          >
            {t("admin.filter.voiceOnly") || "Thoại (Voice)"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.interviews.table.candidate") || "Ứng viên"}</th>
                <th className="px-6 py-4">{t("admin.interviews.table.positionRole") || "Vị trí / Ngôn ngữ"}</th>
                <th className="px-6 py-4 text-center">{t("admin.interviews.table.mode") || "Hình thức"}</th>
                <th className="px-6 py-4 text-center">{t("admin.interviews.table.aiScore") || "Điểm AI"}</th>
                <th className="px-6 py-4">{t("admin.interviews.table.dateSubmitted") || "Thời gian"}</th>
                <th className="px-6 py-4">{t("admin.interviews.table.status") || "Trạng thái"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#607096]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-[#204195]" />
                      <span className="text-xs font-medium">{t("admin.common.loading") || "Đang tải danh sách phiên phỏng vấn từ máy chủ..."}</span>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={6} className="p-6">
                    <AdminEmptyState
                      variant="error"
                      title={t("fixAdmin.ops.interviews.errorTitle")}
                      description={t("fixAdmin.ops.interviews.errorDesc")}
                      onRetry={() => fetchSessions(selectedMode, searchQuery)}
                    />
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#607096]">
                    {t("fixAdmin.ops.interviews.empty")}
                  </td>
                </tr>
              ) : (
                sessions.map((row) => {
                  const pill = statusPill(row.status, t);
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FD] font-bold text-[#204195]">
                            {row.candidateInitials}
                          </div>
                          <div>
                            <p className="font-bold text-[#14244B]">{row.candidateName}</p>
                            <p className="text-[11px] text-[#607096]">{row.candidateEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#14244B]">{row.position || "—"}</p>
                        <p className="text-[11px] text-[#607096]">{row.teamAndLocation}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#DCE4F3] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#204195]">
                          {renderTypeIcon(row.type)}
                          {t(`fixAdmin.ops.interviews.mode.${row.type}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.aiScore === "number" ? (
                          <span className="font-headline font-bold text-[#14244B] text-sm">
                            {row.aiScore}%
                          </span>
                        ) : (
                          <span className="font-medium text-[#8A98B8]">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#14244B]">{row.dateLabel}</p>
                        <p className="text-[11px] text-[#607096]">{row.timeLabel}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={pill.className}>{pill.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && !loadError && sessions.length > 0 && (
          <div className="space-y-2 border-t border-[#EAEFF8] bg-[#F8FAFC] px-6 py-3">
            {totalCount > PAGE_SIZE ? (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={totalCount}
                onPageChange={(next) => fetchSessions(selectedMode, searchQuery, next)}
              />
            ) : (
              <p className="text-[13px] text-[#607096] tabular-nums">
                {totalCount} {t("admin.common.sessionUnit")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
