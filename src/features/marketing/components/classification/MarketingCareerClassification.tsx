"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../../motion/variants";

const EVIDENCE = [
  { textKey: "fixm.classification.ev1", sourceKey: "fixm.classification.ev1Source" },
  { textKey: "fixm.classification.ev2", sourceKey: "fixm.classification.ev2Source" },
];

export function MarketingCareerClassification() {
  const { t } = useLanguage();

  return (
    <section id="career-classification" className="relative bg-white px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Product preview */}
          <div className="order-2 lg:order-1 lg:col-span-7">
            <div className="rounded-3xl bg-white p-6 text-left ring-1 ring-[#DCE4F3] sm:p-8">
              <div className="border-b border-[#DCE4F3] pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] font-semibold text-[#204195]">{t("uxm.classification.label")}</span>
                  <span className="rounded-full bg-[#F0F4FC] px-2.5 py-0.5 text-[11px] font-semibold text-[#607096]">
                    {t("fixm.common.example")}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#204195] px-3.5 py-1 text-xs font-semibold text-white">
                    {t("fixm.classification.primary")}
                  </span>
                  <span className="rounded-full bg-[#F7F9FD] px-3.5 py-1 text-xs font-semibold text-[#14244B]">
                    {t("fixm.classification.secondary")}
                  </span>
                </div>
              </div>

              <ul className="mt-5 space-y-3">
                {EVIDENCE.map((item) => (
                  <li key={item.textKey} className="rounded-2xl bg-[#F7F9FD] p-4 text-sm">
                    <p className="font-semibold text-[#14244B]">{t(item.textKey)}</p>
                    <p className="mt-1 text-xs text-[#607096]">{t(item.sourceKey)}</p>
                  </li>
                ))}
              </ul>

              <p className="mt-5 border-t border-[#DCE4F3] pt-3 text-xs leading-relaxed text-[#607096]">
                {t("landing.classification.disclaimer")}
              </p>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 text-left lg:order-2 lg:col-span-5">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[#14244B] sm:text-4xl md:text-[44px]">
              {t("landing.classification.title")}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-[#607096] sm:text-lg">
              {t("landing.classification.desc")}
            </p>

            <a
              href="#target-job"
              className="mt-6 inline-block text-sm font-semibold text-[#204195] underline-offset-4 hover:underline"
            >
              {t("landing.targetJob.title")} →
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default MarketingCareerClassification;
