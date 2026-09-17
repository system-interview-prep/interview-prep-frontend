"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import LanguageToggleButton from "@/components/LanguageToggleButton";
import { useLanguage } from "@/i18n/LanguageProvider";

export type InterviewCallMode = "voice" | "video";

type UnifiedInterviewRoomProps = {
  mode: InterviewCallMode;
};

const CALL_STARTED_AT_KEY = "intervia.interview.startedAt";

const AI_VIDEO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCbrvg58oKV3STUTihd2m_q5APrjWbT4eLA3nvQS5JP9f9RMzbjl1NDRCtwHLuXPVo7sHDpk8wVMT1q6M6UMAVWwDKcPo06QZCay4y2v4ryK9rlVDVrSSVt5jlHmoOZSlfPqI8zSwhijEF-fxuljINR50AFgTdi-0utPUKx0QcE77vxpbHJpFLXNDrL1gqBwLck3TuWrJwDiXa3kRZeIvmbVObGNuqkHugi7Gs0HOf9s9wBbbHY_OTHtmtQUbsGc0gHrTmYOAA5KUpU";
const CANDIDATE_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBLGDJ9Y6A9aMnB6aLya0pl-KAIJUpBIV54FqMX8T_ZVLG-DREEp1GLjmO02PHyxIty6GygF-x8imwkQisf_3rIsEjyAQBDwgff8rBREyJ_iaHWOVGEtsLx6b6zmhNYnRgwzrpejZR6f9WwTRZfG3pKTPIDkKtlt42k5X_0CKvucBlVMGE0r3V_W6enthaylXRr1XeXDlzjxDLiEtOlxJEl0dIcFP55dZtyFQWbuYuxBupF4tcjjA181FbudO5MxhmLSlW_dAav4D5G";

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function MaterialIcon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined inline-block select-none leading-none ${className}`}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export default function UnifiedInterviewRoom({ mode }: UnifiedInterviewRoomProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(mode === "video");
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    let startedAt = Number(sessionStorage.getItem(CALL_STARTED_AT_KEY));
    if (!Number.isFinite(startedAt) || startedAt <= 0) {
      startedAt = Date.now();
      sessionStorage.setItem(CALL_STARTED_AT_KEY, String(startedAt));
    }

    const updateTimer = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timerLabel = useMemo(() => formatElapsed(elapsedSeconds), [elapsedSeconds]);
  const nextMode: InterviewCallMode = mode === "video" ? "voice" : "video";

  const endInterview = () => {
    sessionStorage.removeItem(CALL_STARTED_AT_KEY);
    router.push("/interview-summary");
  };

  const switchMode = () => {
    setCameraEnabled(nextMode === "video");
    router.replace(`/interview?mode=${nextMode}`);
  };

  const dockButtonClass =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-all hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625] active:translate-y-0";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0D1733] font-body text-[#17244A]">
      <header className="relative z-50 flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 bg-[#101D42] px-3 sm:px-5 lg:px-7">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link
            href="/dashboard"
            className="shrink-0 font-headline text-xl font-black tracking-tight text-white sm:text-2xl"
          >
            INTERVIA
          </Link>
          <div className="hidden h-7 w-px bg-white/15 sm:block" aria-hidden="true" />
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white sm:px-3">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="hidden sm:inline">{t("interview.inCall.liveRecording")}</span>
            <span className="sm:hidden">REC</span>
          </div>
        </div>

        <div
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 font-metadata text-sm font-bold tabular-nums text-white sm:text-base"
          aria-label={t("interview.inCall.timer")}
        >
          <MaterialIcon name="schedule" className="hidden text-[19px] text-white/60 sm:inline-block" />
          {timerLabel}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggleButton className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625]" />
          <button
            type="button"
            onClick={endInterview}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C9362B] px-3 text-sm font-bold text-white transition-colors hover:bg-[#A92C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625] sm:px-4"
          >
            <MaterialIcon name="call_end" className="text-[20px]" />
            <span className="hidden md:inline">{t("interview.endCall")}</span>
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <main className="relative min-w-0 flex-1 overflow-hidden bg-[#0D1733] p-2 sm:p-3 lg:p-4">
          {mode === "video" ? (
            <VideoStage t={t} cameraEnabled={cameraEnabled} />
          ) : (
            <VoiceStage t={t} micEnabled={micEnabled} />
          )}
        </main>

        <TranscriptPanel
          t={t}
          open={transcriptOpen}
          onClose={() => setTranscriptOpen(false)}
        />
      </div>

      <div
        className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-[#101D42]/95 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:gap-2"
        role="toolbar"
        aria-label={t("interview.inCall.controls")}
      >
        <button
          type="button"
          onClick={() => setMicEnabled((value) => !value)}
          className={`${dockButtonClass} ${micEnabled ? "bg-white/10" : "bg-[#C9362B]"}`}
          aria-pressed={micEnabled}
          aria-label={t("interview.mic")}
          title={t("interview.mic")}
        >
          <MaterialIcon name={micEnabled ? "mic" : "mic_off"} className="text-[22px]" />
        </button>
        <button
          type="button"
          onClick={() => setCameraEnabled((value) => !value)}
          className={`${dockButtonClass} ${cameraEnabled ? "bg-white/10" : "bg-white/5 text-white/60"}`}
          aria-pressed={cameraEnabled}
          aria-label={t("interview.camera")}
          title={t("interview.camera")}
        >
          <MaterialIcon name={cameraEnabled ? "videocam" : "videocam_off"} className="text-[22px]" />
        </button>
        <button
          type="button"
          onClick={() => setTranscriptOpen((value) => !value)}
          className={`${dockButtonClass} bg-white/10 lg:hidden`}
          aria-pressed={transcriptOpen}
          aria-controls="interview-transcript-panel"
          aria-label={t("interview.transcript")}
          title={t("interview.transcript")}
        >
          <MaterialIcon name="subtitles" className="text-[22px]" />
        </button>
        <div className="mx-0.5 h-7 w-px bg-white/15" aria-hidden="true" />
        <button
          type="button"
          onClick={switchMode}
          className={`${dockButtonClass} bg-[#2E4FA3]`}
          aria-label={mode === "video" ? t("interview.inCall.switchVoice") : t("interview.inCall.switchVideo")}
          title={mode === "video" ? t("interview.inCall.switchVoice") : t("interview.inCall.switchVideo")}
        >
          <MaterialIcon name={mode === "video" ? "graphic_eq" : "video_camera_front"} className="text-[23px]" />
        </button>
        <button
          type="button"
          onClick={endInterview}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C9362B] text-white transition-all hover:-translate-y-0.5 hover:bg-[#A92C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FCB625] active:translate-y-0"
          aria-label={t("interview.endCall")}
          title={t("interview.endCall")}
        >
          <MaterialIcon name="call_end" className="text-[24px]" />
        </button>
      </div>
    </div>
  );
}

