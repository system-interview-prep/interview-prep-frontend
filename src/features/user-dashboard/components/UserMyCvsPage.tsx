"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, RotateCcw, Trash2 } from "lucide-react";
import CareerClassificationSummary from "@features/resume/components/CareerClassificationSummary";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCvProcessingStatus } from "@features/resume/hooks/useCvProcessingStatus";
import { userCvApi, type UserCvDto } from "@features/resume/services/userCv.service";
import type { CvProcessingStatus, CareerTaxonomyItem, ParsedCvData } from "@features/resume/types";
import { resolveBackendErrorMessage } from "@/utils/backendError";
import { fmt, localeOf } from "@/i18n/format";
import ParsedCvDrawer from "@features/resume/components/ParsedCvDrawer";
import { PROCESSING_STEP_KEYS, cvViewState, processingStep } from "@features/resume/utils/cvStatus";
import WorkspacePageHeader from "@features/resume/components/WorkspacePageHeader";
import StatusNote from "@components/shared/StatusNote";
import Pagination from "@components/shared/Pagination";
import { useDialogA11y } from "@components/shared/useDialogA11y";
import Link from "next/link";

type CvFile = {
  id: string;
  name: string;
  uploadedAt: string;
  /** Last status change; a re-parse of an old CV is not "stale" because of its upload date. */
  updatedAt?: string;
  /** From API when listing user CVs; used to show PDF/Word when filename has no extension */
  contentType?: string;
  status?: CvProcessingStatus;
  error?: string;
  score?: number;
  parsedData?: ParsedCvData;
};

const STORAGE_KEY = "demo.cvFiles";
/** Upper bound for one user's CV list (fetched in pages of 100, then filtered and paged here). */
const LIST_LIMIT = 1000;
const PAGE_SIZE = 10;

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

function displayName(name: string | undefined) {
  const n = name ?? "";
  const base = n.replace(/\.(pdf|docx?)$/i, "").replace(/[._-]+/g, " ").trim();
  return base || n || "—";
}

function dtoToCvFile(d: UserCvDto): CvFile {
  const name = d.originalName?.trim() || "document";
  const uploadedAt = d.createdAt ?? new Date().toISOString();
  const contentType = d.contentType?.trim() || undefined;
  return {
    id: d.id,
    name,
    uploadedAt,
    updatedAt: d.updatedAt || undefined,
    contentType,
    status: d.status,
    error: d.error?.trim() || undefined,
    score: d.score,
    parsedData: d.parsedData,
  };
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
  // A slow parse is still in progress; only the server declares failure.
  if (file.error && file.status !== "DONE") return "FAILED";
  return file.status ?? null;
}

/** Failed CVs, and slow ones whose hint asks for a re-analysis, get the retry button. */
function canRetryParse(file: CvFile): boolean {
  return effectiveCvStatus(file) === "FAILED" || cvViewState(file) === "slow";
}

/** What is happening with this CV and what the candidate can do next. */
function CvRowStatusDetail({ file, onOpenParsed }: { file: CvFile; onOpenParsed: () => void }) {
  const { t } = useLanguage();
  const state = cvViewState(file);
  if (state === "ready") {
    return (
      <button type="button" onClick={onOpenParsed} className="mt-1.5 text-xs font-semibold text-[#204195] hover:underline">
        {t("parsedCv.open")} →
      </button>
    );
  }
  if (state === "processing") {
    const step = processingStep(file.status);
    return (
      <p className="mt-1.5 text-xs text-[#204195]">
        {fmt(t("cvStatus.processingHint"), { step, name: t(PROCESSING_STEP_KEYS[step]) })}
      </p>
    );
  }
  if (state === "slow") return <p className="mt-1.5 text-xs text-[#8A5A00] [overflow-wrap:anywhere]">{t("cvStatus.slowHint")}</p>;
  return file.error ? (
    <p className="mt-1.5 text-xs text-[#C43B3B] [overflow-wrap:anywhere]">{resolveBackendErrorMessage(file.error, t)}</p>
  ) : null;
}

function statusBadgeClass(status: CvProcessingStatus | null | undefined) {
  switch (status) {
    case "DONE":
      return "bg-[#EAF5EE] text-[#287A4B]";
    case "FAILED":
      return "bg-[#FDF2F2] text-[#C43B3B]";
    case "AI_PROCESSING":
      return "bg-[#FFF8E6] text-[#8A5A00]";
    case "PARSING":
      return "bg-[#EEF2FD] text-[#204195]";
    case "PENDING":
    default:
      return "bg-[#F0F4FC] text-[#607096]";
  }
}

