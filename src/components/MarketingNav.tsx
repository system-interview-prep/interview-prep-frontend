"use client";

import Link from "next/link";
import { Settings, Sparkles, LayoutDashboard } from "lucide-react";
import LanguageToggleButton from "./LanguageToggleButton";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthProfile } from "../auth/useAuthProfile";
import { useEffect, useState } from "react";

export type MarketingNavActive = "platform" | "solutions" | "pricing" | "resources";

export default function MarketingNav({ active }: { active: MarketingNavActive }) {
  const { t } = useLanguage();
  const { profile } = useAuthProfile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links: Array<{ href: string; id: MarketingNavActive; label: string }> = [
    { href: "/", id: "platform", label: t("nav.platform") },
    { href: "/solutions", id: "solutions", label: t("nav.solutions") },
    { href: "/pricing", id: "pricing", label: t("nav.pricing") },
    { href: "/resources", id: "resources", label: t("nav.resources") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[#234196] bg-white/95">
      <nav className="mx-auto flex h-16 w-full max-w-[1480px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12" aria-label="Điều hướng chính">
        <Link href="/" className="group inline-flex shrink-0 items-center gap-2 text-[#234196]">
          <span className="grid h-8 w-8 place-items-center rounded-lg border-2 border-[#234196] bg-[#FCB625] shadow-[2px_2px_0_#234196] transition-transform group-hover:-rotate-6">
            <Sparkles size={17} strokeWidth={2.5} />
          </span>
          <span className="font-headline text-xl font-semibold tracking-[-.02em] sm:text-2xl">{t("marketing.brandCurator")}</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) =>
            active === link.id ? (
              <span key={link.id} aria-current="page" className="font-bold underline decoration-[#FCB625] decoration-4 underline-offset-4">
                {link.label}
              </span>
            ) : (
              <Link key={link.id} href={link.href} className="font-bold transition-colors hover:text-[#E59E10]">
                {link.label}
              </Link>
            )
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {mounted && profile ? (
            <>
              <Link href="/dashboard" className="hidden text-sm font-bold hover:underline sm:inline">Dashboard</Link>
              <Link href="/interview/cv-score" className="chunky-primary px-3 py-2 text-xs sm:px-4 sm:text-sm">Vào Ứng Dụng</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm font-bold hover:underline sm:inline">{t("auth.login")}</Link>
              <Link href="/signup" className="chunky-primary px-3 py-2 text-xs sm:px-4 sm:text-sm">{t("auth.getStarted")}</Link>
            </>
          )}
          
          <div className="flex items-center gap-1 border-l-2 border-[#234196] pl-2 sm:pl-3">
            <LanguageToggleButton />
            {mounted && profile && (
              <Link href="/dashboard/profile" className="hidden h-9 w-9 place-items-center rounded-lg hover:bg-[#F0F4FC] sm:grid" aria-label="Cài đặt">
                <Settings size={17} />
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
