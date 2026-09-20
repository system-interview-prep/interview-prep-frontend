"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { performClientLogout } from "@features/auth/services/auth.service";
import { useLanguage } from "@/i18n/LanguageProvider";

export { performClientLogout };

function LogoutContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const nextTarget = searchParams.get("next") || "/login";

  useEffect(() => {
    performClientLogout(nextTarget);
  }, [nextTarget]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#204195]" />
        <p className="text-sm font-medium text-slate-600">{t("auth.loggingOut") || "Đang đăng xuất..."}</p>
      </div>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#204195]" />
        </div>
      }
    >
      <LogoutContent />
    </Suspense>
  );
}
