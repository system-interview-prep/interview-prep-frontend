"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Bookmark, Globe2, Home } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  jobProfileApi,
  type JobProfile,
} from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import {
  JobCard,
  JobCardSkeleton,
  JobCardEmptyState,
  mapJobToJobCard,
  WorkplaceType,
} from "@/components/jobs";

/** Keep in sync with admin job profiles list (`AdminJobProfilesPanel`). */
const PAGE_SIZE = 12;

type PageStart = {
  cursor: string | undefined;
  bufferedActive: JobProfile[];
};

function isActiveProfile(profile: JobProfile): boolean {
  return profile.status === "ACTIVE";
}

export default function UserJobsBoard() {
  const { t } = useLanguage();
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
  const [cvModalJob, setCvModalJob] = useState<JobProfile | null>(null);

  // Client-side saved jobs
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(() => {
    try {
      if (typeof window === "undefined") return new Set();
      const raw = localStorage.getItem("candidate.saved_job_ids");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Client-side quick filter
  const [workplaceFilter, setWorkplaceFilter] = useState<"all" | WorkplaceType>("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const handleToggleSave = useCallback((jobId: string, currentSaved: boolean) => {
    setSavedJobIds((prev) => {
      const next = new Set(prev);
      if (currentSaved) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      try {
        localStorage.setItem("candidate.saved_job_ids", JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

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
    [debouncedSearch, t]
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

  // Filter profiles on client by workplaceType or saved status if selected
  const visibleProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (showSavedOnly && !savedJobIds.has(p.id)) {
        return false;
      }
      if (workplaceFilter !== "all") {
        const card = mapJobToJobCard(p);
        if (card.location?.workplaceType !== workplaceFilter) {
          return false;
        }
      }
      return true;
    });
  }, [profiles, showSavedOnly, savedJobIds, workplaceFilter]);

  const handleClearFilters = () => {
    setSearch("");
    setWorkplaceFilter("all");
    setShowSavedOnly(false);
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2.5 border-b border-[#EAEFF8] pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#204195]">
            {t("userDash.jobs.eyebrow")}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#14244B] sm:text-3xl md:text-4xl">
          {t("userDash.jobProfiles.pageTitle")}
        </h1>
        <p className="max-w-2xl text-xs leading-relaxed text-[#607096] sm:text-sm sm:leading-6">
          {t("userDash.jobProfiles.pageSubtitle")}
        </p>
      </div>

      {/* Search & Quick Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative min-w-[min(100%,320px)] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#607096]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.jobProfile.searchPlaceholder")}
            className="min-h-10 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-10 pr-3 text-sm text-[#14244B] placeholder:text-[#607096] transition-all focus:border-[#204195] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#204195]/20"
            aria-label={t("admin.jobProfile.searchPlaceholder")}
          />
        </div>

        {/* Quick filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setWorkplaceFilter("all");
              setShowSavedOnly(false);
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              workplaceFilter === "all" && !showSavedOnly
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-[#F8FAFC] text-[#607096] hover:bg-[#EEF2FD] hover:text-[#204195]"
            }`}
          >
            {t("interview.cvAnalysis.reqFilterAll") || "Tất cả"}
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkplaceFilter("remote");
              setShowSavedOnly(false);
            }}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              workplaceFilter === "remote" && !showSavedOnly
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-[#F8FAFC] text-[#607096] hover:bg-[#EEF2FD] hover:text-[#204195]"
            }`}
          >
            <Globe2 className="size-3" />
            <span>{t("jobs.workplace.remote") || "Từ xa"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkplaceFilter("hybrid");
              setShowSavedOnly(false);
            }}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              workplaceFilter === "hybrid" && !showSavedOnly
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-[#F8FAFC] text-[#607096] hover:bg-[#EEF2FD] hover:text-[#204195]"
            }`}
          >
            <Home className="size-3" />
            <span>{t("jobs.workplace.hybrid") || "Linh hoạt"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSavedOnly((s) => !s)}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              showSavedOnly
                ? "bg-[#204195] text-white shadow-xs"
                : "border border-[#DCE4F3] bg-[#F8FAFC] text-[#607096] hover:bg-[#EEF2FD] hover:text-[#204195]"
            }`}
          >
            <Bookmark className={`size-3 ${showSavedOnly ? "fill-current" : ""}`} />
            <span>{t("jobs.card.saved") || "Đã lưu"}</span>
            {savedJobIds.size > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] ${showSavedOnly ? "bg-white/20 text-white" : "bg-[#EEF2FD] text-[#204195]"}`}>
                {savedJobIds.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800 shadow-xs" role="alert">
          {error}
        </div>
      )}

      {/* Loading State: Grid of modern Skeletons */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label={t("admin.jobProfile.loading")}>
          {Array.from({ length: 6 }).map((_, item) => (
            <JobCardSkeleton key={item} />
          ))}
        </div>
      ) : visibleProfiles.length === 0 ? (
        /* Empty State with Clear Filters */
        <JobCardEmptyState
          onClearFilters={search || workplaceFilter !== "all" || showSavedOnly ? handleClearFilters : undefined}
        />
      ) : (
        /* Job Cards Grid */
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProfiles.map((p) => {
              const cardData = mapJobToJobCard(p, { savedJobIds });
              return (
                <JobCard
                  key={p.id}
                  job={cardData}
                  onToggleSave={handleToggleSave}
                  onInterview={() => setCvModalJob(p)}
                />
              );
            })}
          </div>

          {/* Pagination Controls */}
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

      {/* CV Selection Modal for Mock Interview */}
      <JobInterviewCvModal
        open={cvModalJob !== null}
        jobTitle={cvModalJob?.title ?? ""}
        jobProfileId={cvModalJob?.id}
        onClose={() => setCvModalJob(null)}
      />
    </div>
  );
}
