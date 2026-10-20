"use client";

import AdminPageHeader from "./primitives/AdminPageHeader";
import { useLanguage } from "@/i18n/LanguageProvider";
import AccessLogsSection from "@features/admin/pipeline/components/AccessLogsSection";

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

/** Event groups the audit log will record once Core exposes GET /admin/audit-logs. */
const PLANNED_EVENT_KEYS = [
  "fixAdmin.ops.audit.event.prompt",
  "fixAdmin.ops.audit.event.rubric",
  "fixAdmin.ops.audit.event.model",
  "fixAdmin.ops.audit.event.content",
] as const;

export default function AdminAuditLogsClient() {
  const { t } = useLanguage();

  // Reads of candidate data are logged and listed; configuration changes are
  // not recorded yet, so that part stays an honest "coming soon" section.
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

      {/* Live: every read of a candidate's answers (admin_access_logs). */}
      <AccessLogsSection />

      <section
        aria-labelledby="audit-coming-soon-title"
        className="rounded-3xl border border-[#DCE4F3] bg-white p-6 sm:p-8"
      >
        <span className="inline-flex items-center rounded-full bg-[#FFF7E3] px-3 py-1 text-xs font-bold text-[#8A5A00] border border-[#FCE3A6]">
          {t("fixAdmin.ops.audit.comingSoon")}
        </span>
        <h2 id="audit-coming-soon-title" className="mt-3 text-lg font-bold text-[#14244B]">
          {t("fixAdmin.ops.audit.title")}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#607096]">
          {t("fixAdmin.ops.audit.desc")}
        </p>

        <div className="mt-6 rounded-2xl border border-[#EAEFF8] bg-[#F8FAFC] p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#607096]">
            {t("fixAdmin.ops.audit.plannedTitle")}
          </p>
          <ul className="mt-2 grid gap-1.5 text-sm text-[#14244B] sm:grid-cols-2">
            {PLANNED_EVENT_KEYS.map((key) => (
              <li key={key} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[#204195]" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-xs text-[#607096]">{t("fixAdmin.ops.audit.next")}</p>
      </section>
    </div>
  );
}
