"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { jobCategoryApi, type JobCategory } from "@/services/jobCategoryApi";
import {
  jobProfileApi,
  jobProfileListCategoryParams,
  type JobProfile,
} from "@/services/jobProfileApi";
import { useLanguage } from "@/i18n/LanguageProvider";
import { UserJobProfileCard } from "@/components/user-dashboard/UserJobProfileCard";
import { JobInterviewCvModal } from "@/components/user-dashboard/JobInterviewCvModal";

const PAGE_SIZE = 30;

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

function keywordsLine(keywords: string[] | undefined): string {
  if (!keywords?.length) return "—";
  return keywords.slice(0, 6).join(", ");
}

export default function UserJobsBoard() {
  const { t, lang } = useLanguage();
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
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

  const loadPage = useCallback(
    async (cursor: string | undefined, append: boolean) => {
      try {
        if (append) setLoadingMore(true);
        else {
          setLoading(true);
          setError(null);
        }
        const { data } = await jobProfileApi.list({
          limit: PAGE_SIZE,
          cursor,
          q: debouncedSearch.trim() || undefined,
          ...(categoryFilter !== "all" ? jobProfileListCategoryParams(categoryFilter) : {}),
          order: "desc",
        });
        const items = data.items ?? [];
        setProfiles((prev) => (append ? [...prev, ...items] : items));
        setNextCursor(data.nextCursor);
      } catch (e: unknown) {
        const msg = axios.isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? e.message)
          : t("admin.jobProfile.error.load");
        setError(msg);
        if (!append) setProfiles([]);
        setNextCursor(undefined);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, categoryFilter, t]
  );

  useEffect(() => {
    loadPage(undefined, false);
  }, [loadPage]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) loadPage(nextCursor, true);
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-2 border-b border-outline-variant/15 pb-6">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          {t("userDash.jobProfiles.backToDashboard")}
        </Link>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface md:text-3xl">
          {t("userDash.jobProfiles.pageTitle")}
        </h1>
        <p className="max-w-2xl text-sm text-on-surface-variant">{t("userDash.jobProfiles.pageSubtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[min(100%,280px)] flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/70">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.jobProfile.searchPlaceholder")}
            className="w-full rounded-xl border border-outline-variant/25 bg-surface-container-lowest py-2.5 pl-10 pr-3 text-sm text-on-surface shadow-sm placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            aria-label={t("admin.jobProfile.searchPlaceholder")}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "all" | string)}
          className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-2.5 text-sm font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          aria-label={t("admin.jobProfile.form.category")}
        >
          <option value="all">{t("admin.jobProfile.filter.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-error/25 bg-error-container/15 px-3 py-2.5 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
      ) : profiles.length === 0 ? (
        <p className="py-12 text-center text-sm text-on-surface-variant">
          {debouncedSearch.trim() || categoryFilter !== "all"
            ? t("admin.jobProfile.noMatch")
            : t("userDash.jobProfiles.empty")}
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profiles.map((p) => (
              <UserJobProfileCard
                key={p.id}
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
          <p className="text-center text-xs text-on-surface-variant">
            {t("userDash.jobProfiles.showingCount").replace("{count}", String(profiles.length))}
          </p>
          {nextCursor && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-6 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
              >
                {loadingMore ? t("admin.jobProfile.loading") : t("admin.jobProfile.loadMore")}
              </button>
            </div>
          )}
        </>
      )}
      <JobInterviewCvModal
        open={cvModalJob !== null}
        jobTitle={cvModalJob?.title ?? ""}
        jobProfileId={cvModalJob?.id}
        onClose={() => setCvModalJob(null)}
      />
    </div>
  );
}
