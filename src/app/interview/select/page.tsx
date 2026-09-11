"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useNavigationLoading } from "../../../components/NavigationLoadingProvider";
import LanguageToggleButton from "../../../components/LanguageToggleButton";
import { UserDashboardShell } from "../../../components/user-dashboard/UserDashboardShell";
import { DemoSessionsHistory } from "../../../components/user-dashboard/DemoSessionsHistory";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { startDemoVideoInterviewRoom } from "../../../utils/demoInterviewSession";
import { useAuthProfile } from "../../../auth/useAuthProfile";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase() || "?";
}

export default function InterviewSelectPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { showNavigationLoading, hideNavigationLoading } = useNavigationLoading();
  const { profile, displayName } = useAuthProfile();
  const [avatarError, setAvatarError] = useState(false);
  const roleLabel = t("userDash.roleFallback");
  const initials = useMemo(() => (displayName ? initialsFromName(displayName) : "?"), [displayName]);

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

  return (
    <UserDashboardShell>
      <main className="paper-dots min-h-screen bg-[#FEF9EE] px-4 pb-16 pt-6 text-[#234196] sm:px-6 md:px-8 md:py-10 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1440px]">
          {/* Header */}
          <header className="mb-8 grid gap-6 border-b-2 border-[#234196] pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="max-w-2xl">
              <span className="sticker -rotate-1 bg-[#FCB625] text-[10px] text-[#234196]">
                {t("interview.select.eyebrow")}
              </span>
              <h1 className="mt-3 font-headline text-[clamp(2rem,3vw,2.75rem)] font-extrabold leading-tight tracking-tight text-[#234196]">
                {t("interview.select.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5A6B8F] sm:text-base">
                {t("interview.select.subtitle")}
              </p>
            </div>

            {/* Tối ưu cụm Profile & Header: Khối liên kết thống nhất + Nút ngôn ngữ độc lập */}
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              {/* Unified Avatar + Name + Role clickable pill */}
              <Link
                href="/dashboard"
                className="group flex min-w-0 items-center gap-3 rounded-2xl border-2 border-[#234196] bg-white p-2 pr-4 shadow-[3px_3px_0_#234196] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#234196] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                aria-label={t("interview.select.backDashboard")}
                title={t("interview.select.backDashboard")}
              >
                {profile?.picture && !avatarError ? (
                  <img
                    alt={displayName || ""}
                    className="h-11 w-11 shrink-0 rounded-xl border-2 border-[#234196] object-cover"
                    src={profile.picture}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] font-headline text-sm font-extrabold text-[#234196]">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#234196] group-hover:underline decoration-[#FCB625] decoration-2 underline-offset-2">
                    {displayName || t("userDash.profile.guest")}
                  </p>
                  <p className="font-metadata text-[9px] font-bold uppercase tracking-wider text-[#5A6B8F]">
                    {roleLabel}
                  </p>
                </div>
              </Link>

              {/* Independent Language Toggle Button with matching h-11 */}
              <LanguageToggleButton className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#234196] bg-white text-[#234196] shadow-[3px_3px_0_#234196] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#F0F4FC] hover:shadow-[4px_4px_0_#234196] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none" />
            </div>
          </header>

          {/* Chuẩn hóa 3 thẻ chế độ: Consistent Action Cards */}
          <section className="mb-12" aria-label={t("interview.select.eyebrow")}>
            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:gap-8">
              {/* Card 1: Chat Interview */}
              <button
                type="button"
                onClick={goToChat}
                className="group relative flex min-h-[320px] w-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#234196] bg-white p-7 text-left shadow-[4px_4px_0_#234196] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[6px_6px_0_#234196] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FCB625]/50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:p-8"
              >
                <div className="relative z-[1]">
                  {/* Accent Icon Box & Badge */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#F0F4FC] text-[#234196] shadow-[2px_2px_0_#234196] transition-transform duration-200 group-hover:-rotate-3">
                      <span className="material-symbols-outlined select-none text-3xl leading-none" aria-hidden="true">
                        chat_bubble
                      </span>
                    </div>
                    <span className="sticker bg-[#F0F4FC] text-[9px] font-bold text-[#234196]">
                      Quick Text
                    </span>
                  </div>

                  <h2 className="mb-3 font-headline text-2xl font-bold text-[#17244A] transition-colors group-hover:text-[#234196]">
                    {t("userDash.mode.chat.title")}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#5A6B8F]">
                    {t("userDash.mode.chat.desc")}
                  </p>
                </div>

                {/* Footer CTA luôn nằm trên cùng 1 trục ngang */}
                <div className="relative z-[1] mt-8 border-t-2 border-[#234196]/15 pt-4">
                  <span className="flex min-h-11 items-center justify-between font-headline text-sm font-bold text-[#234196]">
                    <span>{t("userDash.mode.chat.cta")}</span>
                    <span
                      className="material-symbols-outlined select-none text-[20px] leading-none transition-transform duration-300 group-hover:translate-x-1.5"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  </span>
                </div>

                {/* Background Watermark Icon */}
                <span
                  className="material-symbols-outlined pointer-events-none absolute -bottom-6 -right-4 select-none text-9xl leading-none text-[#234196] opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
                  aria-hidden="true"
                >
                  chat_bubble
                </span>
              </button>

              {/* Card 2: Voice Interview */}
              <button
                type="button"
                onClick={goToVoice}
                className="group relative flex min-h-[320px] w-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#234196] bg-white p-7 text-left shadow-[4px_4px_0_#234196] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[6px_6px_0_#234196] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FCB625]/50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:p-8"
              >
                <div className="relative z-[1]">
                  {/* Accent Icon Box & Badge */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#EEEAFE] text-[#6552C7] shadow-[2px_2px_0_#234196] transition-transform duration-200 group-hover:-rotate-3">
                      <span className="material-symbols-outlined select-none text-3xl leading-none" aria-hidden="true">
                        settings_voice
                      </span>
                    </div>
                    <span className="sticker bg-[#EEEAFE] text-[9px] font-bold text-[#6552C7]">
                      Audio AI
                    </span>
                  </div>

                  <h2 className="mb-3 font-headline text-2xl font-bold text-[#17244A] transition-colors group-hover:text-[#6552C7]">
                    {t("userDash.mode.voice.title")}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#5A6B8F]">
                    {t("userDash.mode.voice.desc")}
                  </p>
                </div>

                {/* Footer CTA luôn nằm trên cùng 1 trục ngang */}
                <div className="relative z-[1] mt-8 border-t-2 border-[#234196]/15 pt-4">
                  <span className="flex min-h-11 items-center justify-between font-headline text-sm font-bold text-[#6552C7]">
                    <span>{t("userDash.mode.voice.cta")}</span>
                    <span
                      className="material-symbols-outlined select-none text-[20px] leading-none transition-transform duration-300 group-hover:translate-x-1.5"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  </span>
                </div>

                {/* Background Watermark Icon */}
                <span
                  className="material-symbols-outlined pointer-events-none absolute -bottom-6 -right-4 select-none text-9xl leading-none text-[#6552C7] opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
                  aria-hidden="true"
                >
                  settings_voice
                </span>
              </button>

              {/* Card 3: Video Simulation */}
              <button
                type="button"
                onClick={goToRoom}
                className="group relative flex min-h-[320px] w-full flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#234196] bg-white p-7 text-left shadow-[4px_4px_0_#234196] transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[6px_6px_0_#234196] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FCB625]/50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:p-8"
              >
                <div className="relative z-[1]">
                  {/* Accent Icon Box & Badge */}
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-[#234196] bg-[#FCB625] text-[#234196] shadow-[2px_2px_0_#234196] transition-transform duration-200 group-hover:-rotate-3">
                      <span className="material-symbols-outlined select-none text-3xl leading-none" aria-hidden="true">
                        videocam
                      </span>
                    </div>
                    <span className="sticker -rotate-1 bg-[#FCB625] text-[9px] font-bold text-[#234196]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E29000] motion-reduce:animate-none" aria-hidden="true" />
                      Live Simulation
                    </span>
                  </div>

                  <h2 className="mb-3 font-headline text-2xl font-bold text-[#17244A] transition-colors group-hover:text-[#234196]">
                    {t("userDash.mode.video.title")}
                  </h2>
                  <p className="text-sm leading-relaxed text-[#5A6B8F]">
                    {t("userDash.mode.video.desc")}
                  </p>
                </div>

                {/* Footer CTA luôn nằm trên cùng 1 trục ngang */}
                <div className="relative z-[1] mt-8 border-t-2 border-[#234196]/15 pt-4">
                  <span className="flex min-h-11 items-center justify-between font-headline text-sm font-bold text-[#234196]">
                    <span>{t("userDash.mode.video.cta")}</span>
                    <span
                      className="material-symbols-outlined select-none text-[20px] leading-none transition-transform duration-300 group-hover:translate-x-1.5"
                      aria-hidden="true"
                    >
                      arrow_forward
                    </span>
                  </span>
                </div>

                {/* Background Watermark Icon */}
                <span
                  className="material-symbols-outlined pointer-events-none absolute -bottom-6 -right-4 select-none text-9xl leading-none text-[#234196] opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
                  aria-hidden="true"
                >
                  videocam
                </span>
              </button>
            </div>
          </section>

          {/* Phân tách khu vực Lịch sử (DemoSessionsHistory) */}
          <section
            className="rounded-2xl border-2 border-[#234196] bg-white p-6 sm:p-8 shadow-[4px_4px_0_#234196] [&>section]:border-t-0 [&>section]:pt-0 [&>section]:mb-0 [&>section>div:first-child]:mb-5"
            aria-label={t("userDash.history.title")}
          >
            <div className="mb-2">
              <span className="sticker -rotate-1 bg-[#FCB625] text-[10px] text-[#234196]">
                SESSION LOGS
              </span>
            </div>
            <DemoSessionsHistory variant="full" />
          </section>
        </div>
      </main>
    </UserDashboardShell>
  );
}
