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
  AlertCircle,
  Clock,
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
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
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

  const handleStartInterview = async (
    mode: "chat" | "voice" | "video",
    experience?: "question_practice" | "interview_chat"
  ) => {
    if (!selectedCvId || roomStarting) return;
    if (!jobProfileId?.trim()) {
      setAnalyzeError("Thiếu Job Profile để tạo bộ câu hỏi.");
      return;
    }
    setRoomStarting(true);
    setAnalyzeError(null);
    showNavigationLoading();
    try {
      try {
        sessionStorage.setItem(SELECTED_CV_SESSION_KEY, selectedCvId);
      } catch {
        /* ignore */
      }
      const targetUrl = await startInterviewSession({
        mode,
        experience,
        lang: lang === "vi" ? "vi" : "en",
        jobTitle: jobTitle.trim() || undefined,
        candidateId: selectedCvId,
        jobId: jobProfileId,
        durationMinutes,
      });
      onClose();
      router.push(targetUrl);
    } catch (err: unknown) {
      setRoomStarting(false);
      hideNavigationLoading();
      const message = err instanceof Error ? err.message : String(err);
      setAnalyzeError(message || "Không thể khởi tạo phiên phỏng vấn. Vui lòng thử lại.");
    }
  };

  const goToInterviewChat = () => void handleStartInterview("chat", "interview_chat");
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
                  <div className="max-h-56 overflow-y-auto pr-1 -mr-1">
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
                  </div>
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
              {/* 1. Chọn thời lượng phỏng vấn */}
              <div className="mb-6 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#14244B]">1. Chọn thời lượng phỏng vấn</p>
                    <p className="mt-0.5 text-xs text-[#607096]">
                      Lựa chọn gói phù hợp với quỹ thời gian và mục tiêu luyện tập của bạn
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200/50">
                    <Clock className="size-3" /> Chuẩn quốc tế
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      minutes: 15,
                      title: "Gói Nhanh",
                      badge: "15 Phút",
                      questions: "4 câu hỏi",
                      focus: "Sơ loại & phản xạ nhanh",
                      desc: "Phù hợp: Luyện nhanh giờ nghỉ trưa",
                      recommend: false,
                    },
                    {
                      minutes: 25,
                      title: "Gói Chuẩn",
                      badge: "25 Phút",
                      questions: "6 câu hỏi",
                      focus: "Đánh giá chuẩn năng lực",
                      desc: "Khuyên dùng cho hầu hết ứng viên",
                      recommend: true,
                    },
                    {
                      minutes: 45,
                      title: "Chuyên Sâu",
                      badge: "45 Phút",
                      questions: "8 câu hỏi",
                      focus: "System Design & Tình huống",
                      desc: "Phù hợp: Ứng viên Mid / Senior",
                      recommend: false,
                    },
                  ].map((pkg) => {
                    const isSelected = durationMinutes === pkg.minutes;
                    return (
                      <button
                        key={pkg.minutes}
                        type="button"
                        onClick={() => setDurationMinutes(pkg.minutes)}
                        className={`relative flex flex-col rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? "border-[#204195] bg-white ring-2 ring-[#204195] shadow-sm"
                            : "border-[#DCE4F3] bg-white hover:border-[#204195]/40 hover:bg-slate-50/70"
                        }`}
                      >
                        {pkg.recommend && (
                          <span className="absolute -top-2.5 right-3 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            ★ Khuyên dùng
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${isSelected ? "text-[#204195]" : "text-[#14244B]"}`}>
                            {pkg.title}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                              isSelected
                                ? "bg-[#204195] text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {pkg.badge}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs font-bold text-[#204195]">• {pkg.questions}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-700">{pkg.focus}</p>
                        <p className="mt-0.5 text-[10px] text-[#607096]">{pkg.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Chọn hình thức tương tác */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[#14244B]">2. Chọn hình thức tương tác</p>
                  <p className="mt-0.5 text-xs text-[#607096]">
                    Bộ câu hỏi ({durationMinutes === 15 ? "4" : durationMinutes === 25 ? "6" : "8"} câu) sẽ được tối ưu theo thời lượng bạn đã chọn.
                  </p>
                </div>
              </div>

              {analyzeError ? (
                <div
                  className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-red-900">Không thể bắt đầu phỏng vấn</p>
                    <p className="mt-1 text-xs leading-relaxed text-red-700">{analyzeError}</p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStep("cv")}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#204195] hover:underline"
                      >
                        <ArrowLeft className="size-3.5" />
                        Chọn CV khác
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    key: "interview_chat",
                    title: "Interview Chat",
                    desc: "Hội thoại phỏng vấn hai chiều với AI Interviewer theo thời gian thực.",
                    meta: "Nhắn tin tương tác",
                    badge: "Khuyên dùng",
                    Icon: MessageSquare,
                    action: goToInterviewChat,
                    disabled: false,
                    cta: "Bắt đầu",
                  },
                  {
                    key: "voice",
                    title: "Voice",
                    desc: "Trả lời bằng giọng nói và luyện nhịp phỏng vấn tự nhiên mà không cần bật camera.",
                    meta: "Cần microphone",
                    badge: null,
                    Icon: Mic,
                    action: goToVoice,
                    disabled: false,
                    cta: "Bắt đầu",
                  },
                  {
                    key: "video",
                    title: "Voice + Face to face",
                    desc: "Mô phỏng buổi phỏng vấn trực diện với giọng nói, camera và interviewer trên màn hình.",
                    meta: "Cần mic + camera",
                    badge: null,
                    Icon: Video,
                    action: goToRoom,
                    disabled: false,
                    cta: "Bắt đầu",
                  },
                ].map(({ key, title, desc, meta, badge, Icon, action, disabled, cta }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={action}
                    disabled={disabled || roomStarting}
                    className={`group flex min-h-[260px] flex-col rounded-2xl border p-5 text-left shadow-xs transition-all ${
                      disabled
                        ? "border-[#DCE4F3] bg-slate-50/70 opacity-70 cursor-not-allowed"
                        : "border-[#DCE4F3] bg-white hover:-translate-y-0.5 hover:border-[#204195]/60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#204195] disabled:cursor-wait disabled:opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform ${
                          disabled
                            ? "bg-slate-100 text-slate-500"
                            : "bg-[#F0F4FC] text-[#204195] group-hover:scale-105"
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      {badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            disabled
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                    <span className="mt-4 text-base font-bold text-[#14244B]">{title}</span>
                    <span className="mt-1.5 flex-1 text-xs leading-5 text-[#607096]">{desc}</span>
                    <span className="mt-3 inline-flex w-fit rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-semibold text-[#607096]">
                      {meta}
                    </span>
                    <span
                      className={`mt-4 flex w-full items-center justify-between border-t border-[#EAEFF8] pt-4 text-sm font-bold ${
                        disabled ? "text-[#7A89A8]" : "text-[#204195]"
                      }`}
                    >
                      <span>{roomStarting && !disabled ? "Đang chuẩn bị..." : cta}</span>
                      {!roomStarting && !disabled && (
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] px-4 py-3 text-xs text-[#607096]">
                <span>Bạn muốn tự ôn luyện câu hỏi trắc nghiệm & tình huống?</span>
                <Link
                  href="/practice"
                  onClick={onClose}
                  className="font-bold text-[#204195] hover:underline"
                >
                  Đến trang Luyện tập &rarr;
                </Link>
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
