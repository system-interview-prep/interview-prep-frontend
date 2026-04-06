"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "./AdminButton";
import { jobCategoryApi, type JobCategory } from "@/services/jobCategoryApi";
import {
  emptyJobProfileForm,
  jobProfileApi,
  keywordsStringToArray,
  type JobProfileFormState,
} from "@/services/jobProfileApi";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function AdminJobProfileCreateView() {
  const { t } = useLanguage();
  const router = useRouter();
  const formId = useId();
  const [form, setForm] = useState<JobProfileFormState>(emptyJobProfileForm);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await jobCategoryApi.list({ limit: 200 });
        if (cancelled) return;
        const items = data.items ?? [];
        setCategories(items);
        setForm((f) =>
          f.categoryId ? f : { ...f, categoryId: items[0]?.id ?? "" }
        );
      } catch {
        if (!cancelled) setError(t("admin.jobCategories.errorLoad"));
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const set =
    (key: keyof JobProfileFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const v = e.target.value;
      setForm((f) => ({ ...f, [key]: v }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.categoryId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await jobProfileApi.create({
        title: form.title.trim(),
        categoryId: form.categoryId,
        keywords: keywordsStringToArray(form.keywords),
        description: form.description.trim() || undefined,
        requirements: form.requirements.trim() || undefined,
        status: form.status,
      });
      router.push(`/admin/job-profiles/${data.id}`);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? err.message)
        : t("admin.jobProfile.error.save");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = useCallback(() => {
    router.push("/admin/dashboard");
  }, [router]);

  return (
    <div className="flex min-w-0 flex-col">
      <header className="mb-8 flex min-w-0 flex-col gap-3 border-b border-outline-variant/20 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {t("admin.jobProfile.createPage.back")}
          </Link>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {t("admin.jobProfile.createPage.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">{t("admin.jobProfile.createPage.subtitle")}</p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      <form id={formId} onSubmit={handleSubmit} className="min-w-0">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-title`}>
                  {t("admin.jobProfile.form.title")}
                </label>
                <input
                  id={`${formId}-title`}
                  required
                  value={form.title}
                  onChange={set("title")}
                  placeholder={t("admin.jobProfile.form.titlePlaceholder")}
                  className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface transition-all placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-cat`}>
                    {t("admin.jobProfile.form.category")}
                  </label>
                  <select
                    id={`${formId}-cat`}
                    value={form.categoryId}
                    onChange={set("categoryId")}
                    disabled={loadingCategories || categories.length === 0}
                    required
                    className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  >
                    {categories.length === 0 && !loadingCategories ? (
                      <option value="">{t("admin.jobCategories.empty")}</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-kw`}>
                    {t("admin.jobProfile.form.keywords")}
                  </label>
                  <div className="relative">
                    <input
                      id={`${formId}-kw`}
                      value={form.keywords}
                      onChange={set("keywords")}
                      placeholder={t("admin.jobProfile.form.keywordsHint")}
                      className="w-full rounded-xl border border-outline-variant/30 bg-surface py-3 pl-4 pr-[7.5rem] text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-primary-fixed px-2 py-1 text-[10px] font-bold text-primary">
                      {t("admin.jobProfile.createPage.keywordsBadge")}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-desc`}>
                  {t("admin.jobProfile.form.description")}
                </label>
                <textarea
                  id={`${formId}-desc`}
                  rows={6}
                  value={form.description}
                  onChange={set("description")}
                  placeholder={t("admin.jobProfile.form.descriptionPlaceholder")}
                  className="w-full resize-y rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-req`}>
                  {t("admin.jobProfile.form.requirements")}
                </label>
                <textarea
                  id={`${formId}-req`}
                  rows={6}
                  value={form.requirements}
                  onChange={set("requirements")}
                  placeholder={t("admin.jobProfile.form.requirementsPlaceholder")}
                  className="w-full resize-y rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-6 sm:flex-row sm:justify-end sm:gap-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="rounded-xl border border-outline-variant/40 bg-surface-container-high px-6 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-variant disabled:opacity-50 sm:min-w-[8rem]"
              >
                {t("admin.jobProfile.form.cancel")}
              </button>
              <AdminButton
                variant="gradient"
                size="md"
                type="submit"
                icon="save"
                iconFill
                disabled={submitting || loadingCategories || !form.categoryId}
                className="justify-center sm:min-w-[12rem]"
              >
                {t("admin.jobProfile.form.save")}
              </AdminButton>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
