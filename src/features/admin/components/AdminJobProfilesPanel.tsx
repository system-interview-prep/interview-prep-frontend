"use client";

import Link from "next/link";
import axios from "axios";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { taxonomyApi, type TaxonomyConcept } from "@/lib/api/taxonomyApi";
import {
  fetchJobProfileListAggregates,
  jobProfileApi,
  jobProfileListTaxonomyParams,
  type JobProfile,
} from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";

import { Plus, Search, Briefcase, Edit, Trash2, Archive, ChevronLeft, ChevronRight, Terminal, Palette, Layers, BarChart2, Sliders, Megaphone } from "lucide-react";

export type { JobProfile } from "@features/admin/services/jobProfile.service";

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

function CategoryIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const key = name.trim().toUpperCase();
  if (key === "ENGINEERING") return <Terminal className={className} />;
  if (key === "DESIGN") return <Palette className={className} />;
  if (key === "PRODUCT") return <Layers className={className} />;
  if (key === "DATA") return <BarChart2 className={className} />;
  if (key === "OPERATIONS") return <Sliders className={className} />;
  if (key === "MARKETING") return <Megaphone className={className} />;
  return <Briefcase className={className} />;
}

function keywordChips(keywords: string[] | null | undefined): string[] {
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
    return "bg-amber-50 text-amber-800 border border-amber-200";
  }
  if (normalized === "ARCHIVED") {
    return "bg-slate-50 text-slate-700 border border-slate-200";
  }
  return "bg-emerald-50 text-emerald-800 border border-emerald-200";
}

