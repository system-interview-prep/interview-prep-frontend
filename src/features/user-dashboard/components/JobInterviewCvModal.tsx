"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  X,
  FileText,
  Upload,
  Loader2,
  ArrowRight,
  MessageSquare,
  Mic,
  Video,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { startInterviewSession } from "@features/interview/services/interviewSession.service";
import { useNavigationLoading } from "@components/shared/NavigationLoadingProvider";
import { useCvProcessingStatus } from "@features/resume/hooks/useCvProcessingStatus";
import { userCvApi, type UserCvDto } from "@features/resume/services/userCv.service";
import type { CvProcessingStatus } from "@features/resume/types";
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
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "FAILED":
      return "bg-red-50 text-red-700 border border-red-200";
    case "AI_PROCESSING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "PARSING":
      return "bg-sky-50 text-sky-700 border border-sky-200";
    case "PENDING":
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
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

  const handleStartInterview = async (mode: "chat" | "voice" | "video") => {
    if (!selectedCvId || roomStarting) return;
    if (!jobProfileId?.trim()) {
      setAnalyzeError("Thiếu Job Profile để tạo bộ câu hỏi.");
      return;
    }
    setRoomStarting(true);
    showNavigationLoading();
    try {
      try {
        sessionStorage.setItem(SELECTED_CV_SESSION_KEY, selectedCvId);
      } catch {
        /* ignore */
      }
      onClose();
      const targetUrl = await startInterviewSession({
        mode,
        lang: lang === "vi" ? "vi" : "en",
        jobTitle: jobTitle.trim() || undefined,
        candidateId: selectedCvId,
        jobId: jobProfileId,
      });
      router.push(targetUrl);
    } catch {
      setRoomStarting(false);
      hideNavigationLoading();
    }
  };

  const goToChat = () => void handleStartInterview("chat");
  const goToVoice = () => void handleStartInterview("voice");
  const goToRoom = () => void handleStartInterview("video");

  if (!mounted || !open) return null;

  const titleId = step === "cv" ? "job-cv-modal-title" : "job-cv-modal-mode-title";

  const modal = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        aria-label={t("interview.cvUpload.cancel")}
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex max-h-[min(92vh,780px)] w-full flex-col overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white shadow-2xl transition-all ${
          step === "mode" ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#DCE4F3] bg-white px-6 py-5">
          <div className="min-w-0">
            {step === "mode" && (
              <button
                type="button"
                onClick={() => setStep("cv")}
                className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#204195] hover:underline"
              >
                <ArrowLeft className="size-4" />
                {t("userDash.jobCvModal.backToCv")}
              </button>
            )}
            <h2
              id={titleId}
              className="text-xl font-bold tracking-tight text-[#14244B]"
            >
              {step === "cv" ? t("userDash.jobCvModal.title") : t("userDash.jobCvModal.modeStepTitle")}
            </h2>
            <p className="mt-1 text-sm text-[#607096]">
              {step === "cv"
                ? t("interview.cvUpload.subtitle").replace("{role}", jobTitle)
                : t("userDash.jobCvModal.modeStepSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-[#607096] hover:bg-[#F8FAFC] hover:text-[#14244B] transition-colors"
            aria-label={t("interview.cvUpload.cancel")}
          >
            <X className="size-5" />
          </button>
        </div>

        {step === "cv" ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 bg-white space-y-5">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#204195]">
                  {t("userDash.jobCvModal.savedSection")}
                </p>
                <p className="mb-3 text-xs text-[#607096]">
                  {apiConnected ? t("userDash.myCvs.listHintApi") : t("userDash.myCvs.listHint")}
                </p>
                {listError ? (
                  <div
                    className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                    role="alert"
                  >
                    {listError}
                  </div>
                ) : null}
                {files.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#DCE4F3] bg-[#F8FAFC] py-8 text-center text-sm text-[#607096]">
                    {t("userDash.jobCvModal.noSavedYet")}
                  </p>
                ) : (
                  <ul className="space-y-2.5" role="radiogroup" aria-label={t("userDash.jobCvModal.savedSection")}>
                    {visibleFiles.map((f) => (
                      <li key={f.id}>
                        <label
                          className={`flex items-center gap-3.5 rounded-xl border p-3.5 transition-all ${
                            effectiveCvStatus(f) === "FAILED" ? "cursor-not-allowed opacity-60 bg-[#F8FAFC] border-slate-200" : "cursor-pointer"
                          } ${
                            selectedCvId === f.id
                              ? "border-[#204195] bg-[#204195]/5 shadow-xs ring-1 ring-[#204195]"
                              : "border-[#DCE4F3] bg-white hover:border-[#204195]/50 hover:bg-[#F8FAFC]"
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
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              fileKind(f.name, f.contentType) === "pdf"
                                ? "border border-red-200 bg-red-50 text-red-600"
                                : "border border-blue-200 bg-blue-50 text-[#204195]"
                            }`}
                          >
                            <FileText className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-sm font-semibold ${effectiveCvStatus(f) === "FAILED" ? "text-[#607096]" : "text-[#14244B]"}`}>
                              {f.name}
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#607096]">
                              <span>
                                {new Date(f.uploadedAt).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")}
                              </span>
                              {effectiveCvStatus(f) ? (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(effectiveCvStatus(f))}`}>
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
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#607096]">
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
                  className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                    dragOver ? "border-[#204195] bg-[#204195]/10 scale-[1.01]" : "border-[#DCE4F3] bg-[#F8FAFC] hover:border-[#204195] hover:bg-[#204195]/5"
                  }`}
                >
                  <Upload className="mx-auto mb-2.5 size-8 text-[#204195]" />
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
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                    className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-[#204195] hover:bg-[#183275] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
                  >
                    {t("profile.upload")}
                  </button>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/dashboard/cvs"
                  className="text-xs font-semibold text-[#204195] hover:underline"
                  onClick={onClose}
                >
                  {t("userDash.jobCvModal.linkMyCvs")}
                </Link>
              </div>

              {trackingCvId ? (
                <div
                  className="flex items-start gap-3 rounded-xl border border-[#DCE4F3] bg-[#F0F4FC] p-4 text-[#14244B]"
                  role="status"
                  aria-live="polite"
                >
                  <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-[#204195]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#14244B]">{t("userDash.myCvs.processingTitle")}</p>
                    <p className="mt-0.5 text-xs text-[#607096]">
                      {labelForCvStatus(t, cvProcessStatus)}
                    </p>
                    {cvStatusPayload?.status === "FAILED" && cvStatusPayload.error ? (
                      <p className="mt-2 text-xs font-medium text-red-600">{String(cvStatusPayload.error)}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {analyzeError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700" role="alert">
                  {analyzeError}
                </p>
              ) : null}

              {files.length > 0 && !selectedCvId && (
                <p className="text-center text-xs font-semibold text-amber-600">{t("userDash.jobCvModal.needSelect")}</p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2.5 border-t border-[#DCE4F3] bg-[#F8FAFC] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#DCE4F3] bg-white px-5 py-2.5 text-sm font-semibold text-[#14244B] hover:bg-slate-50 transition-colors shadow-2xs"
              >
                {t("interview.cvUpload.cancel")}
              </button>
              <button
                type="button"
                onClick={openAnalysisPage}
                disabled={files.length === 0 || !selectedCvId}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#204195] hover:bg-[#183275] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t("userDash.jobCvModal.nextChooseMode")}</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden bg-white">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={goToChat}
                  className="group flex flex-col rounded-2xl border border-[#DCE4F3] bg-white p-5 text-left shadow-xs transition-all hover:border-[#204195] hover:shadow-md"
                  aria-label={t("userDash.jobCvModal.modeChatAria")}
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F4FC] text-[#204195] transition-transform group-hover:scale-105">
                    <MessageSquare className="size-6" />
                  </span>
                  <span className="text-base font-bold text-[#14244B]">{t("userDash.mode.chat.title")}</span>
                  <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#607096]">
                    {t("userDash.mode.chat.desc")}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#204195]">
                    <span>{t("userDash.mode.chat.cta")}</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={goToVoice}
                  className="group flex flex-col rounded-2xl border border-[#DCE4F3] bg-white p-5 text-left shadow-xs transition-all hover:border-[#204195] hover:shadow-md"
                  aria-label={t("userDash.jobCvModal.modeVoiceAria")}
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0F4FC] text-[#204195] transition-transform group-hover:scale-105">
                    <Mic className="size-6" />
                  </span>
                  <span className="text-base font-bold text-[#14244B]">{t("userDash.mode.voice.title")}</span>
                  <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#607096]">
                    {t("userDash.mode.voice.desc")}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#204195]">
                    <span>{t("userDash.mode.voice.cta")}</span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={goToRoom}
                  disabled={roomStarting}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br from-[#204195] to-[#14244B] p-5 text-left text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
                  aria-label={t("userDash.jobCvModal.modeRoomAria")}
                >
                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {t("userDash.mode.video.badge")}
                  </span>
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs transition-transform group-hover:scale-105">
                    <Video className="size-6" />
                  </span>
                  <span className="text-base font-bold text-white">{t("userDash.mode.video.title")}</span>
                  <span className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/85">
                    {t("userDash.mode.video.desc")}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                    <span>{roomStarting ? t("admin.jobProfile.loading") : t("userDash.mode.video.cta")}</span>
                    {!roomStarting && <ArrowRight className="size-4" />}
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
