"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import CareerJourneyMorph from "../../graphics/CareerJourneyMorph";
import { CAREER_JOURNEY_STEPS } from "../../data/landing.data";
import { EASE_CUSTOM, fadeInReveal } from "../../motion/variants";

export function CareerJourney() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="career-journey" className="relative px-5 py-20 sm:px-8 md:py-28 bg-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto max-w-6xl"
      >
        <div className="text-center flex flex-col items-center">
          <CareerJourneyMorph activeStepIndex={activeStep} size={48} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#204195] mt-3">
            PRODUCT JOURNEY
          </span>
          <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl">
            Your path to interview-ready
          </h2>
          <p className="mt-3 text-base text-[#607096] sm:text-lg">
            Hành trình từng bước giúp bạn chuẩn bị kỹ lưỡng từ hồ sơ đến phản xạ phỏng vấn thực tế.
          </p>
        </div>


        {/* Desktop Layout: Left Controls + Right Dynamic Product Preview */}
        <div className="mt-14 hidden md:grid md:grid-cols-12 md:gap-8 items-start">
          {/* Left Column: Interactive Step Selector List */}
          <div className="md:col-span-5 space-y-3">
            {CAREER_JOURNEY_STEPS.map((item, idx) => {
              const isActive = activeStep === idx;

              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-[#204195] bg-[#F7F9FD] shadow-sm"
                      : "border-[#DCE4F3] bg-white hover:border-[#204195]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-xl font-mono text-xs font-bold ${
                          isActive
                            ? "bg-[#204195] text-white"
                            : "bg-[#EEF3FC] text-[#204195]"
                        }`}
                      >
                        {item.step}
                      </span>
                      <h3 className="font-sans text-base font-bold text-[#14244B]">
                        {item.title}
                      </h3>
                    </div>
                    {isActive && (
                      <span className="rounded-full bg-[#FCB625]/20 border border-[#FCB625] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#204195]">
                        {item.highlight}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <p className="mt-3 text-xs leading-relaxed text-[#607096] pl-11">
                      {item.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Step Interactive UI Display */}
          <div className="md:col-span-7 sticky top-24 rounded-3xl border border-[#DCE4F3] bg-[#F7F9FD] p-6 shadow-sm min-h-[420px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#204195]">
                  STEP {CAREER_JOURNEY_STEPS[activeStep].step} / 06
                </span>
                <span className="text-xs text-[#607096]">•</span>
                <span className="text-xs font-medium text-[#14244B]">
                  {CAREER_JOURNEY_STEPS[activeStep].title}
                </span>
              </div>
              <span className="rounded-md bg-white border border-[#DCE4F3] px-2.5 py-1 font-mono text-[11px] font-bold text-[#204195]">
                {CAREER_JOURNEY_STEPS[activeStep].highlight}
              </span>
            </div>

            {/* Render Visual Preview per Active Step */}
            <div className="my-auto py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: EASE_CUSTOM }}
                  className="rounded-2xl border border-[#DCE4F3] bg-white p-6 shadow-xs text-left"
                >
                  {activeStep === 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EEF3FC] text-[#204195]">
                          <Upload className="size-5 text-[#204195]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#14244B]">Resume_Backend_2026.pdf</p>
                          <p className="text-xs text-[#607096]">Parsed 4 Sections · 14 Projects</p>
                        </div>
                      </div>
                      <div className="rounded-xl bg-[#F7F9FD] p-3 text-xs space-y-1.5 font-mono text-[#14244B]">
                        <p>✓ Extracted: 4.5 Years Software Development</p>
                        <p>✓ Key Stack: Java 17, Spring Boot, Microservices</p>
                        <p>✓ Cloud Evidence: AWS EC2, S3, Docker Containerization</p>
                      </div>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#204195] uppercase tracking-wider">Target Job Description</span>
                        <span className="font-mono text-[11px] text-[#607096]">Link Attached</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#14244B]">Senior Backend Developer — FinTech Platform</h4>
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#EEF3FC] border border-[#DCE4F3] text-[#204195]">
                          <strong>Must Have:</strong> Spring Boot, REST APIs, Microservices, SQL Optimization
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#F7F9FD] border border-[#DCE4F3] text-[#607096]">
                          <strong>Nice to Have:</strong> Kubernetes Cluster Management, Redis Caching
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="text-center space-y-3">
                      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#204195] text-white shadow-md">
                        <span className="font-mono text-2xl font-bold">87%</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#14244B]">Semantic Match Calculated</h4>
                      <p className="text-xs text-[#607096] max-w-sm mx-auto">
                        Hồ sơ của bạn đạt mức độ tương thích cao với 6 bằng chứng đáp ứng trực tiếp tiêu chuẩn vị trí.
                      </p>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                        <span>✓ REST API Spring Boot</span>
                        <span className="font-mono font-bold">14 APIs Evidence</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                        <span>△ Cloud Deployment (AWS)</span>
                        <span className="font-mono font-bold">Partial Evidence</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
                        <span>✕ Kubernetes Cluster Management</span>
                        <span className="font-mono font-bold">Gap Detected</span>
                      </div>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#204195]">AI Interviewer Stage</span>
                        <span className="rounded-full bg-[#FCB625] px-2 py-0.5 text-[10px] font-extrabold text-[#204195]">Voice WebRTC</span>
                      </div>
                      <p className="text-xs font-semibold text-[#14244B]">
                        &quot;Q03: Bạn đã từng giải quyết bài toán nghẽn cổ chai SQL trong Spring Boot như thế nào?&quot;
                      </p>
                      <div className="flex items-center justify-center gap-1 py-2">
                        {[30, 60, 90, 45, 80, 55, 70, 40].map((h, i) => (
                          <span key={i} className="w-1.5 rounded-full bg-[#204195]" style={{ height: `${h * 0.3}px` }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {activeStep === 5 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#204195]">Post-Interview Feedback</span>
                        <span className="font-mono text-xs font-bold text-emerald-600">STAR Evaluated</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-[#F7F9FD] rounded-lg border border-[#DCE4F3]">
                          <p className="text-[10px] text-[#607096]">STAR Score</p>
                          <p className="font-bold text-[#204195]">88 / 100</p>
                        </div>
                        <div className="p-2 bg-[#F7F9FD] rounded-lg border border-[#DCE4F3]">
                          <p className="text-[10px] text-[#607096]">Filler Words</p>
                          <p className="font-bold text-emerald-600">2 words/min</p>
                        </div>
                        <div className="p-2 bg-[#F7F9FD] rounded-lg border border-[#DCE4F3]">
                          <p className="text-[10px] text-[#607096]">Readiness</p>
                          <p className="font-bold text-[#204195]">+8 pts</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="border-t border-[#DCE4F3] pt-3 text-xs font-medium text-[#607096]">
              {CAREER_JOURNEY_STEPS[activeStep].description}
            </div>
          </div>
        </div>

        {/* Mobile Fallback: Stacked Step List */}
        <div className="mt-10 space-y-4 md:hidden text-left">
          {CAREER_JOURNEY_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#EEF3FC] font-mono text-xs font-bold text-[#204195]">
                  {item.step}
                </span>
                <span className="rounded-full bg-[#FCB625]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#204195]">
                  {item.highlight}
                </span>
              </div>
              <h3 className="mt-3 font-sans text-base font-bold text-[#14244B]">
                {item.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#607096]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export default CareerJourney;
