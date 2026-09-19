"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";

import { useLanguage } from "@/i18n/LanguageProvider";
import HeroBackground from "./HeroBackground";
import CareerPipelineDemo from "./CareerPipelineDemo";
import { fadeInReveal } from "../../motion/variants";

interface HeroSectionProps {
  onOpenVideo?: () => void;
}

export function HeroSection({ onOpenVideo }: HeroSectionProps) {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="
        relative isolate overflow-hidden
        border-b border-[#E7ECF5]/70
        bg-white
        px-5 pt-3 pb-12
        sm:px-8 sm:pt-4 sm:pb-14
        lg:px-10 lg:pt-5 lg:pb-14
        xl:px-12 xl:pt-6 xl:pb-16
      "
    >
      <HeroBackground />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInReveal}
        className="relative z-10 mx-auto w-full max-w-[1320px]"
      >
        <div
          className="
            grid w-full items-center
            gap-10
            lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]
            lg:gap-3
            xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]
            xl:gap-4
          "
        >
          {/* LEFT — redesigned blended editorial copy */}
          <div className="relative z-20 max-w-[590px] text-left">
            {/* soft bridge to the right side */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute
                -right-24 top-[-8%]
                hidden h-[118%] w-[220px]
                bg-gradient-to-r from-transparent via-white/78 to-white
                blur-[26px]
                lg:block
              "
            />

            {/* ambient panel */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none absolute
                -left-10 top-[-4%]
                h-[108%] w-[108%]
                rounded-[40px]
                bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.58)_100%)]
                blur-[2px]
              "
            />

            <div className="relative">
              {/* eyebrow */}
              <div
                className="
                  inline-flex items-center gap-2 rounded-full
                  border border-[#C9D7F1]
                  bg-white/78
                  px-4 py-2
                  text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#204195]
                  shadow-[0_8px_24px_rgba(32,65,149,0.05)]
                  backdrop-blur-sm
                  sm:text-[11px]
                "
              >
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#FCB625]"
                />
                <span>{t("landing.badge")}</span>
              </div>

              {/* headline */}
              <h1
                className="
                  mt-5 max-w-[560px]
                  font-sans font-extrabold
                  text-[#14244B]
                  tracking-[-0.05em]
                  text-[clamp(2.7rem,3.95vw,4.45rem)]
                  leading-[0.97]
                "
              >
                <span className="block">{t("landing.hero.titleA")}</span>

                <span className="relative mt-1.5 inline-block text-[#204195]">
                  {t("landing.hero.titleB")}
                  <span
                    aria-hidden="true"
                    className="
                      absolute -bottom-1 left-0 -z-10
                      h-[0.11em] w-[96%]
                      rounded-full bg-[#FCB625]/34
                    "
                  />
                </span>
              </h1>

              {/* description */}
              <p
                className="
                  mt-5 max-w-[520px]
                  text-[15px] leading-[1.8] text-[#607096]
                  sm:text-[16px]
                  xl:text-[17px]
                "
              >
                {t("landing.hero.subtitle")}
              </p>
              {/* CTA */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/signup"
                  className="
                    inline-flex h-14 items-center justify-center gap-2.5
                    rounded-[14px] bg-[#204195] px-7
                    font-sans text-sm font-extrabold text-white
                    shadow-[0_12px_28px_rgba(32,65,149,0.18)]
                    transition-all duration-200
                    hover:-translate-y-0.5 hover:bg-[#183275]
                    hover:shadow-[0_16px_32px_rgba(32,65,149,0.22)]
                    active:translate-y-0 active:scale-[0.98]
                  "
                >
                  <span>{t("landing.hero.ctaPrimary")}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>

                <button
                  type="button"
                  onClick={onOpenVideo}
                  className="
                    inline-flex h-14 items-center justify-center gap-2.5
                    rounded-[14px]
                    border border-[#D1DBED]
                    bg-white/82 px-6
                    font-sans text-sm font-extrabold text-[#204195]
                    shadow-[0_8px_22px_rgba(20,36,75,0.045)]
                    backdrop-blur-sm
                    transition-all duration-200
                    hover:-translate-y-0.5 hover:border-[#204195]/30 hover:bg-[#F7F9FD]
                    active:translate-y-0 active:scale-[0.98]
                  "
                >
                  <span
                    className="
                      grid h-8 w-8 place-items-center rounded-full
                      border border-[#DCE4F3] bg-[#EEF3FC]
                    "
                  >
                    <Play
                      className="ml-0.5 size-3.5 fill-[#204195] text-[#204195]"
                      aria-hidden="true"
                    />
                  </span>
                  <span>{t("landing.hero.ctaSecondary")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — scene */}
          <div
            className="
              relative min-w-0
              lg:-ml-2
              xl:-ml-4
            "
          >
            <CareerPipelineDemo />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default HeroSection;