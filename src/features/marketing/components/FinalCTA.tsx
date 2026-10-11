"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../motion/variants";

const BENEFIT_KEYS = ["uxm.cta.benefit1", "uxm.cta.benefit2", "uxm.cta.benefit3"];

export function FinalCTA() {
  const { t } = useLanguage();

  return (
    <section id="final-cta" className="relative bg-white px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInReveal}
        className="relative mx-auto w-full max-w-[1320px] overflow-hidden rounded-[32px] bg-[#204195] px-6 py-14 text-center text-white sm:px-12 sm:py-20"
      >
        <div className="mx-auto flex max-w-[720px] flex-col items-center">

          <h2 className="font-display text-[clamp(2rem,3.6vw,3.4rem)] font-semibold leading-[1.08] tracking-tight text-white">
            {t("landing.cta.titleA")}{" "}
            <span className="italic text-[#FCB625]">{t("landing.cta.titleHighlight")}</span>{" "}
            {t("landing.cta.titleB")}
          </h2>

          <p className="mt-4 max-w-[570px] text-[15px] leading-[1.7] text-white/75 sm:text-[17px]">
            {t("landing.cta.subtitle")}
          </p>

          <Link
            href="/signup"
            className="group mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#FCB625] px-8 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#E5A21D]"
          >
            {t("landing.cta.button")}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>

          <p className="mt-6 text-[13px] text-white/60">
            {BENEFIT_KEYS.map((key, idx) => (
              <React.Fragment key={key}>
                {idx > 0 && <span aria-hidden="true" className="mx-2">·</span>}
                {t(key)}
              </React.Fragment>
            ))}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

export default FinalCTA;
