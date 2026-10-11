"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../motion/variants";

export function HumanMomentSection() {
  const { t } = useLanguage();

  return (
    <section id="human-moment" className="relative overflow-hidden bg-[#F7F9FD] px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Candidate photograph */}
          <div className="order-2 lg:order-1 lg:col-span-5">
            <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-[#EEF3FC]">
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#14244B]/55 via-transparent to-transparent" />
              <Image
                src="/landing/human/candidate-preparing.jpg"
                alt={t("fixm.human.imageAlt")}
                fill
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20 text-left text-white">
                <span className="mb-1 block text-[12px] font-semibold text-[#FCB625]">
                  {t("landing.human.cardLabel")}
                </span>
                <p className="text-sm font-medium text-white/95">
                  {t("landing.human.cardDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Editorial text */}
          <div className="order-1 space-y-6 text-left lg:order-2 lg:col-span-7">
            <h2 className="font-display text-3xl font-normal italic leading-tight text-[#14244B] sm:text-4xl md:text-5xl">
              {t("landing.human.quote")}
            </h2>

            <p className="text-base leading-relaxed text-[#607096] sm:text-lg">
              {t("landing.human.body")}
            </p>

            <div className="border-t border-[#DCE4F3] pt-4">
              <span className="text-sm font-semibold text-[#204195]">
                {t("landing.human.philosophy")}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default HumanMomentSection;
