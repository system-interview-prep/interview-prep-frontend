"use client";

import { useState } from "react";
import { ScrollText, Search, Filter, ShieldCheck } from "lucide-react";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminEmptyState from "./primitives/AdminEmptyState";
import { useLanguage } from "@/i18n/LanguageProvider";

export interface AuditLogItem {
  id: string;
  action:
    | "PROMPT_CHANGED"
    | "PROMPT_PROMOTED"
    | "RUBRIC_VERSION_CHANGED"
    | "DATASET_APPROVED"
    | "MODEL_CONFIG_CHANGED"
    | "JOB_PROFILE_PUBLISHED"
    | "KB_DOCUMENT_CHANGED";
  actor: string;
  targetId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export default function AdminAuditLogsClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  // Strict Rule 2 & 52: If backend missing: do NOT make frontend-only fake audit history.
  const auditLogs: AuditLogItem[] = [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.auditLogs.title")}
        description={t("admin.auditLogs.subtitle")}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.group.system") },
          { label: t("admin.sidebar.auditLogs") },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending")} />
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("admin.auditLogs.stat.total")}
          value={null}
          subtitle={t("admin.auditLogs.stat.totalDesc")}
          icon={ScrollText}
          isPending={true}
          pendingText={t("admin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("admin.auditLogs.stat.aiOps")}
          value={null}
          subtitle={t("admin.auditLogs.stat.aiOpsDesc")}
          icon={ShieldCheck}
          isPending={true}
          pendingText={t("admin.common.backendPending")}
        />
        <AdminMetricCard
          title={t("admin.auditLogs.stat.content")}
          value={null}
          subtitle={t("admin.auditLogs.stat.contentDesc")}
          icon={Filter}
          isPending={true}
          pendingText={t("admin.common.backendPending")}
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
            placeholder={t("admin.auditLogs.searchPlaceholder")}
            type="text"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "PROMPT", "RUBRIC", "MODEL", "JOB_PROFILE"].map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setActionFilter(action)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                actionFilter === action
                  ? "bg-[#204195] text-white shadow-xs"
                  : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
              }`}
            >
              {action === "all" ? t("admin.auditLogs.filter.all") : action}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table / Empty State */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.auditLogs.table.time")}</th>
                <th className="px-6 py-4">{t("admin.auditLogs.table.action")}</th>
                <th className="px-6 py-4">{t("admin.auditLogs.table.actor")}</th>
                <th className="px-6 py-4">{t("admin.auditLogs.table.target")}</th>
                <th className="px-6 py-4">{t("admin.auditLogs.table.ip")}</th>
                <th className="px-6 py-4 text-right">{t("admin.auditLogs.table.details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title={t("admin.auditLogs.emptyTitle")}
                      description={t("admin.auditLogs.emptyDesc")}
                    />
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4">{log.timestamp}</td>
                    <td className="px-6 py-4 font-mono font-bold text-[#204195]">{log.action}</td>
                    <td className="px-6 py-4">{log.actor}</td>
                    <td className="px-6 py-4 font-mono">{log.targetId}</td>
                    <td className="px-6 py-4 text-[#607096]">{log.ipAddress}</td>
                    <td className="px-6 py-4 text-right">{log.details}</td>
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
