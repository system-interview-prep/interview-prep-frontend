"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useNavigationLoading } from "@components/shared/NavigationLoadingProvider";
import { useCvProcessingStatus } from "@features/resume/hooks/useCvProcessingStatus";
import { userCvApi, type UserCvDto } from "@features/resume/services/userCv.service";
import type { CvProcessingStatus } from "@features/resume/types";
import { resolveBackendErrorMessage } from "@/utils/backendError";
import { fmt, localeOf } from "@/i18n/format";
import {
  PROCESSING_STEP_KEYS,
  cvViewState,
  processingStep,
  type CvViewState,
} from "@features/resume/utils/cvStatus";
import StatusNote from "@components/shared/StatusNote";
import { useDialogA11y } from "@components/shared/useDialogA11y";

type CvFile = {
  id: string;
  name: string;
  uploadedAt: string;
  updatedAt?: string;
  contentType?: string;
  status?: CvProcessingStatus;
  error?: string;
  score?: number;
};

const STORAGE_KEY = "demo.cvFiles";

function fileKind(name: string | undefined, mime?: string): "pdf" | "word" | "other" {
  const lower = (name ?? "").toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "word";
  const m = (mime ?? "").toLowerCase();
  if (m.includes("pdf")) return "pdf";
  if (m.includes("wordprocessingml") || m.includes("msword") || m.includes("officedocument")) return "word";
  return "other";
}

