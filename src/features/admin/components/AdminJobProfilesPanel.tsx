"use client";

import Link from "next/link";
import axios from "axios";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { taxonomyApi, type TaxonomyConcept } from "@features/admin/services/taxonomy.service";
import {
  jobProfileApi,
  jobProfileListTaxonomyParams,
  type JobProfile,
  type JobProfileUpload,
} from "@features/admin/services/jobProfile.service";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import AdminRowAction from "./primitives/AdminRowAction";
import AdminJobCard from "./AdminJobCard";
import { Pagination } from "@components/shared/Pagination";
import AdminPageHeader from "./primitives/AdminPageHeader";

import { Plus, Search, Briefcase, Edit, Trash2, Terminal, Palette, Layers, BarChart2, Sliders, Megaphone, FileText } from "lucide-react";

export type { JobProfile } from "@features/admin/services/jobProfile.service";

type SortKey = "newest" | "oldest" | "titleAsc" | "titleDesc";
type EntryFilter = "all" | "saved" | "drafts";
type AdminJobListEntry =
  | { kind: "profile"; id: string; title: string; createdAt: string; updatedAt: string; profile: JobProfile }
  | { kind: "upload"; id: string; title: string; createdAt: string; updatedAt: string; upload: JobProfileUpload };

/** Cards per page in grid view and rows per page in list view. */
const GRID_PAGE_SIZE = 12;
const LIST_PAGE_SIZE = 20;
/** Backend max page size, used to walk the cursor pages. */
const FETCH_LIMIT = 100;
/** Safety cap on cursor walking (FETCH_LIMIT * MAX_FETCH_PAGES items). */
const MAX_FETCH_PAGES = 50;

