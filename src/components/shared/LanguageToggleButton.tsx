"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * Giả sử app của bạn đang có:
 * - language: "vi" | "en"
 * - setLanguage: (lang: "vi" | "en") => void
 *
 * Hãy thay hook bên dưới bằng hook/provider thật của bạn.
 */
import { useLanguage } from "@/i18n/LanguageProvider";

type Lang = "vi" | "en";

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
      <clipPath id="gbFlagClipToggle">
        <path d="M0 0v30h60V0z" />
      </clipPath>
      <g clipPath="url(#gbFlagClipToggle)">
        <path d="M0 0v30h60V0z" fill="#012169" />
        <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0l60 30m0-30L0 30" stroke="#C8102E" strokeWidth="3" />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

const LANGUAGE_OPTIONS: {
  code: Lang;
  label: string;
  shortLabel: string;
}[] = [
  {
    code: "vi",
    label: "Tiếng Việt",
    shortLabel: "VN",
  },
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
  },
];

interface LanguageToggleButtonProps {
  className?: string;
}

export default function LanguageToggleButton({ className }: LanguageToggleButtonProps = {}) {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const current =
    LANGUAGE_OPTIONS.find((item) => item.code === language) ??
    LANGUAGE_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleSelect = (lang: Lang) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex h-10 items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3 text-sm font-bold text-[#204195] shadow-[0_5px_16px_rgba(20,36,75,0.04)] transition-all duration-200 hover:border-[#204195]/25 hover:bg-[#F7F9FD] ${className ?? ""}`}
      >
        <LanguageFlag code={current.code} className="h-[16px] w-[24px]" />
        <span>{current.shortLabel}</span>
        <ChevronDown
          className={`size-4 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="
            absolute right-0 top-[calc(100%+10px)] z-50 min-w-[180px]
            overflow-hidden rounded-2xl border border-[#DCE4F3]
            bg-white p-1.5
            shadow-[0_18px_45px_rgba(20,36,75,0.12)]
          "
        >
          {LANGUAGE_OPTIONS.map((item) => {
            const active = item.code === language;

            return (
              <button
                key={item.code}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(item.code)}
                className="
                  flex w-full items-center justify-between rounded-xl
                  px-3 py-2.5 text-left
                  transition-colors duration-150
                  hover:bg-[#F4F7FD]
                "
              >
                <span className="flex items-center gap-3">
                  <LanguageFlag code={item.code} className="h-[18px] w-[27px]" />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-[#1C2D5A]">
                      {item.label}
                    </span>
                    <span className="text-xs text-[#7081A6]">
                      {item.shortLabel}
                    </span>
                  </span>
                </span>

                {active ? (
                  <Check className="size-4 text-[#204195]" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}