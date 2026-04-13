"use client";

import React from "react";
import LanguageToggleButton from "../../components/LanguageToggleButton";
import { useLanguage } from "../../i18n/LanguageProvider";

type VoiceHeaderProps = {
  voiceEnabled: boolean;
  supportsVoice: boolean;
  onToggleVoicePlayback: () => void;
  onSubmit: () => void;
  onEndSession: () => void;
  busy?: boolean;
};

/**
 * Slim toolbar for /voice only — no duplicate branding (sidebar already shows Curator).
 */
export function VoiceHeader({
  voiceEnabled,
  supportsVoice,
  onToggleVoicePlayback,
  onSubmit,
  onEndSession,
  busy,
}: VoiceHeaderProps) {
  const { t } = useLanguage();

  const playbackLabel = !supportsVoice
    ? t("voice.voiceUnsupported")
    : voiceEnabled
      ? t("voice.voiceOn")
      : t("voice.voiceOff");

  return (
    <header className="shrink-0 border-b border-outline-variant/15 bg-surface-container-lowest z-40">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <h1 className="font-headline min-w-0 text-base font-semibold tracking-tight text-on-surface sm:text-[17px]">
          {t("voice.arenaTitle")}
        </h1>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={Boolean(busy)}
            className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Nộp bài
          </button>
          <button
            type="button"
            onClick={onEndSession}
            disabled={Boolean(busy)}
            className="rounded-xl bg-error px-3 py-2 text-sm font-semibold text-on-error transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            Kết thúc
          </button>
          <LanguageToggleButton />
          <button
            type="button"
            onClick={onToggleVoicePlayback}
            disabled={!supportsVoice}
            title={playbackLabel}
            aria-label={playbackLabel}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              !supportsVoice
                ? "border-outline-variant/25 bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed"
                : voiceEnabled
                  ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                  : "border-outline-variant/35 bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {voiceEnabled ? "volume_up" : "volume_off"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
