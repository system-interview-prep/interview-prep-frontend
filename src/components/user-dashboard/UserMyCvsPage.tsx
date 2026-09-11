"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CareerClassificationSummary from "@/components/cv/CareerClassificationSummary";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCvProcessingStatus } from "@/hooks/useCvProcessingStatus";
import { userCvApi, type UserCvDto } from "@/services/userCvApi";
import type { CvProcessingStatus } from "@/types/cvProcessing";
import type { CareerTaxonomyItem, ParsedCvData } from "@/types/careerClassification";
import { resolveBackendErrorMessage } from "@/utils/backendError";

type CvFile = {
  id: string;
  name: string;
  uploadedAt: string;
  /** From API when listing user CVs; used to show PDF/Word when filename has no extension */
  contentType?: string;
  status?: CvProcessingStatus;
  error?: string;
  score?: number;
  parsedData?: ParsedCvData;
};

const STORAGE_KEY = "demo.cvFiles";
const STALE_PROCESSING_MS = 10 * 60 * 1000;

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
  return base || n || "â€”";
}

function dtoToCvFile(d: UserCvDto): CvFile {
  const name = d.originalName?.trim() || "document";
  const uploadedAt = d.createdAt ?? new Date().toISOString();
  const contentType = d.contentType?.trim() || undefined;
  return { id: d.id, name, uploadedAt, contentType, status: d.status, error: d.error?.trim() || undefined, score: d.score, parsedData: d.parsedData };
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

function effectiveCvStatus(file: CvFile): CvProcessingStatus | null {
  if (
    (file.status === "PARSING" || file.status === "AI_PROCESSING") &&
    Date.now() - new Date(file.uploadedAt).getTime() > STALE_PROCESSING_MS
  ) {
    return "FAILED";
  }
  if (file.error && file.status !== "DONE") return "FAILED";
  return file.status ?? null;
}

function statusBadgeClass(status: CvProcessingStatus | null | undefined) {
  switch (status) {
    case "DONE":
      return "bg-emerald-100 text-emerald-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "AI_PROCESSING":
      return "bg-amber-100 text-amber-800";
    case "PARSING":
      return "bg-sky-100 text-sky-800";
    case "PENDING":
    default:
      return "bg-[#E8EDF8] text-[#5A6B8F]";
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
  const [careerCode, setCareerCode] = useState("");
  const [careerTaxonomy, setCareerTaxonomy] = useState<CareerTaxonomyItem[]>([]);
  const inputPdfRef = useRef<HTMLInputElement>(null);
  const inputWordRef = useRef<HTMLInputElement>(null);
  const [trackingCvId, setTrackingCvId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CvFile | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      const { data } = await userCvApi.list(50, careerCode || undefined);
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
  }, [careerCode, t]);

  const finishCvTracking = useCallback(() => {
    setTrackingCvId(null);
    void loadFiles();
  }, [loadFiles]);

  const { status: cvProcessStatus, lastPayload: cvStatusPayload } = useCvProcessingStatus(
    trackingCvId,
    {
      onDone: finishCvTracking,
      onFailed: (p) => {
        if (p?.error) setAnalyzeError(resolveBackendErrorMessage(p.error, t));
        finishCvTracking();
      },
    }
  );

  /** Legacy: cookie-only sessions could not send Bearer to :5000 â€” copy into localStorage once. */
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
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setCareerTaxonomy([]);
      return;
    }
    let cancelled = false;
    void userCvApi.getCareerTaxonomy()
      .then(({ data }) => {
        if (!cancelled) setCareerTaxonomy(data.items);
      })
      .catch(() => {
        if (!cancelled) setCareerTaxonomy([]);
      });
    return () => {
      cancelled = true;
    };
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

  const hasInFlightCv = useMemo(
    () =>
      files.some((f) => {
        const st = effectiveCvStatus(f);
        return st === "PENDING" || st === "PARSING" || st === "AI_PROCESSING";
      }),
    [files],
  );

  useEffect(() => {
    if (!apiConnected) return;
    if (trackingCvId) return;
    if (!hasInFlightCv) return;

    const timer = window.setInterval(() => {
      void loadFiles();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [apiConnected, trackingCvId, hasInFlightCv, loadFiles]);

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
        setAnalyzeError(resolveBackendErrorMessage(e, t, "userDash.myCvs.apiUploadError"));
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
    const target = files.find((f) => f.id === id) ?? null;
    setDeleteTarget(target);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await removeFile(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteTarget(null);
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
    return "â€”";
  };

  const typeBadgeClass = (f: CvFile) => {
    const k = fileKind(f.name, f.contentType);
    if (k === "pdf") return "bg-[#FFEBEE] text-[#C9362B]";
    if (k === "word") return "bg-[#E8EDF8] text-[#234196]";
    return "bg-[#EEF1F6] text-[#5A6B8F]";
  };

  const typeIconClass = (f: CvFile) => {
    const k = fileKind(f.name, f.contentType);
    if (k === "pdf") return "text-error";
    if (k === "word") return "text-primary";
    return "text-on-surface-variant";
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
    "h-11 w-full min-w-0 rounded-lg border border-[#AAB8D6] bg-white px-3 text-sm font-semibold text-[#234196] outline-none transition-colors focus:border-[#234196] focus:ring-2 focus:ring-[#FCB625]/50 disabled:cursor-not-allowed disabled:bg-[#E5EAF5] disabled:text-[#7A87A5]";
  const filterLabelClass =
    "mb-1.5 block h-4 truncate text-[10px] font-bold uppercase leading-4 tracking-[0.14em] text-[#5A6B8F]";
  const badgeClass =
    "inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold uppercase";

  return (
    <main className="paper-dots min-h-screen bg-[#FEF9EE] px-4 py-6 text-[#234196] sm:px-6 md:px-8 md:py-10 lg:px-10 xl:px-12">
      <div className="mx-auto max-w-[1120px]">
      <header className="mb-8 border-b-2 border-[#234196] pb-7">
        <div className="max-w-2xl">
          <span className="sticker -rotate-1 bg-[#FCB625]">{t("userDash.myCvs.eyebrow")}</span>
          <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight md:text-5xl">
            {t("userDash.myCvs.headerTitle")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#5A6B8F]">{t("userDash.myCvs.headerSubtitle")}</p>
        </div>
      </header>

      <div>
        <div className="space-y-8">
          <div className="overflow-hidden rounded-2xl border-2 border-[#234196] bg-white p-1 shadow-[5px_5px_0_#234196]">
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
                dragOver ? "border-[#234196] bg-[#FCB625]/20" : "border-[#234196] bg-[#F0F4FC]"
              }`}
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#234196] bg-[#FCB625] transition-transform duration-300 group-hover:-rotate-2 motion-reduce:transform-none">
                <span
                  className="material-symbols-outlined text-4xl text-[#234196]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  upload_file
                </span>
              </div>
              <h2 className="font-headline text-3xl font-bold">{t("userDash.myCvs.uploadTitle")}</h2>
              <p className="mb-8 mt-2 max-w-md text-sm leading-6 text-[#5A6B8F]">{t("userDash.myCvs.uploadHint")}</p>
              <div className="mb-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => inputPdfRef.current?.click()}
                  className="chunky-secondary min-h-11 cursor-pointer px-4 text-sm"
                  aria-label={t("userDash.myCvs.pickPdf")}
                >
                  <span className="material-symbols-outlined text-sm text-error">picture_as_pdf</span>
                  <span className="font-bold">PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => inputWordRef.current?.click()}
                  className="chunky-primary min-h-11 cursor-pointer px-4 text-sm"
                  aria-label={t("userDash.myCvs.pickWord")}
                >
                  <span className="material-symbols-outlined text-sm text-primary">description</span>
                  <span className="font-bold">DOCX</span>
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
                <p className="mt-4 rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] px-4 py-3 text-sm text-[#8F1D1D]" role="alert">
                  {analyzeError}
                </p>
              )}
            </div>
          </div>

          {trackingCvId ? (
            <div
              className="flex items-start gap-3 rounded-xl border-2 border-[#234196] bg-[#FCB625]/20 px-4 py-3 shadow-[3px_3px_0_#234196]"
              role="status"
              aria-live="polite"
            >
              <span className="material-symbols-outlined mt-0.5 shrink-0 animate-spin text-[#234196] motion-reduce:animate-none">
                progress_activity
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-headline text-sm font-bold">{t("userDash.myCvs.processingTitle")}</p>
                <p className="mt-0.5 text-sm text-[#5A6B8F]">
                  {labelForCvStatus(t, cvProcessStatus)}
                </p>
                {cvStatusPayload?.status === "FAILED" && cvStatusPayload.error ? (
                  <p className="mt-2 text-sm text-error">{String(cvStatusPayload.error)}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <section className="rounded-2xl border border-[#C8D2E8] bg-white p-4 shadow-[0_12px_32px_rgba(35,65,150,0.08)] md:p-6">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-headline text-2xl font-bold">{t("userDash.myCvs.listTitle")}</h2>
                <p className="mt-1 text-xs text-[#5A6B8F]">
                  {apiConnected ? t("userDash.myCvs.listHintApi") : t("userDash.myCvs.listHint")}
                </p>
              </div>
              <p className="w-fit rounded-full bg-[#FCB625] px-3 py-1.5 font-metadata text-[9px] font-bold uppercase tracking-[0.12em] text-[#234196]">
                {t("userDash.myCvs.listCount").replace("{count}", String(filtered.length))}
              </p>
            </div>

            {listError && (
              <div
                className="mb-4 rounded-xl border-2 border-[#D32F2F] bg-[#FFEBEE] px-4 py-3 text-sm text-[#8F1D1D]"
                role="alert"
              >
                {listError}
              </div>
            )}

            <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-[#F0F4FC] p-4 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.1fr)_minmax(220px,1.35fr)_minmax(115px,.65fr)_minmax(145px,.8fr)_minmax(125px,.7fr)]">
              <div className="min-w-0 sm:col-span-2 xl:col-span-1">
                <label htmlFor="cv-search" className={filterLabelClass}>
                  {t("userDash.myCvs.searchLabel")}
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[20px] leading-none text-[#5A6B8F]"
                    aria-hidden="true"
                  >
                    search
                  </span>
                  <input
                    id="cv-search"
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("userDash.myCvs.searchPlaceholder")}
                    className="h-11 w-full rounded-lg border border-[#AAB8D6] bg-white pl-10 pr-3 text-sm font-semibold text-[#234196] outline-none transition-colors placeholder:font-normal placeholder:text-[#7A87A5] focus:border-[#234196] focus:ring-2 focus:ring-[#FCB625]/50"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label htmlFor="cv-career-filter" className={filterLabelClass}>
                  {t("userDash.myCvs.filterCareerLabel")}
                </label>
                <select
                  id="cv-career-filter"
                  value={careerCode}
                  onChange={(event) => setCareerCode(event.target.value)}
                  className={selectClass}
                  disabled={!apiConnected || careerTaxonomy.length === 0}
                >
                  <option value="">{t("userDash.myCvs.filterCareerAll")}</option>
                  {careerTaxonomy.map((item) => (
                    <option key={item.code} value={item.code}>{item.label} · {item.dimension}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor="cv-type-filter" className={filterLabelClass}>
                  {t("userDash.myCvs.filterTypeLabel")}
                </label>
                <select
                  id="cv-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                  className={selectClass}
                >
                  <option value="all">{t("userDash.myCvs.filterTypeAll")}</option>
                  <option value="pdf">{t("userDash.myCvs.filterTypePdf")}</option>
                  <option value="word">{t("userDash.myCvs.filterTypeWord")}</option>
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor="cv-date-filter" className={filterLabelClass}>
                  {t("userDash.myCvs.filterDateLabel")}
                </label>
                <select
                  id="cv-date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className={selectClass}
                >
                  <option value="all">{t("userDash.myCvs.filterDateAll")}</option>
                  <option value="7d">{t("userDash.myCvs.filterDate7d")}</option>
                  <option value="30d">{t("userDash.myCvs.filterDate30d")}</option>
                  <option value="90d">{t("userDash.myCvs.filterDate90d")}</option>
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor="cv-sort" className={filterLabelClass}>
                  {t("userDash.myCvs.sortLabel")}
                </label>
                <select
                  id="cv-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className={selectClass}
                >
                  <option value="newest">{t("userDash.myCvs.sortNewest")}</option>
                  <option value="oldest">{t("userDash.myCvs.sortOldest")}</option>
                  <option value="name">{t("userDash.myCvs.sortName")}</option>
                </select>
              </div>
            </div>

            {initialLoading ? (
              <div className="space-y-3 py-3" role="status" aria-label={t("admin.jobProfile.loading")}>{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-[#F0F4FC] motion-reduce:animate-none" />)}</div>
            ) : files.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[#234196] bg-[#F0F4FC] px-5 py-12 text-center"><span className="material-symbols-outlined text-4xl" aria-hidden="true">description</span><p className="mt-3 text-sm text-[#5A6B8F]">{t("userDash.myCvs.emptyList")}</p></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-[#234196] bg-[#FEF9EE] px-5 py-12 text-center"><span className="material-symbols-outlined text-4xl" aria-hidden="true">search_off</span><p className="mt-3 text-sm text-[#5A6B8F]">{t("userDash.myCvs.emptyFiltered")}</p></div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-[#C8D2E8] md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                      <thead>
                      <tr className="border-b border-[#C8D2E8] bg-[#F0F4FC] text-xs font-bold uppercase tracking-[0.12em] text-[#234196]">
                        <th className="px-4 py-3">{t("userDash.myCvs.colCandidate")}</th>
                        <th className="px-4 py-3">{t("userDash.myCvs.colType")}</th>
                        <th className="px-4 py-3">{t("userDash.myCvs.colStatus")}</th>
                        <th className="px-4 py-3">{t("userDash.myCvs.colUploaded")}</th>
                        <th className="w-24 px-4 py-3 text-center">{t("userDash.myCvs.colActions")}</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCE3F1] bg-white">
                      {filtered.map((f) => (
                        <tr key={f.id} className="transition-colors hover:bg-[#FEF9EE]">
                          <td className="px-4 py-4 align-middle">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F4FC]" aria-hidden="true">
                                <span className={`material-symbols-outlined inline-block select-none text-[22px] leading-none ${typeIconClass(f)}`}>
                                  {extIcon(f.name, f.contentType)}
                                </span>
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-[#234196]">{displayName(f.name)}</p>
                                  <p className="truncate text-xs text-[#5A6B8F]">{f.name}</p>
                                  <CareerClassificationSummary status={effectiveCvStatus(f) ?? undefined} parsedData={f.parsedData} compact />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span className={`${badgeClass} ${typeBadgeClass(f)}`}>
                              {typeLabel(f)}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            {effectiveCvStatus(f) ? (
                              <span className={`${badgeClass} whitespace-nowrap ${statusBadgeClass(effectiveCvStatus(f))}`}>
                                {labelForCvStatus(t, effectiveCvStatus(f))}
                              </span>
                            ) : (
                              <span className="text-[#7A87A5]">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 align-middle text-[#5A6B8F]">
                            {formatDate(f.uploadedAt)}
                          </td>
                          <td className="px-4 py-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => confirmRemoveFile(f.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#C9362B] transition-colors hover:bg-[#FFF0EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625]"
                              aria-label={t("profile.removeAria")}
                            >
                              <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <ul className="space-y-3 md:hidden">
                  {filtered.map((f) => (
                    <li
                      key={f.id}
                      className="rounded-xl border border-[#C8D2E8] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F4FC]" aria-hidden="true">
                          <span className={`material-symbols-outlined inline-block select-none text-[22px] leading-none ${typeIconClass(f)}`}>
                            {extIcon(f.name, f.contentType)}
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#234196]">{displayName(f.name)}</p>
                          <p className="truncate text-xs text-[#5A6B8F]">{f.name}</p>
                          <CareerClassificationSummary status={effectiveCvStatus(f) ?? undefined} parsedData={f.parsedData} compact />
                          {effectiveCvStatus(f) ? (
                            <div className="mt-2">
                              <span className={`${badgeClass} ${statusBadgeClass(effectiveCvStatus(f))}`}>
                                {labelForCvStatus(t, effectiveCvStatus(f))}
                              </span>
                            </div>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5A6B8F]">
                            <span className={`${badgeClass} ${typeBadgeClass(f)}`}>
                              {typeLabel(f)}
                            </span>
                            <span>{formatDate(f.uploadedAt)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => confirmRemoveFile(f.id)}
                          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-[#C9362B] transition-colors hover:bg-[#FFF0EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625]"
                          aria-label={t("profile.removeAria")}
                        >
                          <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">delete</span>
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

      {deleteTarget ? (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t("userDash.myCvs.confirmDelete")}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={closeDeleteModal}
            aria-label={t("interview.cvUpload.cancel")}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border-2 border-[#234196] bg-white p-6 shadow-[6px_6px_0_#234196]">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[#C9362B] bg-[#FFF0EE] text-[#C9362B]">
              <span className="material-symbols-outlined" aria-hidden="true">delete</span>
            </div>
            <h3 className="mt-4 font-headline text-xl font-bold text-[#234196]">{t("userDash.myCvs.confirmDelete")}</h3>
            <p className="mt-2 break-all rounded-lg border border-[#234196]/25 bg-[#F0F4FC] px-3 py-2 text-sm text-[#5A6B8F]">{deleteTarget.name}</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="chunky-secondary min-h-11 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("interview.cvUpload.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="min-h-11 rounded-lg border-2 border-[#8F251E] bg-[#C9362B] px-5 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#8F251E] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {deleting ? t("admin.jobProfile.loading") : t("profile.removeAria")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </main>
  );
}
