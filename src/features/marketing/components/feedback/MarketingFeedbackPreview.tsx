"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { FEEDBACK_SHOWCASE_DATA } from "../../data/landing.data";
import { fadeInReveal } from "../../motion/variants";

export function MarketingFeedbackPreview() {
  const { t } = useLanguage();

  const notes = [
    {
      label: t("uxm.feedback.well"),
      body: "Mô tả bối cảnh dự án RESTful API rõ ràng (Situation & Action).",
      tone: "bg-[#287A4B]/10 text-[#14244B]",
    },
    {
      label: t("uxm.feedback.evidence"),
      body: "Chưa bổ sung số liệu phần trăm giảm latency (Result).",
      tone: "bg-[#FCB625]/15 text-[#14244B]",
    },
    {
      label: t("uxm.feedback.next"),
      body: "Luyện câu hỏi Trade-off System Design & số liệu định lượng.",
      tone: "bg-[#F7F9FD] text-[#14244B]",
    },
  ];

  return (
    <section id="feedback-preview" className="relative bg-[#F7F9FD] px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Report preview */}
          <div className="order-2 text-left lg:order-1 lg:col-span-7">
            <div className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-[#DCE4F3] sm:p-8">
              <div className="flex items-center justify-between gap-3 border-b border-[#DCE4F3] pb-3">
                <span className="text-sm font-semibold text-[#14244B]">{t("uxm.feedback.report")}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#F0F4FC] px-2.5 py-0.5 text-[11px] font-semibold text-[#607096]">
                    {t("fixm.common.example")}
                  </span>
                  <span className="rounded-full bg-[#287A4B]/10 px-3 py-0.5 text-[11px] font-semibold text-[#287A4B]">
                    {t("uxm.feedback.done")}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {notes.map((note) => (
                  <div key={note.label} className={`rounded-2xl p-4 ${note.tone}`}>
                    <p className="text-[13px] font-semibold">{note.label}</p>
                    <p className="pt-1.5 text-[13px] leading-relaxed opacity-90">{note.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="order-1 text-left lg:order-2 lg:col-span-5">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[#14244B] sm:text-4xl md:text-[44px]">
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
