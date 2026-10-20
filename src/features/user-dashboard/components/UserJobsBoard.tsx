"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import WorkspacePageHeader from "@features/resume/components/WorkspacePageHeader";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  jobProfileApi,
  type JobProfile,
} from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import { useSavedJobs } from "@features/user-dashboard/hooks/useSavedJobs";
import { useFitCache } from "@features/matching/utils/fitCache";
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

  // Saved jobs: shared with the overview page.
  const { savedJobIds, toggleSave: handleToggleSave } = useSavedJobs();
  const fits = useFitCache();

  // Client-side quick filter
  const [workplaceFilter, setWorkplaceFilter] = useState<"all" | WorkplaceType>("all");
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  /** The page the last load tried to show, so "Thử lại" retries that page. */
  const attemptedStartRef = useRef<PageStart>({ cursor: undefined, bufferedActive: [] });

  const loadPage = useCallback(
    async (start: PageStart): Promise<boolean> => {
      attemptedStartRef.current = start;
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
        return true;
      } catch {
        // Never show raw server/Axios text; the retry button below reloads this page.
        setError(t("fixApp.jobs.loadError"));
        setProfiles([]);
        setNextPageStart(null);
        return false;
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
    const from = currentPageStart;
    void loadPage(nextPageStart).then((ok) => {
      if (ok) setPageBackStack((s) => [...s, from]);
    });
  };

  const handlePrevPage = () => {
    if (pageBackStack.length === 0 || loading) return;
    const prevStart = pageBackStack[pageBackStack.length - 1];
    void loadPage(prevStart).then((ok) => {
      if (ok) setPageBackStack((s) => s.slice(0, -1));
    });
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

  /** "Đã lưu" / "Từ xa" / "Linh hoạt" only filter the page already loaded. */
  const clientFilterActive = showSavedOnly || workplaceFilter !== "all";
  const hasOtherPages = pageBackStack.length > 0 || nextPageStart !== null;

  const handleClearFilters = () => {
    setSearch("");
    setWorkplaceFilter("all");
    setShowSavedOnly(false);
  };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <WorkspacePageHeader
        title={t("userDash.jobProfiles.pageTitle")}
        subtitle={t("userDash.jobProfiles.pageSubtitle")}
      />


      {/* Search & Quick Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative min-w-0 flex-1 sm:min-w-[min(100%,320px)]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#607096]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("fixApp.jobs.searchPlaceholder")}
            className="h-10 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-10 pr-4 text-sm text-[#14244B] outline-none transition placeholder:text-[#607096] focus:bg-white focus:ring-2 focus:ring-[#204195]"
            aria-label={t("fixApp.jobs.searchPlaceholder")}
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
            aria-pressed={workplaceFilter === "all" && !showSavedOnly}
            className={`h-9 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              workplaceFilter === "all" && !showSavedOnly
                ? "bg-[#14244B] text-white"
                : "bg-[#F8FAFC] text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
            }`}
          >
            {t("interview.cvAnalysis.reqFilterAll")}
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkplaceFilter("remote");
              setShowSavedOnly(false);
            }}
            aria-pressed={workplaceFilter === "remote" && !showSavedOnly}
            className={`h-9 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              workplaceFilter === "remote" && !showSavedOnly
                ? "bg-[#14244B] text-white"
                : "bg-[#F8FAFC] text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
            }`}
          >
            {t("jobs.workplace.remote")}
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkplaceFilter("hybrid");
              setShowSavedOnly(false);
            }}
            aria-pressed={workplaceFilter === "hybrid" && !showSavedOnly}
            className={`h-9 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              workplaceFilter === "hybrid" && !showSavedOnly
                ? "bg-[#14244B] text-white"
                : "bg-[#F8FAFC] text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
            }`}
          >
            {t("jobs.workplace.hybrid")}
          </button>

          <button
            type="button"
            onClick={() => setShowSavedOnly((s) => !s)}
            aria-pressed={showSavedOnly}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              showSavedOnly
                ? "bg-[#14244B] text-white"
                : "bg-[#F8FAFC] text-[#607096] hover:bg-[#F0F4FC] hover:text-[#14244B]"
            }`}
          >
            <span>{t("jobs.card.saved")}</span>
            {savedJobIds.size > 0 && (
              <span className={`rounded-full px-1.5 text-[11px] ${showSavedOnly ? "bg-white/20 text-white" : "bg-[#F0F4FC] text-[#204195]"}`}>
                {savedJobIds.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Loading State: Grid of modern Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label={t("admin.jobProfile.loading")}>
          {Array.from({ length: 6 }).map((_, item) => (
            <JobCardSkeleton key={item} />
          ))}
        </div>
      ) : error ? (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-[#F5C2C2] bg-[#FDF2F2] px-4 py-3 text-sm text-[#C43B3B] sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadPage(attemptedStartRef.current)}
            className="inline-flex h-9 w-fit shrink-0 items-center rounded-xl bg-white px-4 text-[13px] font-semibold text-[#14244B] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC]"
          >
            {t("fixApp.common.retry")}
          </button>
        </div>
      ) : (
        <>
          {visibleProfiles.length === 0 ? (
            clientFilterActive && profiles.length > 0 ? (
              /* The filter only looked at this page: say so, and keep paging available */
              <JobCardEmptyState
                title={t("fixApp.jobs.emptyOnPage")}
                description={t("fixApp.jobs.emptyOnPageDesc")}
                onClearFilters={handleClearFilters}
              />
            ) : (
              <JobCardEmptyState
                onClearFilters={search || clientFilterActive ? handleClearFilters : undefined}
              />
            )
          ) : (
            /* Job Cards Grid */
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProfiles.map((p) => {
                const cardData = mapJobToJobCard(p, { savedJobIds, fit: fits[p.id] });
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
          )}

          {/* Pagination Controls */}
          {visibleProfiles.length > 0 || (clientFilterActive && hasOtherPages) ? (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={loading || pageBackStack.length === 0}
                className="inline-flex h-10 min-w-[6.5rem] items-center justify-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-[#14244B] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span aria-hidden="true">←</span>
                {t("userDash.jobProfiles.pagePrev")}
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={loading || !nextPageStart}
                className="inline-flex h-10 min-w-[6.5rem] items-center justify-center gap-1.5 rounded-xl bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("userDash.jobProfiles.pageNext")}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : null}
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
