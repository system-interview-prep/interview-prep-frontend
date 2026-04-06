"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import LanguageToggleButton from "@/components/LanguageToggleButton";
import { useLanguage } from "@/i18n/LanguageProvider";

type CvFile = {
  id: string;
  name: string;
  uploadedAt: string;
};

const STORAGE_KEY = "demo.cvFiles";

type PendingJob = { jobProfileId?: string; title?: string };

function extIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "picture_as_pdf";
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) return "article";
  return "description";
}

export default function UserMyCvsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [files, setFiles] = useState<CvFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pendingJob, setPendingJob] = useState<PendingJob | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
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
    try {
      const raw = sessionStorage.getItem("interview.pendingJob");
      if (raw) setPendingJob(JSON.parse(raw) as PendingJob);
    } catch {
      setPendingJob(null);
    }
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

  const sessionTitle = pendingJob?.title?.trim() || t("userDash.myCvs.sessionDefaultTitle");
  const sessionSubtitle = t("userDash.myCvs.sessionSubtitle");

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
        {/* Progress */}
        <div className="mb-10 flex max-w-md items-center justify-between">
          <Link
            href="/interview/select"
            className="flex flex-col items-center gap-2 text-center"
          >
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

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left */}
          <div className="space-y-6 lg:col-span-8">
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
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-outline-variant/35 hover:border-primary/50"
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

            {files.length > 0 && (
              <ul className="space-y-2 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary">{extIcon(f.name)}</span>
                    <span className="min-w-0 flex-1 truncate font-medium text-on-surface">{f.name}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-tertiary p-8 text-on-primary">
              <div className="relative z-10">
                <div className="mb-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-primary/80">auto_awesome</span>
                  <h4 className="text-lg font-bold">{t("userDash.myCvs.aiCardTitle")}</h4>
                </div>
                <p className="text-sm leading-relaxed text-on-primary/90">{t("userDash.myCvs.aiCardBody")}</p>
              </div>
              <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" aria-hidden />
              <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-sm">
              <span className="mb-4 block text-[10px] font-black uppercase tracking-widest text-primary">
                {t("userDash.myCvs.targetLabel")}
              </span>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tertiary-fixed/40">
                  <span className="material-symbols-outlined text-tertiary">code_blocks</span>
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-on-surface line-clamp-2">{sessionTitle}</h5>
                  <p className="text-xs text-on-surface-variant">{sessionSubtitle}</p>
                </div>
              </div>
              <div className="mt-6 border-t border-outline-variant/15 pt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-on-surface-variant">{t("userDash.myCvs.difficulty")}</span>
                  <span className="font-bold text-primary">{t("userDash.myCvs.difficultyValue")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">{t("userDash.myCvs.feedback")}</span>
                  <span className="font-bold text-on-surface">{t("userDash.myCvs.feedbackValue")}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6 text-white">
              <div className="mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-400">shield</span>
                <h5 className="text-sm font-bold">{t("userDash.myCvs.privacyTitle")}</h5>
              </div>
              <p className="mb-6 text-xs text-gray-400">{t("userDash.myCvs.privacyBody")}</p>
              <ul className="space-y-3">
                <li className="flex gap-3 text-xs text-gray-300">
                  <span className="material-symbols-outlined text-lg text-blue-400">check_circle</span>
                  {t("userDash.myCvs.tip1")}
                </li>
                <li className="flex gap-3 text-xs text-gray-300">
                  <span className="material-symbols-outlined text-lg text-blue-400">check_circle</span>
                  {t("userDash.myCvs.tip2")}
                </li>
                <li className="flex gap-3 text-xs text-gray-300">
                  <span className="material-symbols-outlined text-lg text-blue-400">check_circle</span>
                  {t("userDash.myCvs.tip3")}
                </li>
              </ul>
            </div>

            <div className="relative h-40 overflow-hidden rounded-2xl">
              <img
                alt=""
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHvyZ19Ph2PZS5IqQWwY_032BM0GYiJq4G2h9m9rtiuoeZGQVWCuYq568Vsrtc6cJoitvNK1yZTHnlHTqReaNPdwX18mqMpa9oVYWGs6e-41p2Q9s7aO_m5Sq5Jev9Zr6elWoN8l2mSgL0pwdm0A5EDI4fdy9AotIzTlNjmxOSNjm57YzjefdIRRYMaxH4Rtz_7nkXYVinCYVLzN-EUfgvTnwrXZhvo86y-dmcEqw6ydwuOOKBpYCyBU-Tg3Ra448uPeoYahVw4T4"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-900/85 to-transparent p-4">
                <p className="text-xs font-medium text-white">{t("userDash.myCvs.bannerCaption")}</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-outline-variant/20 pt-8 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("userDash.myCvs.footerEthics")}</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{t("userDash.myCvs.footerTerms")}</span>
          </div>
          <p className="text-xs text-on-surface-variant">{t("userDash.myCvs.footerCopy")}</p>
        </footer>
      </div>
    </main>
  );
}
