"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import LanguageToggleButton from "@/components/LanguageToggleButton";
import { UserDashboardShell } from "@/components/user-dashboard/UserDashboardShell";
import { useLanguage } from "@/i18n/LanguageProvider";
import { startDemoVideoInterviewRoom } from "@/utils/demoInterviewSession";

type CvFile = {
  id: string;
  name: string;
  uploadedAt: string;
};

const STORAGE_KEY = "demo.cvFiles";

function extIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "picture_as_pdf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "article";
  return "description";
}

function UploadCvContent() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const title = searchParams.get("title")?.trim() || "";
  const jobProfileId = searchParams.get("jobProfileId")?.trim() || "";

  const [files, setFiles] = useState<CvFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [continuing, setContinuing] = useState(false);
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

  useEffect(() => {
    if (title && jobProfileId) {
      try {
        sessionStorage.setItem(
          "interview.pendingJob",
          JSON.stringify({ jobProfileId, title })
        );
      } catch {
        /* ignore */
      }
    }
  }, [title, jobProfileId]);

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

  function remove(id: string) {
    persist(files.filter((x) => x.id !== id));
  }

  const handleContinue = async () => {
    if (files.length === 0 || continuing) return;
    setContinuing(true);
    try {
      await startDemoVideoInterviewRoom(lang === "vi" ? "vi" : "en", title || undefined);
    } catch {
      setContinuing(false);
    }
  };

  if (!title) {
    return (
      <UserDashboardShell>
        <main className="min-h-[50vh] bg-surface p-6 md:p-12">
          <p className="text-on-surface-variant">{t("interview.cvUpload.missingRole")}</p>
          <Link href="/dashboard" className="mt-4 inline-block font-semibold text-primary hover:underline">
            {t("interview.cvUpload.backDashboard")}
          </Link>
        </main>
      </UserDashboardShell>
    );
  }

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-surface p-6 md:p-12">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t("interview.cvUpload.backDashboard")}
            </Link>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
              {t("interview.cvUpload.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-on-surface-variant">
              {t("interview.cvUpload.subtitle").replace("{role}", title)}
            </p>
          </div>
          <LanguageToggleButton />
        </header>

        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-lg shadow-primary/5">
          <div className="border-b border-outline-variant/10 bg-surface-container/40 px-6 py-5 sm:px-8">
            <h2 className="font-headline text-lg font-bold text-on-surface sm:text-xl">{t("profile.cvSection")}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t("profile.cvHint")}</p>
            {files.length > 0 && (
              <p className="mt-2 text-xs font-semibold text-primary">
                {t("profile.filesStored").replace("{count}", String(files.length))}
              </p>
            )}
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div
              role="button"
              tabIndex={0}
              aria-label={t("profile.upload")}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("label")) return;
                inputRef.current?.click();
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
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={`group rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ${
                dragOver
                  ? "scale-[1.01] border-primary bg-primary/8 shadow-inner"
                  : "border-outline-variant/35 bg-surface-container/30 hover:border-primary/40 hover:bg-primary-fixed/20"
              }`}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed/80 text-primary transition-transform duration-200 group-hover:scale-105">
                <span className="material-symbols-outlined text-3xl">cloud_upload</span>
              </div>
              <p className="font-medium text-on-surface">{t("profile.dropHint")}</p>
              <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-3 font-headline text-sm font-bold text-on-primary shadow-md shadow-primary/25 transition-all hover:bg-primary-container active:scale-[0.98]">
                <span className="material-symbols-outlined text-lg">upload_file</span>
                {t("profile.upload")}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={onUpload}
                />
              </label>
            </div>

            <ul className="space-y-3">
              {files.length === 0 ? (
                <li className="rounded-xl border border-outline-variant/15 bg-surface-container/40 py-12 text-center text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined mb-2 block text-4xl opacity-30">folder_open</span>
                  {t("profile.noFiles")}
                </li>
              ) : (
                files.map((f) => (
                  <li
                    key={f.id}
                    className="group flex items-center gap-4 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 transition-all duration-200 hover:border-primary/15 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-primary transition-transform duration-200 group-hover:scale-105">
                      <span className="material-symbols-outlined text-2xl">{extIcon(f.name)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-headline font-bold text-on-surface">{f.name}</p>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {new Date(f.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(f.id)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-error transition-colors hover:bg-error-container/30"
                      aria-label={t("profile.removeAria")}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </li>
                ))
              )}
            </ul>

            {files.length === 0 && (
              <p className="text-center text-sm text-error">{t("interview.cvUpload.needFile")}</p>
            )}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-outline-variant/30 px-6 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-high"
              >
                {t("interview.cvUpload.cancel")}
              </Link>
              <button
                type="button"
                onClick={handleContinue}
                disabled={files.length === 0 || continuing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {continuing ? t("admin.jobProfile.loading") : t("interview.cvUpload.continue")}
                {!continuing && <span className="material-symbols-outlined text-[20px]">videocam</span>}
              </button>
            </div>
          </div>
        </div>
      </main>
    </UserDashboardShell>
  );
}

export default function InterviewUploadCvPage() {
  return (
    <Suspense
      fallback={
        <UserDashboardShell>
          <main className="min-h-[40vh] bg-surface p-12 text-center text-on-surface-variant">Loading…</main>
        </UserDashboardShell>
      }
    >
      <UploadCvContent />
    </Suspense>
  );
}
