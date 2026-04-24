"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { jobProfileApi, type JobProfile } from "@/services/jobProfileApi";
import { useLanguage } from "@/i18n/LanguageProvider";
import ReactMarkdown from "react-markdown";

export default function AdminJobProfileDetailView() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const id = typeof params.id === "string" ? params.id : "";

  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await jobProfileApi.get(id);
        if (!cancelled) setProfile(data);
      } catch (e: unknown) {
        if (!cancelled) {
          const notFound = axios.isAxiosError(e) && e.response?.status === 404;
          setError(notFound ? t("admin.jobProfile.detail.notFound") : t("admin.jobProfile.error.load"));
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const handleDelete = async () => {
    if (!profile || deleting) return;
    if (!window.confirm(t("admin.jobProfile.card.confirmDelete"))) return;
    setDeleting(true);
    try {
      await jobProfileApi.delete(profile.id);
      router.push("/admin/dashboard");
    } catch {
      setError(t("admin.jobProfile.error.save"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <p className="py-12 text-center text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
    );
  }

  if (error && !profile) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">{error}</div>
        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-primary hover:underline">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          {t("admin.jobProfile.detail.back")}
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const categoryName = profile.category?.name ?? profile.categoryId;

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        {t("admin.jobProfile.detail.back")}
      </Link>

      <article className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary-container to-tertiary p-8 text-on-primary shadow-xl md:p-10">
        <div className="pointer-events-none absolute -right-8 -top-8 opacity-[0.12]">
          <span className="material-symbols-outlined text-[10rem]">auto_awesome</span>
        </div>

        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
              {t("admin.jobProfile.featured.badge")}
            </span>
            <span className="rounded-full bg-emerald-400/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-950">
              {categoryName}
            </span>
            {profile.status && profile.status !== "ACTIVE" && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                {profile.status}
              </span>
            )}
          </div>

          <h1 className="mb-6 font-headline text-3xl font-black tracking-tight md:text-4xl">{profile.title}</h1>
          {profile.keywords && profile.keywords.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {profile.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-full border border-dashed border-white/45 bg-transparent px-3 py-1.5 text-sm font-medium text-on-primary/90 backdrop-blur-sm"
                >
                  {k}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-6">
            <span className="text-xs font-medium text-on-primary/85">
              {t("admin.jobProfile.card.updated")}:{" "}
              {profile.updatedAt || profile.createdAt
                ? new Date(profile.updatedAt ?? profile.createdAt ?? "").toLocaleString(
                    lang === "vi" ? "vi-VN" : "en-US",
                    { dateStyle: "medium", timeStyle: "short" }
                  )
                : "—"}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-white/35 px-4 py-2.5 text-white transition hover:bg-white/10 disabled:opacity-50"
                aria-label={t("admin.jobProfile.card.delete")}
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      {String(profile.description || "").trim() && (
        <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-6 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Job description
          </h2>
          <div className="text-sm leading-relaxed text-on-surface">
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
      )}
    </div>
  );
}
