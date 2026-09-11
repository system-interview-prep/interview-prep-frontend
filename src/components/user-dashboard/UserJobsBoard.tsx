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

/** Keep in sync with admin job profiles list (`AdminJobProfilesPanel`). */
const PAGE_SIZE = 12;

type PageStart = {
  cursor: string | undefined;
  bufferedActive: JobProfile[];
};

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

function isActiveProfile(profile: JobProfile): boolean {
  return profile.status === "ACTIVE";
}

export default function UserJobsBoard() {
  const { t, lang } = useLanguage();
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  /** Snapshot stack for previous pages to support exact back navigation. */
  const [pageBackStack, setPageBackStack] = useState<PageStart[]>([]);
  const [currentPageStart, setCurrentPageStart] = useState<PageStart>({
    cursor: undefined,
    bufferedActive: [],
  });
  const [nextPageStart, setNextPageStart] = useState<PageStart | null>(null);
  const [loading, setLoading] = useState(true);
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
    async (start: PageStart) => {
      try {
        setLoading(true);
        setError(null);
        const collected: JobProfile[] = [];
        const bufferedActive = [...start.bufferedActive];
        let cursor: string | undefined = start.cursor;
        let reachedEnd = false;

        if (bufferedActive.length > 0) {
          const fromBuffer = bufferedActive.splice(0, PAGE_SIZE);
          collected.push(...fromBuffer);
        }

        while (collected.length < PAGE_SIZE && !reachedEnd) {
          const { data } = await jobProfileApi.list({
            limit: PAGE_SIZE,
            cursor,
            q: debouncedSearch.trim() || undefined,
            ...(categoryFilter !== "all" ? jobProfileListCategoryParams(categoryFilter) : {}),
            order: "desc",
          });

          const activeItems = (data.items ?? []).filter(isActiveProfile);
          const need = PAGE_SIZE - collected.length;
          collected.push(...activeItems.slice(0, need));

          if (activeItems.length > need) {
            bufferedActive.push(...activeItems.slice(need));
          }

          cursor = data.nextCursor;
          if (!cursor) reachedEnd = true;
        }

        setProfiles(collected);
        setCurrentPageStart(start);
        if (bufferedActive.length > 0 || cursor) {
          setNextPageStart({ cursor, bufferedActive });
        } else {
          setNextPageStart(null);
        }
      } catch (e: unknown) {
        const msg = axios.isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? e.message)
          : t("admin.jobProfile.error.load");
        setError(msg);
        setProfiles([]);
        setNextPageStart(null);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, categoryFilter, t]
  );

  useEffect(() => {
    setPageBackStack([]);
    void loadPage({ cursor: undefined, bufferedActive: [] });
  }, [loadPage]);

  const handleNextPage = () => {
    if (!nextPageStart || loading) return;
    setPageBackStack((s) => [...s, currentPageStart]);
    void loadPage(nextPageStart);
  };

  const handlePrevPage = () => {
    if (pageBackStack.length === 0 || loading) return;
    const prevStart = pageBackStack[pageBackStack.length - 1];
    setPageBackStack((s) => s.slice(0, -1));
    void loadPage(prevStart);
  };

  return (
    <div className="min-w-0 space-y-8">
      <div className="flex flex-col gap-3 border-b-2 border-[#234196] pb-7">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-bold"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_back</span>
          <span className="underline decoration-[#FCB625] decoration-4 underline-offset-4">{t("userDash.jobProfiles.backToDashboard")}</span>
        </Link>
        <div><span className="sticker -rotate-1 bg-[#FCB625]">{t("userDash.jobs.eyebrow")}</span></div>
        <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl">
          {t("userDash.jobProfiles.pageTitle")}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[#5A6B8F]">{t("userDash.jobProfiles.pageSubtitle")}</p>
      </div>

      <div className="grid gap-3 rounded-2xl border-2 border-[#234196] bg-white p-3 shadow-[3px_3px_0_#234196] sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-w-[min(100%,280px)] flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#5A6B8F]">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.jobProfile.searchPlaceholder")}
            className="min-h-12 w-full rounded-xl border-2 border-[#234196] bg-[#F0F4FC] py-2.5 pl-10 pr-3 text-sm text-[#234196] placeholder:text-[#5A6B8F] focus:bg-white focus:outline-none"
            aria-label={t("admin.jobProfile.searchPlaceholder")}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "all" | string)}
          className="min-h-12 w-full rounded-xl border-2 border-[#234196] bg-white px-4 py-2.5 text-sm font-bold text-[#234196] focus:outline-none sm:w-auto"
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
        <div className="rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] px-4 py-3 text-sm text-[#8F1D1D] shadow-[3px_3px_0_#D32F2F]" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label={t("admin.jobProfile.loading")}>
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] motion-reduce:animate-none" />)}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#234196] bg-[#F0F4FC] px-6 py-16 text-center">
          <span className="material-symbols-outlined text-5xl" aria-hidden="true">work_outline</span>
          <p className="mt-4 text-sm text-[#5A6B8F]">{debouncedSearch.trim() || categoryFilter !== "all" ? t("admin.jobProfile.noMatch") : t("userDash.jobProfiles.empty")}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={loading || pageBackStack.length === 0}
              className="chunky-secondary min-h-11 min-w-[7rem] px-5 text-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              {t("userDash.jobProfiles.pagePrev")}
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={loading || !nextPageStart}
              className="chunky-primary min-h-11 min-w-[7rem] px-5 text-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t("userDash.jobProfiles.pageNext")}
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
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
