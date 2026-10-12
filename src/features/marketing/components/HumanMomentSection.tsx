"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../motion/variants";

export function HumanMomentSection() {
  const { t } = useLanguage();

  return (
    <section id="human-moment" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-white overflow-hidden border-b border-[#E7ECF5]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Candidate Photograph Visual Column (5 col) */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-[#DCE4F3] bg-[#F7F9FD] shadow-md group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#14244B]/40 via-transparent to-transparent z-10" />
              <Image
                src="/landing/human/candidate-preparing.jpg"
                alt="Candidate preparing for interview"
                fill
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-6 left-6 right-6 z-20 text-white text-left">
                <span className="font-mono text-[11px] font-bold text-[#FCB625] uppercase tracking-wider block mb-1">
                  {t("landing.human.cardLabel")}
                </span>
                <p className="font-sans text-sm font-semibold text-white/95">
                  {t("landing.human.cardDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Editorial Text Column (7 col) */}
          <div className="lg:col-span-7 order-1 lg:order-2 text-left space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FC] border border-[#DCE4F3] px-3.5 py-1 font-mono text-xs font-bold text-[#204195]">
              {t("landing.human.eyebrow")}
            </span>

            <h2 className="font-serif text-3xl italic font-normal text-[#14244B] sm:text-4xl md:text-5xl leading-tight">
              {t("landing.human.quote")}
            </h2>

            <p className="text-base font-normal leading-relaxed text-[#607096] sm:text-lg">
              {t("landing.human.body")}
            </p>

            <div className="pt-2 border-t border-[#DCE4F3] flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#204195] text-white flex items-center justify-center font-mono text-xs font-bold">
                IV
              </div>
              <span className="font-mono text-xs font-bold text-[#204195]">
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


