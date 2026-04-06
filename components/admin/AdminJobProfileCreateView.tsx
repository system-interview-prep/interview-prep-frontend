"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminJobProfileForm } from "./AdminJobProfileForm";
import { normalizeBulletFieldForSave } from "./BulletTextarea";
import { jobCategoryApi, type JobCategory } from "@/services/jobCategoryApi";
import {
  emptyJobProfileForm,
  jobProfileApi,
  keywordsArrayToInput,
  keywordsStringToArray,
  type JobProfileFormState,
} from "@/services/jobProfileApi";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function AdminJobProfileCreateView() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [form, setForm] = useState<JobProfileFormState>(emptyJobProfileForm);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
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
        setForm((f) => {
          if (editId) return f;
          return f.categoryId ? f : { ...f, categoryId: items[0]?.id ?? "" };
        });
      } catch {
        if (!cancelled) setError(t("admin.jobCategories.errorLoad"));
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t, editId]);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      setLoadingProfile(true);
      setError(null);
      try {
        const { data } = await jobProfileApi.get(editId);
        if (cancelled) return;
        setForm({
          title: data.title,
          categoryId: data.categoryId,
          keywords: keywordsArrayToInput(data.keywords),
          description: data.description ?? "",
          requirements: data.requirements ?? "",
          status: data.status ?? "ACTIVE",
        });
      } catch {
        if (!cancelled) {
          setError(t("admin.jobProfile.error.load"));
          router.replace("/admin/job-profiles/create");
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, router, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.categoryId || submitting) return;
    if (editId && loadingProfile) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editId) {
        await jobProfileApi.update(editId, {
          title: form.title.trim(),
          categoryId: form.categoryId,
          keywords: keywordsStringToArray(form.keywords),
          description: normalizeBulletFieldForSave(form.description),
          requirements: normalizeBulletFieldForSave(form.requirements),
          status: form.status,
        });
        router.push(`/admin/job-profiles/${editId}`);
      } else {
        const { data } = await jobProfileApi.create({
          title: form.title.trim(),
          categoryId: form.categoryId,
          keywords: keywordsStringToArray(form.keywords),
          description: normalizeBulletFieldForSave(form.description),
          requirements: normalizeBulletFieldForSave(form.requirements),
          status: form.status,
        });
        router.push(`/admin/job-profiles/${data.id}`);
      }
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

  const isEdit = Boolean(editId);
  const pageBusy = loadingCategories || (isEdit && loadingProfile);

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
            {isEdit ? t("admin.jobProfile.form.editTitle") : t("admin.jobProfile.createPage.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            {isEdit ? t("admin.jobProfile.editPage.subtitle") : t("admin.jobProfile.createPage.subtitle")}
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      <div className="min-w-0">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm md:p-8">
            {pageBusy ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
            ) : (
              <AdminJobProfileForm
                mode={isEdit ? "edit" : "create"}
                form={form}
                setForm={setForm}
                categories={
                  form.categoryId && !categories.some((c) => c.id === form.categoryId)
                    ? [{ id: form.categoryId, name: form.categoryId }, ...categories]
                    : categories
                }
                loadingCategories={loadingCategories}
                submitting={submitting}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