function uploadDraftTitle(upload: JobProfileUpload): string {
  const data = upload.structuredData;
  if (data && typeof data === "object") {
    for (const candidate of ["jobtitle", "title"]) {
      const entry = Object.entries(data).find(([key]) => key.toLowerCase().replace(/[_-]/g, "") === candidate)?.[1];
      const value = entry && typeof entry === "object" && "value" in entry ? entry.value : entry;
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return upload.filename.replace(/\.[^.]+$/, "") || upload.filename;
}

function uploadStatusLabel(status: JobProfileUpload["status"], t: (key: string) => string): string {
  const key = `fixAdmin.jp.uploadStatus.${status}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

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

/** Plain-text preview of a (markdown or HTML) JD description for the card body. */
function descriptionPreview(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const isHtml = /^\s*<[a-z][\w-]*(\s[^>]*)?>/i.test(raw);
  const text = isHtml ? raw.replace(/<[^>]*>/g, " ") : raw;
  const cleaned = text
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "—";
}

function keywordChips(keywords: string[] | null | undefined): string[] {
  if (!keywords?.length) return [];
  return keywords.slice(0, 8);
}

function normalizeStatus(status: JobProfile["status"] | JobProfile["listingStatus"]): "ACTIVE" | "DRAFT" | "ARCHIVED" {
  if (status === "DRAFT" || status === "ARCHIVED") return status;
  return "ACTIVE";
}

const STATUS_LABEL_KEY: Record<"ACTIVE" | "DRAFT" | "ARCHIVED", string> = {
  ACTIVE: "fixAdmin.jp.status.active",
  DRAFT: "fixAdmin.jp.status.draft",
  ARCHIVED: "fixAdmin.jp.status.archived",
};

function statusBadgeClass(status: JobProfile["status"] | JobProfile["listingStatus"]): string {
  const normalized = normalizeStatus(status);
  if (normalized === "DRAFT") {
    return "bg-[#FCB625]/15 text-[#7A5600] border border-[#FCB625]/40";
  }
  if (normalized === "ARCHIVED") {
    return "bg-[#F0F4FC] text-[#607096] border border-[#DCE4F3]";
  }
  return "bg-[#287A4B]/10 text-[#287A4B] border border-[#287A4B]/25";
}

export default function AdminJobProfilesPanel() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [uploadDrafts, setUploadDrafts] = useState<JobProfileUpload[]>([]);
  const [page, setPage] = useState(() => {
    const requested = Number.parseInt(searchParams.get("page") ?? "1", 10);
    return Number.isFinite(requested) && requested > 0 ? requested : 1;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [entryFilter, setEntryFilter] = useState<EntryFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const initialTaxonomyConcept = searchParams.get("taxonomyConceptId");
  const [taxonomyFilter, setTaxonomyFilter] = useState<"all" | string>(initialTaxonomyConcept || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [taxonomyConcepts, setTaxonomyConcepts] = useState<TaxonomyConcept[]>([]);
  const [reloadTick, setReloadTick] = useState(0);

  const pageSize = viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

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
        const { data } = await taxonomyApi.active();
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

  /**
   * The backend only offers cursor pagination without a total count, so we walk all cursor pages
   * for the current filters and paginate on the client (numbered pages, global title sort, exact total).
   */
  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const order: "asc" | "desc" = sort === "oldest" ? "asc" : "desc";
        const all: JobProfile[] = [];
        let cursor: string | undefined;
        for (let i = 0; i < MAX_FETCH_PAGES; i += 1) {
          const { data } = await jobProfileApi.list(
            {
              limit: FETCH_LIMIT,
              cursor,
              q: debouncedSearch.trim() || undefined,
              ...(taxonomyFilter !== "all" ? jobProfileListTaxonomyParams(taxonomyFilter) : {}),
              order,
            },
            { signal: ac.signal }
          );
          all.push(...(data.items ?? []));
          cursor = data.nextCursor;
          if (!cursor) break;
        }
        if (!cancelled) setProfiles(all);
        try {
          const { data } = await jobProfileApi.listUploads(100, { signal: ac.signal });
          if (!cancelled) setUploadDrafts(data.items ?? []);
        } catch (uploadError: unknown) {
          if (cancelled || axios.isCancel(uploadError)) return;
          // The listing remains usable if the uploads endpoint is unavailable.
          if (!cancelled) setUploadDrafts([]);
        }
      } catch (e: unknown) {
        if (cancelled || axios.isCancel(e)) return;
        const msg = axios.isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? e.message)
          : t("admin.jobProfile.error.load");
        setError(msg);
        setProfiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [debouncedSearch, taxonomyFilter, sort, reloadTick, t]);

  const syncPageParam = useCallback(
    (nextPage: number) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextPage === 1) params.delete("page");
        else params.set("page", String(nextPage));
        if (params.toString() === searchParams.toString()) return;
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Reset to page 1 when filters, sort or view mode change (skip the first render so ?page= is honoured).
  const filterKey = `${debouncedSearch.trim()}|${taxonomyFilter}|${entryFilter}|${sort}|${viewMode}`;
  const lastFilterKey = useRef(filterKey);
  useEffect(() => {
    if (lastFilterKey.current === filterKey) return;
    lastFilterKey.current = filterKey;
    setPage(1);
    syncPageParam(1);
  }, [filterKey, syncPageParam]);

  useEffect(() => {
    if (searchParams.get("action") !== "create") return;
    startTransition(() => {
      router.replace("/admin/job-descriptions/create", { scroll: false });
    });
  }, [searchParams, router]);

  const taxonomyParam = searchParams.get("taxonomyConceptId");
  useEffect(() => {
    setTaxonomyFilter(taxonomyParam || "all");
  }, [taxonomyParam]);

  const visibleUploadDrafts = useMemo(() => {
    const query = debouncedSearch.trim().toLocaleLowerCase();
    if (!query) return uploadDrafts;
    return uploadDrafts.filter((upload) =>
      `${uploadDraftTitle(upload)} ${upload.filename}`.toLocaleLowerCase().includes(query),
    );
  }, [uploadDrafts, debouncedSearch]);

  const sortedItems = useMemo<AdminJobListEntry[]>(() => {
    const entries: AdminJobListEntry[] = [
      ...profiles.map((profile) => ({
        kind: "profile" as const,
        id: profile.id,
        title: profile.title,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt ?? profile.createdAt,
        profile,
      })),
      ...(taxonomyFilter === "all" ? visibleUploadDrafts.map((upload) => ({
        kind: "upload" as const,
        id: upload.id,
        title: uploadDraftTitle(upload),
        createdAt: upload.createdAt,
        updatedAt: upload.updatedAt ?? upload.createdAt,
        upload,
      })) : []),
    ].filter((entry) => {
      if (entryFilter === "all") return true;
      const isDraft = entry.kind === "upload" || String(entry.profile.listingStatus ?? entry.profile.status ?? "").toUpperCase() === "DRAFT";
      return entryFilter === "drafts" ? isDraft : !isDraft;
    });

    return entries.sort((left, right) => {
      if (sort === "titleAsc" || sort === "titleDesc") {
        const comparison = left.title.localeCompare(right.title, lang === "vi" ? "vi" : "en");
        return sort === "titleAsc" ? comparison : -comparison;
      }
      const comparison = new Date(left.updatedAt || left.createdAt).getTime() - new Date(right.updatedAt || right.createdAt).getTime();
      return sort === "oldest" ? comparison : -comparison;
    });
  }, [profiles, visibleUploadDrafts, taxonomyFilter, entryFilter, sort, lang]);

  const total = sortedItems.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const displayItems = useMemo(
    () => sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedItems, currentPage, pageSize]
  );

  const [pendingDelete, setPendingDelete] = useState<{ id: string; kind: "profile" | "upload" } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (id: string) => {
    if (!id?.trim()) return;
    setPendingDelete({ id, kind: "profile" });
  };

  const handleDeleteUpload = (id: string) => {
    if (!id?.trim()) return;
    setPendingDelete({ id, kind: "upload" });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === "upload") await jobProfileApi.deleteUpload(pendingDelete.id);
      else await jobProfileApi.delete(pendingDelete.id);
      setReloadTick((n) => n + 1);
    } catch {
      setError(t("admin.jobProfile.error.save"));
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const goToPage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageCount) return;
    setPage(nextPage);
    syncPageParam(nextPage);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isFiltered = Boolean(debouncedSearch.trim()) || taxonomyFilter !== "all" || entryFilter !== "all";

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={t("adminUiJd.list.title")}
        description={t("adminUiJd.list.subtitle")}
        breadcrumbs={[
          { label: t("adminUiJd.breadcrumb.admin"), href: "/admin/dashboard" },
          { label: t("adminUiJd.list.title") },
        ]}
        primaryAction={
          <Link
            href="/admin/job-descriptions/create"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#204195] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#183275] hover:shadow-sm active:scale-[0.99]"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("adminUiJd.create.action")}
          </Link>
        }
        secondaryAction={
          <div className="inline-flex shrink-0 rounded-xl border border-[#DCE4F3] bg-white p-1 shadow-xs" role="group" aria-label={t("adminUiJd.list.viewMode")}>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
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
              aria-pressed={viewMode === "list"}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                viewMode === "list"
                  ? "bg-[#EEF2FD] text-[#204195] font-bold"
                  : "text-[#607096] hover:bg-[#F2F5FC] hover:text-[#204195]"
              }`}
            >
              {t("admin.jobProfile.view.list")}
            </button>
          </div>
        }
      />

      {error && (
        <div className="break-words rounded-2xl border border-[#C43B3B]/30 bg-[#FDF2F2] px-4 py-3 text-sm text-[#C43B3B] shadow-xs" role="alert">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-3.5 shadow-xs sm:grid-cols-2 xl:grid-cols-[minmax(18rem,1fr)_auto_auto_auto]">
        <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
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
          value={entryFilter}
          onChange={(e) => setEntryFilter(e.target.value as EntryFilter)}
          className="h-11 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-xs focus:bg-white focus:border-[#204195] focus:outline-none"
          aria-label={t("fixAdmin.jp.list.entryType")}
        >
          <option value="all">{t("fixAdmin.jp.list.entryAll")}</option>
          <option value="saved">{t("fixAdmin.jp.list.entrySaved")}</option>
          <option value="drafts">{t("fixAdmin.jp.list.entryDrafts")}</option>
        </select>
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

      {!loading && sortedItems.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#DCE4F3] bg-white px-6 py-20 text-center flex flex-col items-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F4FC] text-[#204195] mb-3">
            <Briefcase className="size-7" />
          </div>
          {isFiltered ? (
            <>
              <p className="text-sm font-semibold text-[#14244B]">{t("fixAdmin.jp.emptyFiltered.title")}</p>
              <p className="mt-1 text-xs text-[#607096]">{t("fixAdmin.jp.emptyFiltered.hint")}</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTaxonomyFilter("all");
                  setEntryFilter("all");
                }}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-[#DCE4F3] bg-white px-5 py-2 text-xs font-semibold text-[#14244B] shadow-xs transition-all hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195]"
              >
                {t("fixAdmin.jp.emptyFiltered.clear")}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#14244B]">{t("fixAdmin.jp.emptyNone.title")}</p>
              <p className="mt-1 text-xs text-[#607096]">{t("fixAdmin.jp.emptyNone.hint")}</p>
              <Link
                href="/admin/job-descriptions/create"
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#204195] px-5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#183275]"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("admin.sidebar.createProfile")}
              </Link>
            </>
          )}
        </div>
      )}

      {!loading && displayItems.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {displayItems.map((entry) => entry.kind === "profile" ? (
            <AdminJobCard key={`profile-${entry.id}`} profile={entry.profile} onEdit={handleEdit} onDelete={handleDelete} />
          ) : (
            <article key={`upload-${entry.id}`} className="flex h-full min-w-0 flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-2xs">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FD] text-[#204195]"><FileText className="size-5" /></span>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#FCB625]/40 bg-[#FCB625]/15 px-2.5 py-1 text-[10px] font-bold text-[#7A5600]">{t("fixAdmin.jp.status.draft")}</span>
                    <span className="text-[10px] font-medium text-[#8A98B8]">{uploadStatusLabel(entry.upload.status, t)}</span>
                  </div>
                  <h3 className="break-words text-sm font-bold text-[#14244B]">{entry.title}</h3>
                  <p className="mt-1 truncate text-xs text-[#607096]" title={entry.upload.filename}>{entry.upload.filename}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#EAEFF8] pt-3">
                <span className="text-[10px] text-[#8A98B8]">{t("admin.jobProfile.card.updated")}: {formatRelativeShort(entry.updatedAt, lang)}</span>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/job-descriptions/create?upload=${encodeURIComponent(entry.id)}`} className="rounded-full bg-[#204195] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#183275]">
                    {t("fixAdmin.jp.uploadDrafts.continue")}
                  </Link>
                  <button type="button" onClick={() => handleDeleteUpload(entry.id)} className="rounded-lg p-2 text-[#64748B] hover:bg-red-50 hover:text-red-600" aria-label={`${t("admin.jobProfile.card.delete")}: ${entry.title}`} title={t("admin.jobProfile.card.delete")}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && displayItems.length > 0 && viewMode === "list" && (
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
              {displayItems.map((entry) => entry.kind === "profile" ? (
                <tr key={`profile-${entry.id}`} className="transition-colors hover:bg-[#F8FAFC]">
                  <td className="max-w-xs px-5 py-3.5 font-semibold text-[#14244B]">
                    <Link
                      href={`/admin/job-descriptions/${entry.id}`}
                      className="line-clamp-2 break-words hover:text-[#204195] hover:underline"
                      title={entry.title}
                    >
                      {entry.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <span title={resolveTaxonomyLabel(entry.profile)} className="inline-block max-w-[12rem] truncate rounded-full bg-[#204195]/8 border border-[#204195]/15 px-2 py-0.5 text-[10px] font-semibold text-[#204195]">
                      {resolveTaxonomyLabel(entry.profile)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${statusBadgeClass(
                        entry.profile.listingStatus ?? entry.profile.status
                      )}`}
                    >
                      {t(STATUS_LABEL_KEY[normalizeStatus(entry.profile.listingStatus ?? entry.profile.status)])}
                    </span>
                  </td>
                  <td className="max-w-md px-5 py-3.5">
                    {keywordChips(entry.profile.keywords).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {keywordChips(entry.profile.keywords).map((k) => (
                          <span
                            key={k}
                            title={k}
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
                    {formatDate(entry.updatedAt || entry.createdAt, lang)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                    <div className="inline-flex items-center justify-end gap-1">
                      <AdminRowAction icon={Edit} iconOnly label={t("admin.jobProfile.card.edit")} onClick={() => handleEdit(entry.id)} />
                      <AdminRowAction icon={Trash2} tone="danger" iconOnly label={t("admin.jobProfile.card.delete")} onClick={() => handleDelete(entry.id)} />
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={`upload-${entry.id}`} className="transition-colors hover:bg-[#F8FAFC]">
                  <td className="max-w-xs px-5 py-3.5 font-semibold text-[#14244B]">
                    <Link href={`/admin/job-descriptions/create?upload=${encodeURIComponent(entry.id)}`} className="line-clamp-2 break-words hover:text-[#204195] hover:underline" title={entry.title}>{entry.title}</Link>
                    <span className="mt-1 block truncate text-[10px] font-normal text-[#607096]" title={entry.upload.filename}>{entry.upload.filename}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#8A9ABA]">â€”</td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <span className="inline-flex items-center rounded-full border border-[#FCB625]/40 bg-[#FCB625]/15 px-2.5 py-1 text-[10px] font-bold text-[#7A5600]">{t("fixAdmin.jp.status.draft")}</span>
                    <span className="ml-2 text-[10px] text-[#8A98B8]">{uploadStatusLabel(entry.upload.status, t)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#8A9ABA]">â€”</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-[#607096]">{formatDate(entry.updatedAt || entry.createdAt, lang)}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right align-middle">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Link href={`/admin/job-descriptions/create?upload=${encodeURIComponent(entry.id)}`} className="rounded-full bg-[#204195] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#183275]">{t("fixAdmin.jp.uploadDrafts.continue")}</Link>
                      <AdminRowAction icon={Trash2} tone="danger" iconOnly label={t("admin.jobProfile.card.delete")} onClick={() => handleDeleteUpload(entry.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 && (
        <Pagination page={currentPage} pageSize={pageSize} total={total} onPageChange={goToPage} />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("fixAdmin.jp.deleteConfirm.title")}
        body={t("admin.jobProfile.card.confirmDelete")}
        confirmLabel={t("fixAdmin.jp.deleteConfirm.confirm")}
        cancelLabel={t("fixAdmin.jp.cancel")}
        tone="danger"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
