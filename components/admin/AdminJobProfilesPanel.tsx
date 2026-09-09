"use client";

import Link from "next/link";
import axios from "axios";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { jobCategoryApi, type JobCategory } from "@/services/jobCategoryApi";
import {
  fetchJobProfileListAggregates,
  jobProfileApi,
  jobProfileListCategoryParams,
  type JobProfile,
} from "@/services/jobProfileApi";
import { useLanguage } from "@/i18n/LanguageProvider";

export type { JobProfile } from "@/services/jobProfileApi";

type SortKey = "newest" | "oldest" | "titleAsc" | "titleDesc";

const PAGE_SIZE = 12;

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale === "vi" ? "vi-VN" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
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

function categoryIconFromName(name: string): string {
  const m: Record<string, string> = {
    ENGINEERING: "terminal",
    DESIGN: "draw",
    PRODUCT: "category",
    DATA: "analytics",
    OPERATIONS: "settings_suggest",
    MARKETING: "campaign",
    OTHER: "work",
  };
  const key = name.trim().toUpperCase();
  if (m[key]) return m[key];
  const icons = ["work", "label", "category", "analytics", "campaign", "draw"] as const;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % icons.length;
  return icons[h];
}

function keywordChips(keywords: string[] | undefined): string[] {
  if (!keywords?.length) return [];
  return keywords.slice(0, 8);
}

function normalizeStatus(status: JobProfile["status"]): "ACTIVE" | "DRAFT" | "ARCHIVED" {
  if (status === "DRAFT" || status === "ARCHIVED") return status;
  return "ACTIVE";
}

function statusBadgeClass(status: JobProfile["status"]): string {
  const normalized = normalizeStatus(status);
  if (normalized === "DRAFT") {
    return "bg-amber-100 text-amber-800 ring-1 ring-amber-300/70";
  }
  if (normalized === "ARCHIVED") {
    return "bg-slate-200 text-slate-700 ring-1 ring-slate-400/60";
  }
  return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/70";
}

