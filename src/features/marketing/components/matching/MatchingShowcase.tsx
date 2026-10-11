"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { MARKETING_EVIDENCE_MOCK } from "../../data/landing.data";
import { fadeInReveal } from "../../motion/variants";

export function MatchingShowcase() {
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const selectedItem = MARKETING_EVIDENCE_MOCK[selectedIndex];

  return (
    <section id="matching-showcase" className="relative bg-white px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Product preview */}
          <div className="order-2 text-left lg:order-1 lg:col-span-7">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-[#DCE4F3] sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE4F3] pb-4">
                <span className="min-w-0 break-words text-sm font-semibold text-[#14244B]">
                  {t("fixm.matching.fileLabel")}
                </span>
                <span className="rounded-full bg-[#F0F4FC] px-2.5 py-0.5 text-[11px] font-semibold text-[#607096]">
                  {t("fixm.common.example")}
                </span>
              </div>

              {/* Requirement list */}
              <div className="mt-5 space-y-2">
                {MARKETING_EVIDENCE_MOCK.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const isMatched = item.status === "matched";

                  return (
                    <button
                      key={item.requirement}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      aria-pressed={isSelected}
                      className={`w-full rounded-2xl p-3.5 text-left transition-colors ${
                        isSelected
                          ? "bg-[#F7F9FD] ring-2 ring-[#204195]"
                          : "bg-white ring-1 ring-[#DCE4F3] hover:bg-[#F7F9FD]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-[#14244B]">
                          {item.requirement}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            isMatched
                              ? "bg-[#287A4B]/10 text-[#287A4B]"
                              : "bg-[#FCB625]/20 text-[#14244B]"
                          }`}
                        >
                          {isMatched ? t("uxm.match.matched") : t("uxm.match.missing")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Highlighted snippet */}
              <div className="mt-5 rounded-2xl bg-[#F7F9FD] p-4 text-sm text-[#14244B]">
                <span className="text-[12px] font-semibold text-[#204195]">{t("fixm.common.sampleSnippet")}</span>
                {selectedItem.snippets.length > 0 ? (
                  <p className="mt-2 rounded-2xl border border-[#FCB625]/40 bg-[#FCB625]/20 p-3 font-medium">
                    &quot;{selectedItem.snippets[0]}&quot;
                  </p>
                ) : (
                  <p className="mt-2 rounded-2xl bg-white p-3 font-medium text-[#607096]">
                    {t("uxm.match.noSnippet")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 text-left lg:order-2 lg:col-span-5">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[#14244B] sm:text-4xl md:text-[44px]">
              {t("landing.matching.title")}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-[#607096] sm:text-lg">
              {t("landing.matching.desc")}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default MatchingShowcase;
