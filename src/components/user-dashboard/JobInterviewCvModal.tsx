"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/i18n/LanguageProvider";
import { startDemoVideoInterviewRoom } from "@/utils/demoInterviewSession";
import { useNavigationLoading } from "@/components/NavigationLoadingProvider";
import { useCvProcessingStatus } from "@/hooks/useCvProcessingStatus";
import { userCvApi, type UserCvDto } from "@/services/userCvApi";
import type { CvProcessingStatus } from "@/types/cvProcessing";
import { createSession, generateInterviewQuestions } from "@/lib/aiService";
import { resolveBackendErrorMessage } from "@/utils/backendError";

type CvFile = {
  id: string;
  name: string;
  uploadedAt: string;
  contentType?: string;
  status?: CvProcessingStatus;
  error?: string;
  score?: number;
};

const STORAGE_KEY = "demo.cvFiles";
const SELECTED_CV_SESSION_KEY = "interview.selectedCvId";
const STALE_PROCESSING_MS = 10 * 60 * 1000;

function fileKind(name: string | undefined, mime?: string): "pdf" | "word" | "other" {
  const lower = (name ?? "").toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "word";
  const m = (mime ?? "").toLowerCase();
  if (m.includes("pdf")) return "pdf";
  if (m.includes("wordprocessingml") || m.includes("msword") || m.includes("officedocument")) return "word";
  return "other";
}

function extIcon(name: string, mime?: string) {
  const kind = fileKind(name, mime);
  if (kind === "pdf") return "picture_as_pdf";
  if (kind === "word") return "article";
  return "description";
}

