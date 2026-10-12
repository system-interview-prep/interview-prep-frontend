"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Info, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../../motion/variants";

export function MarketingCareerClassification() {
  const { t } = useLanguage();

  return (
    <section id="career-classification" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-[#F7F9FD] border-b border-[#E7ECF5]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* VISUAL COLUMN LEFT (55-60% width = lg:col-span-7) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div className="rounded-3xl border border-[#DCE4F3] bg-white p-6 sm:p-8 shadow-xs text-left">
              <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#607096] uppercase tracking-wider">Inferred Specialization</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#204195] px-3 py-1 text-xs font-extrabold text-white">
                      Backend Engineering
                    </span>
                    <span className="rounded-xl bg-[#EEF3FC] border border-[#DCE4F3] px-3 py-1 font-mono text-xs font-bold text-[#204195]">
                      Platform / Microservices
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Evidence Items */}
              <div className="mt-5 space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F7F9FD] border border-[#DCE4F3] text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[#14244B]">
                    <CheckCircle2 className="size-4 text-[#204195] shrink-0" />
                    <span>Designed & operated 14 RESTful APIs with Spring Boot microservices</span>
                  </div>
                  <p className="font-mono text-[10px] text-[#607096] pl-6">Direct CV Evidence · Enterprise Projects</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F9FD] border border-[#DCE4F3] text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[#14244B]">
                    <CheckCircle2 className="size-4 text-[#204195] shrink-0" />
                    <span>Optimized PostgreSQL indexing handling 100k queries/min</span>
                  </div>
                  <p className="font-mono text-[10px] text-[#607096] pl-6">Database Evidence · Page 2</p>
                </div>
              </div>

              {/* Subtle Disclaimer Microcopy */}
              <div className="mt-5 pt-3 border-t border-[#DCE4F3] flex items-center gap-2 text-[11px] text-[#607096]">
                <Info className="size-3.5 text-[#204195] shrink-0" />
                <span>{t("landing.classification.disclaimer")}</span>
              </div>
            </div>
          </div>

          {/* TEXT COLUMN RIGHT (40-45% width = lg:col-span-5) */}
          <div className="lg:col-span-5 text-left order-1 lg:order-2">
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl leading-tight">
              {t("landing.classification.title")}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-[#607096] sm:text-lg">
              {t("landing.classification.desc")}
            </p>

            <div className="mt-6">
              <a
                href="#target-job"
                className="inline-flex items-center gap-2 font-sans text-sm font-bold text-[#204195] hover:text-[#183275] cursor-pointer"
              >
                <span>{t("landing.targetJob.title")}</span>
                <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default MarketingCareerClassification;

