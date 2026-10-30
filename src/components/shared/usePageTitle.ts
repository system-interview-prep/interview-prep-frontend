"use client";

import { useEffect } from "react";

export const BRAND_NAME = "INTERVIA";

/** "<page> | INTERVIA" — the browser-tab format used by the admin console and the candidate workspace. */
export function brandTitle(page?: string | null): string {
  return page ? `${page} | ${BRAND_NAME}` : BRAND_NAME;
}

/**
 * Sets the browser tab to "<page> | INTERVIA" for the current page. Pass null
 * to leave the title to the page's own metadata (detail pages set their own).
 * Next.js writes the layout's metadata title after hydration and on every
 * navigation, so the title is re-applied whenever <head> changes it back.
 */
export function usePageTitle(page: string | null | undefined) {
  useEffect(() => {
    if (!page) return;
    const wanted = brandTitle(page);
    const apply = () => {
      if (document.title !== wanted) document.title = wanted;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [page]);
}
