"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";

export default function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { t } = useLanguage();

  const title = (t("admin.users.detail.title") || "Chi tiết người dùng: {id}").replace("{id}", params.id);
  const emptyDesc = (t("admin.users.detail.emptyDesc") || "Core Backend cần bổ sung endpoint GET /admin/users/{id} để truy xuất hồ sơ, CV đính kèm và lịch sử phiên phỏng vấn của người dùng.").replace("{id}", params.id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description={t("admin.users.detail.subtitle") || "Thông tin chi tiết hồ sơ tài khoản, lịch sử phiên phỏng vấn và CV đính kèm"}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: t("admin.sidebar.users") || "Người dùng", href: "/admin/users" },
          { label: params.id },
        ]}
        statusBadge={
          <AdminStatusBadge
            status="pending"
            label={t("admin.common.backendPending") || "Backend Integration Pending"}
          />
        }
        primaryAction={
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>{t("admin.users.detail.back") || "Quay lại danh sách"}</span>
          </Link>
        }
      />

      <AdminEmptyState
        variant="pending"
        title={t("admin.users.detail.emptyTitle") || "Chưa kết nối API Chi tiết Người dùng"}
        description={emptyDesc}
      />
    </div>
  );
}
