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
    return "border-2 border-amber-700 bg-amber-100 text-amber-800";
  }
  if (normalized === "ARCHIVED") {
    return "border-2 border-slate-600 bg-slate-200 text-slate-700";
  }
  return "border-2 border-emerald-700 bg-emerald-100 text-emerald-800";
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
    <div className="mx-auto min-w-0 max-w-[1440px] space-y-0">
      {error && (
        <div className="mb-5 rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] px-4 py-3 text-sm text-[#8F1D1D] shadow-[3px_3px_0_#D32F2F]" role="alert">
          {error}
        </div>
      )}

      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="sticker -rotate-1 bg-[#FCB625]">{t("admin.sidebar.jobBoard")}</span>
          <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
            {t("admin.dashboard.title")}
          </h1>
          <p className="mt-3 max-w-xl leading-7 text-[#5A6B8F]">{t("admin.dashboard.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/job-profiles/create" className="chunky-primary min-h-12 px-5 text-sm"><span className="material-symbols-outlined text-xl" aria-hidden="true">add</span>{t("admin.sidebar.createProfile")}</Link>
          <div className="inline-flex shrink-0 rounded-xl border-2 border-[#234196] bg-white p-1 shadow-[2px_2px_0_#234196]">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              viewMode === "grid" ? "bg-[#FCB625] text-[#234196]" : "text-[#5A6B8F] hover:bg-[#F0F4FC] hover:text-[#234196]"
            }`}
          >
            {t("admin.jobProfile.view.grid")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              viewMode === "list" ? "bg-[#FCB625] text-[#234196]" : "text-[#5A6B8F] hover:bg-[#F0F4FC] hover:text-[#234196]"
            }`}
          >
            {t("admin.jobProfile.view.list")}
          </button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-3 rounded-2xl border-2 border-[#234196] bg-white p-3 shadow-[3px_3px_0_#234196] sm:grid-cols-2 xl:grid-cols-[minmax(18rem,1fr)_auto_auto]">
        <div className="relative min-w-[min(100%,320px)] flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6B8F]">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.jobProfile.searchPlaceholder")}
            className="min-h-12 w-full rounded-xl border-2 border-[#234196] bg-[#F0F4FC] py-3 pl-12 pr-4 text-sm text-[#234196] placeholder:text-[#5A6B8F] focus:bg-white focus:outline-none"
            aria-label={t("admin.jobProfile.searchPlaceholder")}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "all" | string)}
          className="min-h-12 w-full rounded-xl border-2 border-[#234196] bg-white px-4 py-3 text-sm font-bold text-[#234196] focus:outline-none"
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
          className="min-h-12 w-full rounded-xl border-2 border-[#234196] bg-white px-4 py-3 text-sm font-bold text-[#234196] focus:outline-none"
          aria-label={t("admin.jobProfile.sortLabel")}
        >
          <option value="newest">{t("admin.jobProfile.sort.newest")}</option>
          <option value="oldest">{t("admin.jobProfile.sort.oldest")}</option>
          <option value="titleAsc">{t("admin.jobProfile.sort.titleAsc")}</option>
          <option value="titleDesc">{t("admin.jobProfile.sort.titleDesc")}</option>
        </select>
      </div>

      {loading && <div className="grid gap-5 md:grid-cols-2" role="status" aria-label={t("admin.jobProfile.loading")}>{[0, 1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] motion-reduce:animate-none" />)}</div>}

      {!loading && profiles.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[#234196] bg-[#F0F4FC] px-6 py-20 text-center">
          <span className="material-symbols-outlined mb-4 text-5xl">work_outline</span>
          <p className="text-[#5A6B8F]">{t("admin.jobProfile.empty")}</p>
        </div>
      )}

      {!loading && profiles.length > 0 && displayItems.length > 0 && viewMode === "grid" && (
        <div className="space-y-6">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {displayItems.map((p) => (
              <article
                key={p.id}
                className="group flex min-h-0 flex-col rounded-2xl border-2 border-[#234196] bg-white p-6 text-[#234196] shadow-[3px_3px_0_#234196] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#234196] motion-reduce:transition-none"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625]">
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
                <h2 className="mb-2 line-clamp-2 font-headline text-xl font-extrabold leading-snug">
                  <Link href={`/admin/job-profiles/${p.id}`} className="hover:underline">
                    {p.title}
                  </Link>
                </h2>
                <p className="mb-5 line-clamp-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-[#5A6B8F]">
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
                    className="sticker inline-flex max-w-full truncate bg-[#F0F4FC] text-[9px]"
                    title={t("admin.jobProfile.form.category")}
                  >
                    {resolveCategoryName(p)}
                  </span>
                  {keywordChips(p.keywords)
                    .slice(0, 3)
                    .map((k) => (
                      <span
                        key={k}
                        className="max-w-full truncate rounded-lg border-2 border-dashed border-[#234196] bg-[#FEF9EE] px-2.5 py-1 text-[10px] font-medium leading-tight"
                      >
                        {k}
                      </span>
                    ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t-2 border-[#234196] pt-4">
                  <span className="text-xs text-[#5A6B8F]">
                    {t("admin.jobProfile.card.updated")}:{" "}
                    {formatRelativeShort(p.updatedAt ?? p.createdAt ?? "", lang)}
                  </span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleEdit(p.id)}
                      className="grid min-h-11 min-w-11 place-items-center rounded-lg transition hover:bg-[#F0F4FC]"
                      aria-label={t("admin.jobProfile.card.edit")}
                    >
                      <span className="material-symbols-outlined text-[22px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="grid min-h-11 min-w-11 place-items-center rounded-lg text-[#D32F2F] transition hover:bg-[#FFEBEE]"
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
        <div className="overflow-x-auto rounded-2xl border-2 border-[#234196] bg-white shadow-[3px_3px_0_#234196]">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#234196] bg-[#F0F4FC] text-xs font-bold uppercase tracking-wider text-[#5A6B8F]">
                <th className="px-5 py-4">{t("admin.jobProfile.list.title")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.category")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.status")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.keywords")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.updated")}</th>
                <th className="px-5 py-4 text-right align-middle">{t("admin.jobProfile.list.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#234196]">
              {displayItems.map((p) => (
                <tr key={p.id} className="hover:bg-[#FEF9EE]">
                  <td className="px-5 py-4 font-semibold text-on-surface">
                    <Link href={`/admin/job-profiles/${p.id}`} className="hover:text-primary hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className="sticker inline-flex max-w-[12rem] truncate bg-[#F0F4FC] text-[8px]">
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
                            className="inline-block max-w-[10rem] truncate rounded-lg border-2 border-dashed border-[#234196] bg-[#FEF9EE] px-2 py-0.5 text-[10px] font-medium"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-[#5A6B8F]">
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

      <div className="mt-8 flex flex-col gap-4 rounded-2xl border-2 border-[#234196] bg-[#F0F4FC] p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#5A6B8F]">
          <span className="inline-flex min-h-11 items-center gap-2 px-3">
            <span className="material-symbols-outlined text-[18px] text-[#234196]">inventory_2</span>
            <span className="font-bold text-[#234196]">
              {aggregateLoading && listAggregate === null ? "…" : listAggregate?.total ?? profiles.length}
            </span>
            <span>{pagerText.items}</span>
          </span>
        </p>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={loading || page <= 1}
            className="chunky-secondary min-h-11 px-4 text-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            {pagerText.prev}
          </button>
          <span className="inline-flex min-h-11 min-w-[6rem] items-center justify-center px-2 text-sm font-bold">
            {pagerText.page} {page}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={loading || !nextCursor}
            className="chunky-primary min-h-11 px-4 text-sm disabled:opacity-50"
          >
            {pagerText.next}
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

    </div>
  );
}
