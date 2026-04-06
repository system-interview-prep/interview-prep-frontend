"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import LanguageToggleButton from "../../../components/LanguageToggleButton";
import { UserDashboardShell } from "../../../components/user-dashboard/UserDashboardShell";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { useAuthProfile } from "../../../auth/useAuthProfile";

type CvFile = {
  id: string;
  name: string;
  uploadedAt: string;
};

const STORAGE_KEY = "demo.cvFiles";

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

function extIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "picture_as_pdf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "article";
  return "description";
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<CvFile[]>([]);
  const { profile, displayName } = useAuthProfile();
  const [dragOver, setDragOver] = useState(false);
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
    function onFocus() {
      loadFiles();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
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

  const email = profile?.email?.trim() || "";
  const roleLabel = t("userDash.roleFallback");

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-surface p-6 pb-28 md:pb-12 md:p-12">
        <header className="relative mb-10 flex flex-col gap-6 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="pointer-events-none absolute -right-8 -top-12 h-64 w-64 rounded-full bg-primary/10 blur-[80px] dark:bg-primary/20" aria-hidden />
          <div className="relative z-[1]">
            <span className="mb-3 inline-block text-[10px] font-bold uppercase tracking-widest text-tertiary">
              {t("profile.eyebrow")}
            </span>
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface md:text-4xl">
              {t("profile.title")}
            </h1>
            <p className="mt-2 max-w-2xl font-body text-lg text-on-surface-variant">{t("profile.subtitle")}</p>
          </div>
          <div className="relative z-[1] flex flex-wrap items-center gap-4 sm:justify-end">
            <LanguageToggleButton />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-headline font-bold text-on-surface">{displayName || "—"}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {roleLabel}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="shrink-0 rounded-full ring-2 ring-primary/10 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                aria-label={t("interview.select.backDashboard")}
                title={t("interview.select.backDashboard")}
              >
                {profile?.picture ? (
                  <img
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                    src={profile.picture}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed font-headline text-sm font-bold text-primary">
                    {displayName ? initialsFromName(displayName) : "?"}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-12">
          <aside className="space-y-6 lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-lg shadow-primary/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10">
              <div className="bg-gradient-to-br from-primary/90 to-tertiary px-6 py-8 text-on-primary">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-5">
                  {profile?.picture ? (
                    <img
                      alt=""
                      className="h-24 w-24 rounded-2xl border-4 border-white/20 object-cover shadow-lg"
                      src={profile.picture}
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white/20 bg-white/15 font-headline text-3xl font-black text-white shadow-lg backdrop-blur-sm">
                      {displayName ? initialsFromName(displayName) : "?"}
                    </div>
                  )}
                  <div className="mt-4 min-w-0 flex-1 sm:mt-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/75">
                      {t("profile.identityTitle")}
                    </p>
                    <p className="mt-1 font-headline text-xl font-bold leading-tight text-white">
                      {displayName || "—"}
                    </p>
                    {email ? (
                      <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-white/90 sm:justify-start">
                        <span className="material-symbols-outlined text-base opacity-80">mail</span>
                        <span className="truncate">{email}</span>
                      </p>
                    ) : null}
                    <span className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>
              <p className="border-t border-outline-variant/10 p-4 text-sm leading-relaxed text-on-surface-variant">
                {t("profile.identityHint")}
              </p>
            </div>

            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
              <h3 className="mb-4 font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                {t("profile.quickLinks")}
              </h3>
              <div className="flex flex-col gap-2">
                <Link
                  href="/interview/select"
                  className="group flex items-center gap-3 rounded-xl border border-transparent bg-surface-container-lowest px-4 py-3 transition-all hover:border-primary/20 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-fixed text-primary transition-transform group-hover:scale-105">
                    <span className="material-symbols-outlined">forum</span>
                  </span>
                  <span className="font-bold text-on-surface">{t("profile.goInterview")}</span>
                  <span className="material-symbols-outlined ml-auto text-on-surface-variant transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  href="/practice"
                  className="group flex items-center gap-3 rounded-xl border border-transparent bg-surface-container-lowest px-4 py-3 transition-all hover:border-tertiary/25 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary-fixed text-tertiary transition-transform group-hover:scale-105">
                    <span className="material-symbols-outlined">quiz</span>
                  </span>
                  <span className="font-bold text-on-surface">{t("profile.goPractice")}</span>
                  <span className="material-symbols-outlined ml-auto text-on-surface-variant transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-lowest shadow-lg shadow-primary/5">
              <div className="border-b border-outline-variant/10 bg-surface-container/40 px-6 py-5 sm:px-8">
                <h2 className="font-headline text-lg font-bold text-on-surface sm:text-xl">
                  {t("profile.cvSection")}
                </h2>
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
                      ? "border-primary bg-primary/8 scale-[1.01] shadow-inner"
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
              </div>
            </div>
          </section>
        </div>
      </main>
    </UserDashboardShell>
  );
}
