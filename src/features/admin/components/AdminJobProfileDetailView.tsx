"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "./primitives/AdminPageHeader";
import JobDescriptionStructuredView from "./job-description/JobDescriptionStructuredView";

export default function AdminJobProfileDetailView() {
  const params = useParams();
  const { t, lang } = useLanguage();
  const id = typeof params.id === "string" ? params.id : "";

  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await jobProfileApi.get(id);
        if (!cancelled) setProfile(data);
      } catch (err: unknown) {
        if (!cancelled) {
          if (axios.isAxiosError(err) && err.response?.status === 404) {
            setError(t("admin.jobProfile.notFound"));
          } else {
            setError(t("admin.jobProfile.loadDetailError"));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-[#607096]">{t("admin.jobProfile.loading")}</p>
    );
  }

  if (error && !profile) {
    return (
      <div className="space-y-4">
        <div
          className="break-words rounded-2xl border border-[#C43B3B]/30 bg-[#FDF2F2] px-4 py-3 text-sm text-[#C43B3B]"
          role="alert"
        >
          {error}
        </div>
        <Link
          href="/admin/job-descriptions"
          className="inline-flex items-center gap-2 text-sm text-[#204195] hover:underline"
        >
          <ArrowLeft className="size-4" />
          {t("admin.jobProfile.detail.back")}
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const status =
    profile.status === "DRAFT" || profile.status === "ARCHIVED" ? profile.status : "ACTIVE";
  const statusLabel =
    status === "DRAFT"
      ? t("fixAdmin.jp.status.draft")
      : status === "ARCHIVED"
        ? t("fixAdmin.jp.status.archived")
        : t("fixAdmin.jp.status.active");
  const statusClass =
    status === "DRAFT"
      ? "bg-[#FCB625]/15 text-[#7A5600] border-[#FCB625]/40"
      : status === "ARCHIVED"
        ? "bg-[#F0F4FC] text-[#607096] border-[#DCE4F3]"
        : "bg-[#287A4B]/10 text-[#287A4B] border-[#287A4B]/25";
  const updatedIso = profile.updatedAt ?? profile.createdAt;
  const updatedLabel = updatedIso
    ? new Date(updatedIso).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={profile.title}
        description={
          updatedLabel ? `${t("adminUiJd.detail.updated")}: ${updatedLabel}` : undefined
        }
        breadcrumbs={[
          { label: t("adminUiJd.breadcrumb.admin"), href: "/admin/dashboard" },
          { label: t("adminUiJd.list.title"), href: "/admin/job-descriptions" },
          { label: t("adminUiJd.detail.crumb") },
        ]}
        statusBadge={
          <span
            className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass}`}
          >
            {statusLabel}
          </span>
        }
        primaryAction={
          <Link
            href={`/admin/job-descriptions/create?id=${encodeURIComponent(profile.id)}`}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#204195] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#183275]"
          >
            <Edit className="size-3.5" aria-hidden="true" />
            {t("adminUiJd.detail.edit")}
          </Link>
        }
      />

      <JobDescriptionStructuredView profile={profile} />
    </div>
  );
}