function dtoToCvFile(d: UserCvDto): CvFile {
  const name = d.originalName?.trim() || "document";
  return {
    id: d.id,
    name,
    uploadedAt: d.createdAt ?? new Date().toISOString(),
    updatedAt: d.updatedAt || undefined,
    contentType: d.contentType?.trim() || undefined,
    status: d.status,
    error: d.error?.trim() || undefined,
    score: typeof d.score === "number" ? d.score : undefined,
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

function statusBadgeClass(status: CvProcessingStatus | null) {
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

function effectiveCvStatus(file: CvFile): CvProcessingStatus | null {
  // A slow parse is still a parse in progress; only the server declares failure.
  if (file.error && file.status !== "DONE") return "FAILED";
  return file.status ?? null;
}

function isSelectableCvFile(file: CvFile) {
  // Only parsed CVs can be matched against a JD.
  return cvViewState(file) === "ready";
}

const STATE_ORDER: Record<CvViewState, number> = { ready: 0, processing: 1, slow: 2, failed: 3 };

function pickSelectableCvId(items: CvFile[], preferred: string | null = null) {
  if (preferred && items.some((item) => item.id === preferred && isSelectableCvFile(item))) {
    return preferred;
  }
  return items.find(isSelectableCvFile)?.id ?? null;
}

type JobInterviewCvModalProps = {
  open: boolean;
  jobTitle: string;
  jobProfileId?: string;
  onClose: () => void;
};

export function JobInterviewCvModal({ open, jobTitle, jobProfileId, onClose }: JobInterviewCvModalProps) {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [files, setFiles] = useState<CvFile[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [trackingCvId, setTrackingCvId] = useState<string | null>(null);
  const [failedVisibleCvIds, setFailedVisibleCvIds] = useState<string[]>([]);
  /** The fox's line after an upload in this modal finishes parsing. */
  const [foxDone, setFoxDone] = useState(false);
  /** True while the file itself is being sent, before parsing starts. */
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showNavigationLoading } = useNavigationLoading();
  const panelRef = useDialogA11y<HTMLDivElement>(open && mounted, onClose);
  // Show every CV, usable ones first, so a failed or in-progress CV never
  // silently disappears from the list.
  const visibleFiles = [...files].sort((a, b) => STATE_ORDER[cvViewState(a)] - STATE_ORDER[cvViewState(b)]);
  const readyCount = files.filter(isSelectableCvFile).length;
  void failedVisibleCvIds;

  const loadFiles = useCallback(async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      const list = loadLocalOnly();
      setFiles(list);
      setApiConnected(false);
      setListError(null);
      setSelectedCvId((prev) => pickSelectableCvId(list, prev));
      return;
    }

    try {
      const { data } = await userCvApi.listAll();
      const list = data.items.map(dtoToCvFile);
      setFiles(list);
      syncDemoCvFiles(list);
      setApiConnected(true);
      setListError(null);
      setSelectedCvId((prev) => pickSelectableCvId(list, prev));
    } catch (e) {
      const local = loadLocalOnly();
      setFiles(local);
      setApiConnected(false);
      setSelectedCvId((prev) => pickSelectableCvId(local, prev));
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        setListError(t("userDash.myCvs.apiNeedLogin"));
      } else {
        setListError(t("userDash.myCvs.apiListError"));
      }
    }
  }, [t]);

  const finishCvTracking = useCallback(() => {
    setTrackingCvId(null);
    queueMicrotask(() => {
      void loadFiles();
    });
  }, [loadFiles]);

  const { status: cvProcessStatus, lastPayload: cvStatusPayload } = useCvProcessingStatus(trackingCvId, {
    onDone: () => {
      setFoxDone(true);
      finishCvTracking();
    },
    onFailed: (p) => {
      setFoxDone(false);
      if (p?.error) setAnalyzeError(resolveBackendErrorMessage(p.error, t));
      const failedCvId = p?.cvId || trackingCvId;
      if (failedCvId) {
        setFiles((prev) => {
          const next = prev.map((file) =>
            file.id === failedCvId ? { ...file, status: "FAILED" as CvProcessingStatus } : file
          );
          setSelectedCvId((current) => pickSelectableCvId(next, current));
          return next;
        });
        setFailedVisibleCvIds((prev) => (prev.includes(failedCvId) ? prev : [...prev, failedCvId]));
      } else {
        setFailedVisibleCvIds((prev) => prev);
      }
      finishCvTracking();
    },
  });

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => setFailedVisibleCvIds([]));
      return;
    }
    queueMicrotask(() => {
      setAnalyzeError(null);
      setListError(null);
      setFoxDone(false);
      void loadFiles();
    });
    try {
      const title = jobTitle.trim();
      if (!title) return;
      sessionStorage.setItem(
        "interview.pendingJob",
        JSON.stringify(jobProfileId ? { jobProfileId, title } : { title })
      );
    } catch {
      /* ignore */
    }
  }, [open, jobTitle, jobProfileId, loadFiles]);

  const hasInFlightCv = useMemo(
    () =>
      files.some((f) => {
        const st = effectiveCvStatus(f);
        return st === "PENDING" || st === "PARSING" || st === "AI_PROCESSING";
      }),
    [files],
  );

  useEffect(() => {
    if (!open) return;
    if (!apiConnected) return;
    if (trackingCvId) return;
    if (!hasInFlightCv) return;

    const timer = window.setInterval(() => {
      void loadFiles();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [open, apiConnected, trackingCvId, hasInFlightCv, loadFiles]);

  async function addFile(f: File) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      setUploading(true);
      setAnalyzeError(null);
      setFoxDone(false);
      try {
        const { data } = await userCvApi.upload(f);
        setAnalyzeError(null);
        setFoxDone(false);
        setTrackingCvId(data.id);
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
    setSelectedCvId(entry.id);
    setAnalyzeError(null);
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list?.length) return;
    void addFile(list[0]);
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
    if (ok) void addFile(f);
    else {
      setFoxDone(false);
      setAnalyzeError(t("fixApp.cvs.unsupportedFile"));
    }
  }

  const openAnalysisPage = () => {
    if (files.length === 0 || !selectedCvId) return;
    if (!jobProfileId) {
      setAnalyzeError(t("interview.cvAnalysis.missingJob"));
      return;
    }

    const selectedCv = files.find((file) => file.id === selectedCvId) ?? null;
    if (selectedCv?.status && selectedCv.status !== "DONE") {
      setAnalyzeError(t("interview.cvAnalysis.waitForDone"));
      return;
    }

    try {
      sessionStorage.setItem(
        "interview.cvScoreContext",
        JSON.stringify({ candidateId: selectedCvId, jobId: jobProfileId, jobTitle })
      );
    } catch {
      /* ignore */
    }

    showNavigationLoading();
    router.push(
      `/interview/cv-score?candidateId=${encodeURIComponent(selectedCvId)}&jobId=${encodeURIComponent(jobProfileId)}&jobTitle=${encodeURIComponent(jobTitle)}`
    );
  };


  if (!mounted || !open) return null;

  const titleId = "job-cv-modal-title";

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-[#14244B]/50 transition-opacity" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="anim-pop relative z-10 flex max-h-[min(92vh,780px)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_70px_-30px_rgba(20,36,75,0.7)] outline-none transition-all"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#EAEFF8] bg-white px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-xl font-semibold text-[#14244B]"
            >
              {t("userDash.jobCvModal.title")}
            </h2>
            <p className="mt-1 break-words text-sm text-[#607096]">
              {t("interview.cvUpload.subtitle").replace("{role}", jobTitle)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-[#607096] transition-colors hover:bg-[#F8FAFC] hover:text-[#14244B]"
            aria-label={t("interview.cvUpload.cancel")}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <>
            <div className="flex-1 space-y-5 overflow-y-auto bg-white px-5 py-5 sm:px-6">
              <div>
                <p className="mb-1 text-sm font-semibold text-[#204195]">
                  {t("userDash.jobCvModal.savedSection")}
                </p>
                <p className="mb-3 text-xs text-[#607096]">
                  {apiConnected ? t("userDash.myCvs.listHintApi") : t("userDash.myCvs.listHint")}
                </p>
                {listError ? (
                  <div
                    className="mb-3 rounded-2xl bg-[#FDF2F2] px-3.5 py-2.5 text-sm text-[#C43B3B]"
                    role="alert"
                  >
                    {listError}
                  </div>
                ) : null}
                {files.length === 0 ? (
                  <div className="flex flex-col items-center rounded-2xl bg-[#F8FAFC] px-4 py-6 text-center">
                    <p className="mt-2 text-sm text-[#607096]">{t("userDash.jobCvModal.noSavedYet")}</p>
                  </div>
                ) : (
                  <>
                  {readyCount === 0 ? (
                    <p className="mb-2.5 rounded-2xl bg-[#FFF8E6] px-3.5 py-2.5 text-xs text-[#8A5A00]" role="status">
                      {t("cvStatus.noneReady")}
                    </p>
                  ) : null}
                  <div className="max-h-56 overflow-y-auto pr-1 -mr-1">
                  <ul className="space-y-2.5" role="radiogroup" aria-label={t("userDash.jobCvModal.savedSection")}>
                    {visibleFiles.map((f) => (
                      <li key={f.id}>
                        <label
                          className={`flex items-center gap-3 rounded-2xl p-3.5 transition-colors ${
                            !isSelectableCvFile(f) ? "cursor-not-allowed bg-[#F8FAFC]" : "cursor-pointer"
                          } ${
                            selectedCvId === f.id
                              ? "bg-[#EEF2FD] ring-2 ring-[#204195]"
                              : "bg-white border border-[#DCE4F3] hover:bg-[#F8FAFC]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="job-cv-choice"
                            className="size-4 shrink-0 accent-[#204195]"
                            checked={selectedCvId === f.id}
                            onChange={() => setSelectedCvId(f.id)}
                            disabled={!isSelectableCvFile(f)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm font-semibold ${!isSelectableCvFile(f) ? "text-[#607096]" : "text-[#14244B]"}`}>
                              {f.name}
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#607096]">
                              <span className="font-semibold text-[#204195]">
                                {fileKind(f.name, f.contentType) === "pdf" ? "PDF" : fileKind(f.name, f.contentType) === "word" ? "DOCX" : ""}
                              </span>
                              <span>
                                {new Date(f.uploadedAt).toLocaleString(localeOf(lang))}
                              </span>
                              {effectiveCvStatus(f) ? (
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadgeClass(effectiveCvStatus(f))}`}>
                                  {labelForCvStatus(t, effectiveCvStatus(f))}
                                </span>
                              ) : null}
                            </span>
                            {cvViewState(f) === "processing" ? (
                              <span className="mt-1 block text-xs text-[#204195]">
                                {fmt(t("cvStatus.processingHint"), {
                                  step: processingStep(f.status),
                                  name: t(PROCESSING_STEP_KEYS[processingStep(f.status)]),
                                })}
                              </span>
                            ) : cvViewState(f) === "slow" ? (
                              <span className="mt-1 block text-xs text-[#8A5A00]">{t("cvStatus.slowHint")}</span>
                            ) : cvViewState(f) === "failed" ? (
                              <span className="mt-1 block text-xs text-[#C43B3B]">
                                {f.error ? `${resolveBackendErrorMessage(f.error, t)} · ` : ""}
                                <Link href="/dashboard/cvs" onClick={onClose} className="font-semibold underline">
                                  {t("cvStatus.reparseLink")}
                                </Link>
                              </span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  </div>
                  </>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[#204195]">
                  {t("userDash.jobCvModal.uploadSection")}
                </p>
                <div
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
                  className={`rounded-3xl border-2 border-dashed p-6 text-center transition-colors ${
                    dragOver ? "border-[#204195] bg-[#EEF2FD]" : "border-[#C9D7F1] bg-[#F8FAFC] hover:border-[#204195]"
                  }`}
                >
                  <p className="text-sm font-medium text-[#607096]">{t("profile.dropHint")}</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={onUpload}
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="mt-3.5 inline-flex h-10 items-center rounded-full bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
                  >
                    {t("profile.upload")}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/dashboard/cvs"
                  className="text-sm font-semibold text-[#204195] underline-offset-4 hover:underline"
                  onClick={onClose}
                >
                  {t("userDash.jobCvModal.linkMyCvs")} →
                </Link>
              </div>

              {trackingCvId ? (
                <div
                  className="flex items-center gap-3 rounded-2xl bg-[#F0F4FC]/70 p-4 text-[#14244B]"
                  role="status"
                  aria-live="polite"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#14244B]">
                      {t("userDash.myCvs.processingTitle")} · {t(`uxWs.cvs.phase.${processingStep(cvProcessStatus)}`)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#607096]">
                      {fmt(t("cvStatus.processingHint"), {
                        step: processingStep(cvProcessStatus),
                        name: t(PROCESSING_STEP_KEYS[processingStep(cvProcessStatus)]),
                      })}
                    </p>
                    {cvStatusPayload?.status === "FAILED" && cvStatusPayload.error ? (
                      <p className="mt-2 text-xs font-medium text-[#C43B3B]">{resolveBackendErrorMessage(cvStatusPayload.error, t)}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {uploading ? (
                <StatusNote text={t("uxWs.cvs.uploading")} />
              ) : analyzeError ? (
                <StatusNote tone="error" text={analyzeError} hint={t("uxWs.cvs.errorHint")} />
              ) : foxDone && !trackingCvId ? (
                <StatusNote tone="success" text={t("uxWs.jobCvModal.parsedDone")} />
              ) : null}

              {readyCount > 0 && !selectedCvId ? (
                <p className="text-center text-xs font-semibold text-[#8A5A00]">{t("userDash.jobCvModal.needSelect")}</p>
              ) : selectedCvId ? (
                <p className="text-center text-xs text-[#607096]">{t("uxWs.jobCvModal.nextHint")}</p>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2.5 border-t border-[#EAEFF8] bg-[#F8FAFC] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#14244B] border border-[#DCE4F3] transition-colors hover:bg-[#F0F4FC]"
              >
                {t("interview.cvUpload.cancel")}
              </button>
              <button
                type="button"
                onClick={openAnalysisPage}
                disabled={files.length === 0 || !selectedCvId}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{t("userDash.jobCvModal.nextChooseMode")}</span>
              </button>
            </div>
        </>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modal, document.body)}
    </>
  );
}
