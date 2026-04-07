"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageProvider";

export type VideoRoomFloatingBarProps = {
  recorderSupported: boolean;
  isRecording: boolean;
  onToggleCamera: () => void;
  onToggleDictation: () => void;
  onEndSession: () => void;
};

/** Camera, mic (speech-to-text), end — compact pills */
export function VideoRoomFloatingBar({
  recorderSupported,
  isRecording,
  onToggleCamera,
  onToggleDictation,
  onEndSession,
}: VideoRoomFloatingBarProps) {
  const { t } = useLanguage();

  const pillPurple =
    "flex min-h-[3rem] w-[3.25rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 pb-1.5 pt-1.5 text-white transition-transform active:scale-95 sm:min-h-[3.25rem] sm:w-[3.5rem] sm:gap-1 sm:rounded-2xl sm:px-1.5 sm:pb-2 sm:pt-2";

  const labelClass =
    "w-full text-center font-body text-[7px] font-semibold uppercase leading-tight tracking-wide text-white/95 sm:text-[8px]";

  return (
    <div
      className="pointer-events-auto flex w-full max-w-[min(100%,320px)] min-w-0 flex-wrap items-stretch justify-center gap-1.5 rounded-2xl border border-outline-variant/20 bg-tertiary-container/90 px-2 py-2 shadow-[0_20px_40px_rgba(25,28,30,0.1)] backdrop-blur-xl sm:flex-nowrap sm:gap-2 sm:px-3 sm:py-2"
      role="toolbar"
      aria-label={t("room.floatingBarAria")}
    >
      <button
        type="button"
        onClick={onToggleCamera}
        title={t("room.toggleCameraAria")}
        aria-label={t("room.toggleCameraAria")}
        className={`${pillPurple} text-white/90 hover:bg-white/10 hover:text-white`}
      >
        <span className="material-symbols-outlined shrink-0 text-[18px] sm:text-[20px]">photo_camera</span>
        <span className={labelClass}>{t("room.toggleCamera")}</span>
      </button>

      <button
        type="button"
        onClick={onToggleDictation}
        disabled={!recorderSupported}
        aria-pressed={isRecording}
        title={isRecording ? t("room.dictationStop") : t("room.control.micShort")}
        aria-label={isRecording ? t("room.dictationStop") : t("room.control.micShort")}
        className={`${pillPurple} text-white/90 hover:text-white disabled:opacity-40 ${
          isRecording ? "bg-white/20 text-white" : "hover:bg-white/10"
        }`}
      >
        <span
          className={`material-symbols-outlined shrink-0 text-[18px] sm:text-[20px] ${isRecording ? "animate-pulse" : ""}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isRecording ? "stop_circle" : "mic"}
        </span>
        <span className={`${labelClass} line-clamp-2`}>
          {isRecording ? t("room.dictationStop") : t("room.control.micShort")}
        </span>
      </button>

      <div className="hidden h-8 w-px shrink-0 self-center bg-white/25 sm:mx-0.5 sm:block" aria-hidden />

      <button
        type="button"
        onClick={onEndSession}
        title={t("voice.control.end")}
        aria-label={t("voice.control.end")}
        className="flex min-h-[3rem] w-[3.25rem] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-red-500/40 bg-error px-1 pb-1.5 pt-1.5 text-on-error shadow-md transition-all hover:scale-[1.02] hover:bg-red-600 active:scale-95 sm:min-h-[3.25rem] sm:w-[3.5rem] sm:gap-1 sm:rounded-2xl sm:px-1.5 sm:pb-2 sm:pt-2"
      >
        <span className="material-symbols-outlined shrink-0 text-[18px] sm:text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          call_end
        </span>
        <span className="w-full text-center font-body text-[7px] font-semibold uppercase leading-tight tracking-wide text-on-error line-clamp-2 sm:text-[8px]">
          {t("voice.control.end")}
        </span>
      </button>
    </div>
  );
}
