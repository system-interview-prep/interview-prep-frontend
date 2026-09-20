"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
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
      if (!version) throw new Error("Nhập version trước khi thêm concept.");
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
      if (!conceptId) throw new Error("Nhập label hợp lệ để tạo Concept ID.");
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
        "Đã lưu concept. Hãy activate version sau khi đủ active skill.",
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
          "Không thể lưu taxonomy.",
      );
    }
  };

  const activate = async () => {
    const targetVersion = form.version.trim() || taxonomy?.version;
    if (!targetVersion) return;
    try {
      await taxonomyApi.activate(targetVersion);
      setMessage("Đã activate taxonomy.");
      await load();
    } catch (error) {
      setMessage(
        (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || "Không thể activate taxonomy.",
      );
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
      setMessage(`Đã import taxonomy vào ${version}.`);
      await load();
    } catch (error) {
      setMessage(
        (error as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || "Không thể import taxonomy.",
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
          Tải template
        </button>
        <button
          type="button"
          onClick={() => void exportVersion()}
          className="rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#204195]"
        >
          Export
        </button>
        <label className="cursor-pointer rounded-xl border border-[#DCE4F3] px-4 py-2 text-sm font-semibold text-[#204195]">
          Import
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
        title="Taxonomy"
        description="Quản lý version, concept và catalog dùng chung cho Question Bank."
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
            Làm mới
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
          title="Không tải được taxonomy"
          description="Kiểm tra Core Backend và quyền ADMIN."
        />
      ) : (
        <>
          <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[#607096]">
                  Version active (chỉ đọc)
                </p>
                <p className="mt-1 text-xl font-bold text-[#14244B]">
                  {state === "loading"
                    ? "Đang tải…"
                    : taxonomy?.version || "Chưa có"}
                </p>
                <label className="mt-2 block text-xs font-semibold text-[#607096]">
                  Version thao tác
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
                  <option value="">Tạo version mới…</option>
                  {versions.map((item) => (
                    <option key={item.version} value={item.version}>
                      {item.version}
                      {item.isActive ? " (active)" : ""}
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
                  Tạo version mới
                </button>
                <button
                  type="button"
                  disabled={!form.version.trim() || state === "loading"}
                  onClick={() => void activate()}
                  className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Activate version
                </button>
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#14244B]">
                  {editingConcept
                    ? `Chỉnh sửa concept: ${editingConcept}`
                    : "Thêm concept"}
                </h2>
                <p className="mt-1 text-xs text-[#607096]">
                  {editingConcept
                    ? "Concept ID được giữ nguyên để không làm hỏng dữ liệu tham chiếu."
                    : "Concept ID được tự sinh từ label; version mặc định là version active."}
                </p>
              </div>
              {isNewVersion && (
                <label className="text-xs font-semibold text-[#607096]">
                  Nguồn clone (tùy chọn)
                  <select
                    value={cloneFrom}
                    onChange={(event) => setCloneFrom(event.target.value)}
                    className="mt-1 block rounded-xl border border-[#DCE4F3] bg-white px-3 py-2 text-sm font-normal text-[#14244B]"
                  >
                    <option value="">Không sao chép — version trống</option>
                    {versions.map((item) => (
                      <option key={item.version} value={item.version}>
                        {item.version}
                        {item.isActive ? " (active)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold text-[#607096]">
                Version
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
                Nhãn
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
                Concept ID
                <input
                  value={editingConcept || slugify(form.label)}
                  readOnly
                  aria-readonly="true"
                  className="mt-1 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-3 py-2 font-mono text-sm text-[#607096]"
                />
              </label>
              <label className="text-xs font-semibold text-[#607096]">
                Kind
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
                Aliases (phân tách bằng dấu phẩy)
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
                Active
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[#204195] px-4 py-2 text-sm font-semibold text-white"
                >
                  Lưu concept
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
                    Hủy
                  </button>
                )}
              </div>
            </form>
          </section>
          <section className="overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-xs">
            <div className="border-b border-[#EAEFF8] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-bold text-[#14244B]">
                  Concepts ({filteredConcepts.length}
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
                      placeholder="Tìm ID, nhãn, mô tả..."
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
                    <option value="all">Tất cả loại (Kind)</option>
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
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
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
                          <th className="px-5 py-3">Nhãn</th>
                          <th className="px-5 py-3">Kind</th>
                          <th className="px-5 py-3">Trạng thái</th>
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
                                {concept.is_active ? "Active" : "Inactive"}
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
                                    aliases: "",
                                    isActive: concept.is_active,
                                  });
                                }}
                                className="text-sm font-semibold text-[#204195]"
                              >
                                Sửa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#EAEFF8] px-5 py-3 text-xs text-[#607096]">
                    <span>
                      Trang {safeConceptPage} / {totalPages} ({filteredConcepts.length} kết quả)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={safeConceptPage <= 1}
                        onClick={() => setConceptPage((page) => page - 1)}
                        className="rounded-lg border border-[#DCE4F3] px-3 py-1.5 disabled:opacity-40"
                      >
                        Trước
                      </button>
                      <button
                        type="button"
                        disabled={safeConceptPage >= totalPages}
                        onClick={() => setConceptPage((page) => page + 1)}
                        className="rounded-lg border border-[#DCE4F3] px-3 py-1.5 disabled:opacity-40"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8">
                  <AdminEmptyState
                    title="Không tìm thấy concept phù hợp"
                    description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc loại / trạng thái."
                  />
                </div>
              )
            ) : (
              <div className="p-6">
                <AdminEmptyState
                  title="Chưa có concept"
                  description="Tạo concept đầu tiên cho version taxonomy."
                />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
