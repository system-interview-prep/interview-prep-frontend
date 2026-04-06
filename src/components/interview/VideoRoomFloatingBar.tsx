"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageProvider";

export type VideoRoomFloatingBarProps = {
  recorderSupported: boolean;
  isRecording: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleDictation: () => void;
  onEndSession: () => void;
};

/** Mic, camera, dictate, end — shared vertical layout (icon + label) to avoid cramped text */
export function VideoRoomFloatingBar({
  recorderSupported,
  isRecording,
  onToggleMic,
  onToggleCamera,
  onToggleDictation,
  onEndSession,
}: VideoRoomFloatingBarProps) {
  const { t } = useLanguage();

  const pillPurple =
    "flex min-h-[4.5rem] w-[4.25rem] shrink-0 flex-col items-center justify-start gap-1 rounded-2xl px-1.5 pb-2 pt-2 text-white transition-transform active:scale-95 sm:min-h-[4.75rem] sm:w-[4.75rem] sm:gap-1.5 sm:px-2 sm:pb-2.5 sm:pt-2.5";

  const labelClass =
    "w-full text-center font-body text-[8px] font-semibold uppercase leading-tight tracking-wide text-white/95 sm:text-[9px]";

  return (
    <div
      className="pointer-events-auto flex w-full max-w-[min(100%,440px)] min-w-0 flex-wrap items-stretch justify-center gap-2 rounded-[2rem] border border-outline-variant/20 bg-tertiary-container/90 px-3 py-3 shadow-[0_40px_60px_rgba(25,28,30,0.08)] backdrop-blur-xl sm:flex-nowrap sm:gap-3 sm:px-5 sm:py-3.5"
      role="toolbar"
      aria-label={t("room.floatingBarAria")}
    >
      <button
        type="button"
        onClick={onToggleMic}
        title={t("voice.control.mic")}
        aria-label={t("voice.control.mic")}
        className={`${pillPurple} text-white/90 hover:bg-white/10 hover:text-white`}
      >
        <span className="material-symbols-outlined shrink-0 text-[24px] sm:text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          mic
        </span>
        <span className={labelClass}>{t("voice.control.mic")}</span>
      </button>

      <button
        type="button"
        onClick={onToggleCamera}
        title={t("room.toggleCameraAria")}
        aria-label={t("room.toggleCameraAria")}
        className={`${pillPurple} text-white/90 hover:bg-white/10 hover:text-white`}
      >
        <span className="material-symbols-outlined shrink-0 text-[24px] sm:text-[26px]">photo_camera</span>
        <span className={labelClass}>{t("room.toggleCamera")}</span>
      </button>

      <button
        type="button"
        onClick={onToggleDictation}
        disabled={!recorderSupported}
        aria-pressed={isRecording}
        title={t("room.control.dictate")}
        aria-label={t("room.control.dictate")}
        className={`${pillPurple} text-white/90 hover:text-white disabled:opacity-40 ${
          isRecording ? "bg-white/20 text-white" : "hover:bg-white/10"
        }`}
      >
        <span
          className={`material-symbols-outlined shrink-0 text-[24px] sm:text-[26px] ${isRecording ? "animate-pulse" : ""}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isRecording ? "stop_circle" : "keyboard_voice"}
        </span>
        <span className={`${labelClass} line-clamp-2`}>
          {isRecording ? t("room.dictationStop") : t("room.control.dictate")}
        </span>
      </button>

      <div className="hidden h-12 w-px shrink-0 self-center bg-white/25 sm:mx-0.5 sm:block" aria-hidden />

      <button
        type="button"
        onClick={onEndSession}
        title={t("voice.control.end")}
        aria-label={t("voice.control.end")}
        className="flex min-h-[4.5rem] w-[4.25rem] shrink-0 flex-col items-center justify-start gap-1 rounded-2xl border border-red-500/40 bg-error px-1.5 pb-2 pt-2 text-on-error shadow-md transition-all hover:scale-[1.02] hover:bg-red-600 active:scale-95 sm:min-h-[4.75rem] sm:w-[4.75rem] sm:gap-1.5 sm:px-2 sm:pb-2.5 sm:pt-2.5"
      >
        <span className="material-symbols-outlined shrink-0 text-[24px] sm:text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          call_end
        </span>
        <span className="w-full text-center font-body text-[8px] font-semibold uppercase leading-tight tracking-wide text-on-error line-clamp-2 sm:text-[9px]">
          {t("voice.control.end")}
        </span>
      </button>
    </div>
  );
}
