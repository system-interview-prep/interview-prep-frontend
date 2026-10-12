"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { useLanguage } from "@/i18n/LanguageProvider";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";

import {
  useEffect,
  useState,
} from "react";

export type MarketingNavActive =
  | "product"
  | "how-it-works"
  | "interview"
  | "resources"
  | "pricing"
  | "solutions"
  | "platform";

/** Page-level nav items, matched against the current path. */
const PATH_ACTIVE: Array<{ prefix: string; id: MarketingNavActive }> = [
  { prefix: "/resources", id: "resources" },
  { prefix: "/solutions", id: "solutions" },
  { prefix: "/pricing", id: "pricing" },
];

export default function MarketingNav({
  active: activeProp,
}: {
  active?: MarketingNavActive;
}) {
  const { t } = useLanguage();
  const { profile } = useAuthProfile();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const links: Array<{
    href: string;
    id: MarketingNavActive;
    label: string;
  }> = [
      {
        href: "/#hero",
        id: "product",
        label: t("nav.product"),
      },
      {
        href: "/#how-to-use",
        id: "how-it-works",
        label: t("nav.howItWorks"),
      },
      {
        href: "/#interview-experience",
        id: "interview",
        label: t("nav.interview"),
      },
      {
        href: "/resources",
        id: "resources",
        label: t("nav.resources"),
      },
      {
        href: "/solutions",
        id: "solutions",
        label: t("nav.solutions"),
      },
      {
        href: "/pricing",
        id: "pricing",
        label: t("nav.pricing"),
      },
    ];

  const active =
    activeProp ??
    PATH_ACTIVE.find(
      (item) => pathname === item.prefix || pathname?.startsWith(`${item.prefix}/`),
    )?.id;

  const signedIn = mounted && profile;

  return (
    <header className="sticky top-0 z-50 border-b border-[#DCE4F3]/80 bg-white/90 px-4 backdrop-blur sm:px-8 lg:px-10 xl:px-12">
      <nav
        className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between gap-4"
        aria-label={t("nav.aria.main")}
      >
        {/* Brand */}
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#DCE4F3] bg-white shadow-2xs">
            <img src="/logo.jpg" alt="Intervia" className="h-full w-full object-cover" />
          </div>
          <span className="font-display text-[22px] font-semibold leading-none tracking-tight text-[#14244B]">
            INTERVIA
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) =>
            active === link.id ? (
              <span
                key={link.id}
                aria-current="page"
                className="rounded-full bg-[#F0F4FC] px-3.5 py-2 text-sm font-semibold text-[#204195]"
              >
                {link.label}
              </span>
            ) : (
              <Link
                key={link.id}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-[#607096] transition-colors hover:bg-[#F7F9FD] hover:text-[#14244B]"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm font-semibold text-[#607096] transition-colors hover:text-[#14244B] sm:inline"
              >
                {t("nav.dashboard")}
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
              >
                {t("nav.openApp")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-[#607096] transition-colors hover:text-[#14244B] sm:inline"
              >
                {t("nav.signIn")}
              </Link>

              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#204195] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
              >
                {t("nav.startFree")}
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen((prev) => !prev)
            }
            aria-label={
              mobileMenuOpen
                ? t("nav.aria.closeMenu")
                : t("nav.aria.openMenu")
            }
            aria-expanded={mobileMenuOpen}
            className="grid h-10 w-10 place-items-center rounded-full text-[#204195] ring-1 ring-[#DCE4F3] transition-colors hover:bg-[#F7F9FD] md:hidden"
          >
            {mobileMenuOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="-mx-4 space-y-1 border-t border-[#DCE4F3] bg-white px-4 pb-5 sm:-mx-8 sm:px-8 pt-2 text-left shadow-[0_18px_30px_-20px_rgba(20,36,75,0.35)] md:hidden">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              aria-current={active === link.id ? "page" : undefined}
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className={`block rounded-2xl px-4 py-3 text-[15px] transition-colors ${
                active === link.id
                  ? "bg-[#F0F4FC] font-semibold text-[#204195]"
                  : "font-medium text-[#607096] hover:bg-[#F7F9FD] hover:text-[#14244B]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 border-t border-[#DCE4F3] px-4 pt-4">
            {signedIn ? (
              <Link
                href="/dashboard"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-sm font-semibold text-[#204195] underline-offset-4 hover:underline"
              >
                {t("nav.dashboard")} →
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="text-sm font-semibold text-[#204195] underline-offset-4 hover:underline"
              >
                {t("nav.signIn")} →
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
