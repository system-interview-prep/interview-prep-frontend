"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { jobCategoryApi, type JobCategory } from "@/services/jobCategoryApi";
import { jobProfileApi, type JobProfile } from "@/services/jobProfileApi";
import { useLanguage } from "@/i18n/LanguageProvider";
import { UserJobProfileCard } from "@/components/user-dashboard/UserJobProfileCard";
import { JobInterviewCvModal } from "@/components/user-dashboard/JobInterviewCvModal";

const PREVIEW_LIMIT = 6;

function isActiveProfile(profile: JobProfile): boolean {
  return profile.status === "ACTIVE";
}

function formatRelativeShort(iso: string, locale: string) {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = now - d.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days <= 0) return locale === "vi" ? "Hôm nay" : "Today";
    if (days === 1) return locale === "vi" ? "Hôm qua" : "Yesterday";
    if (days < 7) return locale === "vi" ? `${days} ngày trước` : `${days} days ago`;
    return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

export default function UserJobProfilesSection() {
  const { t, lang } = useLanguage();
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [cvModalJob, setCvModalJob] = useState<JobProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await jobCategoryApi.list({ limit: 200 });
        if (!cancelled) setCategories(data.items ?? []);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveCategoryName = useCallback(
    (p: JobProfile) =>
      p.category?.name ?? categories.find((c) => c.id === p.categoryId)?.name ?? p.categoryId,
    [categories]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await jobProfileApi.list({
          limit: PREVIEW_LIMIT,
          order: "desc",
        });
        if (!cancelled) setProfiles((data.items ?? []).filter(isActiveProfile));
      } catch (e: unknown) {
        const msg = axios.isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? e.message)
          : t("admin.jobProfile.error.load");
        if (!cancelled) {
          setError(msg);
          setProfiles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  function keywordsLine(keywords: string[] | undefined): string {
    if (!keywords?.length) return "—";
    return keywords.slice(0, 6).join(", ");
  }

  return (
    <section className="mb-16">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
            {t("userDash.jobProfiles.title")}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{t("userDash.jobProfiles.previewSubtitle")}</p>
        </div>
        <Link
          href="/dashboard/jobs"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary hover:underline"
        >
          {t("userDash.jobProfiles.viewAll")}
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error/25 bg-error-container/15 px-3 py-2.5 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
      ) : profiles.length === 0 ? (
        <p className="py-8 text-center text-sm text-on-surface-variant">{t("userDash.jobProfiles.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <UserJobProfileCard
              key={p.id}
              jobId={p.id}
              viewDetailAria={t("userDash.jobProfiles.viewDetailAria")}
              title={p.title}
              categoryLabel={resolveCategoryName(p)}
              keywordsLine={keywordsLine(p.keywords)}
              updatedShort={formatRelativeShort(p.updatedAt ?? p.createdAt ?? "", lang)}
              updatedPrefix={`${t("admin.jobProfile.card.updated")}:`}
              interviewCta={t("userDash.jobProfiles.interviewNow")}
              onInterview={() => setCvModalJob(p)}
            />
          ))}
        </div>
      )}
      <JobInterviewCvModal
        open={cvModalJob !== null}
        jobTitle={cvModalJob?.title ?? ""}
        jobProfileId={cvModalJob?.id}
        onClose={() => setCvModalJob(null)}
      />
    </section>
  );
}