function dtoToCvFile(d: UserCvDto): CvFile {
  const name = d.originalName?.trim() || "document";
  return {
    id: d.id,
    name,
    uploadedAt: d.createdAt ?? new Date().toISOString(),
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
      return "bg-emerald-100 text-emerald-700";
    case "FAILED":
      return "bg-error-container text-error";
    case "AI_PROCESSING":
      return "bg-amber-100 text-amber-700";
    case "PARSING":
      return "bg-sky-100 text-sky-700";
    case "PENDING":
    default:
      return "bg-surface-container-high text-on-surface-variant";
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

function isSelectableCvFile(file: CvFile) {
  return effectiveCvStatus(file) !== "FAILED";
}

function pickSelectableCvId(items: CvFile[], preferred: string | null = null) {
  if (preferred && items.some((item) => item.id === preferred && isSelectableCvFile(item))) {
    return preferred;
  }
  return items.find(isSelectableCvFile)?.id ?? null;
}

type Step = "cv" | "mode";

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
  const [step, setStep] = useState<Step>("cv");
  const [files, setFiles] = useState<CvFile[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [roomStarting, setRoomStarting] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [trackingCvId, setTrackingCvId] = useState<string | null>(null);
  const [failedVisibleCvIds, setFailedVisibleCvIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showNavigationLoading, hideNavigationLoading } = useNavigationLoading();
  const visibleFiles = files.filter((file) => effectiveCvStatus(file) !== "FAILED" || failedVisibleCvIds.includes(file.id));

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
      const { data } = await userCvApi.list(50);
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
    onDone: finishCvTracking,
    onFailed: (p) => {
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
      setStep("cv");
      setRoomStarting(false);
      setAnalyzeError(null);
      setListError(null);
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "mode") setStep("cv");
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, onClose]);

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

  const goToChat = () => {
    void (async () => {
      if (!selectedCvId) return;
      if (!jobProfileId?.trim()) {
        setAnalyzeError("Thiếu Job Profile để tạo bộ câu hỏi.");
        return;
      }
      showNavigationLoading();
      onClose();
      const languageParam = lang === "vi" ? "Vietnamese" : "English";
      const res = await createSession({ type: "Chat", language: languageParam });
      try {
        sessionStorage.setItem("interview.preSessionId", res.sessionId);
      } catch {
        /* ignore */
      }
      await generateInterviewQuestions({
        sessionId: res.sessionId,
        candidateId: selectedCvId,
        jobId: jobProfileId,
        language: languageParam,
        totalQuestions: 20,
        force: false,
      });
      router.push("/chat");
    })();
  };

  const goToVoice = () => {
    void (async () => {
      if (!selectedCvId) return;
      if (!jobProfileId?.trim()) {
        setAnalyzeError("Thiếu Job Profile để tạo bộ câu hỏi.");
        return;
      }
      showNavigationLoading();
      onClose();
      const languageParam = lang === "vi" ? "Vietnamese" : "English";
      const res = await createSession({ type: "Voice", language: languageParam });
      try {
        sessionStorage.setItem("interview.preSessionId", res.sessionId);
      } catch {
        /* ignore */
      }
      await generateInterviewQuestions({
        sessionId: res.sessionId,
        candidateId: selectedCvId,
        jobId: jobProfileId,
        language: languageParam,
        totalQuestions: 20,
        force: false,
      });
      router.push("/voice");
    })();
  };

  const goToRoom = async () => {
    if (!selectedCvId || roomStarting) return;
    setRoomStarting(true);
    showNavigationLoading();
    try {
      try {
        sessionStorage.setItem(SELECTED_CV_SESSION_KEY, selectedCvId);
      } catch {
        /* ignore */
      }
      await startDemoVideoInterviewRoom(
        lang === "vi" ? "vi" : "en",
        jobTitle.trim() || undefined,
        { candidateId: selectedCvId, jobId: jobProfileId }
      );
    } catch {
      setRoomStarting(false);
      hideNavigationLoading();
    }
  };

  if (!mounted || !open) return null;

  const titleId = step === "cv" ? "job-cv-modal-title" : "job-cv-modal-mode-title";

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label={t("interview.cvUpload.cancel")}
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex max-h-[min(92vh,760px)] w-full flex-col overflow-hidden rounded-t-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl sm:rounded-2xl ${
          step === "mode" ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant/15 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {step === "mode" && (
              <button
                type="button"
                onClick={() => setStep("cv")}
                className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                {t("userDash.jobCvModal.backToCv")}
              </button>
            )}
            <h2
              id={titleId}
              className="font-headline text-lg font-bold text-on-surface sm:text-xl"
            >
              {step === "cv" ? t("userDash.jobCvModal.title") : t("userDash.jobCvModal.modeStepTitle")}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {step === "cv"
                ? t("interview.cvUpload.subtitle").replace("{role}", jobTitle)
                : t("userDash.jobCvModal.modeStepSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high"
            aria-label={t("interview.cvUpload.cancel")}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {step === "cv" ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">
                {t("userDash.jobCvModal.savedSection")}
              </p>
              <p className="mb-3 text-[11px] text-on-surface-variant">
                {apiConnected ? t("userDash.myCvs.listHintApi") : t("userDash.myCvs.listHint")}
              </p>
              {listError ? (
                <div
                  className="mb-3 rounded-lg border border-error/25 bg-error-container/15 px-3 py-2 text-sm text-error"
                  role="alert"
                >
                  {listError}
                </div>
              ) : null}
              {files.length === 0 ? (
                <p className="mb-4 rounded-xl border border-outline-variant/15 bg-surface-container/40 py-8 text-center text-sm text-on-surface-variant">
                  {t("userDash.jobCvModal.noSavedYet")}
                </p>
              ) : (
                <ul className="mb-4 space-y-2" role="radiogroup" aria-label={t("userDash.jobCvModal.savedSection")}>
                  {visibleFiles.map((f) => (
                    <li key={f.id}>
                      <label
                        className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                          effectiveCvStatus(f) === "FAILED" ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        } ${
                          selectedCvId === f.id
                            ? "border-primary bg-primary/8 shadow-sm"
                            : "border-outline-variant/15 hover:border-primary/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="job-cv-choice"
                          className="h-4 w-4 shrink-0 accent-primary"
                          checked={selectedCvId === f.id}
                          onChange={() => setSelectedCvId(f.id)}
                          disabled={!isSelectableCvFile(f)}
                        />
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            fileKind(f.name, f.contentType) === "pdf"
                              ? "bg-red-100 text-red-600"
                              : "bg-secondary-container text-primary"
                          }`}
                        >
                          <span className="material-symbols-outlined">{extIcon(f.name, f.contentType)}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate font-medium ${effectiveCvStatus(f) === "FAILED" ? "text-on-surface-variant" : "text-on-surface"}`}>
                            {f.name}
                          </span>
                          <span className="flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                            <span>
                              {new Date(f.uploadedAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}
                            </span>
                            {effectiveCvStatus(f) ? (
                              <span className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide ${statusBadgeClass(effectiveCvStatus(f))}`}>
                                {labelForCvStatus(t, effectiveCvStatus(f))}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                {t("userDash.jobCvModal.uploadSection")}
              </p>
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
                className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  dragOver ? "border-primary bg-primary/8" : "border-outline-variant/30 hover:border-primary/40"
                }`}
              >
                <span className="material-symbols-outlined mb-2 text-3xl text-primary">upload_file</span>
                <p className="text-sm text-on-surface-variant">{t("profile.dropHint")}</p>
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
                    inputRef.current?.click();
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-on-primary"
                >
                  {t("profile.upload")}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="/dashboard/cvs"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={onClose}
                >
                  {t("userDash.jobCvModal.linkMyCvs")}
                </Link>
              </div>

              {trackingCvId ? (
                <div
                  className="mt-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-on-surface"
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

              {analyzeError ? (
                <p className="mt-3 text-sm text-error" role="alert">
                  {analyzeError}
                </p>
              ) : null}

              {files.length > 0 && !selectedCvId && (
                <p className="mt-3 text-center text-sm text-error">{t("userDash.jobCvModal.needSelect")}</p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-outline-variant/15 bg-surface-container/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-outline-variant/30 px-5 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-high"
              >
                {t("interview.cvUpload.cancel")}
              </button>
              <button
                type="button"
                onClick={openAnalysisPage}
                disabled={files.length === 0 || !selectedCvId}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-on-primary shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("userDash.jobCvModal.nextChooseMode")}
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={goToChat}
                  className="group flex flex-col rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 text-left shadow-sm transition hover:border-primary/35 hover:shadow-md"
                  aria-label={t("userDash.jobCvModal.modeChatAria")}
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary transition-transform group-hover:scale-105">
                    <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                  </span>
                  <span className="font-headline text-base font-bold text-on-surface">{t("userDash.mode.chat.title")}</span>
                  <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-on-surface-variant">
                    {t("userDash.mode.chat.desc")}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
                    {t("userDash.mode.chat.cta")}
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">
                      arrow_forward
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={goToVoice}
                  className="group flex flex-col rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-5 text-left shadow-sm transition hover:border-primary/35 hover:shadow-md"
                  aria-label={t("userDash.jobCvModal.modeVoiceAria")}
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-primary transition-transform group-hover:scale-105">
                    <span className="material-symbols-outlined text-2xl">settings_voice</span>
                  </span>
                  <span className="font-headline text-base font-bold text-on-surface">{t("userDash.mode.voice.title")}</span>
                  <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-on-surface-variant">
                    {t("userDash.mode.voice.desc")}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
                    {t("userDash.mode.voice.cta")}
                    <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">
                      arrow_forward
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={goToRoom}
                  disabled={roomStarting}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br from-primary to-tertiary p-5 text-left text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
                  aria-label={t("userDash.jobCvModal.modeRoomAria")}
                >
                  <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                    {t("userDash.mode.video.badge")}
                  </span>
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-transform group-hover:scale-105">
                    <span className="material-symbols-outlined text-2xl">videocam</span>
                  </span>
                  <span className="font-headline text-base font-bold">{t("userDash.mode.video.title")}</span>
                  <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/90">
                    {t("userDash.mode.video.desc")}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-white">
                    {roomStarting ? t("admin.jobProfile.loading") : t("userDash.mode.video.cta")}
                    {!roomStarting && (
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modal, document.body)}
    </>
  );
}
