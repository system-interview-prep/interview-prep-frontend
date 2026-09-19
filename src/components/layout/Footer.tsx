"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer
      className="
        border-t border-[#DCE4F3]
        bg-white
        text-[#14244B]
        px-5
        sm:px-8
        lg:px-10
        xl:px-12
      "
    >
      {/* Main footer */}
      <div
        className="
          mx-auto
          grid w-full max-w-[1320px]
          gap-10
          py-14
          md:py-16
          lg:grid-cols-12
        "
      >
        {/* Brand */}
        <div
          className="
            space-y-4
            text-left
            lg:col-span-4
          "
        >
          <Link
            href="/"
            className="
              inline-flex items-center gap-2.5
              font-sans
              text-2xl font-extrabold
              text-[#204195]
            "
          >
            <span
              className="
                grid h-8 w-8 place-items-center
                rounded-lg
                bg-[#FCB625]
                text-[#204195]
              "
            >
              <Sparkles
                size={16}
                strokeWidth={2.4}
              />
            </span>

            INTERVIA
          </Link>

          <p
            className="
              max-w-sm
              text-sm leading-relaxed
              text-[#607096]
            "
          >
            {t("footer.tagline")}
          </p>
        </div>

        {/* Navigation */}
        <div
          className="
            grid gap-8
            text-left

            sm:grid-cols-3

            lg:col-span-8
          "
        >
          {/* Product */}
          <nav aria-label={t("footer.product")}>
            <h3
              className="
                font-mono
                text-xs font-bold uppercase
                tracking-wider
                text-[#204195]
              "
            >
              {t("footer.product")}
            </h3>

            <ul
              className="
                mt-4 space-y-2.5
                text-xs font-medium
                text-[#607096]
              "
            >
              <li>
                <Link
                  href="/#matching-showcase"
                  className="
                    transition-colors
                    hover:text-[#204195]
                  "
                >
                  {t("footer.cvMatch")}
                </Link>
              </li>

              <li>
                <Link
                  href="/#interview-experience"
                  className="
                    transition-colors
                    hover:text-[#204195]
                  "
                >
                  {t("footer.voiceInterview")}
                </Link>
              </li>

              <li>
                <Link
                  href="/#progress-preview"
                  className="
                    transition-colors
                    hover:text-[#204195]
                  "
                >
                  {t("footer.progressReadiness")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Learn */}
          <nav aria-label={t("footer.learn")}>
            <h3
              className="
                font-mono
                text-xs font-bold uppercase
                tracking-wider
                text-[#204195]
              "
            >
              {t("footer.learn")}
            </h3>

            <ul
              className="
                mt-4 space-y-2.5
                text-xs font-medium
                text-[#607096]
              "
            >
              <li>
                <Link
                  href="/resources"
                  className="
                    transition-colors
                    hover:text-[#204195]
                  "
                >
                  {t("footer.resources")}
                </Link>
              </li>

              <li>
                <Link
                  href="/resources?topic=cv"
                  className="
                    transition-colors
                    hover:text-[#204195]
                  "
                >
                  {t("footer.atsGuides")}
                </Link>
              </li>

              <li>
                <Link
                  href="/#faq"
                  className="
                    transition-colors
                    hover:text-[#204195]
                  "
                >
                  {t("footer.faq")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label={t("footer.company")}>
            <h3
              className="
                font-mono
                text-xs font-bold uppercase
                tracking-wider
                text-[#204195]
              "
            >
              {t("footer.company")}
            </h3>

            <ul
              className="
                mt-4 space-y-2.5
                text-xs font-medium
                text-[#607096]
              "
            >
              <li>
                <Link
                  href="/solutions"
                  className="
                    transition-colors
                    hover:text-[#204195]
                  "
                >
                  {t("footer.aboutUs")}
                </Link>
              </li>

              <li>
                <Link
                  href="/resources"
                  className="
                    transition-colors
                    hover:text-[#204195]
                  "
                >
                  {t("footer.privacyPolicy")}
                </Link>
              </li>

              <li>
                <Link
                  href="/resources"
                  className="
                    transition-colors
                    hover:text-[#204195]
                  "
                >
                  {t("footer.termsOfService")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom legal */}
      <div
        className="
          border-t border-[#DCE4F3]
          bg-[#F7F9FD]/65
          px-5 py-5

          sm:px-8

          lg:px-10

          xl:px-12
        "
      >
        <div
          className="
            mx-auto flex
            w-full max-w-[1320px]
            items-center
            justify-between
          "
        >
          <p
            className="
              text-xs font-medium
              text-[#607096]
            "
          >
            © 2026 INTERVIA. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}