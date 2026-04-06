"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getDictionary, type Lang, normalizeLang } from "./i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function setLangCookie(lang: Lang) {
  // 1 year
  document.cookie = `lang=${lang}; Path=/; SameSite=Lax; Max-Age=31536000`;
}

export default function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(() => normalizeLang(initialLang));

  const dict = useMemo(() => getDictionary(lang), [lang]);
  const dictEn = useMemo(() => getDictionary("en"), []);

  const t = useCallback(
    (key: string) => {
      const localized = dict[key];
      if (localized !== undefined && localized !== "") return localized;
      const english = dictEn[key];
      if (english !== undefined && english !== "") return english;
      return key;
    },
    [dict, dictEn],
  );

  const setLang = useCallback(
    (next: Lang) => {
      setLangCookie(next);
      setLangState(next);
      router.refresh();
    },
    [router],
  );

  const toggleLang = useCallback(() => {
    setLang(lang === "vi" ? "en" : "vi");
  }, [lang, setLang]);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

