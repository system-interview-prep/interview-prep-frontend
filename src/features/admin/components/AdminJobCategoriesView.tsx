"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Filter, BadgeCheck, Search } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { jobCategoryApi, type JobCategory } from "@features/admin/services/jobCategory.service";
import { useLanguage } from "@/i18n/LanguageProvider";

const DESCRIPTION_COLLAPSE_AT = 280;
const PAGE_SIZE = 24;

function CategoryDescription({
  text,
  expanded,
  onToggle,
}: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();
  const trimmed = text.trim();
  if (!trimmed) return null;
  const collapsible = trimmed.length > DESCRIPTION_COLLAPSE_AT;

  const body = (
    <p
      className={`text-sm leading-relaxed text-on-surface-variant/90 whitespace-pre-wrap break-words ${
        collapsible && !expanded ? "line-clamp-3" : ""
      }`}
    >
      {trimmed}
    </p>
  );

  return (
    <div className="mt-1.5 min-w-0 max-w-3xl">
      {collapsible && expanded ? (
        <div className="max-h-[min(70vh,20rem)] overflow-y-auto rounded-md bg-surface-container-low/40 px-0 py-1 dark:bg-surface-container-low/20">
          {body}
        </div>
      ) : (
        body
      )}
      {collapsible && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-1.5 text-xs font-medium text-primary/90 hover:underline"
        >
          {expanded ? t("admin.jobCategories.showLess") : t("admin.jobCategories.showFull")}
        </button>
      )}
    </div>
  );
}

function CategoryListItem({ cat }: { cat: JobCategory }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="group flex flex-col gap-4 rounded-xl border border-transparent px-3 py-5 transition-[background-color,box-shadow,border-color] duration-200 sm:flex-row sm:items-start sm:justify-between sm:gap-8 hover:border-outline-variant/20 hover:bg-surface-container-low/70 hover:shadow-sm dark:hover:bg-surface-container-low/40">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-medium text-on-surface">{cat.name}</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-on-surface-variant/80">
            {cat.id}
          </span>
        </div>
        {cat.description?.trim() ? (
          <CategoryDescription
            text={cat.description}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        ) : (
          <p className="mt-1.5 text-sm text-on-surface-variant/60">{t("admin.jobCategories.noDescription")}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center sm:pt-0.5">
        <Link
          href={`/admin/dashboard?category=${encodeURIComponent(cat.id)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/25 bg-surface px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95"
          title={t("admin.jobCategories.filterBoard")}
        >
          <Filter className="size-4" />
          <span>{t("admin.jobCategories.filterBoard")}</span>
        </Link>
      </div>
    </li>
  );
}

export default function AdminJobCategoriesView() {
  const { t } = useLanguage();
  const [items, setItems] = useState<JobCategory[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const loadPage = useCallback(
    async (cursor: string | undefined, append: boolean) => {
      try {
        if (append) setLoadingMore(true);
        else {
          setLoading(true);
          setError(null);
        }
        const { data } = await jobCategoryApi.list({
          limit: PAGE_SIZE,
          cursor,
          q: debouncedSearch.trim() || undefined,
        });
        const chunk = data.items ?? [];
        setItems((prev) => (append ? [...prev, ...chunk] : chunk));
        setNextCursor(data.nextCursor);
      } catch (e: unknown) {
        const msg = axios.isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? e.message)
          : t("admin.jobCategories.errorLoad");
        setError(msg);
        if (!append) setItems([]);
        setNextCursor(undefined);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedSearch, t]
  );

  useEffect(() => {
    loadPage(undefined, false);
  }, [loadPage]);

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) loadPage(nextCursor, true);
  };

  return (
    <div className="min-w-0 max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-outline-variant/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface md:text-3xl">
            {t("admin.sidebar.categories")}
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-on-surface-variant">
            {t("admin.jobCategories.subtitle")}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
          <BadgeCheck className="size-4.5" />
          <span>{t("admin.jobCategories.taxonomyNotice")}</span>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-5 text-on-surface-variant/70" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.jobCategories.searchPlaceholder")}
          className="w-full rounded-lg border border-outline-variant/20 bg-surface py-2.5 pl-10 pr-3 text-sm text-on-surface transition-colors placeholder:text-on-surface-variant/50 hover:border-outline-variant/45 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          aria-label={t("admin.jobCategories.searchPlaceholder")}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-error/25 bg-error-container/15 px-3 py-2.5 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-10 text-sm text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-sm text-on-surface-variant">
          <p>{debouncedSearch.trim() ? t("admin.jobCategories.noSearchResults") : t("admin.jobCategories.empty")}</p>
          <p className="mt-2 text-xs text-on-surface-variant/80">{t("admin.jobCategories.emptyHint")}</p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-outline-variant/15">
            {items.map((cat) => (
              <CategoryListItem key={cat.id} cat={cat} />
            ))}
          </ul>
          {nextCursor && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
              >
                {loadingMore ? t("admin.jobProfile.loading") : t("admin.jobProfile.loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
