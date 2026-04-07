"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LanguageToggleButton from "@/components/LanguageToggleButton";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCvProcessingStatus } from "@/hooks/useCvProcessingStatus";
import { userCvApi, type UserCvDto } from "@/services/userCvApi";
import type { CvProcessingStatus } from "@/types/cvProcessing";

type CvFile = {
  id: string;
  name: string;
  uploadedAt: string;
  /** From API when listing user CVs; used to show PDF/Word when filename has no extension */
  contentType?: string;
};

const STORAGE_KEY = "demo.cvFiles";

type TypeFilter = "all" | "pdf" | "word";
type DateFilter = "all" | "7d" | "30d" | "90d";
type SortKey = "newest" | "oldest" | "name";

function fileKind(name: string | undefined, mime?: string): "pdf" | "word" | "other" {
  const lower = (name ?? "").toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "word";
  const m = (mime ?? "").toLowerCase();
  if (m.includes("pdf")) return "pdf";
  if (m.includes("wordprocessingml") || m.includes("msword") || m.includes("officedocument")) return "word";
  return "other";
}

function extIcon(name: string | undefined, mime?: string) {
  const k = fileKind(name, mime);
  if (k === "pdf") return "picture_as_pdf";
  if (k === "word") return "article";
  return "description";
}

function displayName(name: string | undefined) {
  const n = name ?? "";
  const base = n.replace(/\.(pdf|docx?)$/i, "").replace(/[._-]+/g, " ").trim();
  return base || n || "—";
}

function dtoToCvFile(d: UserCvDto): CvFile {
  const name = d.originalName?.trim() || "document";
  const uploadedAt = d.createdAt ?? new Date().toISOString();
  const contentType = d.contentType?.trim() || undefined;
  return { id: d.id, name, uploadedAt, contentType };
}

function syncDemoCvFiles(items: CvFile[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 10)));
  } catch {
    /* ignore */
  }
}

function loadLocalOnly(): CvFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CvFile[]) : [];
  } catch {
    return [];
  }
}

function labelForCvStatus(t: (key: string) => string, s: CvProcessingStatus | null) {
  switch (s) {
    case "PARSING":
      return t("userDash.myCvs.statusParsing");
    case "AI_PROCESSING":
      return t("userDash.myCvs.statusAi");
    case "DONE":
      return t("userDash.myCvs.statusDone");
    case "FAILED":
      return t("userDash.myCvs.statusFailed");
    case "PENDING":
    default:
      return t("userDash.myCvs.statusPending");
  }
}

