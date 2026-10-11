"use client";

import Link from "next/link";
import { FoxAvatar } from "@features/mascot/components/FoxAvatar";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#DCE4F3] bg-white p-8 text-center shadow-[0_24px_60px_-40px_rgba(20,36,75,0.35)]">
        <Link href="/" className="mx-auto mb-6 inline-flex items-center gap-2 font-display text-lg font-semibold text-[#14244B]">
          <FoxAvatar size={32} />
          Intervia
        </Link>
        <p className="text-sm font-semibold tracking-wide text-[#607096]">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-[#14244B]">{t("fixAdmin.notFound.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-[#607096]">{t("fixAdmin.notFound.body")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
          >
            {t("fixAdmin.error.toDashboard")}
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#DCE4F3] bg-white px-6 text-sm font-semibold text-[#14244B] transition hover:bg-[#F0F4FC]"
          >
            {t("fixAdmin.error.toHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
