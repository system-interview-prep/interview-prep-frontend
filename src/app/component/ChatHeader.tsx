"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { createPortal } from "react-dom";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import { useLanguage } from "../../i18n/LanguageProvider";
import { closeSession } from "../../lib/aiService";

export function ChatHeader(props: { sessionId?: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isClosing, setIsClosing] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const goToResult = React.useCallback(() => {
    const query = props.sessionId
      ? `?sessionId=${encodeURIComponent(props.sessionId)}`
      : "";
    router.push(`/interview-results${query}`);
  }, [props.sessionId, router]);

  return (
    <header className="shrink-0 bg-[#f9fafb]/95 dark:bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 px-4 py-3 sm:px-6 sm:py-3.5 z-50">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <h1 className="font-headline min-w-0 text-base font-semibold tracking-tight text-on-surface sm:text-[17px]">
          {t("chat.arenaTitle")}
        </h1>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageToggleButton />
          <button
            type="button"
            disabled={isClosing}
            onClick={goToResult}
            className="px-3 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            Nộp bài
          </button>
          <button
            type="button"
            disabled={isClosing}
            onClick={() => setConfirmOpen(true)}
            className="px-3 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-semibold border border-outline-variant/40 hover:bg-surface-container-high transition-all"
          >
            {isClosing ? "Closing…" : t("chatInterview.endSession")}
          </button>
        </div>
      </div>

      {confirmOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-xl">
              <div className="mb-3">
                <div className="text-base font-semibold text-on-surface">
                  {t("chatInterview.endSession")}
                </div>
                <div className="mt-1 text-sm text-on-surface-variant">
                  Bạn có chắc muốn kết thúc phiên này và nộp bài để chấm điểm không?
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isClosing}
                  onClick={() => setConfirmOpen(false)}
                  className="px-3 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-semibold border border-outline-variant/40 hover:bg-surface-container-high transition-all"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  disabled={isClosing}
                  onClick={async () => {
                    try {
                      setIsClosing(true);
                      if (props.sessionId) {
                        await closeSession(props.sessionId);
                      }
                    } catch {
                      // ignore: user can still leave UI even if close fails
                    } finally {
                      setConfirmOpen(false);
                      goToResult();
                      setIsClosing(false);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-error text-on-error text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  Kết thúc & nộp bài
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
