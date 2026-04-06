"use client";

import React from "react";
import { useLanguage } from "../../../i18n/LanguageProvider";

type VoiceFloatingBarProps = {
  recorderSupported: boolean;
  isRecording: boolean;
  onMicToggle: () => void;
  onEndSession: () => void;
};

/** Mic + end — history lives on mobile tab bar */
export function VoiceFloatingBar({
  recorderSupported,
  isRecording,
  onMicToggle,
  onEndSession,
}: VoiceFloatingBarProps) {
  const { t } = useLanguage();

  const pill =
    "flex min-w-[3.5rem] flex-col items-center gap-1 rounded-full p-3 text-white transition-transform active:scale-95 sm:min-w-[4rem]";

  return (
    <div
      className="pointer-events-auto flex w-full max-w-[min(100%,240px)] min-w-[200px] items-center justify-around gap-4 rounded-full border border-outline-variant/20 bg-tertiary-container/85 px-6 py-3 shadow-[0_40px_60px_rgba(25,28,30,0.06)] backdrop-blur-xl sm:min-w-[220px] sm:px-8"
      role="toolbar"
      aria-label={t("voice.floatingBarAria")}
    >
      <button
        type="button"
        onClick={onMicToggle}
        disabled={!recorderSupported}
        aria-pressed={isRecording}
        title={t("voice.control.mic")}
        aria-label={t("voice.control.mic")}
        className={`${pill} text-white/80 hover:text-white hover:scale-110 disabled:opacity-40 ${
          isRecording ? "bg-white/20 text-white" : ""
        }`}
      >
        <span
          className={`material-symbols-outlined text-[26px] ${isRecording ? "animate-pulse" : ""}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          mic
        </span>
        <span className="font-body text-[10px] uppercase tracking-widest">{t("voice.control.mic")}</span>
      </button>

      <div className="mx-1 h-8 w-px shrink-0 bg-white/20 sm:mx-2" aria-hidden />

      <button
        type="button"
        onClick={onEndSession}
        title={t("voice.control.end")}
        aria-label={t("voice.control.end")}
        className="flex min-w-[3.5rem] flex-col items-center gap-1 rounded-full bg-error p-3 text-on-error shadow-md transition-all hover:scale-110 hover:bg-red-600 active:scale-95 sm:min-w-[4rem]"
      >
        <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          call_end
        </span>
        <span className="font-body text-[10px] uppercase tracking-widest">{t("voice.control.end")}</span>
      </button>
    </div>
  );
}
