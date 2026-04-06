"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import AdminButton from "./AdminButton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { jobCategoryApi, type JobCategory } from "@/services/jobCategoryApi";
import { useLanguage } from "@/i18n/LanguageProvider";

const DESCRIPTION_COLLAPSE_AT = 280;
const PAGE_SIZE = 24;

type ModalMode = "closed" | "create" | "edit";

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

function CategoryListItem({
  cat,
  onEdit,
  onDelete,
  deleting,
}: {
  cat: JobCategory;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-medium text-on-surface">{cat.name}</h2>
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
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5 sm:flex-col sm:items-end sm:pt-0.5">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => onEdit(cat.id)}
            className="rounded-md p-2 text-on-surface-variant/60 transition hover:bg-surface-container-high hover:text-primary"
            aria-label={t("admin.jobCategories.edit")}
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(cat.id)}
            disabled={deleting}
            className="rounded-md p-2 text-on-surface-variant/60 transition hover:bg-error-container/20 hover:text-error disabled:opacity-40"
            aria-label={t("admin.jobCategories.delete")}
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const closeModal = () => {
    setModalMode("closed");
    setEditingId(null);
    setName("");
    setDescription("");
    setLoadingDetail(false);
  };

  const openCreate = () => {
    setError(null);
    setName("");
    setDescription("");
    setEditingId(null);
    setModalMode("create");
  };

  const openEdit = async (id: string) => {
    setError(null);
    setEditingId(id);
    setModalMode("edit");
    setLoadingDetail(true);
    setName("");
    setDescription("");
    try {
      const { data } = await jobCategoryApi.get(id);
      setName(data.name);
      setDescription(data.description ?? "");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobCategories.errorLoad");
      setError(msg);
      closeModal();
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || saving || loadingDetail) return;
    setSaving(true);
    setError(null);
    const desc = description.trim();
    try {
      if (modalMode === "edit" && editingId) {
        await jobCategoryApi.update(editingId, {
          name: n,
          description: desc || undefined,
        });
      } else {
        await jobCategoryApi.create({
          name: n,
          description: desc || undefined,
        });
      }
      closeModal();
      await loadPage(undefined, false);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobCategories.errorSave");
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("admin.jobCategories.confirmDelete"))) return;
    setDeletingId(id);
    setError(null);
    try {
      await jobCategoryApi.delete(id);
      await loadPage(undefined, false);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobCategories.errorSave");
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) loadPage(nextCursor, true);
  };

  const modalOpen = modalMode !== "closed";
  const isEdit = modalMode === "edit";

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
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          {t("admin.jobCategories.add")}
        </button>
      </header>

      <div className="relative">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/70">
          search
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.jobCategories.searchPlaceholder")}
          className="w-full rounded-lg border border-outline-variant/20 bg-surface py-2.5 pl-10 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
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
          {!debouncedSearch.trim() ? (
            <p className="mt-2 text-xs text-on-surface-variant/80">{t("admin.jobCategories.emptyHint")}</p>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-outline-variant/15">
            {items.map((cat) => (
              <CategoryListItem
                key={cat.id}
                cat={cat}
                onEdit={openEdit}
                onDelete={handleDelete}
                deleting={deletingId === cat.id}
              />
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

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-inverse-surface/35 p-4 backdrop-blur-[2px] sm:items-center"
          role="presentation"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="jc-modal-title"
            className="w-full max-w-md rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-lg sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <h2 id="jc-modal-title" className="text-lg font-semibold text-on-surface">
                {isEdit ? t("admin.jobCategories.editTitle") : t("admin.jobCategories.createTitle")}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high"
                aria-label={t("common.close")}
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            {loadingDetail ? (
              <p className="py-8 text-center text-sm text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-on-surface" htmlFor="jc-modal-name">
                    {t("admin.jobCategories.name")}
                  </label>
                  <input
                    id="jc-modal-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("admin.jobCategories.namePlaceholder")}
                    className="w-full rounded-lg border border-outline-variant/25 bg-surface px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25"
                    required
                    autoFocus={!isEdit}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-on-surface" htmlFor="jc-modal-desc">
                    {t("admin.jobCategories.description")}
                  </label>
                  <textarea
                    id="jc-modal-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("admin.jobCategories.descriptionPlaceholder")}
                    rows={4}
                    className="w-full resize-y rounded-lg border border-outline-variant/25 bg-surface px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25"
                  />
                </div>
                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
                  >
                    {t("admin.jobProfile.form.cancel")}
                  </button>
                  <AdminButton
                    variant="primary"
                    size="md"
                    type="submit"
                    icon={isEdit ? "save" : "add"}
                    iconFill
                    disabled={saving || !name.trim()}
                  >
                    {isEdit ? t("admin.jobProfile.form.save") : t("admin.jobCategories.add")}
                  </AdminButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
