"use client";

import React, { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { VoiceWaveform } from "./VoiceWaveform";

const AI_AVATAR_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBBT1OJxkN4jhmiirUeotFmDNYxe41UMT-PY6jn6UHavh1vv-QcjG6YEKbCS0BcZy2-waToX3HVPFwhOp0QXKET8DHLvl264lcDQ-2D_DqvzrrkEcWbn8GSIPEPJZB2H8sDShYtwJQYSgLnfAr9Jh7kiZFdLJeM1lQEip5DM-UYO96_iA9ox4gY4pugfNgqfzm6uhH1NQq_u6M-OfBXibZu7ZGKRI8pXIzbmfBg6LtQvVr6xpjkGhkg3bLOfHHorkERU-JQbZltFlnZ";

/** User URL — Google CDN often blocks embedding unless Referer is stripped (see img referrerPolicy). */
const CANDIDATE_DEMO_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBZrjf3NFMaaHwd5FpSVTRCGxi2yZP5UmkvDl7xXUe6Qh3J4VRIl7nwRBVS771uilhYMUFB2DLhjAmIynR71a5D2Pc3sSSUdH6fGoh48eOEZHVsFq-rlfASpdZZ0D8yJPAIxeVkqOil4f_Lzwwn4pxxwqkj12KS6DUifzKBQvXUgQjhb69Y1YaqlNcncLoM8i-kyB7qcazAVeTixzvTUFyPJGdEIctuXZj5hdnIN2BP4yPAftHmEFUbPhwc3y2yOkg_fyWIFOeWz7zc";

const CANDIDATE_FALLBACK_AVATAR =
  "https://api.dicebear.com/7.x/personas/svg?seed=CuratorDemo&backgroundColor=eceef0&scale=88";

const AVATAR_BOX =
  "relative mx-auto aspect-square w-[9.5rem] shrink-0 sm:w-[10.5rem] md:w-[11.5rem] lg:w-[12.5rem]";

type VoiceStageProps = {
  waveformActive: boolean;
  interimTranscript?: string;
  recognitionError?: string | null;
  isRecording?: boolean;
  controls?: React.ReactNode;
  aiActive?: boolean;
  candidateActive?: boolean;
};

export function VoiceStage({
  waveformActive,
  interimTranscript = "",
  recognitionError = null,
  isRecording = false,
  controls,
  aiActive = false,
  candidateActive = false,
}: VoiceStageProps) {
  const { t } = useLanguage();
  const [candidateSrc, setCandidateSrc] = useState(CANDIDATE_DEMO_AVATAR);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col items-center bg-surface px-3 pb-6 pt-5 sm:px-8 sm:pt-8">
      <div
        className="mb-6 flex items-center gap-2 rounded-full border border-outline-variant/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant shadow-sm sm:mb-8"
        role="status"
      >
        <div className="h-2 w-2 rounded-full bg-tertiary animate-pulse" aria-hidden />
        {t("voice.liveAnalysisBadge")}
      </div>

      <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-10 md:flex-row md:gap-16 lg:gap-20">
        {/* AI interviewer — purple ring + name pill */}
        <div className="flex flex-col items-center">
          <div className={AVATAR_BOX}>
            {aiActive ? <div className="absolute inset-0 rounded-full pulse-ring" aria-hidden /> : null}
            <div
              className={`relative z-10 h-full w-full overflow-hidden rounded-full border-[5px] bg-surface-container-lowest transition-all duration-200 ${
                aiActive
                  ? "border-tertiary shadow-[0_14px_44px_-14px_rgba(86,0,190,0.45)]"
                  : "border-tertiary/55 shadow-[0_10px_30px_-14px_rgba(86,0,190,0.2)]"
              }`}
            >
              <img
                src={AI_AVATAR_IMG}
                alt={t("voice.labelAiInterviewer")}
                className="h-full w-full rounded-full object-cover object-center"
                width={192}
                height={192}
                loading="eager"
                referrerPolicy="no-referrer"
                decoding="async"
              />
            </div>
            <div className="absolute bottom-0 left-1/2 z-20 w-max max-w-[calc(100%+1rem)] -translate-x-1/2 translate-y-1/2 px-1">
              <span className="inline-block rounded-full bg-tertiary px-3.5 py-1.5 text-center font-body text-[9px] font-bold uppercase tracking-wide text-on-tertiary shadow-lg">
                {t("voice.labelAiInterviewer")}
              </span>
            </div>
          </div>
        </div>

        {/* Candidate — neutral ring + demo avatar + name pill */}
        <div className="flex flex-col items-center">
          <div className="relative mx-auto aspect-square w-[9.5rem] shrink-0 sm:w-[10.5rem] md:w-[11.5rem] lg:w-[12.5rem]">
            {candidateActive ? (
              <div className="absolute inset-0 rounded-full pulse-ring bg-secondary-container/40" aria-hidden />
            ) : null}
            <div
              className={`relative z-10 h-full w-full overflow-hidden rounded-full border-[5px] bg-surface-container-lowest transition-all duration-200 ${
                candidateActive
                  ? "border-secondary shadow-[0_12px_40px_-14px_rgba(82,95,127,0.42)]"
                  : "border-outline-variant/30 shadow-[0_10px_36px_-14px_rgba(25,28,30,0.18)]"
              }`}
            >
              <img
                src={candidateSrc}
                alt={t("voice.labelCandidate")}
                className="h-full w-full rounded-full object-cover object-center grayscale contrast-[0.95]"
                width={192}
                height={192}
                loading="eager"
                referrerPolicy="no-referrer"
                decoding="async"
                onError={() => {
                  setCandidateSrc((prev) =>
                    prev === CANDIDATE_FALLBACK_AVATAR ? prev : CANDIDATE_FALLBACK_AVATAR
                  );
                }}
              />
            </div>
            <div className="absolute bottom-0 left-1/2 z-20 w-max max-w-[calc(100%+1rem)] -translate-x-1/2 translate-y-1/2 px-1">
              <span className="inline-block rounded-full bg-surface-container-highest px-3 py-1 text-center font-body text-[9px] font-bold uppercase tracking-wide text-on-surface-variant shadow-md ring-1 ring-outline-variant/25">
                {t("voice.labelCandidate")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-lg">
        <VoiceWaveform active={waveformActive} />
        {(isRecording || interimTranscript) && (
          <p className="mt-3 line-clamp-3 text-center text-xs text-tertiary" aria-live="polite">
            {interimTranscript || t("voice.interimListening")}
          </p>
        )}
        {recognitionError && (
          <p className="mt-2 text-center text-xs text-error" role="alert">
            {recognitionError}
          </p>
        )}
      </div>

      {controls ? <div className="mt-1 sm:mt-2">{controls}</div> : null}
    </section>
  );
}
