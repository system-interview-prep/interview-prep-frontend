"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserDashboardHome } from "@features/user-dashboard/components/UserDashboardHome";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useLanguage } from "@/i18n/LanguageProvider";
import { startInterviewSession } from "@features/interview/services/interviewSession.service";
import { useNavigationLoading } from "@components/shared/NavigationLoadingProvider";

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { showNavigationLoading, hideNavigationLoading } = useNavigationLoading();
  const [videoError, setVideoError] = useState(false);

  const navigate = (href: string) => {
    showNavigationLoading();
    router.push(href);
  };

  const startVideo = async (jobTitle?: string) => {
    setVideoError(false);
    showNavigationLoading();
    try {
      const url = await startInterviewSession({
        mode: "video",
        lang: lang === "vi" ? "vi" : "en",
        jobTitle,
      });
      router.push(url);
    } catch {
      hideNavigationLoading();
      setVideoError(true);
    }
  };

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#F8FAFC] px-4 pb-12 pt-6 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1440px]">
          <header id="user-profile" className="mb-8 border-b border-[#EAEFF8] pb-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9D7F1] bg-white px-3.5 py-1 text-xs font-bold text-[#204195] shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FCB625]" />
                <span>{t("userDash.workspace.eyebrow")}</span>
              </div>
              <h1 className="mt-3 font-headline text-[clamp(1.85rem,2.8vw,2.5rem)] font-extrabold leading-tight tracking-[-0.03em] text-[#14244B]">
                {t("userDash.workspace.welcome")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#607096] sm:text-base">
                {t("userDash.workspace.subtitle")}
              </p>
            </div>
          </header>
          <UserDashboardHome onNavigate={navigate} onStartVideo={startVideo} videoError={videoError} onDismissVideoError={() => setVideoError(false)} />
        </div>
      </main>
    </UserDashboardShell>
  );
}
