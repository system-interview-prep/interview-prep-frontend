"use client";

import { useState } from "react";
import { Users, Search, Shield, UserCheck, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminStatusBadge from "./primitives/AdminStatusBadge";
import AdminMetricCard from "./primitives/AdminMetricCard";
import AdminEmptyState from "./primitives/AdminEmptyState";

export interface UserSummaryItem {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CANDIDATE" | "USER";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  totalSessions: number;
}

export default function AdminUsersClient() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Since backend endpoint GET /admin/users is missing (documented in ADMIN_BACKEND_GAPS.md),
  // we maintain true state without fake rows.
  const users: UserSummaryItem[] = [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.users.title") || "Quản lý Người dùng & Ứng viên"}
        description={t("admin.users.subtitle") || "Tra cứu danh sách tài khoản, phân quyền quản trị và giám sát mức độ sử dụng nền tảng INTERVIA"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.users") || "Người dùng & Ứng viên" },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending") || "Backend Integration Pending"} />
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminMetricCard
          title={t("admin.users.total") || "Tổng người dùng"}
          value={null}
          subtitle={t("admin.users.totalSub") || "Tất cả tài khoản hệ thống"}
          icon={Users}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
        />
        <AdminMetricCard
          title={t("admin.users.activeCandidates") || "Ứng viên hoạt động"}
          value={null}
          subtitle={t("admin.users.activeCandidatesSub") || "Có phiên trong 30 ngày"}
          icon={UserCheck}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
        />
        <AdminMetricCard
          title={t("admin.users.administrators") || "Quản trị viên (Admin)"}
          value={null}
          subtitle={t("admin.users.administratorsSub") || "Tài khoản có quyền admin"}
          icon={Shield}
          isPending={true}
          pendingText={t("admin.common.backendPending") || "Backend pending"}
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
            placeholder={t("admin.users.searchPlaceholder") || "Tìm theo email, tên hoặc ID người dùng..."}
            type="text"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["all", "ADMIN", "CANDIDATE"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                roleFilter === role
                  ? "bg-[#204195] text-white shadow-xs"
                  : "border border-[#DCE4F3] bg-white text-[#607096] hover:border-[#204195]/40 hover:text-[#204195]"
              }`}
            >
              {role === "all" ? (t("admin.users.allRoles") || "Tất cả vai trò") : role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table / Empty State (Strict Rule 2 - No fake rows) */}
      <div className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-6 py-4">{t("admin.users.colAccount") || "Tài khoản & Email"}</th>
                <th className="px-6 py-4">{t("admin.users.colRole") || "Vai trò (Role)"}</th>
                <th className="px-6 py-4">{t("admin.users.colStatus") || "Trạng thái"}</th>
                <th className="px-6 py-4">{t("admin.users.colCreatedAt") || "Ngày tham gia"}</th>
                <th className="px-6 py-4 text-center">{t("admin.users.colSessions") || "Số phiên"}</th>
                <th className="px-6 py-4 text-right">{t("admin.users.colActions") || "Chi tiết"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <AdminEmptyState
                      variant="pending"
                      title={t("admin.users.emptyPendingTitle") || "Chưa kết nối API Người dùng"}
                      description={t("admin.users.emptyPendingDesc") || "Giao diện quản trị Người dùng đã sẵn sàng. Core Backend cần triển khai endpoint GET /admin/users (và GET /admin/users/{id}) để hiển thị dữ liệu thực tế."}
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-bold text-[#14244B]">{user.name}</td>
                    <td className="px-6 py-4">{user.role}</td>
                    <td className="px-6 py-4">{user.status}</td>
                    <td className="px-6 py-4">{user.createdAt}</td>
                    <td className="px-6 py-4 text-center">{user.totalSessions}</td>
                    <td className="px-6 py-4 text-right">
                      <ArrowUpRight className="size-4 text-[#204195]" />
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
