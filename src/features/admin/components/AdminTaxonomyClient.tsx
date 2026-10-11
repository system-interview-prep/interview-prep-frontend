"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import {
  taxonomyApi,
  type ActiveTaxonomy,
  type TaxonomyVersion,
} from "@features/admin/services/taxonomy.service";
import AdminEmptyState from "./primitives/AdminEmptyState";
import AdminPageHeader from "./primitives/AdminPageHeader";

const initialForm = {
  version: "",
  priority: "0",
  conceptId: "",
  label: "",
  kind: "skill",
  description: "",
  aliases: "",
  isActive: true,
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminTaxonomyClient() {
  const { t } = useLanguage();
  const [taxonomy, setTaxonomy] = useState<ActiveTaxonomy | null>(null);
  const [versions, setVersions] = useState<TaxonomyVersion[]>([]);
  const [editingConcept, setEditingConcept] = useState<string | null>(null);
  const [cloneFrom, setCloneFrom] = useState("");
  const [conceptPage, setConceptPage] = useState(1);
  const conceptPageSize = 20;
  const [conceptSearch, setConceptSearch] = useState("");
  const [conceptKindFilter, setConceptKindFilter] = useState("all");
  const [conceptStatusFilter, setConceptStatusFilter] = useState("all");
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [deletingVersion, setDeletingVersion] = useState(false);
  const [deletingConcept, setDeletingConcept] = useState<string | null>(null);

  const isNewVersion =
    !editingConcept &&
    !versions.some((item) => item.version === form.version.trim());

  const load = async () => {
    setState("loading");
    try {
      const active = (await taxonomyApi.active()).data;
      setVersions((await taxonomyApi.versions()).data.items);
      setTaxonomy(active);
      setConceptPage(1);
      setForm((current) => ({
        ...current,
        version: active.version || current.version || "internal-career-2026.2",
      }));
      setState("ready");
    } catch {
      setState("error");
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    try {
      const version = form.version.trim() || taxonomy?.version;
      if (!version) throw new Error(t("fixAdmin.taxonomy.versionRequired"));
      if (!taxonomy?.version || version !== taxonomy.version) {
        if (cloneFrom && isNewVersion) await taxonomyApi.cloneVersion(version, cloneFrom);
        else
          await taxonomyApi.upsertVersion({
            version,
            priority: Number(form.priority) || 0,
            activate: false,
          });
      }
      const conceptId = slugify(form.label);
      if (!conceptId) throw new Error(t("fixAdmin.taxonomy.labelRequired"));
      const savedConceptId = editingConcept || conceptId;
      await taxonomyApi.upsertConcept(version, savedConceptId, {
        label: form.label.trim(),
        kind: form.kind,
        description: form.description.trim(),
        aliases: form.aliases
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        metadata: {},
        isActive: form.isActive,
      });
      setMessage(
        t("fixAdmin.taxonomy.conceptSaved"),
      );
      setEditingConcept(null);
      setCloneFrom("");
      setForm({ ...initialForm, version });
      await load();
    } catch (error) {
      setMessage(
        (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail ||
          (error as Error).message ||
          t("fixAdmin.taxonomy.saveFailed"),
      );
    }
  };

  const activate = async () => {
    const targetVersion = form.version.trim() || taxonomy?.version;
    if (!targetVersion) return;
    try {
      await taxonomyApi.activate(targetVersion);
      setMessage(t("fixAdmin.taxonomy.activated"));
      await load();
    } catch (error) {
      setMessage(
        (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || t("fixAdmin.taxonomy.activateFailed"),
      );
    }
  };

  const deleteVersion = async () => {
    const version = form.version.trim();
    const selectedVersion = versions.find((item) => item.version === version);
    if (!version || !selectedVersion || selectedVersion.isActive) return;
    if (
      !window.confirm(
        fmt(t("fixAdmin.taxonomy.confirmDeleteVersion"), { version }),
      )
    ) {
      return;
    }
    setDeletingVersion(true);
    setMessage("");
    try {
      await taxonomyApi.deleteVersion(version);
      setMessage(fmt(t("fixAdmin.taxonomy.versionDeleted"), { version }));
      setEditingConcept(null);
      setCloneFrom("");
      setForm({ ...initialForm, version: taxonomy?.version || "" });
      await load();
    } catch (error) {
      setMessage(
        (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || t("fixAdmin.taxonomy.deleteVersionFailed"),
      );
    } finally {
      setDeletingVersion(false);
    }
  };

  const deleteConcept = async (conceptId: string, label: string) => {
    const version = taxonomy?.version;
    if (!version || deletingConcept) return;
    if (
      !window.confirm(
        fmt(t("fixAdmin.taxonomy.confirmDeleteConcept"), { label, conceptId, version }),
      )
    ) {
      return;
    }
    setDeletingConcept(conceptId);
    setMessage("");
    try {
      await taxonomyApi.deleteConcept(version, conceptId);
      if (editingConcept === conceptId) {
        setEditingConcept(null);
        setForm({ ...initialForm, version });
      }
      setMessage(fmt(t("fixAdmin.taxonomy.conceptDeleted"), { conceptId }));
      await load();
    } catch (error) {
      setMessage(
        (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || t("fixAdmin.taxonomy.deleteConceptFailed"),
      );
    } finally {
      setDeletingConcept(null);
    }
  };

  const exportVersion = async () => {
    const version = form.version.trim() || taxonomy?.version;
    if (!version) return;
    const response = await taxonomyApi.exportVersion(version);
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taxonomy-${version}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = async () => {
    const response = await taxonomyApi.downloadTemplate();
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "taxonomy-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importVersion = async (file: File) => {
    const version = form.version.trim() || taxonomy?.version;
    if (!version) return;
    try {
      await taxonomyApi.importVersion(version, file);
      setMessage(fmt(t("fixAdmin.taxonomy.imported"), { version }));
      await load();
    } catch (error) {
      setMessage(
        (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || t("fixAdmin.taxonomy.importFailed"),
      );
    }
  };

  const availableKinds = Array.from(
    new Set([
      "skill",
      "competency",
      "domain",
      "occupation",
      "job_family",
      ...(taxonomy?.concepts.map((c) => c.kind).filter(Boolean) || []),
    ]),
  );

  const filteredConcepts = (taxonomy?.concepts || []).filter((concept) => {
    if (conceptSearch.trim()) {
      const q = conceptSearch.trim().toLowerCase();
      const matchId = concept.concept_id.toLowerCase().includes(q);
      const matchLabel = concept.label.toLowerCase().includes(q);
      const matchDesc = (concept.description || "").toLowerCase().includes(q);
      if (!matchId && !matchLabel && !matchDesc) return false;
    }
    if (conceptKindFilter !== "all" && concept.kind !== conceptKindFilter) {
      return false;
    }
    if (conceptStatusFilter === "active" && !concept.is_active) {
      return false;
    }
    if (conceptStatusFilter === "inactive" && concept.is_active) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredConcepts.length / conceptPageSize),
  );
  const safeConceptPage = Math.min(conceptPage, totalPages);
  const paginatedConcepts = filteredConcepts.slice(
    (safeConceptPage - 1) * conceptPageSize,
    safeConceptPage * conceptPageSize,
  );

  return (
    <div className="space-y-6 [&>div:first-child]:w-full [&>div:first-child]:justify-end">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void downloadTemplate()}
          className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#204195]"
        >
          {t("fixAdmin.taxonomy.downloadTemplate")}
        </button>
        <button
          type="button"
          onClick={() => void exportVersion()}
          className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#204195]"
        >
          {t("fixAdmin.taxonomy.export")}
        </button>
        <label className="cursor-pointer rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#204195]">
          {t("fixAdmin.taxonomy.import")}
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importVersion(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      <AdminPageHeader
        title={t("fixAdmin.shell.taxonomy")}
        description={t("fixAdmin.taxonomy.pageDesc")}
        breadcrumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Taxonomy" },
        ]}
        primaryAction={
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-[#DCE4F3] bg-white px-4 py-2 text-sm font-semibold text-[#14244B]"
          >
            {t("fixAdmin.taxonomy.refresh")}
          </button>
        }
      />
      {message && (
        <div
          role="status"
          className="rounded-xl border border-[#DCE4F3] bg-white p-3 text-sm text-[#14244B]"
        >
          {message}
        </div>
      )}
      {state === "error" ? (
        <AdminEmptyState
          variant="error"
          title={t("fixAdmin.taxonomy.loadErrorTitle")}
          description={t("fixAdmin.taxonomy.loadErrorDesc")}
        />
      ) : (
        <>
          <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607096]">
                  {t("fixAdmin.taxonomy.activeVersionLabel")}
                </p>
                <p className="mt-1 text-xl font-bold text-[#14244B]">
                  {state === "loading"
                    ? t("fixAdmin.taxonomy.loading")
                    : taxonomy?.version || t("fixAdmin.taxonomy.none")}
                </p>
                <label className="mt-2 block text-xs font-semibold text-[#607096]">
                  {t("fixAdmin.taxonomy.workingVersion")}
                </label>
                <select
                  value={
                    versions.some((item) => item.version === form.version)
                      ? form.version
                      : ""
                  }
                  onChange={(e) => {
                    setForm({ ...form, version: e.target.value });
                    if (e.target.value) setCloneFrom("");
                  }}
                  className="mt-1 rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 text-sm"
                >
                  <option value="">{t("fixAdmin.taxonomy.createVersionOption")}</option>
                  {versions.map((item) => (
                    <option key={item.version} value={item.version}>
                      {item.version}
                      {item.isActive ? t("fixAdmin.taxonomy.activeSuffix") : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingConcept(null);
                    setCloneFrom("");
                    setForm({ ...initialForm, version: "" });
                  }}
                  className="rounded-xl border border-[#DCE4F3] bg-white px-4 py-2 text-sm font-semibold text-[#204195]"
                >
                  {t("fixAdmin.taxonomy.createVersion")}
                </button>
                <button
                  type="button"
                  disabled={!form.version.trim() || state === "loading"}
                  onClick={() => void activate()}
                  className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {t("fixAdmin.taxonomy.activateVersion")}
                </button>
                <button
                  type="button"
                  disabled={
                    !versions.some(
                      (item) =>
                        item.version === form.version.trim() && !item.isActive,
                    ) || deletingVersion
                  }
                  onClick={() => void deleteVersion()}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  title={t("fixAdmin.taxonomy.cannotDeleteActive")}
                >
                  {deletingVersion ? t("fixAdmin.taxonomy.deleting") : t("fixAdmin.taxonomy.deleteVersion")}
                </button>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#14244B]">
                  {editingConcept
                    ? fmt(t("fixAdmin.taxonomy.editConceptTitle"), { id: editingConcept })
                    : t("fixAdmin.taxonomy.addConcept")}
                </h2>
                <p className="mt-1 text-xs text-[#607096]">
                  {editingConcept
                    ? t("fixAdmin.taxonomy.editHint")
                    : t("fixAdmin.taxonomy.addHint")}
                </p>
              </div>
              {isNewVersion && (
                <label className="text-xs font-semibold text-[#607096]">
                  {t("fixAdmin.taxonomy.cloneSource")}
                  <select
                    value={cloneFrom}
                    onChange={(event) => setCloneFrom(event.target.value)}
                    className="mt-1 block rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 text-sm font-normal text-[#14244B]"
                  >
                    <option value="">{t("fixAdmin.taxonomy.noClone")}</option>
                    {versions.map((item) => (
                      <option key={item.version} value={item.version}>
                        {item.version}
                        {item.isActive ? t("fixAdmin.taxonomy.activeSuffix") : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold text-[#607096]">
                {t("fixAdmin.taxonomy.version")}
                <input
                  required
                  value={form.version}
                  onChange={(e) =>
                    setForm({ ...form, version: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-[#607096]">
                {t("fixAdmin.taxonomy.label")}
                <input
                  required
                  value={form.label}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      label: e.target.value,
                      conceptId: editingConcept || slugify(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold text-[#607096]">
                {t("fixAdmin.taxonomy.conceptId")}
                <input
                  value={editingConcept || slugify(form.label)}
                  readOnly
                  aria-readonly="true"
                  className="mt-1 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#607096]"
                />
              </label>
              <label className="text-xs font-semibold text-[#607096]">
                {t("fixAdmin.taxonomy.kind")}
                <select
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm"
                >
                  <option>skill</option>
                  <option>competency</option>
                  <option>domain</option>
                  <option>occupation</option>
                  <option>job_family</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[#607096] md:col-span-2">
                {t("fixAdmin.taxonomy.aliasesLabel")}
                <input
                  value={form.aliases}
                  onChange={(e) =>
                    setForm({ ...form, aliases: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-[#DCE4F3] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#607096]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />{" "}
                {t("fixAdmin.taxonomy.statusActive")}
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("fixAdmin.taxonomy.saveConcept")}
                </button>
                {editingConcept && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingConcept(null);
                      setCloneFrom("");
                      setForm({
                        ...initialForm,
                        version: taxonomy?.version || "",
                      });
                    }}
                    className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#204195]"
                  >
                    {t("fixAdmin.taxonomy.cancel")}
                  </button>
                )}
              </div>
            </form>
          </section>
          <section className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
            <div className="border-b border-[#EAEFF8] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-bold text-[#14244B]">
                  {t("fixAdmin.taxonomy.conceptsHeading")} ({filteredConcepts.length}
                  {filteredConcepts.length !== (taxonomy?.concepts.length || 0)
                    ? ` / ${taxonomy?.concepts.length || 0}`
                    : ""}
                  )
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[200px] flex-1 sm:w-60 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" />
                    <input
                      type="text"
                      value={conceptSearch}
                      onChange={(e) => {
                        setConceptSearch(e.target.value);
                        setConceptPage(1);
                      }}
                      placeholder={t("fixAdmin.taxonomy.searchPlaceholder")}
                      className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-1.5 pl-9 pr-3 text-xs text-[#14244B] placeholder:text-[#607096] focus:border-[#204195] focus:outline-none"
                    />
                  </div>
                  <select
                    value={conceptKindFilter}
                    onChange={(e) => {
                      setConceptKindFilter(e.target.value);
                      setConceptPage(1);
                    }}
                    className="rounded-xl border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#14244B] focus:border-[#204195] focus:outline-none"
                  >
                    <option value="all">{t("fixAdmin.taxonomy.allKinds")}</option>
                    {availableKinds.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <select
                    value={conceptStatusFilter}
                    onChange={(e) => {
                      setConceptStatusFilter(e.target.value);
                      setConceptPage(1);
                    }}
                    className="rounded-xl border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#14244B] focus:border-[#204195] focus:outline-none"
                  >
                    <option value="all">{t("fixAdmin.taxonomy.allStatuses")}</option>
                    <option value="active">{t("fixAdmin.taxonomy.statusActive")}</option>
                    <option value="inactive">{t("fixAdmin.taxonomy.statusInactive")}</option>
                  </select>
                </div>
              </div>
            </div>
            {taxonomy?.concepts.length ? (
              filteredConcepts.length ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F8FAFC] text-xs uppercase text-[#607096]">
                        <tr>
                          <th className="px-5 py-3">ID</th>
                          <th className="px-5 py-3">{t("fixAdmin.taxonomy.label")}</th>
                          <th className="px-5 py-3">{t("fixAdmin.taxonomy.colKind")}</th>
                          <th className="px-5 py-3">{t("fixAdmin.common.status")}</th>
                          <th className="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEFF8]">
                        {paginatedConcepts.map((concept) => (
                          <tr key={concept.concept_id} className="hover:bg-[#F8FAFC]/60">
                            <td className="px-5 py-3 font-mono text-xs text-[#607096]">
                              {concept.concept_id}
                            </td>
                            <td className="px-5 py-3 font-medium text-[#14244B]">{concept.label}</td>
                            <td className="px-5 py-3">
                              <span className="rounded-md bg-[#F1F5F9] px-2 py-0.5 text-xs text-[#475569]">
                                {concept.kind}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  concept.is_active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {concept.is_active ? t("fixAdmin.taxonomy.statusActive") : t("fixAdmin.taxonomy.statusInactive")}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingConcept(concept.concept_id);
                                  setForm({
                                    ...form,
                                    version: taxonomy.version || form.version,
                                    conceptId: concept.concept_id,
                                    label: concept.label,
                                    kind: concept.kind,
                                    description: concept.description || "",
                                    aliases: (concept.aliases || []).join(", "),
                                    isActive: concept.is_active,
                                  });
                                }}
                                className="text-sm font-semibold text-[#204195]"
                              >
                                {t("fixAdmin.taxonomy.edit")}
                              </button>
                              <button
                                type="button"
                                disabled={deletingConcept === concept.concept_id}
                                onClick={() =>
                                  void deleteConcept(
                                    concept.concept_id,
                                    concept.label,
                                  )
                                }
                                className="ml-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                              >
                                {deletingConcept === concept.concept_id
                                  ? t("fixAdmin.taxonomy.deleting")
                                  : t("fixAdmin.taxonomy.delete")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#EAEFF8] px-5 py-3 text-xs text-[#607096]">
                    <span>
                      {fmt(t("fixAdmin.taxonomy.pageInfo"), { page: safeConceptPage, total: totalPages, count: filteredConcepts.length })}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={safeConceptPage <= 1}
                        onClick={() => setConceptPage((page) => page - 1)}
                        className="rounded-lg border border-[#DCE4F3] px-3 py-1.5 disabled:opacity-40"
                      >
                        {t("fixAdmin.taxonomy.prev")}
                      </button>
                      <button
                        type="button"
                        disabled={safeConceptPage >= totalPages}
                        onClick={() => setConceptPage((page) => page + 1)}
                        className="rounded-lg border border-[#DCE4F3] px-3 py-1.5 disabled:opacity-40"
                      >
                        {t("fixAdmin.taxonomy.next")}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8">
                  <AdminEmptyState
                    title={t("fixAdmin.taxonomy.noMatchTitle")}
                    description={t("fixAdmin.taxonomy.noMatchDesc")}
                  />
                </div>
              )
            ) : (
              <div className="p-6">
                <AdminEmptyState
                  title={t("fixAdmin.taxonomy.emptyTitle")}
                  description={t("fixAdmin.taxonomy.emptyDesc")}
                />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
