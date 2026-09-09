"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import UserJobProfilesSection from "../../components/user-dashboard/UserJobProfilesSection";
import { UserDashboardShell } from "../../components/user-dashboard/UserDashboardShell";
import { useLanguage } from "../../i18n/LanguageProvider";
import { startDemoVideoInterviewRoom } from "../../utils/demoInterviewSession";
import { useAuthProfile } from "../../auth/useAuthProfile";
import { useNavigationLoading } from "../../components/NavigationLoadingProvider";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { profile, displayName } = useAuthProfile();
  const router = useRouter();
  const { showNavigationLoading, hideNavigationLoading } = useNavigationLoading();

  const goToChat = () => {
    showNavigationLoading();
    router.push("/chat");
  };

  const goToVoice = () => {
    showNavigationLoading();
    router.push("/voice");
  };

  const goToRoom = async () => {
    showNavigationLoading();
    try {
      await startDemoVideoInterviewRoom(lang === "vi" ? "vi" : "en");
    } catch {
      hideNavigationLoading();
    }
  };

  const welcomeTitle = displayName
    ? t("userDash.welcomeWithName").replace("{name}", displayName)
    : t("userDash.welcomeFallback");
  const roleLabel = t("userDash.roleFallback");

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#FAF9F5] p-6 md:p-12 md:pb-12">
        <header
          id="user-profile"
          className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-end mb-12 scroll-mt-24"
        >
          <div>
            <p className="font-metadata text-[10px] uppercase tracking-[.16em] text-[#87867F]">Your practice desk</p>
            <h2 className="mt-3 font-headline text-3xl font-medium tracking-tight text-[#141413] md:text-4xl">
              {welcomeTitle}
            </h2>
            <p className="mt-2 font-body text-lg text-[#5E5D59]">
              {t("userDash.welcomeSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 justify-between sm:justify-end">
            <LanguageToggleButton />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-headline font-bold text-on-surface">
                  {displayName || "—"}
                </p>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
                  {roleLabel}
                </p>
              </div>
              {profile?.picture ? (
                <img
                  alt=""
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10"
                  src={profile.picture}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center font-headline font-bold text-primary text-sm ring-2 ring-primary/10">
                  {displayName ? initialsFromName(displayName) : "?"}
                </div>
              )}
            </div>
          </div>
        </header>

        <UserJobProfilesSection />

        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden border border-[#E8E6DC] bg-white p-8 transition-colors hover:bg-[#FFFEFB]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center bg-[#EFF3EA] text-[#566844]">
                <span className="material-symbols-outlined text-3xl">chat_bubble</span>
              </div>
              <h3 className="mb-3 font-headline text-2xl">{t("userDash.mode.chat.title")}</h3>
              <p className="body-md mb-8 leading-relaxed text-[#5E5D59]">
                {t("userDash.mode.chat.desc")}
              </p>
              <button
                type="button"
                onClick={goToChat}
                className="group/btn inline-flex items-center gap-2 border-0 bg-transparent p-0 font-metadata text-xs uppercase tracking-wider text-[#D97757]"
              >
                {t("userDash.mode.chat.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-9xl">chat_bubble</span>
              </div>
            </div>

            <div className="group relative overflow-hidden border border-[#E8E6DC] bg-white p-8 transition-colors hover:bg-[#FFFEFB]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center bg-[#FBE8EC] text-[#A34A69]">
                <span className="material-symbols-outlined text-3xl">settings_voice</span>
              </div>
              <h3 className="mb-3 font-headline text-2xl">{t("userDash.mode.voice.title")}</h3>
              <p className="body-md mb-8 leading-relaxed text-[#5E5D59]">
                {t("userDash.mode.voice.desc")}
              </p>
              <button
                type="button"
                onClick={goToVoice}
                className="group/btn inline-flex items-center gap-2 border-0 bg-transparent p-0 font-metadata text-xs uppercase tracking-wider text-[#D97757]"
              >
                {t("userDash.mode.voice.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-9xl">settings_voice</span>
              </div>
            </div>

            <div className="group relative overflow-hidden border border-[#E8E6DC] bg-[#141413] p-8 text-white transition-colors hover:bg-[#2A2A28]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center bg-white/10 text-white">
                <span className="material-symbols-outlined text-3xl">videocam</span>
              </div>
              <h3 className="mb-3 font-headline text-2xl">{t("userDash.mode.video.title")}</h3>
              <p className="text-white/90 body-md leading-relaxed mb-8">
                {t("userDash.mode.video.desc")}
              </p>
              <button
                type="button"
                onClick={goToRoom}
                className="group/btn inline-flex items-center gap-2 font-metadata text-xs uppercase tracking-wider text-white"
              >
                {t("userDash.mode.video.cta")}
                <span className="material-symbols-outlined text-sm transition-transform group-hover/btn:translate-x-1">
                  arrow_forward
                </span>
              </button>
              <div className="absolute right-4 top-4 flex items-center gap-2 border border-white/15 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-[#D97757] animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  {t("userDash.mode.video.badge")}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-16">
          <div className="flex flex-col justify-center border border-[#E8E6DC] bg-[#F0EEE6] p-8">
            <span className="mb-4 font-metadata text-[10px] uppercase tracking-widest text-[#D97757]">
              {t("userDash.training.label")}
            </span>
            <h3 className="mb-4 font-headline text-3xl leading-tight">
              {t("userDash.training.title")}
            </h3>
            <p className="text-on-surface-variant mb-8 max-w-md">{t("userDash.training.desc")}</p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/practice"
                className="rounded-md bg-[#D97757] px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#C15F3C]"
              >
                {t("userDash.training.quiz")}
              </Link>
              <Link
                href="/resources"
                className="rounded-md border border-[#D8D5C9] bg-white px-6 py-3 text-center text-sm font-medium text-[#141413] transition-colors hover:bg-[#FAF9F5]"
              >
                {t("userDash.training.explore")}
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-8 border border-[#E8E6DC] bg-white p-8 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h4 className="font-headline font-bold text-xl mb-2">{t("userDash.progress.title")}</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tighter">
                    <span>{t("userDash.progress.bias")}</span>
                    <span>88%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "88%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-tighter">
                    <span>{t("userDash.progress.semantic")}</span>
                    <span>65%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full" style={{ width: "65%" }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden sm:block shrink-0">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  <circle
                    className="text-surface-container"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                  <circle
                    className="text-primary"
                    cx="64"
                    cy="64"
                    fill="transparent"
                    r="56"
                    stroke="currentColor"
                    strokeDasharray="351.8"
                    strokeDashoffset="88"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">75%</span>
                  <span className="text-[8px] uppercase font-bold tracking-widest text-on-surface-variant text-center">
                    {t("userDash.progress.global")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-24 w-full border-t border-[#c3c6d6]/20 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-center sm:text-left">
              <span className="font-headline font-bold text-[#191c1e] text-xl">
                {t("userDash.footer.brand")}
              </span>
              <span className="text-xs text-on-surface-variant font-inter">{t("userDash.footer.copy")}</span>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <a className="text-xs text-[#434654] font-inter hover:underline transition-colors" href="#">
                {t("userDash.footer.privacy")}
              </a>
              <a className="text-xs text-[#434654] font-inter hover:underline transition-colors" href="#">
                {t("userDash.footer.terms")}
              </a>
              <a className="text-xs text-[#434654] font-inter hover:underline transition-colors" href="#">
                {t("userDash.footer.cookies")}
              </a>
              <a className="text-xs text-[#434654] font-inter hover:underline transition-colors" href="#">
                {t("userDash.footer.security")}
              </a>
            </div>
          </div>
        </footer>
      </main>
    </UserDashboardShell>
  );
}
