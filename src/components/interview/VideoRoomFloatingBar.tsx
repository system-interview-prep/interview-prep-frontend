"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageProvider";

export type VideoRoomFloatingBarProps = {
  recorderSupported: boolean;
  isRecording: boolean;
  onToggleCamera: () => void;
  /** Toggle continuous listening on/off. */
  onToggleMic: () => void;
  onEndSession: () => void;
};

/** Single compact row — icons only + title tooltips (minimal vertical space). */
export function VideoRoomFloatingBar({
  recorderSupported,
  isRecording,
  onToggleCamera,
  onToggleMic,
  onEndSession,
}: VideoRoomFloatingBarProps) {
  const { t } = useLanguage();

  const iconBtn =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-all active:scale-95 sm:h-10 sm:w-10";

  return (
    <div
      className="pointer-events-auto inline-flex w-auto max-w-none items-center gap-1 rounded-full border border-outline-variant/25 bg-tertiary-container/95 px-1.5 py-1 shadow-md backdrop-blur-md sm:gap-1.5 sm:px-2 sm:py-1.5"
      role="toolbar"
      aria-label={t("room.floatingBarAria")}
    >
      <button
        type="button"
        onClick={onToggleCamera}
        title={t("room.toggleCameraAria")}
        aria-label={t("room.toggleCameraAria")}
        className={`${iconBtn} hover:bg-white/15`}
      >
        <span className="material-symbols-outlined text-[20px] sm:text-[22px]">photo_camera</span>
      </button>

      <button
        type="button"
        onClick={onToggleMic}
        disabled={!recorderSupported}
        aria-pressed={isRecording}
        title={isRecording ? t("room.micStopTitle") : t("room.micStartTitle")}
        aria-label={isRecording ? t("room.micStopTitle") : t("room.micStartTitle")}
        className={`${iconBtn} hover:bg-white/15 disabled:opacity-40 ${
          isRecording ? "bg-white/25 ring-2 ring-white/40" : ""
        }`}
      >
        <span
          className={`material-symbols-outlined text-[20px] sm:text-[22px] ${isRecording ? "animate-pulse" : ""}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          mic
        </span>
      </button>

      <div className="mx-0.5 h-6 w-px shrink-0 bg-white/30" aria-hidden />

      <button
        type="button"
        onClick={onEndSession}
        title={t("voice.control.end")}
        aria-label={t("voice.control.end")}
        className={`${iconBtn} border border-red-400/50 bg-error text-on-error hover:bg-red-600 hover:ring-1 hover:ring-red-300/50`}
      >
        <span className="material-symbols-outlined text-[20px] sm:text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          call_end
        </span>
      </button>
    </div>
  );
}
