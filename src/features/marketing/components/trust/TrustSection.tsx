"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, FileCheck, UserCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../../motion/variants";

export function TrustSection() {
  const { t } = useLanguage();

  const trustCards = [
    {
      icon: ShieldCheck,
      title: t("landing.trust.card1Title"),
      desc: t("landing.trust.card1Desc"),
    },
    {
      icon: FileCheck,
      title: t("landing.trust.card2Title"),
      desc: t("landing.trust.card2Desc"),
    },
    {
      icon: UserCheck,
      title: t("landing.trust.card3Title"),
      desc: t("landing.trust.card3Desc"),
    },
  ];

  return (
    <section id="trust-privacy" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-white border-b border-[#DCE4F3]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px] text-left"
      >
        <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl max-w-xl">
          {t("landing.trust.title")}
        </h2>

        {/* 3 Calm Trust Statements */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {trustCards.map((card) => {
            const IconComponent = card.icon;

            return (
              <div key={card.title} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EEF3FC] text-[#204195]">
                    <IconComponent className="size-4" />
                  </span>
                  <h3 className="font-sans text-lg font-bold text-[#14244B]">
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-[#607096] sm:text-sm pl-11">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

export default TrustSection;
