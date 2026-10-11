"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../../motion/variants";

export function TrustSection() {
  const { t } = useLanguage();

  const trustCards = [
    {
      title: t("landing.trust.card1Title"),
      desc: t("landing.trust.card1Desc"),
    },
    {
      title: t("landing.trust.card2Title"),
      desc: t("landing.trust.card2Desc"),
    },
    {
      title: t("landing.trust.card3Title"),
      desc: t("landing.trust.card3Desc"),
    },
  ];

  return (
    <section id="trust-privacy" className="relative bg-white px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px] text-left"
      >
        <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight text-[#14244B] sm:text-4xl md:text-[44px]">
          {t("landing.trust.title")}
        </h2>

        {/* Three calm statements */}
        <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {trustCards.map((card, idx) => (
            <div key={card.title} className="border-t border-[#DCE4F3] pt-5">
              <span className="font-display text-lg font-semibold text-[#204195]">0{idx + 1}</span>
              <h3 className="mt-2 text-lg font-semibold text-[#14244B]">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#607096]">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default TrustSection;