function VideoStage({
  t,
  cameraEnabled,
}: {
  t: (key: string) => string;
  cameraEnabled: boolean;
}) {
  return (
    <section className="relative h-full overflow-hidden rounded-2xl bg-[#17244A] shadow-2xl">
      <Image
        src={AI_VIDEO_IMAGE}
        alt={t("interview.aiInterviewer")}
        fill
        priority
        unoptimized
        sizes="(min-width: 1024px) calc(100vw - 400px), 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071027]/55 via-transparent to-[#071027]/20" />

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#101D42]/75 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md sm:left-6 sm:top-6">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#FCB625] motion-reduce:animate-none" />
        {t("interview.aiAnalystActive")}
      </div>

      <div className="absolute right-4 top-4 hidden w-72 rounded-xl border border-white/20 bg-white/90 p-4 shadow-xl backdrop-blur-xl sm:block sm:right-6 sm:top-6">
        <div className="flex items-center gap-2">
          <MaterialIcon name="psychology" className="text-[20px] text-[#A34A69]" />
          <p className="text-xs font-bold text-[#17244A]">{t("interview.aiRealtimeSentiment")}</p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#DCE3F1]">
          <div className="h-full w-3/4 rounded-full bg-[#A34A69]" />
        </div>
        <p className="mt-2 text-[11px] leading-4 text-[#5A6B8F]">
          {t("interview.aiRealtimeSentiment.desc")}
        </p>
      </div>

      <div className="absolute bottom-5 right-4 aspect-video w-36 overflow-hidden rounded-xl border-2 border-white/70 bg-[#101D42] shadow-2xl sm:bottom-6 sm:right-6 sm:w-56">
        {cameraEnabled ? (
          <Image
            src={CANDIDATE_IMAGE}
            alt={t("interview.candidateYou")}
            fill
            unoptimized
            sizes="(min-width: 640px) 224px, 144px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-white/70">
            <MaterialIcon name="videocam_off" className="text-3xl" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{t("interview.camera")}</span>
          </div>
        )}
        <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          {t("interview.candidateYou")}
        </span>
      </div>
    </section>
  );
}

