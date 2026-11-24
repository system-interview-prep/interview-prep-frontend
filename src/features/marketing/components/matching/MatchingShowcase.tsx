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
    <section id="matching-showcase" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-[#F7F9FD] border-b border-[#E7ECF5]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* VISUAL COLUMN LEFT (60% width = lg:col-span-7) */}
          <div className="lg:col-span-7 order-2 lg:order-1 text-left">
            <div className="rounded-3xl border border-[#DCE4F3] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-4">
                <span className="font-mono text-xs font-bold text-[#204195]">
                  Nguyen_Van_A_Resume.pdf ↔ JD Requirements
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 font-mono text-[11px] font-bold text-emerald-800">
                  {t("landing.matching.eyebrow")}
                </span>
              </div>

              {/* Requirement Clickable List */}
              <div className="mt-5 space-y-2">
                {MARKETING_EVIDENCE_MOCK.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const isMatched = item.status === "matched";

                  return (
                    <button
                      key={item.requirement}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#204195] bg-[#EEF3FC] shadow-xs"
                          : "border-[#DCE4F3] bg-white hover:border-[#204195]/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-sans text-xs font-bold text-[#14244B]">
                          {item.requirement}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                            isMatched
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isMatched ? "Matched" : "Missing Evidence"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Highlighted Snippet Box */}
              <div className="mt-5 rounded-2xl border border-[#DCE4F3] bg-[#F7F9FD] p-4 text-xs font-sans text-[#14244B]">
                <span className="font-mono text-[10px] font-bold text-[#607096] uppercase">CV Snippet Highlight</span>
                {selectedItem.snippets.length > 0 ? (
                  <p className="mt-2 font-medium bg-[#FCB625]/20 border border-[#FCB625]/40 p-3 rounded-xl">
                    &quot;{selectedItem.snippets[0]}&quot;
                  </p>
                ) : (
                  <p className="mt-2 font-medium bg-amber-50 text-amber-900 border border-amber-200 p-3 rounded-xl">
                    No evidence snippet located in CV for this requirement.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* TEXT COLUMN RIGHT (40% width = lg:col-span-5) */}
          <div className="lg:col-span-5 order-1 lg:order-2 text-left">
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl leading-tight">
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

