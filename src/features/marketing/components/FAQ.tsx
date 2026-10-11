"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <section id="faq" className="relative bg-[#F7F9FD] px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px] text-center"
      >
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[#14244B] sm:text-4xl md:text-[44px]">
          {t("landing.faq.title")}
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-base text-[#607096] sm:text-lg">
          {t("landing.faq.subtitle")}
        </p>

        {/* Accordion */}
        <div className="mx-auto mt-10 max-w-[840px] space-y-3 text-left">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-3xl bg-white ring-1 ring-[#DCE4F3]"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left text-[15px] font-semibold text-[#14244B] transition-colors hover:text-[#204195] sm:text-base"
                >
                  <span>{item.q}</span>
                  <span
                    aria-hidden="true"
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F7F9FD] text-lg leading-none text-[#607096] transition-transform duration-200 ${
                      isOpen ? "rotate-45 text-[#204195]" : ""
                    }`}
                  >
                    +
                  </span>
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
                      <div className="px-5 pb-5 text-sm leading-relaxed text-[#607096]">
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
