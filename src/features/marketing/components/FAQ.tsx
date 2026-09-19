"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { FAQ_ITEMS } from "../data/landing.data";
import { fadeInReveal, EASE_CUSTOM } from "../motion/variants";

export function FAQ() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-[#F7F9FD] border-t border-[#DCE4F3]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px] text-center"
      >
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#204195]">
          {t("landing.faq.eyebrow")}
        </span>

        <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl">
          {t("landing.faq.title")}
        </h2>

        <p className="mt-3 text-base text-[#607096] max-w-xl mx-auto sm:text-lg">
          {t("landing.faq.subtitle")}
        </p>

        {/* Accordion List centered within container */}
        <div className="mt-10 mx-auto max-w-[840px] space-y-3 text-left">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#DCE4F3] bg-white transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 font-sans text-base font-bold text-[#14244B] text-left hover:text-[#204195] cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="size-5 text-[#204195] shrink-0" />
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`size-5 text-[#607096] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#204195]" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: EASE_CUSTOM }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#DCE4F3] p-5 pt-3 text-sm leading-relaxed text-[#607096]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

export default FAQ;
