"use client";

import Link from "next/link";
import {
  Sparkles,
  Menu,
  X,
  ChevronDown,
  Check,
} from "lucide-react";

import { useLanguage } from "@/i18n/LanguageProvider";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";

import {
  useEffect,
  useRef,
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

type LanguageCode = "vi" | "en";

const languages: Array<{
  code: LanguageCode;
  short: string;
  label: string;
}> = [
    {
      code: "vi",
      short: "VN",
      label: "Tiếng Việt",
    },
    {
      code: "en",
      short: "EN",
      label: "English",
    },
  ];

function LanguageFlag({
  code,
  className = "h-4 w-6",
}: {
  code: "vi" | "en";
  className?: string;
}) {
  if (code === "vi") {
    return (
      <svg
        viewBox="0 0 30 20"
        className={`${className} shrink-0 overflow-hidden rounded-[3px]`}
        aria-hidden="true"
      >
        <rect width="30" height="20" fill="#DA251D" />

        <polygon
          fill="#FFCD00"
          points="
            15,4
            16.47,8.05
            20.76,8.18
            17.37,10.82
            18.57,14.95
            15,12.5
            11.43,14.95
            12.63,10.82
            9.24,8.18
            13.53,8.05
          "
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 60 30"
      className={`${className} shrink-0 overflow-hidden rounded-[3px]`}
      aria-hidden="true"
    >
      <clipPath id="gbFlagClip">
        <path d="M0 0v30h60V0z" />
      </clipPath>

      <g clipPath="url(#gbFlagClip)">
        <path d="M0 0v30h60V0z" fill="#012169" />

        <path
          d="M0 0l60 30m0-30L0 30"
          stroke="#fff"
          strokeWidth="6"
        />

        <path
          d="M0 0l60 30m0-30L0 30"
          stroke="#C8102E"
          strokeWidth="3"
        />

        <path
          d="M30 0v30M0 15h60"
          stroke="#fff"
          strokeWidth="10"
        />

        <path
          d="M30 0v30M0 15h60"
          stroke="#C8102E"
          strokeWidth="6"
        />
      </g>
    </svg>
  );
}

export default function MarketingNav({
  active,
}: {
  active?: MarketingNavActive;
}) {
  const { lang, setLang, t } = useLanguage();
  const { profile } = useAuthProfile();

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        languageRef.current &&
        !languageRef.current.contains(event.target as Node)
      ) {
        setLanguageOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
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

  const currentLanguage =
    languages.find((item) => item.code === lang) ?? languages[0];

  const handleLanguageChange = (code: LanguageCode) => {
    setLang(code);
    setLanguageOpen(false);
  };

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-[#DCE4F3]/80
        bg-white/88
        px-5
        sm:px-8
        lg:px-10
        xl:px-12
        backdrop-blur-xl
        transition-all duration-200
      "
    >
      <nav
        className="
          mx-auto flex h-16 w-full max-w-[1320px]
          items-center justify-between gap-4
        "
        aria-label={t("nav.aria.main")}
      >
        {/* Brand */}
        <Link
          href="/"
          className="
            group inline-flex shrink-0
            items-center gap-2.5
            text-[#204195]
          "
        >
          <span
            className="
              grid h-9 w-9 place-items-center
              rounded-xl
              border border-[#204195]/15
              bg-[#FCB625]
              text-[#204195]
              shadow-[0_5px_16px_rgba(32,65,149,0.08)]
              transition-transform duration-200
              group-hover:scale-105
            "
          >
            <Sparkles size={18} strokeWidth={2.5} />
          </span>

          <span
            className="
              font-sans text-xl font-extrabold
              tracking-tight text-[#204195]
            "
          >
            INTERVIA
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) =>
            active === link.id ? (
              <span
                key={link.id}
                aria-current="page"
                className="
                  border-b-2 border-[#FCB625]
                  pb-0.5
                  text-sm font-bold text-[#204195]
                "
              >
                {link.label}
              </span>
            ) : (
              <Link
                key={link.id}
                href={link.href}
                className="
                  text-sm font-semibold text-[#607096]
                  transition-colors
                  hover:text-[#204195]
                "
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Language selector */}
          <div
            ref={languageRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => setLanguageOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              aria-label={t("nav.aria.chooseLanguage")}
              className="
                inline-flex h-10 items-center gap-2
                rounded-xl
                border border-[#DCE4F3]
                bg-white/90
                px-3
                text-sm font-bold text-[#204195]
                shadow-[0_5px_16px_rgba(20,36,75,0.04)]
                transition-all duration-200
                hover:border-[#204195]/25
                hover:bg-[#F7F9FD]
              "
            >
              <LanguageFlag
                code={currentLanguage.code}
                className="h-[16px] w-[24px]"
              />

              <span>{currentLanguage.short}</span>

              <ChevronDown
                size={15}
                className={`
                  transition-transform duration-200
                  ${languageOpen ? "rotate-180" : ""}
                `}
              />
            </button>

            {/* Dropdown */}
            {languageOpen && (
              <div
                role="menu"
                className="
                  absolute right-0 top-[calc(100%+10px)]
                  z-[70]
                  w-[190px]

                  rounded-2xl
                  border border-[#DCE4F3]
                  bg-white
                  p-1.5

                  shadow-[0_18px_48px_rgba(20,36,75,0.13)]
                "
              >
                {languages.map((language) => {
                  const selected = lang === language.code;

                  return (
                    <button
                      key={language.code}
                      type="button"
                      role="menuitem"
                      onClick={() =>
                        handleLanguageChange(language.code)
                      }
                      className={`
                        flex w-full items-center justify-between
                        rounded-xl px-3 py-2.5
                        text-left
                        transition-colors duration-150

                        ${selected
                          ? "bg-[#F4F7FD]"
                          : "hover:bg-[#F7F9FD]"
                        }
                      `}
                    >
                      <span className="flex items-center gap-3">
                        <LanguageFlag
                          code={language.code}
                          className="h-[18px] w-[27px]"
                        />

                        <span className="flex flex-col">
                          <span className="text-sm font-bold text-[#14244B]">
                            {language.label}
                          </span>

                          <span className="text-[11px] font-semibold text-[#8090B0]">
                            {language.short}
                          </span>
                        </span>
                      </span>

                      {selected && (
                        <span
                          className="
                            grid h-6 w-6 place-items-center
                            rounded-full
                            bg-[#FCB625]/20
                            text-[#204195]
                          "
                        >
                          <Check
                            size={14}
                            strokeWidth={2.5}
                          />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auth */}
          {mounted && profile ? (
            <>
              <Link
                href="/dashboard"
                className="
                  hidden text-sm font-bold text-[#607096]
                  transition-colors
                  hover:text-[#204195]
                  sm:inline
                "
              >
                {t("nav.dashboard")}
              </Link>

              <Link
                href="/dashboard"
                className="
                  inline-flex h-10
                  items-center justify-center
                  rounded-xl bg-[#204195]
                  px-4
                  text-xs font-bold text-white
                  transition-all
                  hover:bg-[#183275]
                  active:scale-95
                "
              >
                {t("nav.openApp")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="
                  hidden text-sm font-bold text-[#607096]
                  transition-colors
                  hover:text-[#204195]
                  sm:inline
                "
              >
                {t("nav.signIn")}
              </Link>

              <Link
                href="/signup"
                className="
                  inline-flex h-10
                  items-center justify-center
                  rounded-xl bg-[#204195]
                  px-4
                  text-xs font-bold text-white
                  transition-all
                  hover:bg-[#183275]
                  active:scale-95
                "
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
            className="
              grid h-10 w-10 place-items-center
              rounded-xl
              border border-[#DCE4F3]
              text-[#204195]
              transition-colors
              hover:bg-[#F7F9FD]
              md:hidden
            "
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
        <div
          className="
            space-y-2
            border-t border-[#DCE4F3]
            bg-white
            px-5 py-4
            text-left
            shadow-[0_16px_30px_rgba(20,36,75,0.06)]
            md:hidden
          "
        >
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="
                block rounded-xl
                px-3 py-2.5
                text-sm font-bold text-[#14244B]
                transition-colors
                hover:bg-[#F7F9FD]
                hover:text-[#204195]
              "
            >
              {link.label}
            </Link>
          ))}

          <div
            className="
              mt-2 flex items-center
              justify-between
              border-t border-[#DCE4F3]
              pt-4
            "
          >
            {mounted && profile ? (
              <Link
                href="/dashboard"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  text-xs font-bold
                  text-[#204195]
                "
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  text-xs font-bold
                  text-[#204195]
                "
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}