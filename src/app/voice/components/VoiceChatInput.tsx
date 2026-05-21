"use client";

import React from "react";
import { useLanguage } from "../../../i18n/LanguageProvider";

type VoiceChatInputProps = {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  /** Mic lives on the floating bar when false */
  showMicInForm?: boolean;
  onMicToggle?: () => void;
  isRecording?: boolean;
  recorderSupported?: boolean;
  interimTranscript: string;
  recognitionError: string | null;
  /** Single-line composer — less visual weight vs. floating controls */
  compact?: boolean;
};

export function VoiceChatInput({
  input,
  setInput,
  onSend,
  showMicInForm = true,
  onMicToggle,
  isRecording = false,
  recorderSupported = true,
  interimTranscript,
  recognitionError,
  compact = false,
}: VoiceChatInputProps) {
  const { t } = useLanguage();

  return (
    <footer
      className={`shrink-0 bg-transparent ${compact ? "px-0 pt-1 pb-1" : "border-t border-outline-variant/15 px-4 pt-2 pb-4 sm:px-5 sm:pb-5"}`}
    >
      <form
        className={
          compact
            ? "flex items-center gap-2 rounded-xl border border-outline-variant/20 bg-white/90 px-2 py-1.5 shadow-sm focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/15"
            : "flex flex-col gap-2 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-2 shadow-sm sm:flex-row sm:items-end sm:p-3 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/25"
        }
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t("voice.input.placeholder")}
          className={
            compact
              ? "min-w-0 flex-1 border-0 bg-transparent py-2 pl-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-0"
              : "min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-3 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:outline-none focus:ring-0 sm:text-base"
          }
          aria-label={t("voice.input.placeholder")}
        />
        <div className={`flex shrink-0 items-stretch gap-2 ${compact ? "" : "flex-wrap"}`}>
          {showMicInForm && onMicToggle ? (
            <button
              type="button"
              onClick={onMicToggle}
              disabled={!recorderSupported}
              aria-pressed={isRecording}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors sm:flex-initial ${
                isRecording
                  ? "border-error/40 bg-error-container/80 text-on-error-container"
                  : "border-outline-variant/35 bg-surface-container text-on-surface hover:bg-surface-container-high"
              } ${recorderSupported ? "" : "cursor-not-allowed opacity-45"}`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isRecording ? "animate-pulse" : ""}`}>
                mic
              </span>
              {!compact ? (
                <span className="whitespace-nowrap">
                  {isRecording ? t("voice.micListening") : t("voice.micSpeak")}
                </span>
              ) : null}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={!input.trim()}
            title={t("voice.sendPrompt")}
            aria-label={t("voice.sendPrompt")}
            className={
              compact
                ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition-colors hover:bg-primary-container disabled:pointer-events-none disabled:opacity-40"
                : "inline-flex min-w-[7rem] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary shadow-md transition-colors hover:bg-primary-container disabled:pointer-events-none disabled:opacity-40 sm:flex-initial"
            }
          >
            <span className={`material-symbols-outlined ${compact ? "text-[20px]" : "text-[22px]"}`}>send</span>
            {!compact ? <span>{t("voice.sendPrompt")}</span> : null}
          </button>
        </div>
      </form>

      {(interimTranscript || isRecording) && (
        <div
          className={
            compact
              ? "mt-2 flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/[0.05] px-2.5 py-2 text-xs text-on-surface"
              : "mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2.5 text-xs text-on-surface"
          }
        >
          <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0">graphic_eq</span>
          <span className="leading-relaxed">
            {interimTranscript ? interimTranscript : t("voice.interimListening")}
          </span>
        </div>
      )}

      {recognitionError && (
        <div
          className="mt-3 rounded-xl border border-error/30 bg-error-container/50 px-3 py-2.5 text-xs text-on-error-container"
          role="alert"
        >
          {recognitionError}
        </div>
      )}
    </footer>
  );
}
