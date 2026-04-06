"use client";

import React from "react";
import { useLanguage } from "../i18n/LanguageProvider";

export default function LanguageToggleButton({
  className = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container",
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { lang, toggleLang, t } = useLanguage();

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={toggleLang}
        className="rounded-lg px-4 py-2 font-bold text-on-surface-variant transition-all hover:bg-surface-variant"
      >
        {lang === "vi" ? "VI/EN" : "EN/VI"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLang}
      className={className}
      aria-label={t("chat.toggleUiLanguage")}
    >
      <span className="material-symbols-outlined text-[22px]">globe</span>
    </button>
  );
}

