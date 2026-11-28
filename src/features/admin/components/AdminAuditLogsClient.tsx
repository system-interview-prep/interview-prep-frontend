"use client";

import AdminPageHeader from "./primitives/AdminPageHeader";
import { useLanguage } from "@/i18n/LanguageProvider";
import AccessLogsSection from "@features/admin/pipeline/components/AccessLogsSection";

/** Admin action log: reads of candidate data and changes made in the admin (admin_access_logs). */
export default function AdminAuditLogsClient() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.auditLogs.title")}
        description={t("admin.auditLogs.subtitle")}
        breadcrumbs={[
          { label: "Quản trị", href: "/admin/dashboard" },
          { label: t("admin.sidebar.group.system") },
          { label: t("admin.sidebar.auditLogs") },
        ]}
      />
      <AccessLogsSection />
    </div>
  );
}
