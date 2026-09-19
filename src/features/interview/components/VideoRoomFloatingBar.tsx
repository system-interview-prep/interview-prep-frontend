"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Mic, PhoneOff } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export type VideoRoomFloatingBarProps = {
  recorderSupported: boolean;
  isRecording: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onEndSession: () => void;
};

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
  const [cameraOn, setCameraOn] = useState(true);

  const handleCameraClick = () => {
    setCameraOn((prev) => !prev);
    onToggleCamera();
  };

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

  return (
    <>
      <div
        className="pointer-events-auto inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/90 px-6 py-3 shadow-2xl backdrop-blur-lg"
        role="toolbar"
        aria-label={t("room.floatingBarAria")}
      >
        <button
          type="button"
          onClick={handleCameraClick}
          title={t("room.toggleCameraAria")}
          aria-label={t("room.toggleCameraAria")}
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
            cameraOn
              ? "bg-[#204195] text-white ring-2 ring-[#FCB625] shadow-xs"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Camera className="size-5" />
        </button>

        <button
          type="button"
          onClick={onToggleMic}
          disabled={!recorderSupported}
          aria-pressed={isRecording}
          title={isRecording ? t("room.micStopTitle") : t("room.micStartTitle")}
          aria-label={isRecording ? t("room.micStopTitle") : t("room.micStartTitle")}
          className={`flex h-11 items-center gap-2 rounded-full px-5 text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer disabled:opacity-40 ${
            isRecording
              ? "bg-[#204195] text-white shadow-[0_0_15px_rgba(252,182,37,0.4)] ring-2 ring-[#FCB625]"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Mic className={`size-4 ${isRecording ? "animate-pulse text-[#FCB625]" : ""}`} />
          <span>{isRecording ? "Đang nghe" : "Bật mic"}</span>
        </button>

        <div className="h-6 w-px shrink-0 bg-slate-200" aria-hidden />

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          title={t("voice.control.end")}
          aria-label={t("voice.control.end")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-95 transition-all cursor-pointer"
        >
          <PhoneOff className="size-5" />
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
                className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                aria-label="Close"
                onClick={() => (isClosing ? null : setConfirmOpen(false))}
              />
              <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div>
                  <h3 className="font-headline text-lg font-extrabold text-slate-900">
                    {t("chatInterview.endSession")}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {t("chatInterview.confirmEndSession") || "Bạn có chắc muốn kết thúc phiên phỏng vấn này không?"}
                  </p>
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-full px-5 py-2.5 text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                      onClick={() => setConfirmOpen(false)}
                      disabled={isClosing}
                    >
                      {t("common.cancel") || "Hủy"}
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-5 py-2.5 text-xs font-extrabold bg-red-500 text-white shadow-sm hover:bg-red-600 disabled:opacity-60 cursor-pointer"
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


