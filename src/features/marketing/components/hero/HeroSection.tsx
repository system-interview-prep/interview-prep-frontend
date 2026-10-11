"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { useLanguage } from "@/i18n/LanguageProvider";
import { MARKETING_EVIDENCE_MOCK } from "../../data/landing.data";
import { fadeInReveal } from "../../motion/variants";

/** A compact, static CV ↔ JD preview built from the landing sample data (labelled as an example). */
function HeroProductPreview() {
  const { t } = useLanguage();
  const matchedCount = MARKETING_EVIDENCE_MOCK.filter((item) => item.status === "matched").length;
  const firstSnippet = MARKETING_EVIDENCE_MOCK.find((item) => item.snippets.length > 0)?.snippets[0];

  return (
    <div className="rounded-3xl border border-[#DCE4F3] bg-[#F0F4FC] p-4 sm:p-6">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-[#DCE4F3] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE4F3] pb-4">
          <span className="text-sm font-semibold text-[#14244B]">{t("fixm.hero.previewTitle")}</span>
          <span className="rounded-full bg-[#F0F4FC] px-2.5 py-0.5 text-[11px] font-semibold text-[#607096]">
            {t("fixm.common.example")}
          </span>
        </div>

        <p className="mt-4 text-[13px] text-[#607096]">
          <span className="font-display text-2xl font-semibold text-[#204195]">
            {matchedCount}/{MARKETING_EVIDENCE_MOCK.length}
          </span>{" "}
          {t("fixm.hero.previewMatched")}
        </p>

        <ul className="mt-4 space-y-2">
          {MARKETING_EVIDENCE_MOCK.map((item) => {
            const isMatched = item.status === "matched";
            return (
              <li
                key={item.requirement}
                className="flex items-start justify-between gap-3 rounded-2xl bg-[#F7F9FD] px-3.5 py-3"
              >
                <span className="text-[13px] font-medium leading-snug text-[#14244B]">{item.requirement}</span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    isMatched ? "bg-[#287A4B]/10 text-[#287A4B]" : "bg-[#FCB625]/20 text-[#14244B]"
                  }`}
                >
                  {isMatched ? t("uxm.match.matched") : t("uxm.match.missing")}
                </span>
              </li>
            );
          })}
        </ul>

        {firstSnippet ? (
          <div className="mt-4 rounded-2xl border border-[#FCB625]/40 bg-[#FCB625]/10 p-3.5">
            <span className="text-[12px] font-semibold text-[#204195]">{t("fixm.common.sampleSnippet")}</span>
            <p className="mt-1 text-[13px] leading-relaxed text-[#14244B]">&quot;{firstSnippet}&quot;</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function HeroSection() {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-white px-4 pb-14 pt-6 sm:px-8 sm:pb-16 sm:pt-10 lg:px-10 lg:pb-20 lg:pt-12 xl:px-12"
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInReveal}
        className="relative mx-auto grid w-full max-w-[1320px] items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14"
      >
        {/* Copy */}
        <div className="max-w-[600px] text-left">
          <h1 className="text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-[1.04] tracking-tight text-[#14244B]">
            <span className="block">{t("landing.hero.titleA")}</span>
            <span className="mt-1 block font-normal italic text-[#204195]">
              {t("landing.hero.titleB")}
            </span>
          </h1>

          <p className="mt-6 max-w-[520px] text-[16px] leading-[1.75] text-[#607096] xl:text-[17px]">
            {t("landing.hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#204195] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
            >
              {t("landing.hero.ctaPrimary")}
              <span aria-hidden="true">→</span>
            </Link>

            <a
              href="#how-to-use"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] transition-colors hover:bg-[#EEF3FC]"
            >
              {t("fixm.hero.ctaSecondary")}
              <span aria-hidden="true" className="text-[#204195]">↓</span>
            </a>
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-[#607096]">{t("uxm.hero.nextStep")}</p>
        </div>

        {/* Product preview (sample data) */}
        <HeroProductPreview />
      </motion.div>
    </section>
  );
}

export default HeroSection;
