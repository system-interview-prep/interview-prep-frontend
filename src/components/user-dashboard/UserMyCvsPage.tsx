"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LanguageToggleButton from "@/components/LanguageToggleButton";
import { useLanguage } from "@/i18n/LanguageProvider";

type CvFile = {
  id: string;
  name: string;
  uploadedAt: string;
};

const STORAGE_KEY = "demo.cvFiles";

type TypeFilter = "all" | "pdf" | "word";
type DateFilter = "all" | "7d" | "30d" | "90d";
type SortKey = "newest" | "oldest" | "name";

function extIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "picture_as_pdf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "article";
  return "description";
}

function fileKind(name: string): "pdf" | "word" | "other" {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "word";
  return "other";
}

function displayName(name: string) {
  return name.replace(/\.(pdf|docx?)$/i, "").replace(/[._-]+/g, " ").trim() || name;
}

export default function UserMyCvsPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [files, setFiles] = useState<CvFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setFiles(raw ? (JSON.parse(raw) as CvFile[]) : []);
    } catch {
      setFiles([]);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  function persist(next: CvFile[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setFiles(next);
  }

  function addFile(f: File) {
    const entry: CvFile = {
      id: `cv_${Date.now().toString(36)}`,
      name: f.name,
      uploadedAt: new Date().toISOString(),
    };
    setFiles((prev) => {
      const next = [entry, ...prev].slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setAnalyzeError(null);
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const next = prev.filter((x) => x.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list?.length) return;
    addFile(list[0]);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const ok =
      f.type === "application/pdf" ||
      f.type === "application/msword" ||
      f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      /\.pdf$/i.test(f.name) ||
      /\.docx?$/i.test(f.name);
    if (ok) addFile(f);
  }

  const handleAnalyze = () => {
    if (files.length === 0) {
      setAnalyzeError(t("userDash.myCvs.needUpload"));
      return;
    }
    setAnalyzeError(null);
    router.push("/interview/select");
  };

  const filtered = useMemo(() => {
    let list = [...files];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) || displayName(f.name).toLowerCase().includes(q)
      );
    }
    if (typeFilter === "pdf") list = list.filter((f) => fileKind(f.name) === "pdf");
    if (typeFilter === "word") list = list.filter((f) => fileKind(f.name) === "word");

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    if (dateFilter === "7d") list = list.filter((f) => now - new Date(f.uploadedAt).getTime() <= 7 * day);
    if (dateFilter === "30d") list = list.filter((f) => now - new Date(f.uploadedAt).getTime() <= 30 * day);
    if (dateFilter === "90d") list = list.filter((f) => now - new Date(f.uploadedAt).getTime() <= 90 * day);

    list.sort((a, b) => {
      if (sort === "newest") return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      if (sort === "oldest") return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      return a.name.localeCompare(b.name, lang === "vi" ? "vi" : "en", { sensitivity: "base" });
    });
    return list;
  }, [files, search, typeFilter, dateFilter, sort, lang]);

  const typeLabel = (name: string) => {
    const k = fileKind(name);
    if (k === "pdf") return t("userDash.myCvs.typePdf");
    if (k === "word") return t("userDash.myCvs.typeWord");
    return "—";
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  const selectClass =
    "rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3 py-2 text-sm font-medium text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  return (
    <main className="min-h-screen bg-surface p-4 md:p-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-outline-variant/15 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-xl font-extrabold tracking-tight text-on-surface md:text-2xl">
            {t("userDash.myCvs.headerTitle")}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">{t("userDash.myCvs.headerSubtitle")}</p>
        </div>
        <LanguageToggleButton />
      </header>

      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex max-w-md items-center justify-between">
          <Link href="/interview/select" className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
              1
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
              {t("userDash.myCvs.stepSelect")}
            </span>
          </Link>
          <div className="mx-2 mt-[-1.25rem] h-0.5 flex-1 bg-primary" aria-hidden />
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary ring-4 ring-primary/20">
              2
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
              {t("userDash.myCvs.stepUpload")}
            </span>
          </div>
          <div className="mx-2 mt-[-1.25rem] h-0.5 flex-1 bg-outline-variant/40" aria-hidden />
          <div className="flex flex-col items-center gap-2 opacity-70">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
              3
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
              {t("userDash.myCvs.stepInterview")}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white/80 p-1 shadow-sm backdrop-blur-md dark:border-outline-variant/30 dark:bg-surface-container-lowest/90">
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className={`group flex cursor-pointer flex-col items-center rounded-[calc(1rem-4px)] border-2 border-dashed p-8 text-center transition-colors md:p-12 ${
                dragOver ? "border-primary bg-primary/5" : "border-outline-variant/35 hover:border-primary/50"
              }`}
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-fixed/50 transition-transform duration-300 group-hover:scale-110 dark:bg-primary-fixed/25 motion-reduce:transform-none">
                <span
                  className="material-symbols-outlined text-4xl text-primary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  upload_file
                </span>
              </div>
              <h3 className="font-headline text-2xl font-bold text-on-surface">{t("userDash.myCvs.uploadTitle")}</h3>
              <p className="mb-8 max-w-sm text-on-surface-variant">{t("userDash.myCvs.uploadHint")}</p>
              <div className="mb-8 flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container/50 px-4 py-2 dark:bg-surface-container-low/80">
                  <span className="material-symbols-outlined text-sm text-error">picture_as_pdf</span>
                  <span className="text-sm font-semibold text-on-surface">PDF</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container/50 px-4 py-2 dark:bg-surface-container-low/80">
                  <span className="material-symbols-outlined text-sm text-primary">description</span>
                  <span className="text-sm font-semibold text-on-surface">DOCX</span>
                </div>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={onUpload}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAnalyze();
                }}
                className="rounded-xl bg-primary px-10 py-4 font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:opacity-95 active:scale-[0.98]"
              >
                {t("userDash.myCvs.analyzeCta")}
              </button>
              {analyzeError && (
                <p className="mt-4 text-sm text-error" role="alert">
                  {analyzeError}
                </p>
              )}
            </div>
          </div>

          <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm md:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">{t("userDash.myCvs.listTitle")}</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">{t("userDash.myCvs.listHint")}</p>
              </div>
              <p className="text-xs font-medium text-on-surface-variant">
                {t("userDash.myCvs.listCount").replace("{count}", String(filtered.length))}
              </p>
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="relative min-w-0 flex-1 lg:min-w-[220px]">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant/70">
                  search
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("userDash.myCvs.searchPlaceholder")}
                  className="w-full rounded-xl border border-outline-variant/25 bg-surface py-2.5 pl-10 pr-3 text-sm text-on-surface shadow-sm placeholder:text-on-surface-variant/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  aria-label={t("userDash.myCvs.searchPlaceholder")}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                  className={selectClass}
                  aria-label={t("userDash.myCvs.filterTypeLabel")}
                >
                  <option value="all">{t("userDash.myCvs.filterTypeAll")}</option>
                  <option value="pdf">{t("userDash.myCvs.filterTypePdf")}</option>
                  <option value="word">{t("userDash.myCvs.filterTypeWord")}</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className={selectClass}
                  aria-label={t("userDash.myCvs.filterDateLabel")}
                >
                  <option value="all">{t("userDash.myCvs.filterDateAll")}</option>
                  <option value="7d">{t("userDash.myCvs.filterDate7d")}</option>
                  <option value="30d">{t("userDash.myCvs.filterDate30d")}</option>
                  <option value="90d">{t("userDash.myCvs.filterDate90d")}</option>
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className={selectClass}
                  aria-label={t("userDash.myCvs.sortLabel")}
                >
                  <option value="newest">{t("userDash.myCvs.sortNewest")}</option>
                  <option value="oldest">{t("userDash.myCvs.sortOldest")}</option>
                  <option value="name">{t("userDash.myCvs.sortName")}</option>
                </select>
              </div>
            </div>

            {files.length === 0 ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">{t("userDash.myCvs.emptyList")}</p>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">{t("userDash.myCvs.emptyFiltered")}</p>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/15 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        <th className="py-3 pr-4">{t("userDash.myCvs.colCandidate")}</th>
                        <th className="py-3 pr-4">{t("userDash.myCvs.colType")}</th>
                        <th className="py-3 pr-4">{t("userDash.myCvs.colUploaded")}</th>
                        <th className="w-24 py-3 text-right">{t("userDash.myCvs.colActions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {filtered.map((f) => (
                        <tr key={f.id} className="hover:bg-surface-container/40">
                          <td className="py-3 pr-4 align-top">
                            <div className="flex items-start gap-2">
                              <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary">{extIcon(f.name)}</span>
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface">{displayName(f.name)}</p>
                                <p className="truncate text-xs text-on-surface-variant">{f.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 align-top">
                            <span className="inline-flex rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                              {typeLabel(f.name)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 align-top text-on-surface-variant whitespace-nowrap">
                            {formatDate(f.uploadedAt)}
                          </td>
                          <td className="py-3 text-right align-top">
                            <button
                              type="button"
                              onClick={() => removeFile(f.id)}
                              className="inline-flex rounded-lg p-2 text-error hover:bg-error-container/20"
                              aria-label={t("profile.removeAria")}
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="space-y-3 md:hidden">
                  {filtered.map((f) => (
                    <li
                      key={f.id}
                      className="rounded-xl border border-outline-variant/15 bg-surface-container p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary">{extIcon(f.name)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-on-surface">{displayName(f.name)}</p>
                          <p className="truncate text-xs text-on-surface-variant">{f.name}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                            <span className="rounded-full bg-primary/12 px-2 py-0.5 font-bold uppercase text-primary">
                              {typeLabel(f.name)}
                            </span>
                            <span>{formatDate(f.uploadedAt)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(f.id)}
                          className="shrink-0 rounded-lg p-2 text-error hover:bg-error-container/20"
                          aria-label={t("profile.removeAria")}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
