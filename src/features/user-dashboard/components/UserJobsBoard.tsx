"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Search, Briefcase, ChevronLeft, ChevronRight } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { jobCategoryApi, type JobCategory } from "@features/admin/services/jobCategory.service";
import {
  jobProfileApi,
  jobProfileListCategoryParams,
  type JobProfile,
} from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import { UserJobProfileCard } from "@features/user-dashboard/components/UserJobProfileCard";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";

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
      <div className="flex flex-col gap-3 border-b border-[#EAEFF8] pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#204195]">
            {t("userDash.jobs.eyebrow")}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#14244B] md:text-4xl">
          {t("userDash.jobProfiles.pageTitle")}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-[#607096]">{t("userDash.jobProfiles.pageSubtitle")}</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-3 shadow-xs sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="relative min-w-[min(100%,280px)] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#607096]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.jobProfile.searchPlaceholder")}
            className="min-h-11 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-10 pr-3 text-sm text-[#14244B] placeholder:text-[#607096] transition-all focus:border-[#204195] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]/20"
            aria-label={t("admin.jobProfile.searchPlaceholder")}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "all" | string)}
          className="min-h-11 w-full rounded-xl border border-[#DCE4F3] bg-white px-4 py-2 text-sm font-semibold text-[#14244B] transition-all focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/20 sm:w-auto"
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
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-xs" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label={t("admin.jobProfile.loading")}>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white shadow-xs motion-reduce:animate-none" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DCE4F3] bg-white px-6 py-16 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F4FC] text-[#204195]">
            <Briefcase className="size-7" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-medium text-[#607096]">
            {debouncedSearch.trim() || categoryFilter !== "all" ? t("admin.jobProfile.noMatch") : t("userDash.jobProfiles.empty")}
          </p>
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
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={loading || pageBackStack.length === 0}
              className="inline-flex min-h-10 min-w-[6.5rem] items-center justify-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-white px-4 text-xs font-semibold text-[#14244B] shadow-xs transition-all hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
              {t("userDash.jobProfiles.pagePrev")}
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={loading || !nextPageStart}
              className="inline-flex min-h-10 min-w-[6.5rem] items-center justify-center gap-1.5 rounded-xl bg-[#204195] px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("userDash.jobProfiles.pageNext")}
              <ChevronRight className="size-4" />
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
