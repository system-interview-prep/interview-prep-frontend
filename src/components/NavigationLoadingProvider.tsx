"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";

type NavigationLoadingContextValue = {
  showNavigationLoading: () => void;
  hideNavigationLoading: () => void;
};

const NavigationLoadingContext = createContext<NavigationLoadingContextValue | null>(null);

export function useNavigationLoading(): NavigationLoadingContextValue {
  const ctx = useContext(NavigationLoadingContext);
  if (!ctx) {
    throw new Error("useNavigationLoading must be used within NavigationLoadingProvider");
  }
  return ctx;
}

/** Optional: use when provider may be absent (e.g. tests). */
export function useNavigationLoadingOptional(): NavigationLoadingContextValue | null {
  return useContext(NavigationLoadingContext);
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const showNavigationLoading = useCallback(() => setVisible(true), []);
  const hideNavigationLoading = useCallback(() => setVisible(false), []);

  useEffect(() => {
    setVisible(false);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(() => setVisible(false), 15_000);
    return () => window.clearTimeout(id);
  }, [visible]);

  const value = useMemo(
    () => ({ showNavigationLoading, hideNavigationLoading }),
    [showNavigationLoading, hideNavigationLoading]
  );

  const overlay =
    mounted &&
    visible &&
    createPortal(
      <div
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-4 bg-surface/85 backdrop-blur-sm"
        role="alertdialog"
        aria-busy="true"
        aria-live="polite"
        aria-label={t("navigation.loadingAria")}
      >
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
        <p className="max-w-xs text-center font-headline text-sm font-semibold text-on-surface">
          {t("navigation.loading")}
        </p>
      </div>,
      document.body
    );

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
      {overlay}
    </NavigationLoadingContext.Provider>
  );
}
