"use client";

import React from "react";
import { useLanguage } from "../../i18n/LanguageProvider";

type ChatInterviewBrandProps = {
  /** Smaller icon + type for the top bar on /chat */
  compact?: boolean;
  /** Third line under the workspace label (e.g. room hint) */
  showRoomHint?: boolean;
  /** i18n key for the third line when `showRoomHint` (default: chat room hint) */
  roomHintKey?: string;
  /** Narrow sidebar: smaller type + two-line workspace label (no clipping) */
  density?: "default" | "sidebar";
};

export function ChatInterviewBrand({
  compact = false,
  showRoomHint = false,
  roomHintKey = "chatInterview.roomHint",
  density = "default",
}: ChatInterviewBrandProps) {
  const { t, lang } = useLanguage();

  const isSidebar = density === "sidebar";

  const iconBox = compact
    ? "h-9 w-9 rounded-[10px]"
    : isSidebar
      ? "h-10 w-10 rounded-[11px]"
      : "h-11 w-11 rounded-xl";
  const iconSize = compact ? "text-[22px]" : isSidebar ? "text-[24px]" : "text-[26px]";
  const titleClass = compact
    ? "text-base sm:text-[17px] font-bold text-[#191c1e] dark:text-white leading-tight"
    : isSidebar
      ? "text-[17px] font-bold text-[#000000] dark:text-white leading-tight tracking-tight"
      : "text-xl font-bold text-[#000000] dark:text-white leading-tight tracking-tight";

  const workspaceMuted = "text-[10px] sm:text-[11px] font-medium text-[#6b7280] leading-snug";
  const workspaceLine =
    lang === "en"
      ? `${workspaceMuted} uppercase tracking-[0.14em]`
      : `${workspaceMuted} tracking-wide`;

  const workspaceBlock =
    isSidebar ? (
      <span className={`flex flex-col gap-0 ${workspaceLine}`}>
        <span className="break-words">{t("chatInterview.brandWorkspaceLine1")}</span>
        <span className="break-words">{t("chatInterview.brandWorkspaceLine2")}</span>
      </span>
    ) : (
      <span className={`${workspaceLine} break-words`}>{t("chatInterview.brandWorkspace")}</span>
    );

  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${isSidebar ? "items-start sm:items-center" : ""}`}>
      <div
        className={`flex shrink-0 items-center justify-center bg-primary text-on-primary shadow-sm ${iconBox} ${isSidebar ? "mt-0.5 sm:mt-0" : ""}`}
      >
        <span
          className={`material-symbols-outlined ${iconSize}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          psychology
        </span>
      </div>
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className={`font-headline ${titleClass}`}>{t("chatInterview.brandTitle")}</span>
        {workspaceBlock}
        {showRoomHint ? (
          <p className="mt-0.5 text-xs text-on-surface-variant leading-snug text-balance">
            {t(roomHintKey)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
