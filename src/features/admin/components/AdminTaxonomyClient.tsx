"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Pencil, Plus, RefreshCw, Search, Trash2, Upload } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt } from "@/i18n/format";
import {
  taxonomyApi,
  type ActiveTaxonomy,
  type TaxonomyConcept,
  type TaxonomyVersion,
} from "@features/admin/services/taxonomy.service";
import { Pagination } from "@components/shared/Pagination";
import { ConfirmDialog } from "@components/shared/ConfirmDialog";
import AdminEmptyState from "./primitives/AdminEmptyState";
import AdminPageHeader from "./primitives/AdminPageHeader";
import AdminModal, { AdminModalButton } from "./primitives/AdminModal";
import AdminRowAction, { AdminRowActions } from "./primitives/AdminRowAction";

/** One color per concept kind, so kinds can be told apart at a glance. */
const KIND_TONE: Record<string, string> = {
  skill: "bg-blue-50 text-blue-700",
  competency: "bg-violet-50 text-violet-700",
  specialization: "bg-teal-50 text-teal-700",
  domain: "bg-amber-50 text-amber-800",
  occupation: "bg-rose-50 text-rose-700",
  job_family: "bg-indigo-50 text-indigo-700",
};

const KINDS = ["skill", "competency", "domain", "occupation", "job_family"];
const PAGE_SIZE = 20;

type ConceptForm = {
  label: string;
  kind: string;
  description: string;
  aliases: string;
  isActive: boolean;
};
const EMPTY_CONCEPT: ConceptForm = { label: "", kind: "skill", description: "", aliases: "", isActive: true };

/** The concept modal is either adding a new concept or editing one of the active version. */
type ConceptModal =
  | { mode: "add"; version: string }
  | { mode: "edit"; concept: TaxonomyConcept; version: string };

/** What the delete confirmation is about. */
type PendingDelete =
  | { kind: "concept"; conceptId: string; label: string; version: string }
  | { kind: "version"; version: string };

const errorText = (error: unknown, fallback: string) => {
  const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
  return typeof detail === "string" && detail ? detail : fallback;
};

