"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { PRODUCT_MANUAL_TABS } from "../../data/landing.data";
import { fadeInReveal, EASE_CUSTOM } from "../../motion/variants";

export function ProductWalkthrough() {
  const { t } = useLanguage();
  const [activeStepId, setActiveStepId] = useState("upload");

  const currentStep = PRODUCT_MANUAL_TABS.find((tab) => tab.id === activeStepId) || PRODUCT_MANUAL_TABS[0];

  const previewBox = "rounded-2xl bg-[#F7F9FD] p-4";

  return (
    <section id="how-to-use" className="relative scroll-mt-20 bg-white px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid items-start gap-12 lg:grid-cols-12">
          {/* Steps */}
          <div className="space-y-2.5 text-left lg:col-span-5">
            <h2 className="mb-6 font-display text-3xl font-semibold leading-tight tracking-tight text-[#14244B] sm:text-4xl md:text-[44px]">
              {t("landing.walkthrough.title")}
            </h2>

            {PRODUCT_MANUAL_TABS.map((step) => {
              const isActive = step.id === activeStepId;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  aria-pressed={isActive}
                  className={`block w-full rounded-2xl p-4 text-left transition-colors ${
                    isActive
                      ? "bg-[#F7F9FD] ring-2 ring-[#204195]"
                      : "bg-white ring-1 ring-[#DCE4F3] hover:bg-[#F7F9FD]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`font-display text-lg font-semibold ${isActive ? "text-[#204195]" : "text-[#8A98B8]"}`}
                    >
                      {step.stepNumber}
                    </span>
                    <span className="text-[15px] font-semibold text-[#14244B]">{step.title}</span>
                  </span>

                  {isActive && (
                    <span className="mt-2 block pl-9 text-sm leading-relaxed text-[#607096]">
                      {step.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div className="lg:sticky lg:top-28 lg:col-span-7">
            <div className="flex min-h-[300px] flex-col rounded-3xl bg-white p-6 text-left ring-1 ring-[#DCE4F3] sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE4F3] pb-3">
                <span className="text-[12px] font-semibold text-[#204195]">
                  {t("uxm.walk.preview")} {currentStep.stepNumber}
                </span>
                <span className="flex items-center gap-2 text-[12px] text-[#607096]">
                  <span>
                    {t("uxm.walk.estimate")} {currentStep.timeEstimate}
                  </span>
                  <span className="rounded-full bg-[#F0F4FC] px-2.5 py-0.5 text-[11px] font-semibold">
                    {t("fixm.common.example")}
                  </span>
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: EASE_CUSTOM }}
                  className="my-6 space-y-3 text-sm"
                >
                  {currentStep.id === "upload" && (
                    <div className={previewBox}>
                      <p className="font-semibold text-[#14244B]">{t("fixm.walk.upload.title")}</p>
                      <p className="mt-1 text-[#607096]">{t("fixm.walk.upload.desc")}</p>
                    </div>
                  )}

                  {currentStep.id === "match" && (
                    <div className={previewBox}>
                      <p className="font-semibold text-[#14244B]">{t("fixm.walk.match.title")}</p>
                      <p className="mt-1 text-[#607096]">{t("fixm.walk.match.desc")}</p>
                    </div>
                  )}

                  {currentStep.id === "understand" && (
                    <div className={previewBox}>
                      <p className="font-semibold text-[#287A4B]">{t("fixm.walk.understand.title")}</p>
                      <p className="mt-1 font-semibold text-[#204195]">{t("fixm.walk.understand.desc")}</p>
                    </div>
                  )}

                  {currentStep.id === "practice" && (
                    <div className="rounded-2xl bg-[#14244B] p-4 text-white">
                      <p className="font-semibold text-[#FCB625]">{t("fixm.walk.practice.title")}</p>
                      <p className="mt-1 text-white/80">{t("fixm.walk.practice.desc")}</p>
                    </div>
                  )}

                  {currentStep.id === "improve" && (
                    <div className={previewBox}>
                      <p className="font-semibold text-[#14244B]">{t("fixm.walk.improve.title")}</p>
                      <p className="mt-1 text-[#287A4B]">{t("fixm.walk.improve.desc")}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default ProductWalkthrough;
