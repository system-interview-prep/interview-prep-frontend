"use client";

import { useId } from "react";
import AdminButton from "./AdminButton";
import { BulletTextarea } from "./BulletTextarea";
import type { JobCategory } from "@/services/jobCategoryApi";
import type { JobProfileFormState } from "@/services/jobProfileApi";
import { useLanguage } from "@/i18n/LanguageProvider";

export type AdminJobProfileFormMode = "create" | "edit";

export function AdminJobProfileForm({
  mode,
  form,
  setForm,
  categories,
  loadingCategories,
  submitting,
  onCancel,
  onSubmit,
}: {
  mode: AdminJobProfileFormMode;
  form: JobProfileFormState;
  setForm: React.Dispatch<React.SetStateAction<JobProfileFormState>>;
  categories: JobCategory[];
  loadingCategories?: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { t } = useLanguage();
  const formId = useId();

  return (
    <form id={formId} onSubmit={onSubmit} className="min-w-0 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-title`}>
          {t("admin.jobProfile.form.title")}
        </label>
        <input
          id={`${formId}-title`}
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder={t("admin.jobProfile.form.titlePlaceholder")}
          className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface transition-all placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-cat`}>
            {t("admin.jobProfile.form.category")}
          </label>
          <select
            id={`${formId}-cat`}
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            disabled={Boolean(loadingCategories) || categories.length === 0}
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
          <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-status`}>
            Status
          </label>
          <select
            id={`${formId}-status`}
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as JobProfileFormState["status"],
              }))
            }
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-kw`}>
            {t("admin.jobProfile.form.keywords")}
          </label>
          <input
            id={`${formId}-kw`}
            value={form.keywords}
            onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            placeholder={t("admin.jobProfile.form.keywordsHint")}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-[11px] font-semibold text-primary/80">
            {t("admin.jobProfile.createPage.keywordsBadge")}
          </p>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-desc`}>
          {t("admin.jobProfile.form.description")}
        </label>
        <BulletTextarea
          id={`${formId}-desc`}
          rows={6}
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          placeholder={t("admin.jobProfile.form.descriptionPlaceholder")}
          className="w-full resize-y rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-on-surface" htmlFor={`${formId}-req`}>
          {t("admin.jobProfile.form.requirements")}
        </label>
        <BulletTextarea
          id={`${formId}-req`}
          rows={6}
          value={form.requirements}
          onChange={(v) => setForm((f) => ({ ...f, requirements: v }))}
          placeholder={t("admin.jobProfile.form.requirementsPlaceholder")}
          className="w-full resize-y rounded-xl border border-outline-variant/30 bg-surface px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/20 pt-6 sm:flex-row sm:justify-end sm:gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl border border-outline-variant/40 bg-surface-container-high px-6 py-3 text-sm font-bold text-on-surface transition hover:bg-surface-variant disabled:opacity-50 sm:min-w-[8rem]"
        >
          {t("admin.jobProfile.form.cancel")}
        </button>
        <AdminButton
          variant={mode === "create" ? "gradient" : "primary"}
          size="md"
          type="submit"
          icon="save"
          iconFill
          disabled={submitting || Boolean(loadingCategories) || !form.categoryId}
          className="justify-center sm:min-w-[12rem]"
        >
          {mode === "create" ? t("admin.jobProfile.form.save") : t("admin.jobProfile.form.update")}
        </AdminButton>
      </div>
    </form>
  );
}

