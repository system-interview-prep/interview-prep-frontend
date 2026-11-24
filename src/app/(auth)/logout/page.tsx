"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { performClientLogout } from "@features/auth/services/auth.service";
import { useLanguage } from "@/i18n/LanguageProvider";

export { performClientLogout };

/** Only same-origin relative paths ("/x", not "//host") may follow logout. */
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/login";
  // Backslashes and control characters can be normalised by browsers into "//host".
  for (const ch of raw) {
    if (ch === "\\" || ch.charCodeAt(0) < 0x20) return "/login";
  }
  return raw;
}

function LogoutContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const nextTarget = safeNextPath(searchParams.get("next"));

  useEffect(() => {
    performClientLogout(nextTarget);
  }, [nextTarget]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FD] px-4">
      <div className="flex flex-col items-center gap-4 text-center" role="status">
        <p className="text-sm font-medium text-[#607096]">{t("auth.loggingOut") || "Đang đăng xuất..."}</p>
      </div>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F9FD]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DCE4F3] border-t-[#204195]" />
        </div>
      }
    >
      <LogoutContent />
    </Suspense>
  );
}
