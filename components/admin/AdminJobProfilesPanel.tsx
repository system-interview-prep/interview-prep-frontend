"use client";

import Link from "next/link";
import axios from "axios";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminButton from "./AdminButton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { jobCategoryApi, type JobCategory } from "@/services/jobCategoryApi";
import {
  emptyJobProfileForm,
  jobProfileApi,
  jobProfileListCategoryParams,
  keywordsArrayToInput,
  keywordsStringToArray,
  type JobProfile,
  type JobProfileFormState,
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

export default function AdminJobProfilesPanel() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [sort, setSort] = useState<SortKey>("newest");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobProfileFormState>(emptyJobProfileForm);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<JobCategory[]>([]);

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
        const order: "asc" | "desc" = sort === "oldest" ? "asc" : "desc";
        const { data } = await jobProfileApi.list({
          limit: PAGE_SIZE,
          cursor,
          q: debouncedSearch.trim() || undefined,
          ...(categoryFilter !== "all" ? jobProfileListCategoryParams(categoryFilter) : {}),
          order,
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
    [debouncedSearch, categoryFilter, sort, t]
  );

  useEffect(() => {
    loadPage(undefined, false);
  }, [loadPage]);

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
    const total = profiles.length;
    const withDesc = profiles.filter((p) => (p.description ?? "").trim().length > 0).length;
    const withReq = profiles.filter((p) => (p.requirements ?? "").trim().length > 0).length;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return {
      total,
      pctDesc: pct(withDesc),
      pctReq: pct(withReq),
    };
  }, [profiles]);

  const openEdit = useCallback((p: JobProfile) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      categoryId: p.categoryId,
      keywords: keywordsArrayToInput(p.keywords),
      description: p.description ?? "",
      requirements: p.requirements ?? "",
      status: p.status ?? "ACTIVE",
    });
    setModalOpen(true);
  }, []);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await jobProfileApi.get(editId);
        if (cancelled) return;
        openEdit(data);
      } catch {
        /* invalid id */
      } finally {
        if (!cancelled) router.replace("/admin/dashboard", { scroll: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router, openEdit]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.categoryId || !editingId || saving) return;
    setSaving(true);
    try {
      await jobProfileApi.update(editingId, {
        title: form.title.trim(),
        categoryId: form.categoryId,
        keywords: keywordsStringToArray(form.keywords),
        description: form.description.trim() || undefined,
        requirements: form.requirements.trim() || undefined,
        status: form.status,
      });
      await loadPage(undefined, false);
      closeModal();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("admin.jobProfile.card.confirmDelete"))) return;
    try {
      await jobProfileApi.delete(id);
      await loadPage(undefined, false);
    } catch {
      setError(t("admin.jobProfile.error.save"));
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) loadPage(nextCursor, true);
  };

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
            <div className="flex flex-col rounded-2xl border border-primary/15 bg-white p-6 text-primary shadow-sm ring-1 ring-primary/5 dark:border-primary/20 dark:bg-surface-container-lowest">
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-primary/65">
                {t("admin.jobProfile.stats.pipeline")}
              </h4>
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex justify-between text-[10px] font-bold uppercase text-primary/80">
                    <span>{t("admin.jobProfile.stats.withDescription")}</span>
                    <span>{stats.pctDesc}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-primary-fixed/35 dark:bg-primary-fixed/25">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.pctDesc}%` }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-[10px] font-bold uppercase text-primary/80">
                    <span>{t("admin.jobProfile.stats.withRequirements")}</span>
                    <span>{stats.pctReq}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-primary-fixed/35 dark:bg-primary-fixed/25">
                    <div className="h-full rounded-full bg-tertiary transition-all" style={{ width: `${stats.pctReq}%` }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-primary/15 bg-white p-6 text-primary shadow-sm ring-1 ring-primary/5 dark:border-primary/20 dark:bg-surface-container-lowest">
              <div className="font-headline text-4xl font-black text-primary md:text-5xl">{stats.total}</div>
              <div className="mt-2 text-[10px] font-bold uppercase leading-relaxed text-primary/60">
                {t("admin.jobProfile.stats.total")}
                <br />
                {t("admin.jobProfile.stats.sub")}
              </div>
            </div>
          </div>

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
                  <button type="button" className="text-primary/35 hover:text-primary/70 dark:text-primary/40" aria-hidden>
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </div>
                <h4 className="mb-2 font-headline text-lg font-extrabold leading-snug text-primary line-clamp-2 md:text-xl">
                  <Link href={`/admin/job-profiles/${p.id}`} className="hover:underline">
                    {p.title}
                  </Link>
                </h4>
                <p className="mb-5 line-clamp-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-primary/80">
                  {p.description || "—"}
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
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="rounded-lg p-2 text-primary/60 transition hover:bg-primary-fixed/40 hover:text-primary"
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
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant/15 bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-5 py-4">{t("admin.jobProfile.list.title")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.category")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.keywords")}</th>
                <th className="px-5 py-4">{t("admin.jobProfile.list.updated")}</th>
                <th className="px-5 py-4 text-right">{t("admin.jobProfile.list.actions")}</th>
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
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="mr-2 inline-flex rounded-lg p-2 text-primary hover:bg-primary-fixed"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="inline-flex rounded-lg p-2 text-error hover:bg-error-container/30"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && nextCursor && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
          >
            {loadingMore ? t("admin.jobProfile.loading") : t("admin.jobProfile.loadMore")}
          </button>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-inverse-surface/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[min(92vh,900px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <h2 className="font-headline text-xl font-bold text-on-surface">{t("admin.jobProfile.form.editTitle")}</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high"
                aria-label={t("admin.jobProfile.form.cancel")}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="jp-title">
                  {t("admin.jobProfile.form.title")}
                </label>
                <input
                  id="jp-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={t("admin.jobProfile.form.titlePlaceholder")}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="jp-category">
                  {t("admin.jobProfile.form.category")}
                </label>
                <select
                  id="jp-category"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  {form.categoryId && !categories.some((c) => c.id === form.categoryId) && (
                    <option value={form.categoryId}>{form.categoryId}</option>
                  )}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="jp-keywords">
                  {t("admin.jobProfile.form.keywords")}
                </label>
                <input
                  id="jp-keywords"
                  value={form.keywords}
                  onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                  placeholder={t("admin.jobProfile.form.keywordsHint")}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1 text-xs text-on-surface-variant">{t("admin.jobProfile.form.keywordsHint")}</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="jp-desc">
                  {t("admin.jobProfile.form.description")}
                </label>
                <textarea
                  id="jp-desc"
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t("admin.jobProfile.form.descriptionPlaceholder")}
                  className="w-full resize-y rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-on-surface" htmlFor="jp-req">
                  {t("admin.jobProfile.form.requirements")}
                </label>
                <textarea
                  id="jp-req"
                  rows={5}
                  value={form.requirements}
                  onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                  placeholder={t("admin.jobProfile.form.requirementsPlaceholder")}
                  className="w-full resize-y rounded-xl border border-outline-variant/30 bg-surface px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-outline-variant/40 px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
                >
                  {t("admin.jobProfile.form.cancel")}
                </button>
                <AdminButton variant="primary" size="md" type="submit" icon="save" iconFill disabled={saving}>
                  {t("admin.jobProfile.form.save")}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
