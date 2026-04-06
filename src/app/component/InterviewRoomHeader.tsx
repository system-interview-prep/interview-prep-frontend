"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import { useLanguage } from "../../i18n/LanguageProvider";

export function InterviewRoomHeader() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <header className="shrink-0 bg-[#f9fafb]/95 dark:bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 px-4 py-3 sm:px-6 sm:py-3.5 z-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
          <Link
            href="/interview/select"
            className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-semibold text-primary hover:bg-primary-fixed/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="hidden sm:inline">{t("room.backModes")}</span>
          </Link>
          <div className="hidden h-6 w-px bg-outline-variant/40 sm:block" aria-hidden />
          <h1 className="font-headline min-w-0 text-base font-semibold tracking-tight text-on-surface sm:text-[17px]">
            {t("room.arenaTitle")}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggleButton />
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-3 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-semibold border border-outline-variant/40 hover:bg-surface-container-high transition-all"
          >
            {t("chatInterview.endSession")}
          </button>
        </div>
      </div>
    </header>
  );
}
