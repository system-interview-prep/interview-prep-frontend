"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNavigationLoading } from "@components/shared/NavigationLoadingProvider";
import { UserDashboardShell } from "@features/user-dashboard/components/UserDashboardShell";
import { useLanguage } from "@/i18n/LanguageProvider";
import { startInterviewSession } from "@features/interview/services/interviewSession.service";
import { MessageSquare, Mic, Video, ArrowRight } from "lucide-react";

export default function InterviewSelectPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { showNavigationLoading, hideNavigationLoading } = useNavigationLoading();

  const startMode = async (
    mode: "chat" | "voice" | "video",
    experience?: "question_practice" | "interview_chat"
  ) => {
    showNavigationLoading();
    try {
      const url = await startInterviewSession({
        mode,
        experience,
        lang: lang === "vi" ? "vi" : "en",
      });
      router.push(url);
    } catch {
      hideNavigationLoading();
    }
  };

  const goToInterviewChat = () => void startMode("chat", "interview_chat");
  const goToVoice = () => void startMode("voice");
  const goToRoom = () => void startMode("video");

  return (
    <UserDashboardShell>
      <main className="min-h-screen bg-[#F8FAFC] px-4 pb-16 pt-6 text-[#14244B] sm:px-6 md:px-8 md:py-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1440px]">
          {/* Header */}
          <header className="mb-8 border-b border-[#EAEFF8] pb-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#204195]">
                {t("interview.select.eyebrow")}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl">
                {t("interview.select.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#607096] sm:text-base">
                {t("interview.select.subtitle")}
              </p>
            </div>
          </header>

          <section className="mb-6 rounded-2xl border border-[#DCE4F3] bg-white px-5 py-4 shadow-xs sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#14244B]">Choose how you want to practise</p>
                <p className="mt-1 text-xs leading-relaxed text-[#607096]">
                  The interview plan and question set stay consistent. Only the interaction changes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-[#425477]">
                <span className="rounded-full bg-[#F0F4FC] px-2.5 py-1">Text</span>
                <span className="rounded-full bg-[#F0F4FC] px-2.5 py-1">Voice</span>
                <span className="rounded-full bg-[#F0F4FC] px-2.5 py-1">Face to face</span>
              </div>
            </div>
          </section>

          {/* Consistent Action Cards */}
          <section className="mb-8" aria-label={t("interview.select.eyebrow")}>
            <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-3 lg:gap-6">
              {/* Card 1: Interview Chat */}
              <button
                type="button"
                onClick={goToInterviewChat}
                className="group relative flex min-h-[320px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white p-7 text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#204195]/40 hover:shadow-md md:p-8 cursor-pointer"
              >
                <div>
                  {/* Top Tag */}
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      Khuyên dùng
                    </span>
                  </div>

                  {/* Icon + Title */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-[#204195] group-hover:text-white">
                      <MessageSquare className="size-5" />
                    </div>
                    <h2 className="text-xl font-bold text-[#14244B]">
                      Interview Chat
                    </h2>
                  </div>

                  <p className="mt-3.5 text-sm leading-relaxed text-[#607096]">
                    Hội thoại phỏng vấn hai chiều với AI Interviewer theo thời gian thực.
                  </p>
                </div>

                <div className="mt-8 border-t border-[#EAEFF8] pt-4">
                  <span className="flex min-h-10 items-center justify-between text-sm font-semibold text-[#204195] transition-colors group-hover:text-[#183273]">
                    <span>Bắt đầu</span>
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </button>

              {/* Card 2: Voice Interview */}
              <button
                type="button"
                onClick={goToVoice}
                className="group relative flex min-h-[320px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white p-7 text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#204195]/40 hover:shadow-md md:p-8 cursor-pointer"
              >
                <div>
                  {/* Top Tag */}
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-[#204195]">
                      Voice
                    </span>
                  </div>

                  {/* Icon + Title */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-[#204195]">
                      <Mic className="size-5" />
                    </div>
                    <h2 className="text-xl font-bold text-[#14244B] transition-colors group-hover:text-[#204195]">
                      {t("userDash.mode.voice.title")}
                    </h2>
                  </div>

                  <p className="mt-3.5 text-sm leading-relaxed text-[#607096]">
                    {t("userDash.mode.voice.desc")}
                  </p>
                </div>

                <div className="mt-8 border-t border-[#EAEFF8] pt-4">
                  <span className="flex min-h-10 items-center justify-between text-sm font-semibold text-[#204195]">
                    <span>{t("userDash.mode.voice.cta")}</span>
                    <ArrowRight className="size-4.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </button>

              {/* Card 3: Video Simulation (Featured) */}
              <button
                type="button"
                onClick={goToRoom}
                className="group relative flex min-h-[320px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white p-7 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg md:p-8 cursor-pointer"
              >
                <div>
                  {/* Top Tag */}
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCB625] px-3 py-1 text-xs font-bold text-[#14244B] shadow-xs">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#14244B]" aria-hidden="true" />
                      Voice + Face to face
                    </span>
                  </div>

                  {/* Icon + Title */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700">
                      <Video className="size-5" />
                    </div>
                    <h2 className="text-xl font-bold text-[#14244B] transition-colors group-hover:text-[#204195]">
                      {t("userDash.mode.video.title")}
                    </h2>
                  </div>

                  <p className="mt-3.5 text-sm leading-relaxed text-[#607096]">
                    {t("userDash.mode.video.desc")}
                  </p>
                </div>

                <div className="mt-8 border-t border-[#DCE4F3] pt-4">
                  <span className="flex min-h-10 items-center justify-between text-sm font-bold text-[#204195]">
                    <span>{t("userDash.mode.video.cta")}</span>
                    <ArrowRight className="size-4.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* Question Practice Banner */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#DCE4F3] bg-white px-6 py-4 shadow-xs text-sm text-[#607096]">
            <span>Bạn muốn tự ôn luyện câu hỏi trắc nghiệm & tình huống theo tốc độ của mình?</span>
            <Link
              href="/practice"
              className="inline-flex items-center gap-1 font-bold text-[#204195] hover:text-[#183275] hover:underline shrink-0"
            >
              <span>Đến trang Luyện tập</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Session Logs Section */}
          <section
            className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs sm:p-8"
            aria-label={t("userDash.history.title")}
          >
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9D7F1] bg-[#F0F4FC] px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#204195]">
                SESSION LOGS
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-[#607096]">{t("userDash.history.title")}</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#204195] hover:text-[#183275] hover:underline transition-colors"
              >
                {t("common.viewAll")}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </UserDashboardShell>
  );
}
