"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error("Admin error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FAFC] px-4 py-12">
      <div role="alert" className="w-full max-w-md rounded-3xl border border-[#DCE4F3] bg-white p-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-[#14244B]">{t("fixAdmin.error.adminTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-[#607096]">{t("fixAdmin.error.adminBody")}</p>
        {error.digest ? (
          <p className="mt-2 text-xs text-[#607096]">
            {t("fixAdmin.error.code")} {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white transition hover:bg-[#183275]"
          >
            {t("fixAdmin.error.retry")}
          </button>
          <Link
            href="/admin/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#DCE4F3] bg-white px-6 text-sm font-semibold text-[#14244B] transition hover:bg-[#F0F4FC]"
          >
            {t("fixAdmin.error.toAdminHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
