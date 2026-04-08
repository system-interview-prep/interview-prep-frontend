"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const onConfirmClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await onEndSession();
    } catch (e) {
      console.error("[VideoRoomFloatingBar] failed to end session", e);
    } finally {
      setIsClosing(false);
      setConfirmOpen(false);
    }
  };

  const iconBtn =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-all active:scale-95 sm:h-10 sm:w-10";

  return (
    <>
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
        onClick={() => setConfirmOpen(true)}
        title={t("voice.control.end")}
        aria-label={t("voice.control.end")}
        className={`${iconBtn} border border-red-400/50 bg-error text-on-error hover:bg-red-600 hover:ring-1 hover:ring-red-300/50`}
      >
        <span className="material-symbols-outlined text-[20px] sm:text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          call_end
        </span>
      </button>
    </div>

    {confirmOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              aria-label="Close"
              onClick={() => (isClosing ? null : setConfirmOpen(false))}
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-2xl">
              <div className="p-5">
                <h3 className="font-headline text-base font-bold text-on-surface">
                  {t("chatInterview.endSession")}
                </h3>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {t("chatInterview.confirmEndSession") || "Bạn có chắc muốn kết thúc phiên này không?"}
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2 text-sm font-semibold border border-outline-variant/40 bg-surface-container text-on-surface hover:bg-surface-container-high"
                    onClick={() => setConfirmOpen(false)}
                    disabled={isClosing}
                  >
                    {t("common.cancel") || "Hủy"}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2 text-sm font-semibold bg-error text-on-error shadow-sm hover:opacity-95 disabled:opacity-60"
                    onClick={onConfirmClose}
                    disabled={isClosing}
                  >
                    {isClosing ? (t("common.processing") || "Đang xử lý...") : (t("common.confirm") || "Kết thúc")}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null}
    </>
  );
}