export default function AdminJobProfilesPanel() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageCursors, setPageCursors] = useState<Record<number, string | undefined>>({ 1: undefined });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [sort, setSort] = useState<SortKey>("newest");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categories, setCategories] = useState<JobCategory[]>([]);

  const [listAggregate, setListAggregate] = useState<{
    total: number;
    withDescription: number;
    withRequirements: number;
  } | null>(null);
  const [aggregateLoading, setAggregateLoading] = useState(false);
  const [aggregateTick, setAggregateTick] = useState(0);

  const handleEdit = useCallback(
    (id: string) => {
      if (!id?.trim()) return;
      router.push(`/admin/job-profiles/create?id=${encodeURIComponent(id)}`);
    },
    [router],
  );

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

  const resolveCategoryName = (p: JobProfile) =>
    p.category?.name ?? categories.find((c) => c.id === p.categoryId)?.name ?? p.categoryId;

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;

    (async () => {
      setAggregateLoading(true);
      setListAggregate(null);
      try {
        const order: "asc" | "desc" = sort === "oldest" ? "asc" : "desc";
        const agg = await fetchJobProfileListAggregates(
          {
            q: debouncedSearch.trim() || undefined,
            ...(categoryFilter !== "all" ? jobProfileListCategoryParams(categoryFilter) : {}),
            order,
          },
          { signal: ac.signal }
        );
        if (!cancelled) setListAggregate(agg);
      } catch {
        if (!cancelled) setListAggregate(null);
      } finally {
        if (!cancelled) setAggregateLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [debouncedSearch, categoryFilter, sort, aggregateTick]);

  const loadPage = useCallback(
    async (cursor: string | undefined, pageNumber: number) => {
      try {
        setLoading(true);
        setError(null);
        const order: "asc" | "desc" = sort === "oldest" ? "asc" : "desc";
        const { data } = await jobProfileApi.list({
          limit: PAGE_SIZE,
          cursor,
          q: debouncedSearch.trim() || undefined,
          ...(categoryFilter !== "all" ? jobProfileListCategoryParams(categoryFilter) : {}),
          order,
        });
        const items = data.items ?? [];
        setProfiles(items);
        setNextCursor(data.nextCursor);
        setPageCursors((prev) => ({
          ...prev,
          [pageNumber]: cursor,
          ...(data.nextCursor ? { [pageNumber + 1]: data.nextCursor } : {}),
        }));
      } catch (e: unknown) {
        const msg = axios.isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? e.message)
          : t("admin.jobProfile.error.load");
        setError(msg);
        setProfiles([]);
        setNextCursor(undefined);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, categoryFilter, sort, t]
  );

  useEffect(() => {
    // This API uses cursor-based pagination. Jumping directly to page>1 isn't possible without
    // walking cursors, so we clamp to page 1 on initial load.
    const requested = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const safePage = Number.isFinite(requested) && requested > 0 ? requested : 1;
    if (safePage !== 1) {
      router.replace("/admin/dashboard?page=1", { scroll: false });
    }
    setPage(1);
    setPageCursors({ 1: undefined });
    loadPage(undefined, 1);
  }, [loadPage]);

  // Reset pagination when filters change.
  useEffect(() => {
    setPage(1);
    setPageCursors({ 1: undefined });
    setNextCursor(undefined);
    loadPage(undefined, 1);
    startTransition(() => {
      router.replace("/admin/dashboard?page=1", { scroll: false });
    });
  }, [debouncedSearch, categoryFilter, sort]);

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;
    startTransition(() => {
      router.replace("/admin/job-profiles/create", { scroll: false });
    });
  }, [searchParams, router]);

  useEffect(() => {
    const categoryId = searchParams.get("categoryId");
    const category = searchParams.get("category");
    if (categoryId) {
      setCategoryFilter(categoryId);
      return;
    }
    if (category !== null) {
      if (category === "" || category === "all") setCategoryFilter("all");
      else setCategoryFilter(category);
    }
  }, [searchParams]);

  const displayItems = useMemo(() => {
    if (sort === "titleAsc") {
      return [...profiles].sort((a, b) =>
        a.title.localeCompare(b.title, lang === "vi" ? "vi" : "en")
      );
    }
    if (sort === "titleDesc") {
      return [...profiles].sort((a, b) =>
        b.title.localeCompare(a.title, lang === "vi" ? "vi" : "en")
      );
    }
    return profiles;
  }, [profiles, sort, lang]);

  const stats = useMemo(() => {
    if (listAggregate) {
      const total = listAggregate.total;
      const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
      return {
        total,
        pctDesc: pct(listAggregate.withDescription),
        pctReq: pct(listAggregate.withRequirements),
        hasGlobal: true as const,
      };
    }
    const total = profiles.length;
    const withDesc = 0;
    const withReq = 0;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return {
      total,
      pctDesc: pct(withDesc),
      pctReq: pct(withReq),
      hasGlobal: false as const,
    };
  }, [listAggregate, profiles]);

  const handleDelete = async (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("admin.jobProfile.card.confirmDelete"))) return;
    try {
      await jobProfileApi.delete(id);
      setPage(1);
      setPageCursors({ 1: undefined });
      await loadPage(undefined, 1);
      setAggregateTick((n) => n + 1);
    } catch {
      setError(t("admin.jobProfile.error.save"));
    }
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1) return;
    const cursor = pageCursors[nextPage];
    if (nextPage > page && !nextCursor) return;
    setPage(nextPage);
    void loadPage(cursor, nextPage);
    startTransition(() => {
      router.replace(`/admin/dashboard?page=${nextPage}`, { scroll: false });
    });
  };

  const pagerText = useMemo(() => {
    const vi = lang === "vi";
    return {
      prev: vi ? "Trước" : "Prev",
      next: vi ? "Sau" : "Next",
      page: vi ? "Trang" : "Page",
      items: vi ? "mục" : "items", 
    };
  }, [lang]);

  return (
    <div className="min-w-0 space-y-0">
      {error && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {t("admin.dashboard.title")}
          </h2>
          <p className="mt-2 max-w-xl text-on-surface-variant">{t("admin.dashboard.subtitle")}</p>
        </div>
        <div className="inline-flex shrink-0 rounded-xl border border-outline-variant/25 bg-surface-container-lowest p-1">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              viewMode === "grid" ? "bg-surface-container-high text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t("admin.jobProfile.view.grid")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              viewMode === "list" ? "bg-surface-container-high text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {t("admin.jobProfile.view.list")}
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[min(100%,320px)] flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.jobProfile.searchPlaceholder")}
            className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container-lowest py-3.5 pl-12 pr-4 text-sm text-on-surface shadow-sm placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            aria-label={t("admin.jobProfile.searchPlaceholder")}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "all" | string)}
          className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          aria-label={t("admin.jobProfile.form.category")}
        >
          <option value="all">{t("admin.jobProfile.filter.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          aria-label={t("admin.jobProfile.sortLabel")}
        >
          <option value="newest">{t("admin.jobProfile.sort.newest")}</option>
          <option value="oldest">{t("admin.jobProfile.sort.oldest")}</option>
          <option value="titleAsc">{t("admin.jobProfile.sort.titleAsc")}</option>
          <option value="titleDesc">{t("admin.jobProfile.sort.titleDesc")}</option>
        </select>
      </div>

      {loading && (
        <p className="py-12 text-center text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
      )}

      {!loading && profiles.length === 0 && (
        <div className="rounded-[2rem] border border-dashed border-outline-variant/40 bg-surface-container-low/40 px-6 py-20 text-center">
          <span className="material-symbols-outlined mb-4 text-5xl text-on-surface-variant/40">work_outline</span>
          <p className="text-on-surface-variant">{t("admin.jobProfile.empty")}</p>
        </div>
      )}

      {!loading && profiles.length > 0 && displayItems.length > 0 && viewMode === "grid" && (
        <div className="space-y-6">

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {displayItems.map((p) => (
              <article
                key={p.id}
                className="group flex min-h-0 flex-col rounded-2xl border border-primary/15 bg-white p-6 text-primary shadow-sm ring-1 ring-primary/5 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md dark:border-primary/20 dark:bg-surface-container-lowest dark:ring-primary/10"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed/50 text-primary dark:bg-primary-fixed/30">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {categoryIconFromName(resolveCategoryName(p))}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(
                      p.status
                    )}`}
                  >
                    {normalizeStatus(p.status)}
                  </span>
                </div>
                <h4 className="mb-2 font-headline text-lg font-extrabold leading-snug text-primary line-clamp-2 md:text-xl">
                  <Link href={`/admin/job-profiles/${p.id}`} className="hover:underline">
                    {p.title}
                  </Link>
                </h4>
                <p className="mb-5 line-clamp-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-primary/80">
                  {(() => {
                    const raw = String((p as any)?.description || "").trim();
                    if (!raw) return "—";
                    // If description is HTML, show a plain-text preview.
                    const isHtml = /^\s*<[a-z][\w-]*(\s[^>]*)?>/i.test(raw);
                    const text = isHtml
                      ? raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
                      : raw;

                    // Remove markdown headings like "## " at start of lines for list preview.
                    const cleaned = text.replace(/^\s*#{1,6}\s*/gm, "").trim();
                    return cleaned || "—";
                  })()}
                </p>
                <div className="mb-5 flex flex-wrap gap-2">
                  <span
                    className="inline-flex max-w-full items-center rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-on-primary shadow-sm ring-1 ring-primary/30"
                    title={t("admin.jobProfile.form.category")}
                  >
                    {resolveCategoryName(p)}
                  </span>
                  {keywordChips(p.keywords)
                    .slice(0, 3)
                    .map((k) => (
                      <span
                        key={k}
                        className="max-w-full truncate rounded-full border border-dashed border-outline-variant/70 bg-surface-container-high px-2.5 py-1 text-[10px] font-medium leading-tight text-on-surface-variant dark:border-outline-variant/50 dark:bg-surface-container"
                      >
                        {k}
                      </span>
                    ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-primary/10 pt-4">
                  <span className="text-xs text-primary/65">
                    {t("admin.jobProfile.card.updated")}:{" "}
                    {formatRelativeShort(p.updatedAt ?? p.createdAt ?? "", lang)}
                  </span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleEdit(p.id)}
                      className="rounded-lg p-2 text-primary/50 transition hover:bg-primary-fixed/30 hover:text-primary"
                      aria-label={t("admin.jobProfile.card.edit")}
                    >
                      <span className="material-symbols-outlined text-[22px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="rounded-lg p-2 text-primary/50 transition hover:bg-error-container/40 hover:text-error"
                      aria-label={t("admin.jobProfile.card.delete")}
                    >
                      <span className="material-symbols-outlined text-[22px]">delete</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && profiles.length > 0 && displayItems.length > 0 && viewMode === "list" && (
        <div className="overflow-x-auto rounded-2xl border border-outline-variant/15 bg-surface-container-lowest shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/15 bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-5 py-4">{t("admin.jobProfile.list.title")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.category")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.status")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.keywords")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.updated")}</th>
                <th className="px-5 py-4 text-right align-middle">{t("admin.jobProfile.list.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {displayItems.map((p) => (
                <tr key={p.id} className="hover:bg-surface-container-low/80">
                  <td className="px-5 py-4 font-semibold text-on-surface">
                    <Link href={`/admin/job-profiles/${p.id}`} className="hover:text-primary hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex max-w-[12rem] items-center truncate rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-primary">
                      {resolveCategoryName(p)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(
                        p.status
                      )}`}
                    >
                      {normalizeStatus(p.status)}
                    </span>
                  </td>
                  <td className="max-w-md px-5 py-4">
                    {keywordChips(p.keywords).length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {keywordChips(p.keywords).map((k) => (
                          <span
                            key={k}
                            className="inline-block max-w-[10rem] truncate rounded-full border border-dashed border-outline-variant/70 bg-surface-container-high px-2 py-0.5 text-[10px] font-medium text-on-surface-variant dark:border-outline-variant/50 dark:bg-surface-container"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-on-surface-variant">
                    {formatDate(p.updatedAt ?? p.createdAt ?? "", lang)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right align-middle">
                    <div className="inline-flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-error hover:bg-error-container/30"
                        aria-label={t("admin.jobProfile.card.delete")}
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-3 py-1.5">
            <span className="material-symbols-outlined text-[18px] text-primary">inventory_2</span>
            <span className="font-semibold text-on-surface">
              {aggregateLoading && listAggregate === null ? "…" : listAggregate?.total ?? profiles.length}
            </span>
            <span className="text-on-surface-variant">{pagerText.items}</span>
          </span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={loading || page <= 1}
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/25 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            {pagerText.prev}
          </button>
          <span className="inline-flex min-w-[7.5rem] items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface">
            {pagerText.page} {page}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={loading || !nextCursor}
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/25 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high disabled:opacity-50"
          >
            {pagerText.next}
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

    </div>
  );
}
