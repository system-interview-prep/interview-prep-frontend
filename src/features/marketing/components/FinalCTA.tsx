"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  Zap,
  ShieldCheck,
} from "lucide-react";

import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../motion/variants";

const BENEFITS = [
  {
    icon: BarChart3,
    label: "AI-powered practice",
  },
  {
    icon: Zap,
    label: "Real interview scenarios",
  },
  {
    icon: ShieldCheck,
    label: "Build confidence",
  },
];

export function FinalCTA() {
  const { t } = useLanguage();

  return (
    <section
      id="final-cta"
      className="
        relative isolate overflow-hidden
        bg-[#163D98]
        text-white
      "
    >
      {/* =========================================
          BACKGROUND IMAGE
      ========================================== */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/landing/cta/final-cta-bg.png"
          alt=""
          fill
          priority={false}
          sizes="100vw"
          className="
            object-cover
            object-center
          "
        />
      </div>

      {/* =========================================
          BLUE OVERLAY
          Giữ contrast chữ nhưng không che mascot
      ========================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 -z-10
          bg-[linear-gradient(90deg,rgba(19,55,145,0.18)_0%,rgba(16,48,132,0.05)_18%,rgba(13,43,125,0.12)_50%,rgba(16,48,132,0.05)_82%,rgba(19,55,145,0.18)_100%)]
        "
      />

      {/* spotlight giữa */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute left-1/2 top-[54%]
          -z-10
          h-[340px] w-[720px]
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-[#FCB625]/[0.12]
          blur-[120px]
        "
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInReveal}
        className="
    relative z-10
    mx-auto flex
    min-h-[560px]
    w-full max-w-[1320px]
    flex-col items-center
    justify-center
    px-5
    py-14
    text-center

    sm:px-8
    sm:py-16

    lg:min-h-[610px]
    lg:px-10
    lg:py-16

    xl:px-12
  "
      >
        {/* SAFE CONTENT COLUMN */}
        <div
          className="
      flex w-full
      max-w-[720px]
      -translate-y-2
      flex-col
      items-center

      lg:-translate-y-4
    "
        >
          {/* Eyebrow */}
          <div
            className="
        inline-flex items-center gap-2
        rounded-full
        border border-white/15
        bg-[#173F99]/55
        px-4 py-2
        shadow-[0_10px_30px_rgba(0,0,0,0.08)]
        backdrop-blur-md
      "
          >
            <Sparkles
              className="size-4 text-[#FCB625]"
              aria-hidden="true"
            />

            <span
              className="
          text-[10px]
          font-extrabold
          uppercase
          tracking-[0.11em]
          text-white
          sm:text-[11px]
        "
            >
              {t("landing.cta.eyebrow")}
            </span>
          </div>

          {/* Headline */}
          <h2
            className="
        mt-6
        max-w-[700px]

        font-sans
        text-[clamp(2.25rem,3.5vw,3.8rem)]
        font-extrabold
        leading-[1.02]
        tracking-[-0.045em]
        text-white
      "
          >
            {t("landing.cta.titleA")}
            <span className="block">
              <span className="text-[#FCB625]">
                {t("landing.cta.titleHighlight")}
              </span>
              {t("landing.cta.titleB")}
            </span>
          </h2>

          {/* Description */}
          <p
            className="
        mt-4
        max-w-[570px]

        text-[14px]
        font-medium
        leading-[1.65]
        text-white/72

        sm:text-[16px]
        lg:text-[17px]
      "
          >
            {t("landing.cta.subtitle")}
          </p>

          {/* CTA */}
          <Link
            href="/signup"
            className="
        group
        mt-6
        inline-flex
        h-13
        items-center
        justify-center
        gap-2.5

        rounded-[14px]
        bg-[#FCB625]
        px-7

        text-sm
        font-extrabold
        text-[#143A8B]

        shadow-[0_14px_30px_rgba(252,182,37,0.2)]

        transition-all
        duration-200

        hover:-translate-y-0.5
        hover:bg-[#FFC64A]
        hover:shadow-[0_18px_38px_rgba(252,182,38,0.28)]

        active:translate-y-0
        active:scale-[0.98]
      "
          >
            <span>{t("landing.cta.button")}</span>

            <ArrowRight
              className="
          size-4
          transition-transform
          duration-200
          group-hover:translate-x-1
        "
            />
          </Link>

          {/* Benefits */}
          <div
            className="
        mt-6
        flex
        max-w-[620px]
        flex-wrap
        items-center
        justify-center

        gap-x-5
        gap-y-2.5

        text-[10px]
        font-medium
        text-white/66

        sm:text-[11px]
      "
          >
            {BENEFITS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="
            inline-flex
            items-center
            gap-2
          "
              >
                <span
                  className="
              grid
              h-7 w-7
              place-items-center

              rounded-full
              border border-white/[0.1]
              bg-white/[0.07]
              backdrop-blur-sm
            "
                >
                  <Icon
                    className="size-3 text-white/85"
                    aria-hidden="true"
                  />
                </span>

                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default FinalCTA;