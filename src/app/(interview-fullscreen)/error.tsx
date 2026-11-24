"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";

/** Covers every fullscreen interview page (select, chat, practice, results). */
export default function InterviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error("Interview Fullscreen Error Boundary Caught Exception:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#F7F9FD] px-4 text-[#14244B]">
      <div className="anim-rise w-full max-w-md rounded-3xl border border-[#DCE4F3] bg-white p-8 text-center shadow-[0_28px_60px_-36px_rgba(20,36,75,0.35)]">
        <h2 className="mb-2 font-display text-2xl font-semibold text-[#14244B]">{t("room.boundary.title")}</h2>
        <p className="mb-6 text-sm leading-relaxed text-[#607096]">{t("room.boundary.body")}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
          >
            {t("room.common.retry")}
          </button>
          <Link
            href="/interview/select"
            className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] transition hover:bg-[#EEF2FD]"
          >
            {t("uxInterview.error.back")}
          </Link>
        </div>
      </div>
    </div>
  );
}
