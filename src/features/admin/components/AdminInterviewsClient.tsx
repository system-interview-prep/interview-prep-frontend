"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Video,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Mic,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { adminApi, AdminSessionItem } from "@/lib/apiClient";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminMetricCard from "./primitives/AdminMetricCard";

type InterviewType = "video" | "chat" | "voice";
type InterviewStatus = "completed" | "scheduled" | "action_needed";

function renderTypeIcon(type: InterviewType) {
  if (type === "video") return <Video className="size-4" />;
  if (type === "chat") return <MessageSquare className="size-4" />;
  return <Mic className="size-4" />;
}

function statusPill(status: InterviewStatus, t: (key: string) => string) {
  if (status === "completed") {
    return {
      className:
        "inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide",
      label: t("admin.dashboard.stat.completedSessions") || "Hoàn thành",
    };
  }
  if (status === "scheduled") {
    return {
      className:
        "inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wide",
      label: t("admin.dashboard.stat.activeSessions") || "Đang mở",
    };
  }
  return {
    className:
      "inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wide",
    label: t("admin.common.status") || "Cần xử lý",
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
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMode, setSelectedMode] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchSessions = useCallback(async (mode: string, search: string) => {
    try {
      setIsLoading(true);
      const res = await adminApi.getSessions({
        mode,
        search: search.trim() || undefined,
        limit: 100,
      });
      if (res.data?.success) {
        setSessions(res.data.sessions || []);
        setTotalCount(res.data.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch admin sessions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(selectedMode, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSessions, selectedMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(selectedMode, searchQuery);
  };

  // Calculate real-time stats from fetched sessions
  const activeSessionsCount = sessions.filter((s) => s.status === "scheduled").length;
  const completedSessionsCount = sessions.filter((s) => s.status === "completed").length;
  const scoredSessions = sessions.filter((s) => typeof s.aiScore === "number");
  const avgScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((acc, curr) => acc + (curr.aiScore || 0), 0) /
            scoredSessions.length
        )
      : 0;

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
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all cursor-pointer"
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
          unit={`/ ${totalCount} ${t("admin.dashboard.stat.jobProfilesUnit") || "phiên"}`}
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
          unit={t("admin.dashboard.stat.jobProfilesUnit") || "phiên"}
          subtitle={t("admin.dashboard.stat.completedSessionsSub") || "Đã chốt kết quả"}
          status={completedSessionsCount > 0 ? "success" : undefined}
          icon={Mic}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#607096]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none transition-colors"
            placeholder={t("admin.search.sessionsCandidates") || "Tìm theo tên hoặc email ứng viên..."}
            type="text"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedMode("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedMode === "all"
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
            }`}
          >
            {t("admin.filter.allModes") || "Tất cả"}
          </button>
          <button
            onClick={() => setSelectedMode("video")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedMode === "video"
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
            }`}
          >
            {t("admin.filter.videoOnly") || "Video"}
          </button>
          <button
            onClick={() => setSelectedMode("chat")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedMode === "chat"
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
            }`}
          >
            {t("admin.filter.chatOnly") || "Chat"}
          </button>
          <button
            onClick={() => setSelectedMode("voice")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
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
                <th className="px-6 py-4 text-right">{t("admin.interviews.table.actions") || "Thao tác"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#607096]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="size-6 animate-spin text-[#204195]" />
                      <span className="text-xs font-medium">{t("admin.common.loading") || "Đang tải danh sách phiên phỏng vấn từ máy chủ..."}</span>
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#607096]">
                    {t("admin.common.noData") || "Không tìm thấy phiên phỏng vấn nào phù hợp."}
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
                        <p className="font-semibold text-[#14244B]">{row.position}</p>
                        <p className="text-[11px] text-[#607096]">{row.teamAndLocation}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] p-1.5 text-[#204195]">
                          {renderTypeIcon(row.type)}
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
                      <td className="px-6 py-4 text-right">
                        <button className="font-semibold text-[#204195] hover:underline">
                          {t("admin.common.view") || "Xem chi tiết"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#EAEFF8] bg-[#F8FAFC] px-6 py-3 text-xs font-medium text-[#607096]">
          <span>{sessions.length} / {totalCount} {t("admin.dashboard.stat.jobProfilesUnit") || "phiên phỏng vấn"}</span>
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-1.5 hover:bg-white text-[#204195] transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <span className="rounded-lg bg-white px-3 py-1 font-bold text-[#204195] shadow-xs border border-[#DCE4F3]">
              1
            </span>
            <button className="rounded-lg p-1.5 hover:bg-white text-[#204195] transition-colors">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
