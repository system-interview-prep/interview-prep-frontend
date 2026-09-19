"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import { FEEDBACK_SHOWCASE_DATA } from "../../data/landing.data";
import { fadeInReveal } from "../../motion/variants";

export function MarketingFeedbackPreview() {
  return (
    <section id="feedback-preview" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-[#F7F9FD] border-b border-[#DCE4F3]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* VISUAL COLUMN LEFT (55-60% width = lg:col-span-7) */}
          <div className="lg:col-span-7 order-2 lg:order-1 text-left">
            <div className="rounded-3xl border border-[#DCE4F3] bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="border-b border-[#DCE4F3] pb-3 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#204195]">STAR SESSION REPORT</span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                  Evaluated
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* What went well */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs space-y-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" /> What went well
                  </span>
                  <p className="text-emerald-900 leading-relaxed text-[11px] pt-1">
                    Mô tả bối cảnh dự án RESTful API rõ ràng (Situation & Action).
                  </p>
                </div>

                {/* What needs evidence */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs space-y-1">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="size-3.5 text-amber-600" /> What needs evidence
                  </span>
                  <p className="text-amber-900 leading-relaxed text-[11px] pt-1">
                    Chưa bổ sung số liệu phần trăm giảm latency (Result).
                  </p>
                </div>

                {/* Practice next */}
                <div className="rounded-xl border border-[#DCE4F3] bg-[#F7F9FD] p-3.5 text-xs space-y-1">
                  <span className="font-bold text-[#204195] flex items-center gap-1.5">
                    <ArrowUpRight className="size-3.5 text-[#204195]" /> Practice next
                  </span>
                  <p className="text-[#14244B] leading-relaxed text-[11px] pt-1">
                    Luyện câu hỏi Trade-off System Design & số liệu định lượng.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TEXT COLUMN RIGHT (40-45% width = lg:col-span-5) */}
          <div className="lg:col-span-5 order-1 lg:order-2 text-left">
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl leading-tight">
              {FEEDBACK_SHOWCASE_DATA.headline}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-[#607096] sm:text-lg">
              {FEEDBACK_SHOWCASE_DATA.body}
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default MarketingFeedbackPreview;
