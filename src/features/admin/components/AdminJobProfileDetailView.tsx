"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import ReactMarkdown from "react-markdown";
import AdminPageHeader from "./primitives/AdminPageHeader";

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
        <div className="break-words rounded-2xl border border-[#C43B3B]/30 bg-[#FDF2F2] px-4 py-3 text-sm text-[#C43B3B]" role="alert">{error}</div>
        <Link href="/admin/job-descriptions" className="inline-flex items-center gap-2 text-sm text-[#204195] hover:underline">
          <ArrowLeft className="size-4" />
          {t("admin.jobProfile.detail.back")}
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const categoryName = profile.primaryTaxonomy?.label ?? t("fixAdmin.jp.unclassified");
  const status = profile.status === "DRAFT" || profile.status === "ARCHIVED" ? profile.status : "ACTIVE";
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
  const description = String(profile.description || "").trim();

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={profile.title}
        breadcrumbs={[
          { label: t("adminUiJd.breadcrumb.admin"), href: "/admin/dashboard" },
          { label: t("adminUiJd.list.title"), href: "/admin/job-descriptions" },
          { label: t("adminUiJd.detail.crumb") },
        ]}
        statusBadge={
          <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusClass}`}>
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

      <section className="grid min-w-0 gap-4 rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#607096]">{t("adminUiJd.detail.category")}</p>
          <p className="mt-1 break-words text-sm font-semibold text-[#14244B]">{categoryName}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#607096]">{t("adminUiJd.detail.keywords")}</p>
          {profile.keywords && profile.keywords.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {profile.keywords.map((k) => (
                <span
                  key={k}
                  title={k}
                  className="max-w-full truncate rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] px-2 py-0.5 text-xs font-medium text-[#607096]"
                >
                  {k}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-[#8A9ABA]">—</p>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#607096]">{t("adminUiJd.detail.updated")}</p>
          <p className="mt-1 text-sm text-[#14244B]">
            {updatedIso
              ? new Date(updatedIso).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "—"}
          </p>
        </div>
      </section>

      {description ? (
        <section className="min-w-0 rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs sm:p-6">
          <h2 className="sr-only">{t("adminUiJd.detail.description")}</h2>
          <div className="min-w-0 break-words text-sm leading-relaxed text-[#14244B] [overflow-wrap:anywhere]">
            <ReactMarkdown
              components={{
                h1: (p) => <h3 className="mt-5 mb-2 text-base font-extrabold" {...p} />,
                h2: (p) => <h3 className="mt-5 mb-2 text-base font-extrabold" {...p} />,
                h3: (p) => <h4 className="mt-4 mb-2 text-sm font-bold" {...p} />,
                p: (p) => <p className="my-2" {...p} />,
                ul: (p) => <ul className="my-2 list-disc pl-5" {...p} />,
                ol: (p) => <ol className="my-2 list-decimal pl-5" {...p} />,
                li: (p) => <li className="my-1" {...p} />,
                strong: (p) => <strong className="font-semibold" {...p} />,
                em: (p) => <em className="italic" {...p} />,
                a: (p) => <a className="text-[#204195] underline" target="_blank" rel="noreferrer" {...p} />,
                code: (p) => <code className="rounded bg-[#F0F4FC] px-1 text-[13px]" {...p} />,
                pre: (p) => <pre className="my-2 overflow-x-auto rounded-lg bg-[#F8FAFC] p-3 text-xs" {...p} />,
                table: (p) => (
                  <div className="my-2 overflow-x-auto">
                    <table className="min-w-full text-xs" {...p} />
                  </div>
                ),
              }}
            >
              {description}
            </ReactMarkdown>
          </div>
        </section>
      ) : null}
    </div>
  );
}