function VoiceStage({ t, micEnabled }: { t: (key: string) => string; micEnabled: boolean }) {
  const waveform = [18, 30, 44, 26, 54, 38, 62, 46, 58, 32, 48, 24, 40, 28, 18];

  return (
    <section className="relative flex h-full items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_center,_#243D86_0%,_#131F46_48%,_#0B1430_100%)] px-4 pb-24 text-white shadow-2xl sm:px-8">
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur-md sm:left-6 sm:top-6">
        <span className="h-2 w-2 animate-pulse rounded-full bg-[#FCB625] motion-reduce:animate-none" />
        {t("interview.liveAnalysisActive")}
      </div>

      <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-10">
        <VoiceParticipant
          label={t("interview.aiInterviewer")}
          icon="psychology"
          active
          statusLabel={t("interview.inCall.aiActive")}
        />

        <div className="flex h-20 items-center justify-center gap-1" aria-label={t("voice.waveformActiveHint")}>
          {waveform.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className={`w-1 rounded-full bg-[#FCB625] ${micEnabled ? "animate-pulse motion-reduce:animate-none" : "opacity-30"}`}
              style={{ height, animationDelay: `${index * 70}ms` }}
            />
          ))}
        </div>

        <VoiceParticipant
          label={t("voice.labelCandidate")}
          icon={micEnabled ? "person" : "mic_off"}
          active={micEnabled}
          statusLabel={micEnabled ? t("interview.inCall.micActive") : t("interview.inCall.standby")}
        />
      </div>
    </section>
  );
}

function VoiceParticipant({
  label,
  icon,
  active,
  statusLabel,
}: {
  label: string;
  icon: string;
  active: boolean;
  statusLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-4 text-center">
      <div className="relative">
        {active ? (
          <span className="absolute -inset-3 animate-ping rounded-full border border-[#FCB625]/40 motion-reduce:animate-none" />
        ) : null}
        <div className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 sm:h-36 sm:w-36 ${active ? "border-[#FCB625] bg-[#FCB625]/15" : "border-white/25 bg-white/10"}`}>
          <MaterialIcon name={icon} className="text-4xl sm:text-6xl" />
        </div>
      </div>
      <div>
        <p className="truncate font-headline text-sm font-bold sm:text-lg">{label}</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/55 sm:text-[10px]">
          {statusLabel}
        </p>
      </div>
    </div>
  );
}

function TranscriptPanel({
  t,
  open,
  onClose,
}: {
  t: (key: string) => string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      id="interview-transcript-panel"
      className={`${open ? "flex" : "hidden"} absolute inset-x-3 bottom-24 top-3 z-50 min-h-0 flex-col overflow-hidden rounded-2xl border border-[#C8D2E8] bg-[#F8FAFE] shadow-2xl lg:static lg:flex lg:h-full lg:w-[400px] lg:shrink-0 lg:rounded-none lg:border-y-0 lg:border-r-0 lg:shadow-none`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[#DCE3F1] bg-white px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <h2 className="font-headline text-lg font-bold text-[#17244A]">{t("interview.liveTranscript")}</h2>
          </div>
          <p className="mt-1 text-[11px] font-medium text-[#7A87A5]">
            {t("interview.sessionIdLabel")} #INT-8829
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#5A6B8F] hover:bg-[#F0F4FC] lg:hidden"
          aria-label={t("common.close")}
        >
          <MaterialIcon name="close" className="text-[20px]" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
        <TranscriptMessage
          label={t("interview.aiInterviewer")}
          time="10:42"
          message={t("interview.inCall.aiMessage")}
          ai
        />
        <TranscriptMessage
          label={t("interview.youLabel")}
          time="10:43"
          message={t("interview.inCall.userMessage")}
        />
        <div className="flex items-center gap-2 text-[#A34A69]">
          <span className="text-[10px] font-bold uppercase tracking-wider">{t("interview.aiInterviewer")}</span>
          <span className="flex gap-1" aria-label={t("interview.transcribing")}>
            {[0, 1, 2].map((item) => (
              <span
                key={item}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#A34A69] motion-reduce:animate-none"
                style={{ animationDelay: `${item * 180}ms` }}
              />
            ))}
          </span>
        </div>
      </div>

      <div className="shrink-0 border-t border-[#DCE3F1] bg-white p-5">
        <div className="mb-2 flex items-center justify-between text-xs font-bold">
          <span className="text-[#17244A]">{t("interview.competencyMapping")}</span>
          <span className="text-[#234196]">82%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E8EDF8]">
          <div className="h-full w-[82%] rounded-full bg-[#234196]" />
        </div>
        <p className="mt-2 text-[10px] text-[#7A87A5]">
          {t("interview.confidenceScore").replace("{value}", "94%")}
        </p>
      </div>
    </aside>
  );
}

function TranscriptMessage({
  label,
  time,
  message,
  ai = false,
}: {
  label: string;
  time: string;
  message: string;
  ai?: boolean;
}) {
  return (
    <article className={`flex flex-col gap-2 ${ai ? "items-start" : "items-end"}`}>
      <div className="flex items-center gap-2 text-[10px]">
        <span className={`font-bold uppercase tracking-wider ${ai ? "text-[#A34A69]" : "text-[#234196]"}`}>{label}</span>
        <time className="text-[#8A96B1]">{time}</time>
      </div>
      <p className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${ai ? "rounded-tl-sm bg-[#FBE8EC] text-[#6E3047]" : "rounded-tr-sm bg-[#234196] text-white"}`}>
        {message}
      </p>
    </article>
  );
}
