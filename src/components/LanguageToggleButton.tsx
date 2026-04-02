"use client";

import React from "react";
import { useLanguage } from "../i18n/LanguageProvider";

export default function LanguageToggleButton({
  className = "material-symbols-outlined cursor-pointer hover:bg-[#eceef0] p-1 rounded-full transition-colors",
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { lang, toggleLang } = useLanguage();

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
    <button type="button" onClick={toggleLang} className={className} aria-label="Toggle language">
      language
    </button>
  );
}

