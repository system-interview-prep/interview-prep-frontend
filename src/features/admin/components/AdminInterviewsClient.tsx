"use client";

import Link from "next/link";
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
import { fmt } from "@/i18n/format";
import { Pagination } from "@components/shared/Pagination";
import { adminApi, AdminSessionItem, type AdminSessionStats } from "@/lib/apiClient";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminEmptyState from "./primitives/AdminEmptyState";
import LiveSessionsBoard from "@features/admin/pipeline/components/LiveSessionsBoard";
import BatchGradeButton from "@features/admin/pipeline/components/BatchGradeButton";

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
      label: t("adminOps.sessions.status.graded"),
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
    label: t("adminOps.sessions.status.missing"),
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
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchSessions = useCallback(async (mode: string, search: string, pageNumber = 1, report = "all") => {
    try {
      setIsLoading(true);
      setLoadError(false);
      const res = await adminApi.getSessions({
        mode,
        search: search.trim() || undefined,
        report: report === "all" ? undefined : report,
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
    fetchSessions(selectedMode, searchQuery, 1, reportFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchSessions, selectedMode, reportFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(selectedMode, searchQuery, 1, reportFilter);
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
          { label: "Quản trị", href: "/admin/dashboard" },
          { label: t("admin.sidebar.interviews") || "Phiên phỏng vấn" },
        ]}
        primaryAction={
          <div className="flex flex-wrap items-center gap-2">
          {/* Counts every user only when no filter narrows the list. */}
          {selectedMode === "all" && !searchQuery.trim() && (reportFilter === "all" || reportFilter === "missing") ? (
            <BatchGradeButton
              pending={stats?.ungraded ?? 0}
              onFinished={() => fetchSessions(selectedMode, searchQuery, page, reportFilter)}
            />
          ) : null}
          <button
            onClick={() => fetchSessions(selectedMode, searchQuery, page, reportFilter)}
            className="inline-flex items-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-[#204195]" : "text-[#607096]"}`} />
            <span>{t("admin.common.refresh") || "Làm mới"}</span>
          </button>
          </div>
        }
      />

      {/* Interviews running now: step, time, problems; pushed live. */}
      <LiveSessionsBoard />

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
          <label className="sr-only" htmlFor="admin-interviews-report">
            {t("adminOps.sessions.reportFilter")}
          </label>
          <select
            id="admin-interviews-report"
            value={reportFilter}
            onChange={(e) => setReportFilter(e.target.value)}
            className="rounded-full border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#14244B]"
          >
            {["all", "missing", "graded", "open"].map((value) => (
              <option key={value} value={value}>
                {t(`adminOps.sessions.report.${value}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Counts for the current filter (the platform-wide numbers are on the overview). */}
      {!loadError && stats ? (
        <p className="text-xs text-[#607096]" aria-live="polite">
          {fmt(t("interviews2.filterSummary"), {
            total: totalCount,
            active: activeSessionsCount,
            completed: completedSessionsCount,
          })}
          {stats.ungraded ? ` · ${fmt(t("adminOps.sessions.ungradedCount"), { n: stats.ungraded })}` : ""}
          {avgScore > 0 ? ` · ${fmt(t("interviews2.filterAvg"), { score: avgScore })}` : ""}
        </p>
      ) : null}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="w-[28%] px-5 py-4">{t("admin.interviews.table.candidate") || "Ứng viên"}</th>
                <th className="w-[26%] px-5 py-4">{t("admin.interviews.table.positionRole") || "Vị trí / Ngôn ngữ"}</th>
                <th className="w-[11%] px-3 py-4 text-center">{t("admin.interviews.table.mode") || "Hình thức"}</th>
                <th className="w-[9%] px-3 py-4 text-center">{t("admin.interviews.table.aiScore") || "Điểm AI"}</th>
                <th className="w-[12%] px-3 py-4">{t("admin.interviews.table.dateSubmitted") || "Thời gian"}</th>
                <th className="w-[14%] px-3 py-4">{t("admin.interviews.table.status") || "Trạng thái"}</th>
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
                      onRetry={() => fetchSessions(selectedMode, searchQuery, page, reportFilter)}
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
                // The API pages by PAGE_SIZE; never render more rows than one page.
                sessions.slice(0, PAGE_SIZE).map((row) => {
                  const pill = statusPill(row.status, t);
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FD] font-bold text-[#204195]">
                            {row.candidateInitials}
                          </div>
                          <div className="min-w-0">
                            {row.userId ? (
                              <Link
                                href={`/admin/users/${encodeURIComponent(row.userId)}`}
                                className="line-clamp-2 font-bold text-[#14244B] hover:text-[#204195] hover:underline"
                                title={row.candidateName}
                              >
                                {row.candidateName}
                              </Link>
                            ) : (
                              <p className="line-clamp-2 font-bold text-[#14244B]" title={row.candidateName}>
                                {row.candidateName}
                              </p>
                            )}
                            <p className="truncate text-[11px] text-[#607096]" title={row.candidateEmail}>
                              {row.candidateEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="line-clamp-2 font-semibold text-[#14244B]" title={row.position ?? undefined}>
                          {row.position || "—"}
                        </p>
                        <p className="truncate text-[11px] text-[#607096]">{row.teamAndLocation}</p>
                      </td>
                      <td className="px-3 py-4 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#DCE4F3] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-[#204195]">
                          {renderTypeIcon(row.type)}
                          {t(`fixAdmin.ops.interviews.mode.${row.type}`)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center">
                        {typeof row.aiScore === "number" ? (
                          <span className="font-bold text-[#14244B] text-sm tabular-nums">
                            {row.aiScore}%
                          </span>
                        ) : (
                          <span className="font-medium text-[#8A98B8]">--</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-semibold text-[#14244B] tabular-nums">{row.dateLabel}</p>
                        <p className="text-[11px] text-[#607096]">{row.timeLabel}</p>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`${pill.className} whitespace-nowrap`}>{pill.label}</span>
                        {row.endReason && row.status !== "scheduled" ? (
                          <span className="mt-1 block text-[11px] text-[#607096]">
                            {hookT(`aiPipeline.endReason.${row.endReason}`) !== `aiPipeline.endReason.${row.endReason}`
                              ? hookT(`aiPipeline.endReason.${row.endReason}`)
                              : row.endReason}
                          </span>
                        ) : null}
                        <Link
                          href={`/admin/interviews/${encodeURIComponent(row.id)}`}
                          className="mt-1 block text-[11px] font-semibold text-[#204195] hover:underline"
                        >
                          {t("adminPlan.view")}
                        </Link>
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
                onPageChange={(next) => fetchSessions(selectedMode, searchQuery, next, reportFilter)}
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
