"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import React, { useEffect, useMemo, useState } from "react";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import { useLanguage } from "../../i18n/LanguageProvider";
import { closeSession, endVideoCall } from "../../lib/aiService";

export function InterviewRoomHeader() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const sessionId = (params?.id as string) || "";

  const [mounted, setMounted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => setMounted(true), []);

  const callId = useMemo(() => {
    try {
      return sessionStorage.getItem("video.callId") || "";
    } catch {
      return "";
    }
  }, []);

  const onConfirmClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      // 1) Close InterviewSessions (status Open -> Closed)
      if (sessionId) {
        await closeSession(sessionId);
      }
      // 2) End InterviewVideoCalls (status active -> ended)
      if (callId) {
        await endVideoCall(callId);
      }
    } catch (e) {
      // Even if API fails, allow user to leave room to avoid trapping them.
      console.error("[VideoRoom] failed to close session/call", e);
    } finally {
      setIsClosing(false);
      setConfirmOpen(false);
      router.push("/dashboard");
    }
  };

  return (
    <header className="shrink-0 bg-[#f9fafb]/95 dark:bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 px-4 py-3 sm:px-6 sm:py-3.5 z-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
          <h1 className="font-headline min-w-0 text-base font-semibold tracking-tight text-on-surface sm:text-[17px]">
            {t("room.arenaTitle")}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggleButton />
        </div>
      </div>

      {mounted && confirmOpen
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
    </header>
  );
}
