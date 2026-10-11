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
}: LanguageProviderProps) {
  // Sản phẩm chỉ dùng tiếng Việt: bỏ qua initialLang/cookie cũ và không cho đổi.
  const [lang] = useState<Language>("vi");

  const setLang = () => undefined;

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

// Outside a provider (unit tests, isolated renders) fall back to the app's
// default language instead of crashing; the app always mounts the provider.
const viDictionary = getDictionary("vi");
const DEFAULT_CONTEXT: LanguageContextType = {
  lang: "vi",
  setLang: () => undefined,
  t: (key: string) => viDictionary[key] ?? key,
  language: "vi",
  setLanguage: () => undefined,
};

export function useLanguage() {
  return useContext(LanguageContext) ?? DEFAULT_CONTEXT;
}

/**
 * RootLayout hiện dùng:
 * import LanguageProvider from "@/i18n/LanguageProvider";
 */
export default LanguageProvider;