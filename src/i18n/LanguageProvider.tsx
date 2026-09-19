"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { getDictionary } from "@/i18n/i18n";

export type Language = "vi" | "en";

type LanguageContextType = {
  // API chính
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;

  // Alias để tương thích code cũ
  language: Language;
  setLanguage: (lang: Language) => void;
};

const LanguageContext =
  createContext<LanguageContextType | null>(null);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLang?: Language;
}

export function LanguageProvider({
  children,
  initialLang = "vi",
}: LanguageProviderProps) {
  const [lang, setLangState] =
    useState<Language>(initialLang);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);

    // Lưu lại để server RootLayout đọc ở lần request sau
    document.cookie = [
      `lang=${nextLang}`,
      "path=/",
      "max-age=31536000",
      "samesite=lax",
    ].join("; ");

    // Đồng bộ thuộc tính <html lang="">
    document.documentElement.lang = nextLang;
  };

  const t = useMemo(() => {
    const dict = getDictionary(lang);
    return (key: string) => dict[key] ?? key;
  }, [lang]);

  const value = useMemo<LanguageContextType>(
    () => ({
      lang,
      setLang,
      t,

      // compatibility aliases
      language: lang,
      setLanguage: setLang,
    }),
    [lang, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used within LanguageProvider",
    );
  }

  return context;
}

/**
 * RootLayout hiện dùng:
 * import LanguageProvider from "@/i18n/LanguageProvider";
 */
export default LanguageProvider;