export default function UserMyCvsPage() {
  const { t, lang } = useLanguage();
  const [files, setFiles] = useState<CvFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const inputPdfRef = useRef<HTMLInputElement>(null);
  const inputWordRef = useRef<HTMLInputElement>(null);
  const [trackingCvId, setTrackingCvId] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setFiles(loadLocalOnly());
      setApiConnected(false);
      setListError(null);
      return;
    }
    try {
      const { data } = await userCvApi.list(50);
      const mapped = data.items.map(dtoToCvFile);
      setFiles(mapped);
      syncDemoCvFiles(mapped);
      setApiConnected(true);
      setListError(null);
    } catch (e) {
      setApiConnected(false);
      setFiles(loadLocalOnly());
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setListError(t("userDash.myCvs.apiNeedLogin"));
      } else {
        setListError(t("userDash.myCvs.apiListError"));
      }
    }
  }, [t]);

  const finishCvTracking = useCallback(() => {
    setTrackingCvId(null);
    void loadFiles();
  }, [loadFiles]);

  const { status: cvProcessStatus, lastPayload: cvStatusPayload } = useCvProcessingStatus(
    trackingCvId,
    {
      onDone: finishCvTracking,
      onFailed: (p) => {
        if (p?.error) setAnalyzeError(p.error);
        finishCvTracking();
      },
    }
  );

  /** Legacy: cookie-only sessions could not send Bearer to :5000 — copy into localStorage once. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
    if (m?.[1] && !localStorage.getItem("accessToken")) {
      try {
        localStorage.setItem("accessToken", decodeURIComponent(m[1]));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitialLoading(true);
      await loadFiles();
      if (!cancelled) setInitialLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFiles]);

  async function addFile(f: File) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      try {
        const { data } = await userCvApi.upload(f);
        setAnalyzeError(null);
        setTrackingCvId(data.id);
        await loadFiles();
      } catch (e) {
        const msg = axios.isAxiosError(e)
          ? String((e.response?.data as { message?: string })?.message ?? e.message)
          : t("userDash.myCvs.apiUploadError");
        setAnalyzeError(msg);
      }
      return;
    }
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

  async function removeFile(id: string) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      try {
        await userCvApi.remove(id);
        await loadFiles();
      } catch {
        setListError(t("userDash.myCvs.apiListError"));
      }
      return;
    }
    setFiles((prev) => {
      const next = prev.filter((x) => x.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function confirmRemoveFile(id: string) {
    if (typeof window !== "undefined" && !window.confirm(t("userDash.myCvs.confirmDelete"))) {
      return;
    }
    void removeFile(id);
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

  const filtered = useMemo(() => {
    let list = [...files];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) || displayName(f.name).toLowerCase().includes(q)
      );
    }
    if (typeFilter === "pdf") list = list.filter((f) => fileKind(f.name, f.contentType) === "pdf");
    if (typeFilter === "word") list = list.filter((f) => fileKind(f.name, f.contentType) === "word");

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

  const typeLabel = (f: CvFile) => {
    const k = fileKind(f.name, f.contentType);
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
        <div className="space-y-8">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white/80 p-1 shadow-sm backdrop-blur-md dark:border-outline-variant/30 dark:bg-surface-container-lowest/90">
            <div
              role="region"
              aria-label={t("userDash.myCvs.uploadDropRegionAria")}
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
              className={`group flex flex-col items-center rounded-[calc(1rem-4px)] border-2 border-dashed p-8 text-center transition-colors md:p-12 ${
                dragOver ? "border-primary bg-primary/5" : "border-outline-variant/35"
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
                <button
                  type="button"
                  onClick={() => inputPdfRef.current?.click()}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container/50 px-4 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:bg-surface-container-low/80"
                  aria-label={t("userDash.myCvs.pickPdf")}
                >
                  <span className="material-symbols-outlined text-sm text-error">picture_as_pdf</span>
                  <span className="text-sm font-semibold text-on-surface">PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => inputWordRef.current?.click()}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container/50 px-4 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:bg-surface-container-low/80"
                  aria-label={t("userDash.myCvs.pickWord")}
                >
                  <span className="material-symbols-outlined text-sm text-primary">description</span>
                  <span className="text-sm font-semibold text-on-surface">DOCX</span>
                </button>
              </div>
              <input
                ref={inputPdfRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={onUpload}
              />
              <input
                ref={inputWordRef}
                type="file"
                accept="application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,.docx"
                className="hidden"
                onChange={onUpload}
              />
              {analyzeError && (
                <p className="mt-4 text-sm text-error" role="alert">
                  {analyzeError}
                </p>
              )}
            </div>
          </div>

          {trackingCvId ? (
            <div
              className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-on-surface"
              role="status"
              aria-live="polite"
            >
              <span className="material-symbols-outlined mt-0.5 shrink-0 animate-spin text-primary">
                progress_activity
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-headline text-sm font-bold">{t("userDash.myCvs.processingTitle")}</p>
                <p className="mt-0.5 text-sm text-on-surface-variant">
                  {labelForCvStatus(t, cvProcessStatus)}
                </p>
                {cvStatusPayload?.status === "FAILED" && cvStatusPayload.error ? (
                  <p className="mt-2 text-sm text-error">{String(cvStatusPayload.error)}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <section className="rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm md:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-headline text-lg font-bold text-on-surface">{t("userDash.myCvs.listTitle")}</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {apiConnected ? t("userDash.myCvs.listHintApi") : t("userDash.myCvs.listHint")}
                </p>
              </div>
              <p className="text-xs font-medium text-on-surface-variant">
                {t("userDash.myCvs.listCount").replace("{count}", String(filtered.length))}
              </p>
            </div>

            {listError && (
              <div
                className="mb-4 rounded-lg border border-error/25 bg-error-container/15 px-3 py-2 text-sm text-error"
                role="alert"
              >
                {listError}
              </div>
            )}

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

            {initialLoading ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">{t("admin.jobProfile.loading")}</p>
            ) : files.length === 0 ? (
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
                              <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary">{extIcon(f.name, f.contentType)}</span>
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface">{displayName(f.name)}</p>
                                <p className="truncate text-xs text-on-surface-variant">{f.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 align-top">
                            <span className="inline-flex rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                              {typeLabel(f)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 align-top text-on-surface-variant whitespace-nowrap">
                            {formatDate(f.uploadedAt)}
                          </td>
                          <td className="py-3 text-right align-top">
                            <button
                              type="button"
                              onClick={() => confirmRemoveFile(f.id)}
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
                        <span className="material-symbols-outlined text-primary">{extIcon(f.name, f.contentType)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-on-surface">{displayName(f.name)}</p>
                          <p className="truncate text-xs text-on-surface-variant">{f.name}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                            <span className="rounded-full bg-primary/12 px-2 py-0.5 font-bold uppercase text-primary">
                              {typeLabel(f)}
                            </span>
                            <span>{formatDate(f.uploadedAt)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => confirmRemoveFile(f.id)}
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
