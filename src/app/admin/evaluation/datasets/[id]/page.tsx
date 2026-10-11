"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";

export default function AdminEvaluationDatasetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next 16: route params arrive as a Promise.
  const { id } = use(params);
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={fmt(t("fixAdmin.detail.dataset.title"), { id })}
        description={t("fixAdmin.detail.dataset.subtitle")}
        breadcrumbs={[
          { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
          { label: t("fixAdmin.detail.dataset.crumb"), href: "/admin/evaluation/datasets" },
          { label: id },
        ]}
        statusBadge={
          <AdminStatusBadge status="pending" label={t("admin.common.backendPending")} />
        }
        primaryAction={
          <Link
            href="/admin/evaluation/datasets"
            className="inline-flex items-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs hover:bg-[#F8FAFC] transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>{t("fixAdmin.detail.back")}</span>
          </Link>
        }
      />

      <AdminEmptyState
        variant="pending"
        title={t("fixAdmin.detail.dataset.emptyTitle")}
        description={fmt(t("fixAdmin.detail.dataset.emptyDesc"), { id })}
      />
    </div>
  );
}
