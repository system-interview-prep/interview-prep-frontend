"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import ReactMarkdown from "react-markdown";

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
      <p className="py-12 text-center text-[#607096]">{t("admin.jobProfile.loading")}</p>
    );
  }

  if (error && !profile) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-[#C43B3B]/30 bg-[#FDF2F2] px-4 py-3 text-sm text-[#C43B3B]" role="alert">{error}</div>
        <Link href="/admin/job-descriptions" className="inline-flex items-center gap-2 text-[#204195] hover:underline">
          <ArrowLeft className="size-4" />
          {t("admin.jobProfile.detail.back")}
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const categoryName = profile.primaryTaxonomy?.label ?? t("fixAdmin.jp.unclassified");

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href="/admin/job-descriptions"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#204195] hover:underline"
      >
        <ArrowLeft className="size-4" />
        {t("admin.jobProfile.detail.back")}
      </Link>

      <article className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#204195] via-[#2C52B5] to-[#14244B] p-8 text-white shadow-xl md:p-10">
        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
              {t("admin.jobProfile.featured.badge")}
            </span>
            <span className="rounded-full bg-[#FCB625] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#14244B]">
              {categoryName}
            </span>
            {profile.status && profile.status !== "ACTIVE" && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                {profile.status === "DRAFT"
                  ? t("fixAdmin.jp.status.draft")
                  : profile.status === "ARCHIVED"
                    ? t("fixAdmin.jp.status.archived")
                    : profile.status}
              </span>
            )}
          </div>

          <h1 className="mb-6 font-headline text-3xl font-black tracking-tight md:text-4xl">{profile.title}</h1>
          {profile.keywords && profile.keywords.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {profile.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-dashed border-white/45 bg-transparent px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm"
                >
                  {k}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6">
            <span className="text-xs font-medium text-white/85">
              {t("admin.jobProfile.card.updated")}:{" "}
              {profile.updatedAt || profile.createdAt
                ? new Date(profile.updatedAt ?? profile.createdAt ?? "").toLocaleString(
                    lang === "vi" ? "vi-VN" : "en-US",
                    { dateStyle: "medium", timeStyle: "short" }
                  )
                : "—"}
            </span>
          </div>
        </div>
      </article>

      {String(profile.description || "").trim() ? (
        <section className="rounded-3xl border border-[#DCE4F3] bg-white p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#607096]">
              {t("fixAdmin.jp.jobDescription")}
            </h2>
          </div>
          <div className="text-sm leading-relaxed text-[#14244B]">
            <ReactMarkdown
              components={{
                h2: (p) => <h3 className="mt-5 mb-2 text-base font-extrabold" {...p} />,
                h3: (p) => <h4 className="mt-4 mb-2 text-sm font-bold" {...p} />,
                p: (p) => <p className="my-2" {...p} />,
                ul: (p) => <ul className="my-2 list-disc pl-5" {...p} />,
                ol: (p) => <ol className="my-2 list-decimal pl-5" {...p} />,
                li: (p) => <li className="my-1" {...p} />,
                strong: (p) => <strong className="font-semibold" {...p} />,
                em: (p) => <em className="italic" {...p} />,
              }}
            >
              {String(profile.description || "").trim()}
            </ReactMarkdown>
          </div>
        </section>
      ) : null}
    </div>
  );
}
