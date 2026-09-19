"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Plus, Layers } from "lucide-react";
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
    <nav className="space-y-2" aria-label={t("admin.sidebar.jobNavAria")}>
      <Link
        href="/admin/dashboard"
        className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all ${
          isJobBoard
            ? "border-[#234196] bg-[#FCB625] font-bold text-[#234196] shadow-[2px_2px_0_#234196]"
            : "border-transparent text-[#5A6B8F] hover:border-[#234196] hover:bg-[#F0F4FC] hover:text-[#234196]"
        }`}
      >
        <Briefcase className="size-5 shrink-0" aria-hidden />
        <span className={isJobBoard ? "font-bold" : "font-medium"}>{t("admin.sidebar.jobBoard")}</span>
      </Link>

      <Link
        href="/admin/job-profiles/create"
        className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all ${
          isCreate
            ? "border-[#234196] bg-[#FCB625] font-bold text-[#234196] shadow-[2px_2px_0_#234196]"
            : "border-transparent text-[#5A6B8F] hover:border-[#234196] hover:bg-[#F0F4FC] hover:text-[#234196]"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isCreate ? "border-2 border-[#234196] bg-white text-[#234196]" : "border-2 border-[#234196] bg-[#F0F4FC] text-[#234196]"
          }`}
          aria-hidden
        >
          <Plus className="size-4.5" />
        </span>
        <span className={isCreate ? "font-bold" : "font-medium"}>{t("admin.sidebar.createProfile")}</span>
      </Link>

      <Link
        href="/admin/job-profiles/categories"
        className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all ${
          isCategories
            ? "border-[#234196] bg-[#FCB625] font-bold text-[#234196] shadow-[2px_2px_0_#234196]"
            : "border-transparent text-[#5A6B8F] hover:border-[#234196] hover:bg-[#F0F4FC] hover:text-[#234196]"
        }`}
      >
        <Layers className="size-5 shrink-0" aria-hidden />
        <span className={isCategories ? "font-bold" : "font-medium"}>{t("admin.sidebar.categories")}</span>
      </Link>
    </nav>
  );
}
