"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { JobInterviewCvModal } from "@/components/user-dashboard/JobInterviewCvModal";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobProfileApi, type JobProfile } from "@/services/jobProfileApi";
import ReactMarkdown from "react-markdown";

function formatDetailDate(iso: string | undefined, locale: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function UserJobDetailView() {
  const params = useParams();
  const { t, lang } = useLanguage();
  const id = typeof params.id === "string" ? params.id : "";

  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cvModalOpen, setCvModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await jobProfileApi.get(id);
        if (!cancelled) {
          if (data.status !== "ACTIVE") {
            setError(t("admin.jobProfile.detail.notFound"));
            setProfile(null);
          } else {
            setProfile(data);
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const notFound = axios.isAxiosError(e) && e.response?.status === 404;
          setError(
            notFound ? t("admin.jobProfile.detail.notFound") : t("admin.jobProfile.error.load")
          );
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

  if (loading) {
    return (
      <p className="py-12 text-center text-sm text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-w-0 space-y-4">
        <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          {t("userDash.jobProfiles.detailBack")}
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  const categoryName = profile.category?.name ?? profile.categoryId;
  const keywords = profile.keywords?.filter(Boolean) ?? [];

  return (
    <div className="min-w-0 space-y-8">
      <Link
        href="/dashboard/jobs"
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        {t("userDash.jobProfiles.detailBack")}
      </Link>

      <header className="border-b border-outline-variant/15 pb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-primary/12 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
            {categoryName}
          </span>
          {profile.status && profile.status !== "ACTIVE" && (
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase text-on-surface-variant">
              {profile.status}
            </span>
          )}
        </div>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
          {profile.title}
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {t("userDash.jobProfiles.detailUpdated")}:{" "}
          {formatDetailDate(profile.updatedAt ?? profile.createdAt, lang)}
        </p>
        <button
          type="button"
          onClick={() => setCvModalOpen(true)}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-md transition hover:opacity-95"
        >
          {t("userDash.jobProfiles.interviewNow")}
          <span className="material-symbols-outlined text-[22px]">play_arrow</span>
        </button>
      </header>

      {keywords.length > 0 && (
        <section>
          <h2 className="mb-3 font-headline text-sm font-bold uppercase tracking-wide text-on-surface-variant">
            {t("userDash.jobProfiles.detailKeywords")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <span
                key={k}
                className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-1.5 text-sm font-medium text-on-surface"
              >
                {k}
              </span>
            ))}
          </div>
        </section>
      )}

      {keywords.length === 0 && (
        <p className="text-sm text-on-surface-variant">{t("userDash.jobProfiles.detailEmpty")}</p>
      )}

      {String(profile.description || "").trim() && (
        <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5">
          <h2 className="mb-3 font-headline text-sm font-bold uppercase tracking-wide text-on-surface-variant">
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

      <JobInterviewCvModal
        open={cvModalOpen}
        jobTitle={profile.title}
        jobProfileId={profile.id}
        onClose={() => setCvModalOpen(false)}
      />
    </div>
  );
}
