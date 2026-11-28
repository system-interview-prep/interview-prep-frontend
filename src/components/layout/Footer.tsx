"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";

const linkClass = "transition-colors hover:text-[#14244B]";
const headingClass = "text-[13px] font-semibold text-[#14244B]";
const listClass = "mt-4 space-y-2.5 text-sm text-[#607096]";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[#DCE4F3] bg-[#F7F9FD] px-4 text-[#14244B] sm:px-8 lg:px-10 xl:px-12">
      {/* Main footer */}
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 py-14 md:py-16 lg:grid-cols-12">
        {/* Brand */}
        <div className="space-y-4 text-left lg:col-span-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#DCE4F3] bg-white shadow-2xs">
              <img src="/logo.jpg" alt="Intervia" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-[22px] font-semibold leading-none tracking-tight text-[#14244B]">
              INTERVIA
            </span>
          </Link>

          <p className="max-w-sm text-sm leading-relaxed text-[#607096]">
            {t("footer.tagline")}
          </p>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 gap-8 text-left sm:grid-cols-3 lg:col-span-8">
          {/* Product */}
          <nav aria-label={t("footer.product")}>
            <h3 className={headingClass}>{t("footer.product")}</h3>
            <ul className={listClass}>
              <li>
                <Link href="/#matching-showcase" className={linkClass}>
                  {t("footer.cvMatch")}
                </Link>
              </li>
              <li>
                <Link href="/#interview-experience" className={linkClass}>
                  {t("footer.voiceInterview")}
                </Link>
              </li>
              <li>
                <Link href="/#feedback-preview" className={linkClass}>
                  {t("footer.progressReadiness")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Learn */}
          <nav aria-label={t("footer.learn")}>
            <h3 className={headingClass}>{t("footer.learn")}</h3>
            <ul className={listClass}>
              <li>
                <Link href="/resources" className={linkClass}>
                  {t("footer.resources")}
                </Link>
              </li>
              <li>
                <Link href="/resources?topic=cv" className={linkClass}>
                  {t("footer.atsGuides")}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className={linkClass}>
                  {t("footer.faq")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Explore (no legal / about pages exist yet, so none are linked) */}
          <nav aria-label={t("fixm.footer.explore")}>
            <h3 className={headingClass}>{t("fixm.footer.explore")}</h3>
            <ul className={listClass}>
              <li>
                <Link href="/solutions" className={linkClass}>
                  {t("nav.solutions")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  {t("nav.pricing")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom legal */}
      <div className="mx-auto w-full max-w-[1320px] border-t border-[#DCE4F3] py-5">
        <p className="text-xs text-[#607096]">
          © 2026 INTERVIA. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
