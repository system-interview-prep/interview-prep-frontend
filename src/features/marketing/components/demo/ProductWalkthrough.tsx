"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { PRODUCT_MANUAL_TABS } from "../../data/landing.data";
import { fadeInReveal, EASE_CUSTOM } from "../../motion/variants";
import type { MascotMood } from "@features/mascot/types";
import { useMascot } from "@features/mascot/MascotContext";

export function ProductWalkthrough() {
  const { t } = useLanguage();
  const { setActiveScene } = useMascot();
  const [activeStepId, setActiveStepId] = useState("upload");
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  const currentStep = PRODUCT_MANUAL_TABS.find((t) => t.id === activeStepId) || PRODUCT_MANUAL_TABS[0];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInView(entry.isIntersecting);
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView) {
      setActiveScene(`how-${activeStepId}`);
    }
  }, [isInView, activeStepId, setActiveScene]);

  return (
    <section ref={sectionRef} id="how-to-use" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-[#F7F9FD] border-b border-[#DCE4F3]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* STEPS LIST LEFT (40% width = lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-3 text-left">
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl leading-tight mb-6">
              {t("landing.walkthrough.title")}
            </h2>

            {PRODUCT_MANUAL_TABS.map((step) => {
              const isActive = step.id === activeStepId;
              return (
                <div
                  key={step.id}
                  data-mascot-anchor={`how-${step.id}`}
                  onClick={() => setActiveStepId(step.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${isActive
                      ? "bg-white border-[#204195] shadow-sm ring-1 ring-[#204195]"
                      : "bg-[#F7F9FD] border-[#DCE4F3] hover:border-[#204195]/30"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg ${isActive ? "bg-[#204195] text-white" : "bg-[#EEF3FC] text-[#204195]"
                        }`}
                    >
                      {step.stepNumber}
                    </span>
                    <h3 className="font-sans text-sm font-bold text-[#14244B]">{step.title}</h3>
                  </div>

                  {isActive && (
                    <p className="mt-2 text-xs text-[#607096] leading-relaxed pl-9">
                      {step.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* LARGE VISUAL PREVIEW RIGHT (60% width = lg:col-span-7) */}
          <div className="lg:col-span-7 sticky top-28">
            <div className="rounded-3xl border border-[#DCE4F3] bg-white p-6 sm:p-10 shadow-xs min-h-[320px] flex flex-col justify-between text-left">
              <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-3">
                <span className="font-mono text-xs font-bold text-[#204195] uppercase">
                  Step {currentStep.stepNumber} Preview
                </span>
                <span className="font-mono text-[11px] text-[#607096]">Estimate: {currentStep.timeEstimate}</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: EASE_CUSTOM }}
                  className="my-6 space-y-3 font-mono text-xs"
                >
                  {currentStep.id === "upload" && (
                    <div className="p-4 bg-[#F7F9FD] rounded-xl border border-[#DCE4F3]">
                      <p className="font-bold text-[#204195]">CV Uploaded: Nguyen_Van_A.pdf</p>
                      <p className="text-[#607096] mt-1">14 backend projects & Spring Boot skills parsed</p>
                    </div>
                  )}

                  {currentStep.id === "match" && (
                    <div className="p-4 bg-[#F7F9FD] rounded-xl border border-[#DCE4F3]">
                      <p className="font-bold text-[#204195]">Target Role: Senior Java Backend</p>
                      <p className="text-[#607096] mt-1">Extracted 8 core requirements from JD</p>
                    </div>
                  )}

                  {currentStep.id === "understand" && (
                    <div className="p-4 bg-[#F7F9FD] rounded-xl border border-[#DCE4F3]">
                      <p className="font-bold text-emerald-700">6 Requirements Matched with CV Snippets</p>
                      <p className="font-bold text-amber-700 mt-1">1 Evidence Gap Identified for Prep</p>
                    </div>
                  )}

                  {currentStep.id === "practice" && (
                    <div className="p-4 bg-[#204195] text-white rounded-xl">
                      <p className="font-bold text-[#FCB625]">Voice WebRTC Active</p>
                      <p className="text-white/80 mt-1">AI Coach asking Q03 / Real-time voice practice</p>
                    </div>
                  )}

                  {currentStep.id === "improve" && (
                    <div className="p-4 bg-[#F7F9FD] rounded-xl border border-[#DCE4F3]">
                      <p className="font-bold text-[#204195]">STAR Evaluation Report Generated</p>
                      <p className="text-emerald-700 mt-1">Readiness Score: 84 / Practical STAR action points</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="pt-3 border-t border-[#DCE4F3] text-[11px] text-[#607096]">
                INTERVIA Engine · Transparent Evidence-First Pipeline
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default ProductWalkthrough;