export default function UserMyCvsPage() {
  const { t, lang } = useLanguage();
  const [files, setFiles] = useState<CvFile[]>([]);
  const [parsedCv, setParsedCv] = useState<CvFile | null>(null);
  const closeParsedCv = useCallback(() => setParsedCv(null), []);
  const [dragOver, setDragOver] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  // Same file uploaded again, or a new file renamed because its name was taken.
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  /** True when the user owns more than LIST_LIMIT CVs, so the oldest are not shown. */
  const [listCapped, setListCapped] = useState(false);
  const [reparsingId, setReparsingId] = useState<string | null>(null);
  /** What the fox says right after a CV finishes parsing (the corner fox is hidden on this page). */
  const [foxDone, setFoxDone] = useState(false);
  /** True while the file itself is being sent, before the server starts parsing. */
  const [uploading, setUploading] = useState(false);

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
      const { data } = await userCvApi.listAll(careerCode || undefined, LIST_LIMIT);
      const mapped = data.items.map(dtoToCvFile);
      setFiles(mapped);
      setListCapped(data.total > LIST_LIMIT);
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
    setReparsingId(null);
    void loadFiles();
  }, [loadFiles]);

  /** Re-run parsing for a CV that failed (OCR outage, slow network, worker restart). */
  const retryParse = useCallback(
    async (file: CvFile) => {
      if (reparsingId) return;
      setReparsingId(file.id);
      setAnalyzeError(null);
      try {
        await userCvApi.reparse(file.id);
        const now = new Date().toISOString();
        setFiles((prev) =>
          prev.map((item) =>
            item.id === file.id ? { ...item, status: "PENDING", error: undefined, updatedAt: now } : item
          )
        );
        setTrackingCvId(file.id);
      } catch (e) {
        setReparsingId(null);
        setAnalyzeError(resolveBackendErrorMessage(e, t));
      }
    },
    [reparsingId, t]
  );

  const { status: cvProcessStatus, lastPayload: cvStatusPayload } = useCvProcessingStatus(
    trackingCvId,
    {
      onDone: () => {
        setFoxDone(true);
        finishCvTracking();
      },
      onFailed: (p) => {
        setFoxDone(false);
        if (p?.error) setAnalyzeError(resolveBackendErrorMessage(p.error, t));
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
      setUploading(true);
      setAnalyzeError(null);
      setUploadNotice(null);
      setFoxDone(false);
      try {
        const { data } = await userCvApi.upload(f);
        setAnalyzeError(null);
        setFoxDone(false);
        if (data.duplicate) {
          // Nothing new to process: point at the CV they already have.
          setUploadNotice(fmt(t("uxWs.cvs.duplicateUpload"), { name: data.originalName }));
        } else {
          if (data.renamedFrom) {
            setUploadNotice(fmt(t("uxWs.cvs.renamedUpload"), { from: data.renamedFrom, to: data.originalName }));
          }
          setTrackingCvId(data.id);
        }
        await loadFiles();
      } catch (e) {
        setAnalyzeError(resolveBackendErrorMessage(e, t, "userDash.myCvs.apiUploadError"));
      } finally {
        setUploading(false);
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
      // Let a failed delete reach the dialog, which stays open and says so.
      await userCvApi.remove(id);
      await loadFiles();
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
    setDeleteError(null);
    setDeleteTarget(target);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await removeFile(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setDeleteError(t("fixApp.cvs.deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  const closeDeleteModal = useCallback(() => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }, [deleting]);
  const deleteDialogRef = useDialogA11y<HTMLDivElement>(deleteTarget !== null, closeDeleteModal);

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
    else {
      setFoxDone(false);
      setAnalyzeError(t("fixApp.cvs.unsupportedFile"));
    }
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

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const typeLabel = (f: CvFile) => {
    const k = fileKind(f.name, f.contentType);
    if (k === "pdf") return t("userDash.myCvs.typePdf");
    if (k === "word") return t("userDash.myCvs.typeWord");
    return "—";
  };

  const typeBadgeClass = (f: CvFile) => {
    const k = fileKind(f.name, f.contentType);
    if (k === "pdf") return "bg-[#F0F4FC] text-[#204195]";
    if (k === "word") return "bg-[#EEF2FD] text-[#204195]";
    return "bg-[#F0F4FC] text-[#607096]";
  };

  const readyCount = files.filter((f) => cvViewState(f) === "ready").length;
  const trackingStep = processingStep(cvProcessStatus);
  const nextStepLink = (
    <Link href="/dashboard/jobs" className="font-semibold text-[#204195] underline-offset-4 hover:underline">
      {t("uxWs.cvs.nextChooseJob")} →
    </Link>
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(localeOf(lang), {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  const selectClass =
    "h-10 w-full min-w-0 rounded-xl border-0 bg-white px-3 text-[13px] font-medium text-[#14244B] outline-none border border-[#DCE4F3] transition focus:ring-2 focus:ring-[#204195] disabled:cursor-not-allowed disabled:opacity-60";
  const filterLabelClass =
    "mb-1.5 block h-4 truncate text-xs font-semibold text-[#607096]";
  const badgeClass =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 pb-16 pt-4 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
      <div className="mx-auto max-w-[1280px]">
      <WorkspacePageHeader
        title={t("userDash.myCvs.headerTitle")}
        subtitle={t("userDash.myCvs.headerSubtitle")}
        className="mb-6"
      />

      {readyCount > 0 ? <p className="mb-6 text-sm">{nextStepLink}</p> : null}

      <div>
        <div className="space-y-8">
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
            className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors md:px-8 md:py-8 ${
              dragOver ? "border-[#204195] bg-[#EEF2FD]" : "border-[#C9D7F1] bg-white"
            }`}
          >
            <h2 className="text-lg font-bold text-[#14244B]">{t("userDash.myCvs.uploadTitle")}</h2>
            <p className="mb-6 mt-1.5 max-w-md text-sm leading-6 text-[#607096]">{t("userDash.myCvs.uploadHint")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => inputPdfRef.current?.click()}
                className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
                aria-label={t("userDash.myCvs.pickPdf")}
              >
                PDF
              </button>
              <button
                type="button"
                onClick={() => inputWordRef.current?.click()}
                className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-[#F8FAFC] px-6 text-sm font-semibold text-[#14244B] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC]"
                aria-label={t("userDash.myCvs.pickWord")}
              >
                DOCX
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
            {uploading ? (
              <StatusNote text={t("uxWs.cvs.uploading")} className="mt-6 w-full max-w-lg text-left" />
            ) : analyzeError ? (
              <StatusNote
                tone="error"
                text={analyzeError}
                hint={t("uxWs.cvs.errorHint")}
                className="mt-6 w-full max-w-lg text-left"
              />
            ) : uploadNotice ? (
              <StatusNote
                text={uploadNotice}
                onDismiss={() => setUploadNotice(null)}
                dismissLabel={t("common.close")}
                className="mt-6 w-full max-w-lg text-left"
              />
            ) : foxDone && !trackingCvId ? (
              <StatusNote
                tone="success"
                text={t("uxWs.cvs.parsedDone")}
                hint={nextStepLink}
                onDismiss={() => setFoxDone(false)}
                dismissLabel={t("common.close")}
                className="mt-6 w-full max-w-lg text-left"
              />
            ) : null}
          </div>

          {trackingCvId ? (
            <div
              className="flex items-start gap-3 rounded-2xl border border-[#C9D7F1] bg-[#F0F4FC] px-4 py-3"
              role="status"
              aria-live="polite"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[#14244B]">
                  {t("userDash.myCvs.processingTitle")} · {t(`uxWs.cvs.phase.${trackingStep}`)}
                </p>
                <ol className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label={t("userDash.myCvs.processingTitle")}>
                  {([1, 2, 3] as const).map((n) => (
                    <li
                      key={n}
                      aria-current={n === trackingStep ? "step" : undefined}
                      className={n < trackingStep ? "font-semibold text-[#204195]" : n === trackingStep ? "font-bold text-[#14244B]" : "text-[#607096]"}
                    >
                      <span aria-hidden="true">{n < trackingStep ? "✓ " : n === trackingStep ? "● " : "○ "}</span>
                      {t(PROCESSING_STEP_KEYS[n])}
                    </li>
                  ))}
                </ol>
                <p className="mt-1.5 text-xs text-[#607096]">
                  {labelForCvStatus(t, cvProcessStatus)} {t("uxWs.cvs.processingWait")}
                </p>
                {cvStatusPayload?.status === "FAILED" && cvStatusPayload.error ? (
                  <p className="mt-1.5 text-xs text-[#C43B3B]">{resolveBackendErrorMessage(cvStatusPayload.error, t)}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <section className="rounded-2xl bg-white p-4 border border-[#DCE4F3] sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#14244B]">{t("userDash.myCvs.listTitle")}</h2>
                <p className="mt-1 text-xs text-[#607096]">
                  {apiConnected ? t("userDash.myCvs.listHintApi") : t("userDash.myCvs.listHint")}
                </p>
              </div>
              <p className="w-fit text-xs font-semibold text-[#204195]">
                {t("userDash.myCvs.listCount").replace("{count}", String(filtered.length))}
              </p>
            </div>

            {listError && (
              <div
                className="mb-4 rounded-2xl bg-[#FDF2F2] px-4 py-3 text-sm text-[#C43B3B]"
                role="alert"
              >
                {listError}
              </div>
            )}

            <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#F8FAFC] p-3 sm:p-4 xl:grid-cols-[minmax(180px,1.1fr)_minmax(220px,1.35fr)_minmax(115px,.65fr)_minmax(145px,.8fr)_minmax(125px,.7fr)]">
              <div className="col-span-2 min-w-0 xl:col-span-1">
                <label htmlFor="cv-search" className={filterLabelClass}>
                  {t("userDash.myCvs.searchLabel")}
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]"
                    aria-hidden="true"
                  />
                  <input
                    id="cv-search"
                    type="search"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder={t("userDash.myCvs.searchPlaceholder")}
                    className="h-10 w-full rounded-xl border-0 bg-white pl-9 pr-3 text-[13px] font-medium text-[#14244B] outline-none border border-[#DCE4F3] transition placeholder:text-[#607096] focus:ring-2 focus:ring-[#204195]"
                  />
                </div>
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <label htmlFor="cv-career-filter" className={filterLabelClass}>
                  {t("userDash.myCvs.filterCareerLabel")}
                </label>
                <select
                  id="cv-career-filter"
                  value={careerCode}
                  onChange={(event) => {
                    setCareerCode(event.target.value);
                    setPage(1);
                  }}
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
                  onChange={(e) => {
                    setTypeFilter(e.target.value as TypeFilter);
                    setPage(1);
                  }}
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
                  onChange={(e) => {
                    setDateFilter(e.target.value as DateFilter);
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="all">{t("userDash.myCvs.filterDateAll")}</option>
                  <option value="7d">{t("userDash.myCvs.filterDate7d")}</option>
                  <option value="30d">{t("userDash.myCvs.filterDate30d")}</option>
                  <option value="90d">{t("userDash.myCvs.filterDate90d")}</option>
                </select>
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <label htmlFor="cv-sort" className={filterLabelClass}>
                  {t("userDash.myCvs.sortLabel")}
                </label>
                <select
                  id="cv-sort"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as SortKey);
                    setPage(1);
                  }}
                  className={selectClass}
                >
                  <option value="newest">{t("userDash.myCvs.sortNewest")}</option>
                  <option value="oldest">{t("userDash.myCvs.sortOldest")}</option>
                  <option value="name">{t("userDash.myCvs.sortName")}</option>
                </select>
              </div>
            </div>

            {initialLoading ? (
              <div className="space-y-3 py-3" role="status" aria-label={t("admin.jobProfile.loading")}>
                {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-[#F0F4FC] motion-reduce:animate-none" />)}
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl bg-[#F8FAFC] px-5 py-10 text-center">
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#607096]">{t("userDash.myCvs.emptyList")}</p>
                <button
                  type="button"
                  onClick={() => inputPdfRef.current?.click()}
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
                >
                  {t("userDash.myCvs.uploadTitle")}
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl bg-[#F8FAFC] px-5 py-10 text-center">
                <p className="mt-3 max-w-sm text-sm leading-6 text-[#607096]">{t("userDash.myCvs.emptyFiltered")}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                    setDateFilter("all");
                    setCareerCode("");
                    setPage(1);
                  }}
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-white px-5 text-sm font-semibold text-[#14244B] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC]"
                >
                  {t("uxWs.cvs.clearFilters")}
                </button>
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-2xl border border-[#DCE4F3] lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                      <thead>
                      <tr className="border-b border-[#DCE4F3] bg-[#F8FAFC] text-xs font-semibold text-[#204195]">
                        <th className="px-4 py-3">{t("userDash.myCvs.colCandidate")}</th>
                        <th className="px-4 py-3">{t("userDash.myCvs.colType")}</th>
                        <th className="px-4 py-3">{t("userDash.myCvs.colStatus")}</th>
                        <th className="px-4 py-3">{t("userDash.myCvs.colUploaded")}</th>
                        <th className="w-24 px-4 py-3 text-center">{t("userDash.myCvs.colActions")}</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAEFF8] bg-white">
                      {paged.map((f) => (
                        <tr key={f.id} className="transition-colors hover:bg-[#F8FAFC]">
                          <td className="w-full max-w-0 px-4 py-4 align-middle">
                            <div className="flex items-start gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-[#14244B] [overflow-wrap:anywhere]">{displayName(f.name)}</p>
                                <p className="truncate text-xs text-[#607096]" title={f.name}>{f.name}</p>
                                <CareerClassificationSummary status={effectiveCvStatus(f) ?? undefined} parsedData={f.parsedData} compact />
                                <CvRowStatusDetail file={f} onOpenParsed={() => setParsedCv(f)} />
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 align-middle">
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
                              <span className="text-[#607096]">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 align-middle text-xs text-[#607096]">
                            {formatDate(f.uploadedAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-center align-middle">
                            {apiConnected && canRetryParse(f) ? (
                              <button
                                type="button"
                                onClick={() => void retryParse(f)}
                                disabled={reparsingId !== null}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#204195] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={t("userDash.myCvs.retryParse")}
                                title={t("userDash.myCvs.retryParse")}
                              >
                                <RotateCcw
                                  className={`size-4 ${reparsingId === f.id ? "animate-spin motion-reduce:animate-none" : ""}`}
                                  aria-hidden="true"
                                />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => confirmRemoveFile(f.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#C43B3B] transition-colors hover:bg-[#FDF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]"
                              aria-label={t("profile.removeAria")}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <ul className="space-y-3 lg:hidden">
                  {paged.map((f) => (
                    <li
                      key={f.id}
                      className="rounded-2xl bg-white p-3.5 border border-[#DCE4F3] sm:p-4"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#14244B] [overflow-wrap:anywhere]">{displayName(f.name)}</p>
                          <p className="truncate text-xs text-[#607096]" title={f.name}>{f.name}</p>
                          <CareerClassificationSummary status={effectiveCvStatus(f) ?? undefined} parsedData={f.parsedData} compact />
                          <CvRowStatusDetail file={f} onOpenParsed={() => setParsedCv(f)} />
                          {effectiveCvStatus(f) ? (
                            <div className="mt-2">
                              <span className={`${badgeClass} ${statusBadgeClass(effectiveCvStatus(f))}`}>
                                {labelForCvStatus(t, effectiveCvStatus(f))}
                              </span>
                            </div>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#607096]">
                            <span className={`${badgeClass} ${typeBadgeClass(f)}`}>
                              {typeLabel(f)}
                            </span>
                            <span>{formatDate(f.uploadedAt)}</span>
                          </div>
                        </div>
                        {apiConnected && canRetryParse(f) ? (
                          <button
                            type="button"
                            onClick={() => void retryParse(f)}
                            disabled={reparsingId !== null}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#204195] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195] disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={t("userDash.myCvs.retryParse")}
                          >
                            <RotateCcw
                              className={`size-4 ${reparsingId === f.id ? "animate-spin motion-reduce:animate-none" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => confirmRemoveFile(f.id)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#C43B3B] transition-colors hover:bg-[#FDF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204195]"
                          aria-label={t("profile.removeAria")}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <Pagination
                  page={currentPage}
                  pageSize={PAGE_SIZE}
                  total={filtered.length}
                  onPageChange={setPage}
                  className="mt-6"
                />
                {listCapped ? (
                  <p className="mt-3 text-center text-xs text-[#607096]">{fmt(t("fixApp.cvs.capped"), { n: LIST_LIMIT })}</p>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#14244B]/40" onClick={closeDeleteModal} aria-hidden="true" />
          <div
            ref={deleteDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cv-delete-title"
            tabIndex={-1}
            className="anim-pop relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_30px_60px_-30px_rgba(20,36,75,0.6)] outline-none"
          >
            <h3 id="cv-delete-title" className="text-lg font-bold text-[#14244B]">{t("fixApp.cvs.deleteTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-[#607096]">{t("fixApp.cvs.deleteBody")}</p>
            <p className="mt-3 break-all rounded-2xl bg-[#F8FAFC] px-3 py-2 text-xs text-[#607096]">{deleteTarget.name}</p>
            {deleteError ? <StatusNote tone="error" text={deleteError} className="mt-3" /> : null}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                data-autofocus
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F8FAFC] px-5 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#F0F4FC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("fixApp.common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#C43B3B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#A93232] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? t("fixApp.cvs.deleting") : t("fixApp.cvs.deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
      {parsedCv ? (
        <ParsedCvDrawer cvId={parsedCv.id} fileName={parsedCv.name} onClose={closeParsedCv} />
      ) : null}
    </main>
  );
}