export default function AdminJobProfilesPanel() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
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
  const initialTaxonomyConcept = searchParams.get("taxonomyConceptId");
  const [taxonomyFilter, setTaxonomyFilter] = useState<"all" | string>(initialTaxonomyConcept || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [taxonomyConcepts, setTaxonomyConcepts] = useState<TaxonomyConcept[]>([]);

  useEffect(() => {
    const fromUrl = searchParams.get("taxonomyConceptId");
    if (fromUrl) {
      setTaxonomyFilter(fromUrl);
    }
  }, [searchParams]);

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
      router.push(`/admin/job-descriptions/create?id=${encodeURIComponent(id)}`);
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await taxonomyApi.getActive();
        if (!cancelled) setTaxonomyConcepts(data.concepts ?? []);
      } catch {
        if (!cancelled) setTaxonomyConcepts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolveTaxonomyLabel = (p: JobProfile) => p.primaryTaxonomy?.label ?? t("userDash.jobProfiles.uncategorized");

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
            ...(taxonomyFilter !== "all" ? jobProfileListTaxonomyParams(taxonomyFilter) : {}),
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
  }, [debouncedSearch, taxonomyFilter, sort, aggregateTick]);

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
          ...(taxonomyFilter !== "all" ? jobProfileListTaxonomyParams(taxonomyFilter) : {}),
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
    [debouncedSearch, taxonomyFilter, sort, t]
  );

  useEffect(() => {
    // This API uses cursor-based pagination. Jumping directly to page>1 isn't possible without
    // walking cursors, so we clamp to page 1 on initial load.
    const requested = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const safePage = Number.isFinite(requested) && requested > 0 ? requested : 1;
    if (safePage !== 1) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
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
      if (searchParams.get("page") && searchParams.get("page") !== "1") {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    });
  }, [debouncedSearch, taxonomyFilter, sort]);

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;
    startTransition(() => {
      router.replace("/admin/job-descriptions/create", { scroll: false });
    });
  }, [searchParams, router]);

  useEffect(() => {
    setTaxonomyFilter(searchParams.get("taxonomyConceptId") || "all");
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
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage === 1) {
        params.delete("page");
      } else {
        params.set("page", String(nextPage));
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
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
    <div className="mx-auto min-w-0 max-w-[1440px] space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-xs" role="alert">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#204195]/8 border border-[#204195]/15 px-3 py-1 text-xs font-semibold text-[#204195]">
            <Briefcase className="size-3.5" />
            {t("admin.sidebar.jobBoard")}
          </span>
          <h1 className="mt-2.5 font-headline text-2xl font-bold tracking-tight text-[#14244B] md:text-3xl">
            {t("admin.dashboard.title")}
          </h1>
          <p className="mt-1 max-w-xl text-xs text-[#607096]">{t("admin.dashboard.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/job-descriptions/create"
            className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#204195] hover:bg-[#183275] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:shadow-sm active:scale-[0.99]"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("admin.sidebar.createProfile")}
          </Link>
          <div className="inline-flex shrink-0 rounded-xl border border-[#DCE4F3] bg-white p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === "grid"
                  ? "bg-[#EEF2FD] text-[#204195] font-bold"
                  : "text-[#607096] hover:bg-[#F2F5FC] hover:text-[#204195]"
              }`}
            >
              {t("admin.jobProfile.view.grid")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === "list"
                  ? "bg-[#EEF2FD] text-[#204195] font-bold"
                  : "text-[#607096] hover:bg-[#F2F5FC] hover:text-[#204195]"
              }`}
            >
              {t("admin.jobProfile.view.list")}
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-3.5 shadow-xs sm:grid-cols-2 xl:grid-cols-[minmax(18rem,1fr)_auto_auto]">
        <div className="relative min-w-[min(100%,320px)] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8A9ABA]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.jobProfile.searchPlaceholder")}
            className="h-11 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2.5 pl-10 pr-4 text-xs font-medium text-[#14244B] placeholder:text-[#8A9ABA] shadow-xs focus:bg-white focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15"
            aria-label={t("admin.jobProfile.searchPlaceholder")}
          />
        </div>
        <select
          value={taxonomyFilter}
          onChange={(e) => setTaxonomyFilter(e.target.value as "all" | string)}
          className="h-11 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-xs focus:bg-white focus:border-[#204195] focus:outline-none"
          aria-label={t("admin.jobProfile.form.category")}
        >
          <option value="all">{t("admin.jobProfile.filter.allCategories")}</option>
          {taxonomyConcepts.map((concept) => (
            <option key={concept.concept_id} value={concept.concept_id}>
              {concept.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-11 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-xs focus:bg-white focus:border-[#204195] focus:outline-none"
          aria-label={t("admin.jobProfile.sortLabel")}
        >
          <option value="newest">{t("admin.jobProfile.sort.newest")}</option>
          <option value="oldest">{t("admin.jobProfile.sort.oldest")}</option>
          <option value="titleAsc">{t("admin.jobProfile.sort.titleAsc")}</option>
          <option value="titleDesc">{t("admin.jobProfile.sort.titleDesc")}</option>
        </select>
      </div>

      {loading && (
        <div className="grid gap-5 md:grid-cols-2" role="status" aria-label={t("admin.jobProfile.loading")}>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white shadow-xs motion-reduce:animate-none" />
          ))}
        </div>
      )}

      {!loading && profiles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#DCE4F3] bg-white px-6 py-20 text-center flex flex-col items-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F4FC] text-[#204195] mb-3">
            <Briefcase className="size-7" />
          </div>
          <p className="text-sm font-medium text-[#607096]">{t("admin.jobProfile.empty")}</p>
        </div>
      )}

      {!loading && profiles.length > 0 && displayItems.length > 0 && viewMode === "grid" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {displayItems.map((p) => (
              <article
                key={p.id}
                className="group flex min-h-0 flex-col rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#204195]/40 hover:shadow-md motion-reduce:transition-none"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F4FC] text-[#204195]">
                    <CategoryIcon name={resolveTaxonomyLabel(p)} className="size-5" />
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(
                      p.status
                    )}`}
                  >
                    {normalizeStatus(p.status)}
                  </span>
                </div>
                <h2 className="mb-2 line-clamp-2 font-headline text-lg font-bold text-[#14244B] leading-snug transition-colors group-hover:text-[#204195]">
                  <Link href={`/admin/job-descriptions/${p.id}`} className="hover:underline">
                    {p.title}
                  </Link>
                </h2>
                <p className="mb-5 line-clamp-3 flex-1 whitespace-pre-wrap text-xs leading-relaxed text-[#607096]">
                  {(() => {
                    const raw = String((p as Record<string, unknown>)?.description || "").trim();
                    if (!raw) return "—";
                    const isHtml = /^\s*<[a-z][\w-]*(\s[^>]*)?>/i.test(raw);
                    const text = isHtml
                      ? raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
                      : raw;
                    const cleaned = text.replace(/^\s*#{1,6}\s*/gm, "").trim();
                    return cleaned || "—";
                  })()}
                </p>
                <div className="mb-5 flex flex-wrap gap-1.5">
                  <span
                    className="inline-flex max-w-full truncate rounded-full bg-[#204195]/8 border border-[#204195]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#204195]"
                    title={t("admin.jobProfile.form.category")}
                  >
                    {resolveTaxonomyLabel(p)}
                  </span>
                  {keywordChips(p.keywords)
                    .slice(0, 3)
                    .map((k) => (
                      <span
                        key={k}
                        className="max-w-full truncate rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-medium text-[#607096]"
                      >
                        {k}
                      </span>
                    ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-[#EAEFF8] pt-4">
                  <span className="text-[11px] text-[#607096]">
                    {t("admin.jobProfile.card.updated")}:{" "}
                    {formatRelativeShort(p.updatedAt ?? p.createdAt ?? "", lang)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(p.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-[#607096] transition hover:bg-[#F0F4FC] hover:text-[#204195]"
                      aria-label={t("admin.jobProfile.card.edit")}
                    >
                      <Edit className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                      aria-label={t("admin.jobProfile.card.delete")}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && profiles.length > 0 && displayItems.length > 0 && viewMode === "list" && (
        <div className="overflow-x-auto rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#EAEFF8] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[#607096]">
                <th className="px-5 py-3.5">{t("admin.jobProfile.list.title")}</th>
                <th className="px-5 py-3.5">{t("admin.jobProfile.list.category")}</th>
                <th className="px-5 py-3.5">{t("admin.jobProfile.list.status")}</th>
                <th className="px-5 py-3.5">{t("admin.jobProfile.list.keywords")}</th>
                <th className="px-5 py-3.5">{t("admin.jobProfile.list.updated")}</th>
                <th className="px-5 py-3.5 text-right align-middle">{t("admin.jobProfile.list.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8] text-xs">
              {displayItems.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-[#F8FAFC]">
                  <td className="px-5 py-3.5 font-semibold text-[#14244B]">
                    <Link href={`/admin/job-descriptions/${p.id}`} className="hover:text-[#204195] hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex max-w-[12rem] truncate rounded-full bg-[#204195]/8 border border-[#204195]/15 px-2 py-0.5 text-[10px] font-semibold text-[#204195]">
                      {resolveTaxonomyLabel(p)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(
                        p.status
                      )}`}
                    >
                      {normalizeStatus(p.status)}
                    </span>
                  </td>
                  <td className="max-w-md px-5 py-3.5">
                    {keywordChips(p.keywords).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {keywordChips(p.keywords).map((k) => (
                          <span
                            key={k}
                            className="inline-block max-w-[10rem] truncate rounded-lg border border-[#DCE4F3] bg-[#F8FAFC] px-1.5 py-0.5 text-[10px] font-medium text-[#607096]"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#8A9ABA]">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-[#607096]">
                    {formatDate(p.updatedAt ?? p.createdAt ?? "", lang)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                    <div className="inline-flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(p.id)}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-[#607096] hover:bg-[#F0F4FC] hover:text-[#204195]"
                        aria-label={t("admin.jobProfile.card.edit")}
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                        aria-label={t("admin.jobProfile.card.delete")}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <p className="text-xs text-[#607096]">
          <span className="inline-flex items-center gap-1.5 px-1">
            <Archive className="size-4 text-[#204195]" />
            <span className="font-bold text-[#14244B]">
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
            className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl border border-[#DCE4F3] bg-white px-3 text-xs font-semibold text-[#14244B] shadow-xs transition-all hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
            {pagerText.prev}
          </button>
          <span className="inline-flex min-h-9 min-w-[5rem] items-center justify-center px-2 text-xs font-bold text-[#14244B]">
            {pagerText.page} {page}
          </span>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={loading || !nextCursor}
            className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-[#204195] px-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pagerText.next}
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