const splitAliases = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function downloadBlob(data: Blob, name: string) {
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

const fieldClass =
  "mt-1 w-full rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 text-sm font-normal text-[#14244B] focus:border-[#204195] focus:outline-none focus:ring-2 focus:ring-[#204195]/15";
const labelClass = "block text-xs font-semibold text-[#607096]";
const toolButton =
  "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#DCE4F3] bg-white px-3.5 text-sm font-semibold text-[#14244B] transition-colors hover:border-[#204195] hover:text-[#204195] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#DCE4F3] disabled:hover:text-[#14244B]";

export default function AdminTaxonomyClient() {
  const { t } = useLanguage();
  const [taxonomy, setTaxonomy] = useState<ActiveTaxonomy | null>(null);
  const [versions, setVersions] = useState<TaxonomyVersion[]>([]);
  /** Version the version tools (activate, export, import, delete) act on. */
  const [workingVersion, setWorkingVersion] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyAction, setBusyAction] = useState<"activate" | "export" | "import" | "template" | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Concept add / edit modal
  const [conceptModal, setConceptModal] = useState<ConceptModal | null>(null);
  const [conceptForm, setConceptForm] = useState<ConceptForm>(EMPTY_CONCEPT);
  const [conceptBusy, setConceptBusy] = useState(false);
  const [conceptError, setConceptError] = useState("");

  // New version modal
  const [versionModal, setVersionModal] = useState(false);
  const [newVersion, setNewVersion] = useState({ name: "", cloneFrom: "" });
  const [versionBusy, setVersionBusy] = useState(false);
  const [versionError, setVersionError] = useState("");

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [conceptPage, setConceptPage] = useState(1);
  const [conceptSearch, setConceptSearch] = useState("");
  const [conceptKindFilter, setConceptKindFilter] = useState("all");
  const [conceptStatusFilter, setConceptStatusFilter] = useState("all");

  /** Reloads; keeps the working version when it still exists, else the active one. */
  const load = async (prefer?: string) => {
    setState("loading");
    try {
      const [activeRes, versionsRes] = await Promise.all([taxonomyApi.active(), taxonomyApi.versions()]);
      const active = activeRes.data;
      const items = versionsRes.data.items;
      setTaxonomy(active);
      setVersions(items);
      setWorkingVersion((current) => {
        const wanted = prefer ?? current;
        if (wanted && items.some((item) => item.version === wanted)) return wanted;
        return active.version || items[0]?.version || "";
      });
      setState("ready");
    } catch {
      setState("error");
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const activeVersion = taxonomy?.version || "";
  const selected = versions.find((item) => item.version === workingVersion);
  const selectedIsActive = Boolean(selected?.isActive);

  const say = (tone: "ok" | "error", text: string) => setMessage({ tone, text });

  // ---- version tools -------------------------------------------------------

  const activate = async () => {
    if (!selected || selectedIsActive) return;
    setBusyAction("activate");
    setMessage(null);
    try {
      await taxonomyApi.activate(selected.version);
      say("ok", fmt(t("fixAdmin.taxonomy.activatedVersion"), { version: selected.version }));
      await load(selected.version);
    } catch (error) {
      say("error", errorText(error, t("fixAdmin.taxonomy.activateFailed")));
    } finally {
      setBusyAction(null);
    }
  };

  const exportVersion = async () => {
    if (!workingVersion) return;
    setBusyAction("export");
    setMessage(null);
    try {
      downloadBlob((await taxonomyApi.exportVersion(workingVersion)).data, `taxonomy-${workingVersion}.xlsx`);
    } catch (error) {
      say("error", errorText(error, t("fixAdmin.taxonomy.exportFailed")));
    } finally {
      setBusyAction(null);
    }
  };

  const downloadTemplate = async () => {
    setBusyAction("template");
    setMessage(null);
    try {
      downloadBlob((await taxonomyApi.downloadTemplate()).data, "taxonomy-template.csv");
    } catch (error) {
      say("error", errorText(error, t("fixAdmin.taxonomy.templateFailed")));
    } finally {
      setBusyAction(null);
    }
  };

  const importVersion = async (file: File) => {
    if (!workingVersion) return;
    setBusyAction("import");
    setMessage(null);
    try {
      await taxonomyApi.importVersion(workingVersion, file);
      say("ok", fmt(t("fixAdmin.taxonomy.imported"), { version: workingVersion }));
      await load(workingVersion);
    } catch (error) {
      say("error", errorText(error, t("fixAdmin.taxonomy.importFailed")));
    } finally {
      setBusyAction(null);
    }
  };

  const openNewVersion = () => {
    setVersionError("");
    setNewVersion({ name: "", cloneFrom: activeVersion });
    setVersionModal(true);
  };

  const createVersion = async (event: FormEvent) => {
    event.preventDefault();
    if (versionBusy) return;
    const name = newVersion.name.trim();
    if (!name) {
      setVersionError(t("fixAdmin.taxonomy.versionRequired"));
      return;
    }
    if (versions.some((item) => item.version === name)) {
      setVersionError(fmt(t("fixAdmin.taxonomy.versionExists"), { version: name }));
      return;
    }
    setVersionBusy(true);
    setVersionError("");
    try {
      if (newVersion.cloneFrom) await taxonomyApi.cloneVersion(name, newVersion.cloneFrom);
      else await taxonomyApi.upsertVersion({ version: name, priority: 0, activate: false });
      setVersionModal(false);
      say(
        "ok",
        newVersion.cloneFrom
          ? fmt(t("fixAdmin.taxonomy.versionClonedMsg"), { version: name, source: newVersion.cloneFrom })
          : fmt(t("fixAdmin.taxonomy.versionCreatedMsg"), { version: name }),
      );
      await load(name);
    } catch (error) {
      setVersionError(errorText(error, t("fixAdmin.taxonomy.versionCreateFailed")));
    } finally {
      setVersionBusy(false);
    }
  };

  // ---- concepts -------------------------------------------------------------

  const openAdd = () => {
    const version = workingVersion || activeVersion;
    if (!version) {
      openNewVersion();
      return;
    }
    setConceptError("");
    setConceptForm(EMPTY_CONCEPT);
    setConceptModal({ mode: "add", version });
  };

  const openEdit = (concept: TaxonomyConcept) => {
    setConceptError("");
    setConceptForm({
      label: concept.label,
      kind: concept.kind,
      description: concept.description || "",
      aliases: (concept.aliases || []).join(", "),
      isActive: concept.is_active,
    });
    setConceptModal({ mode: "edit", concept, version: activeVersion });
  };

  const closeConcept = () => {
    if (conceptBusy) return;
    setConceptModal(null);
    setConceptError("");
  };

  const newConceptId = slugify(conceptForm.label);

  const saveConcept = async (event: FormEvent) => {
    event.preventDefault();
    if (!conceptModal || conceptBusy) return;
    const label = conceptForm.label.trim();
    if (!label) {
      setConceptError(t("fixAdmin.taxonomy.labelRequiredShort"));
      return;
    }
    const isEdit = conceptModal.mode === "edit";
    const conceptId = isEdit ? conceptModal.concept.concept_id : newConceptId;
    if (!conceptId) {
      setConceptError(t("fixAdmin.taxonomy.labelRequired"));
      return;
    }
    // Saving uses PUT (create or replace): never silently overwrite an existing concept from "add".
    if (!isEdit && conceptModal.version === activeVersion && taxonomy?.concepts.some((c) => c.concept_id === conceptId)) {
      setConceptError(fmt(t("fixAdmin.taxonomy.conceptExists"), { id: conceptId }));
      return;
    }
    setConceptBusy(true);
    setConceptError("");
    try {
      await taxonomyApi.upsertConcept(conceptModal.version, conceptId, {
        label,
        kind: conceptForm.kind,
        description: conceptForm.description.trim(),
        aliases: splitAliases(conceptForm.aliases),
        metadata: isEdit ? conceptModal.concept.metadata ?? {} : {},
        isActive: conceptForm.isActive,
      });
      setConceptModal(null);
      if (isEdit) say("ok", fmt(t("fixAdmin.taxonomy.conceptUpdated"), { label }));
      else if (conceptModal.version === activeVersion) say("ok", fmt(t("fixAdmin.taxonomy.conceptAdded"), { label }));
      else say("ok", fmt(t("fixAdmin.taxonomy.conceptAddedOther"), { label, version: conceptModal.version }));
      await load(conceptModal.version);
    } catch (error) {
      setConceptError(errorText(error, t("fixAdmin.taxonomy.saveFailed")));
    } finally {
      setConceptBusy(false);
    }
  };

  // ---- deletes ---------------------------------------------------------------

  const confirmDelete = async () => {
    if (!pendingDelete || deleteBusy) return;
    setDeleteBusy(true);
    setMessage(null);
    try {
      if (pendingDelete.kind === "version") {
        await taxonomyApi.deleteVersion(pendingDelete.version);
        say("ok", fmt(t("fixAdmin.taxonomy.versionDeleted"), { version: pendingDelete.version }));
        setPendingDelete(null);
        await load(activeVersion);
      } else {
        await taxonomyApi.deleteConcept(pendingDelete.version, pendingDelete.conceptId);
        say("ok", fmt(t("fixAdmin.taxonomy.conceptDeleted"), { conceptId: pendingDelete.conceptId }));
        setPendingDelete(null);
        await load();
      }
    } catch (error) {
      say(
        "error",
        errorText(
          error,
          t(pendingDelete.kind === "version" ? "fixAdmin.taxonomy.deleteVersionFailed" : "fixAdmin.taxonomy.deleteConceptFailed"),
        ),
      );
      setPendingDelete(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  // ---- list -------------------------------------------------------------------

  const availableKinds = Array.from(
    new Set([...KINDS, ...(taxonomy?.concepts.map((c) => c.kind).filter(Boolean) || [])]),
  );

  const kindLabel = (kind: string) => {
    const key = `fixAdmin.taxonomy.kind.${kind}`;
    const text = t(key);
    return text && text !== key ? text : kind;
  };

  const query = conceptSearch.trim().toLowerCase();
  const filteredConcepts = (taxonomy?.concepts || []).filter((concept) => {
    if (
      query &&
      !concept.concept_id.toLowerCase().includes(query) &&
      !concept.label.toLowerCase().includes(query) &&
      !(concept.description || "").toLowerCase().includes(query)
    )
      return false;
    if (conceptKindFilter !== "all" && concept.kind !== conceptKindFilter) return false;
    if (conceptStatusFilter === "active" && !concept.is_active) return false;
    if (conceptStatusFilter === "inactive" && concept.is_active) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredConcepts.length / PAGE_SIZE));
  const safePage = Math.min(conceptPage, totalPages);
  const pageConcepts = filteredConcepts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const loading = state === "loading";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("fixAdmin.shell.taxonomy")}
        description={t("fixAdmin.taxonomy.pageDesc")}
        breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("fixAdmin.shell.taxonomy") }]}
        primaryAction={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className={toolButton}
              aria-label={t("fixAdmin.taxonomy.refresh")}
              title={t("fixAdmin.taxonomy.refresh")}
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={openAdd}
              disabled={state === "error" || loading}
              className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#204195] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("fixAdmin.taxonomy.addConcept")}
            </button>
          </div>
        }
      />

      {message ? (
        <div
          role={message.tone === "error" ? "alert" : "status"}
          className={`rounded-xl border p-3 text-sm [overflow-wrap:anywhere] ${
            message.tone === "error"
              ? "border-[#F3C4C4] bg-[#FFF8F8] text-[#9F2F2F]"
              : "border-[#BFE3CC] bg-[#F3FBF6] text-[#1F6B3F]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {state === "error" ? (
        <AdminEmptyState
          variant="error"
          title={t("fixAdmin.taxonomy.loadErrorTitle")}
          description={t("fixAdmin.taxonomy.loadErrorDesc")}
          onRetry={() => void load()}
        />
      ) : (
        <>
          <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-[#14244B]">{t("fixAdmin.taxonomy.versionsHeading")}</h2>
                <p className="mt-1 text-xs text-[#607096]">
                  {activeVersion
                    ? fmt(t("fixAdmin.taxonomy.activeVersionLine"), { version: activeVersion })
                    : t("fixAdmin.taxonomy.noActiveVersion")}
                </p>
                <label htmlFor="taxonomy-working-version" className={`${labelClass} mt-3`}>
                  {t("fixAdmin.taxonomy.workingVersion")}
                </label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <select
                    id="taxonomy-working-version"
                    value={workingVersion}
                    onChange={(e) => setWorkingVersion(e.target.value)}
                    disabled={!versions.length}
                    className="h-10 w-full min-w-0 rounded-xl border border-[#DCE4F3] bg-white px-3 text-sm text-[#14244B] focus:border-[#204195] focus:outline-none sm:w-auto sm:min-w-[260px]"
                  >
                    {!versions.length ? <option value="">{t("fixAdmin.taxonomy.none")}</option> : null}
                    {versions.map((item) => (
                      <option key={item.version} value={item.version}>
                        {item.version}
                        {item.isActive ? t("fixAdmin.taxonomy.activeSuffix") : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={openNewVersion} disabled={loading} className={toolButton}>
                  <Plus className="size-4" aria-hidden="true" />
                  {t("fixAdmin.taxonomy.createVersion")}
                </button>
                <button
                  type="button"
                  onClick={() => void activate()}
                  disabled={!selected || selectedIsActive || busyAction !== null}
                  title={selectedIsActive ? t("fixAdmin.taxonomy.alreadyActive") : undefined}
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#204195] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:cursor-not-allowed disabled:bg-[#B8C4E0]"
                >
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {busyAction === "activate" ? t("fixAdmin.taxonomy.activating") : t("fixAdmin.taxonomy.activateVersion")}
                </button>
                <button
                  type="button"
                  onClick={() => selected && setPendingDelete({ kind: "version", version: selected.version })}
                  disabled={!selected || selectedIsActive || deleteBusy}
                  title={selectedIsActive ? t("fixAdmin.taxonomy.cannotDeleteActive") : undefined}
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#F3C4C4] bg-[#FFF8F8] px-4 text-sm font-semibold text-[#B42323] transition-colors hover:border-[#C43B3B] hover:bg-[#FDECEC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {t("fixAdmin.taxonomy.deleteVersion")}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#EAEFF8] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#607096]">
                {workingVersion
                  ? fmt(t("fixAdmin.taxonomy.fileToolsFor"), { version: workingVersion })
                  : t("fixAdmin.taxonomy.fileToolsNone")}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void exportVersion()} disabled={!workingVersion || busyAction !== null} className={toolButton}>
                  <Download className="size-4" aria-hidden="true" />
                  {busyAction === "export" ? t("fixAdmin.taxonomy.working") : t("fixAdmin.taxonomy.export")}
                </button>
                <button type="button" onClick={() => importRef.current?.click()} disabled={!workingVersion || busyAction !== null} className={toolButton}>
                  <Upload className="size-4" aria-hidden="true" />
                  {busyAction === "import" ? t("fixAdmin.taxonomy.working") : t("fixAdmin.taxonomy.import")}
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void importVersion(file);
                    event.currentTarget.value = "";
                  }}
                />
                <button type="button" onClick={() => void downloadTemplate()} disabled={busyAction !== null} className={toolButton}>
                  <FileSpreadsheet className="size-4" aria-hidden="true" />
                  {t("fixAdmin.taxonomy.downloadTemplate")}
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
            <div className="border-b border-[#EAEFF8] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#14244B]">
                    {t("fixAdmin.taxonomy.conceptsHeading")} ({filteredConcepts.length}
                    {filteredConcepts.length !== (taxonomy?.concepts.length || 0) ? ` / ${taxonomy?.concepts.length || 0}` : ""})
                  </h2>
                  {activeVersion ? (
                    <p className="mt-0.5 text-xs text-[#607096] [overflow-wrap:anywhere]">
                      {fmt(t("fixAdmin.taxonomy.listOfVersion"), { version: activeVersion })}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full min-w-0 sm:w-60">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" aria-hidden="true" />
                    <input
                      type="text"
                      value={conceptSearch}
                      onChange={(e) => {
                        setConceptSearch(e.target.value);
                        setConceptPage(1);
                      }}
                      aria-label={t("fixAdmin.taxonomy.searchPlaceholder")}
                      placeholder={t("fixAdmin.taxonomy.searchPlaceholder")}
                      className="h-9 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] pl-9 pr-3 text-xs text-[#14244B] placeholder:text-[#607096] focus:border-[#204195] focus:outline-none"
                    />
                  </div>
                  <select
                    value={conceptKindFilter}
                    aria-label={t("fixAdmin.taxonomy.colKind")}
                    onChange={(e) => {
                      setConceptKindFilter(e.target.value);
                      setConceptPage(1);
                    }}
                    className="h-9 rounded-xl border border-[#DCE4F3] bg-white px-3 text-xs font-semibold text-[#14244B] focus:border-[#204195] focus:outline-none"
                  >
                    <option value="all">{t("fixAdmin.taxonomy.allKinds")}</option>
                    {availableKinds.map((k) => (
                      <option key={k} value={k}>
                        {kindLabel(k)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={conceptStatusFilter}
                    aria-label={t("fixAdmin.common.status")}
                    onChange={(e) => {
                      setConceptStatusFilter(e.target.value);
                      setConceptPage(1);
                    }}
                    className="h-9 rounded-xl border border-[#DCE4F3] bg-white px-3 text-xs font-semibold text-[#14244B] focus:border-[#204195] focus:outline-none"
                  >
                    <option value="all">{t("fixAdmin.taxonomy.allStatuses")}</option>
                    <option value="active">{t("fixAdmin.taxonomy.statusActive")}</option>
                    <option value="inactive">{t("fixAdmin.taxonomy.statusInactive")}</option>
                  </select>
                </div>
              </div>
            </div>
            {loading && !taxonomy ? (
              <p className="p-6 text-sm text-[#607096]">{t("fixAdmin.taxonomy.loading")}</p>
            ) : taxonomy?.concepts.length ? (
              filteredConcepts.length ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="bg-[#F8FAFC] text-xs uppercase text-[#607096]">
                        <tr>
                          <th className="px-5 py-3">{t("fixAdmin.taxonomy.colId")}</th>
                          <th className="px-5 py-3">{t("fixAdmin.taxonomy.label")}</th>
                          <th className="px-5 py-3">{t("fixAdmin.taxonomy.colKind")}</th>
                          <th className="px-5 py-3">{t("fixAdmin.common.status")}</th>
                          <th className="px-5 py-3 text-right">{t("fixAdmin.taxonomy.colActions")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEFF8]">
                        {pageConcepts.map((concept) => (
                          <tr key={concept.concept_id} className="hover:bg-[#F8FAFC]/60">
                            <td className="min-w-[180px] max-w-[260px] px-5 py-3 align-top font-mono text-xs text-[#607096] [overflow-wrap:anywhere]">
                              {concept.concept_id}
                            </td>
                            <td className="min-w-[160px] max-w-[240px] px-5 py-3 align-top font-medium text-[#14244B] break-words">
                              {concept.label}
                            </td>
                            <td className="px-5 py-3 align-top">
                              <span
                                className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs ${KIND_TONE[concept.kind] ?? "bg-[#F1F5F9] text-[#475569]"}`}
                                title={concept.kind}
                              >
                                {kindLabel(concept.kind)}
                              </span>
                            </td>
                            <td className="px-5 py-3 align-top">
                              <span
                                className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  concept.is_active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"
                                }`}
                              >
                                {concept.is_active ? t("fixAdmin.taxonomy.statusActive") : t("fixAdmin.taxonomy.statusInactive")}
                              </span>
                            </td>
                            <td className="px-5 py-3 align-top">
                              <AdminRowActions>
                                <AdminRowAction
                                  icon={Pencil}
                                  label={t("fixAdmin.taxonomy.edit")}
                                  aria-label={fmt(t("fixAdmin.taxonomy.editAria"), { label: concept.label })}
                                  onClick={() => openEdit(concept)}
                                />
                                <AdminRowAction
                                  icon={Trash2}
                                  tone="danger"
                                  label={t("fixAdmin.taxonomy.delete")}
                                  aria-label={fmt(t("fixAdmin.taxonomy.deleteAria"), { label: concept.label })}
                                  busy={deleteBusy && pendingDelete?.kind === "concept" && pendingDelete.conceptId === concept.concept_id}
                                  onClick={() =>
                                    setPendingDelete({
                                      kind: "concept",
                                      conceptId: concept.concept_id,
                                      label: concept.label,
                                      version: activeVersion,
                                    })
                                  }
                                />
                              </AdminRowActions>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredConcepts.length > PAGE_SIZE ? (
                    <div className="border-t border-[#EAEFF8] bg-[#F8FAFC] px-5 py-3">
                      <Pagination page={safePage} pageSize={PAGE_SIZE} total={filteredConcepts.length} onPageChange={setConceptPage} />
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="p-8">
                  <AdminEmptyState title={t("fixAdmin.taxonomy.noMatchTitle")} description={t("fixAdmin.taxonomy.noMatchDesc")} />
                </div>
              )
            ) : (
              <div className="p-6">
                <AdminEmptyState title={t("fixAdmin.taxonomy.emptyTitle")} description={t("fixAdmin.taxonomy.emptyDesc")} />
              </div>
            )}
          </section>
        </>
      )}

      {/* Add / edit concept */}
      <AdminModal
        open={conceptModal !== null}
        title={conceptModal?.mode === "edit" ? t("fixAdmin.taxonomy.editModalTitle") : t("fixAdmin.taxonomy.addConcept")}
        description={conceptModal?.mode === "edit" ? t("fixAdmin.taxonomy.editHint") : t("fixAdmin.taxonomy.addModalHint")}
        onClose={closeConcept}
        onSubmit={(event) => void saveConcept(event)}
        busy={conceptBusy}
        closeLabel={t("fixAdmin.taxonomy.cancel")}
        footer={
          <>
            <AdminModalButton onClick={closeConcept} disabled={conceptBusy}>
              {t("fixAdmin.taxonomy.cancel")}
            </AdminModalButton>
            <AdminModalButton type="submit" variant="primary" disabled={conceptBusy}>
              {conceptBusy
                ? t("fixAdmin.taxonomy.saving")
                : conceptModal?.mode === "edit"
                  ? t("fixAdmin.taxonomy.saveChanges")
                  : t("fixAdmin.taxonomy.addConceptSubmit")}
            </AdminModalButton>
          </>
        }
      >
        {conceptModal ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {conceptModal.mode === "add" ? (
              <label className={`${labelClass} sm:col-span-2`}>
                {t("fixAdmin.taxonomy.addToVersion")}
                <select
                  value={conceptModal.version}
                  onChange={(e) => setConceptModal({ mode: "add", version: e.target.value })}
                  className={fieldClass}
                >
                  {versions.map((item) => (
                    <option key={item.version} value={item.version}>
                      {item.version}
                      {item.isActive ? t("fixAdmin.taxonomy.activeSuffix") : ""}
                    </option>
                  ))}
                </select>
                {conceptModal.version !== activeVersion ? (
                  <span className="mt-1 block text-[11px] font-normal text-[#8A5A00]">{t("fixAdmin.taxonomy.otherVersionHint")}</span>
                ) : null}
              </label>
            ) : null}
            <label className={`${labelClass} sm:col-span-2`}>
              {t("fixAdmin.taxonomy.label")}
              <input
                data-autofocus
                value={conceptForm.label}
                onChange={(e) => setConceptForm({ ...conceptForm, label: e.target.value })}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              {t("fixAdmin.taxonomy.conceptId")}
              <input
                value={conceptModal.mode === "edit" ? conceptModal.concept.concept_id : newConceptId}
                placeholder={t("fixAdmin.taxonomy.conceptIdAuto")}
                readOnly
                aria-readonly="true"
                className={`${fieldClass} bg-[#F8FAFC] font-mono text-[#607096]`}
              />
            </label>
            <label className={labelClass}>
              {t("fixAdmin.taxonomy.kind")}
              <select
                value={conceptForm.kind}
                onChange={(e) => setConceptForm({ ...conceptForm, kind: e.target.value })}
                className={fieldClass}
              >
                {availableKinds.map((k) => (
                  <option key={k} value={k}>
                    {kindLabel(k)}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              {t("fixAdmin.taxonomy.description")}
              <textarea
                rows={3}
                value={conceptForm.description}
                onChange={(e) => setConceptForm({ ...conceptForm, description: e.target.value })}
                className={`${fieldClass} resize-y`}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              {t("fixAdmin.taxonomy.aliasesLabel")}
              <input
                value={conceptForm.aliases}
                onChange={(e) => setConceptForm({ ...conceptForm, aliases: e.target.value })}
                className={fieldClass}
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-2.5 text-sm font-semibold text-[#14244B] sm:col-span-2">
              <input
                type="checkbox"
                checked={conceptForm.isActive}
                onChange={(e) => setConceptForm({ ...conceptForm, isActive: e.target.checked })}
                className="size-4 accent-[#204195]"
              />
              <span>
                {t("fixAdmin.taxonomy.statusActive")}
                <span className="mt-0.5 block text-xs font-normal text-[#607096]">{t("fixAdmin.taxonomy.activeHint")}</span>
              </span>
            </label>
            {conceptError ? (
              <p role="alert" className="rounded-xl border border-[#F3C4C4] bg-[#FFF8F8] p-3 text-sm text-[#9F2F2F] [overflow-wrap:anywhere] sm:col-span-2">
                {conceptError}
              </p>
            ) : null}
          </div>
        ) : null}
      </AdminModal>

      {/* New version */}
      <AdminModal
        open={versionModal}
        size="sm"
        title={t("fixAdmin.taxonomy.createVersion")}
        description={t("fixAdmin.taxonomy.newVersionHint")}
        onClose={() => !versionBusy && setVersionModal(false)}
        onSubmit={(event) => void createVersion(event)}
        busy={versionBusy}
        closeLabel={t("fixAdmin.taxonomy.cancel")}
        footer={
          <>
            <AdminModalButton onClick={() => setVersionModal(false)} disabled={versionBusy}>
              {t("fixAdmin.taxonomy.cancel")}
            </AdminModalButton>
            <AdminModalButton type="submit" variant="primary" disabled={versionBusy}>
              {versionBusy ? t("fixAdmin.taxonomy.saving") : t("fixAdmin.taxonomy.createVersionSubmit")}
            </AdminModalButton>
          </>
        }
      >
        <div className="grid gap-4">
          <label className={labelClass}>
            {t("fixAdmin.taxonomy.versionName")}
            <input
              data-autofocus
              value={newVersion.name}
              placeholder="internal-career-2026.2"
              onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
              className={`${fieldClass} font-mono`}
            />
          </label>
          <label className={labelClass}>
            {t("fixAdmin.taxonomy.cloneSource")}
            <select
              value={newVersion.cloneFrom}
              onChange={(e) => setNewVersion({ ...newVersion, cloneFrom: e.target.value })}
              className={fieldClass}
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
          {versionError ? (
            <p role="alert" className="rounded-xl border border-[#F3C4C4] bg-[#FFF8F8] p-3 text-sm text-[#9F2F2F] [overflow-wrap:anywhere]">
              {versionError}
            </p>
          ) : null}
        </div>
      </AdminModal>

      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        busy={deleteBusy}
        title={pendingDelete?.kind === "version" ? t("fixAdmin.taxonomy.deleteVersionTitle") : t("fixAdmin.taxonomy.deleteConceptTitle")}
        body={
          pendingDelete?.kind === "version"
            ? fmt(t("fixAdmin.taxonomy.confirmDeleteVersion"), { version: pendingDelete.version })
            : pendingDelete
              ? fmt(t("fixAdmin.taxonomy.confirmDeleteConcept"), {
                  label: pendingDelete.label,
                  conceptId: pendingDelete.conceptId,
                  version: pendingDelete.version,
                })
              : null
        }
        confirmLabel={deleteBusy ? t("fixAdmin.taxonomy.deleting") : t("fixAdmin.taxonomy.delete")}
        cancelLabel={t("fixAdmin.taxonomy.cancel")}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
