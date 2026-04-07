"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * Vertical “tab bar” for job profiles: Job Board, Create Profile, Categories (mockup-style).
 */
export default function AdminDashboardJobNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const isJobBoard = pathname === "/admin/dashboard";
  const isCreate = pathname.startsWith("/admin/job-profiles/create");
  const isCategories = pathname.startsWith("/admin/job-profiles/categories");

  return (
    <nav className="space-y-1" aria-label={t("admin.sidebar.jobNavAria")}> 
      <Link
        href="/admin/dashboard"
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
          isJobBoard
            ? "bg-primary-fixed/55 font-bold text-primary shadow-sm dark:bg-primary-fixed/25"
            : "text-on-surface-variant hover:bg-surface-variant"
        }`}
      >
        <span
          className="material-symbols-outlined shrink-0 text-[22px]"
          style={isJobBoard ? { fontVariationSettings: "'FILL' 1" } : undefined}
          aria-hidden
        >
          work
        </span>
        <span className={isJobBoard ? "font-bold" : "font-medium"}>{t("admin.sidebar.jobBoard")}</span>
      </Link>

      <Link
        href="/admin/job-profiles/create"
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
          isCreate
            ? "bg-primary-fixed/55 font-bold text-primary shadow-sm dark:bg-primary-fixed/25"
            : "text-on-surface-variant hover:bg-surface-variant"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isCreate ? "bg-primary text-white" : "bg-[#5f6368] text-white dark:bg-neutral-600"
          }`}
          aria-hidden
        >
          <span className="material-symbols-outlined text-[20px] leading-none">add</span>
        </span>
        <span className={isCreate ? "font-bold" : "font-medium"}>{t("admin.sidebar.createProfile")}</span>
      </Link>

      <Link
        href="/admin/job-profiles/categories"
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
          isCategories
            ? "bg-primary-fixed/55 font-bold text-primary shadow-sm dark:bg-primary-fixed/25"
            : "text-on-surface-variant hover:bg-surface-variant"
        }`}
      >
        <span
          className="material-symbols-outlined shrink-0 text-[22px] text-inherit"
          style={isCategories ? { fontVariationSettings: "'FILL' 1" } : undefined}
          aria-hidden
        >
          category
        </span>
        <span className={isCategories ? "font-bold" : "font-medium"}>{t("admin.sidebar.categories")}</span>
      </Link>
    </nav>
  );
}
