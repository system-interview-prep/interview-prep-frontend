"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Flame, CheckCircle2, Clock } from "lucide-react";
import { PROGRESS_DATA } from "../../data/landing.data";
import { fadeInReveal } from "../../motion/variants";
import { useLanguage } from "@/i18n/LanguageProvider";

export function ProgressPreview() {
  const { t } = useLanguage();

  return (
    <section id="progress-preview" className="relative px-5 py-20 sm:px-8 md:py-28 bg-[#F7F9FD] border-y border-[#DCE4F3]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto max-w-5xl text-center"
      >
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#204195]">
          GAMIFICATION & PROGRESS
        </span>

        <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl">
          {t("progress.title")}
        </h2>

        <p className="mt-3 text-base text-[#607096] max-w-xl mx-auto sm:text-lg">
          {t("progress.desc")}
        </p>

        {/* Dashboard Preview Card */}
        <div className="mt-10 rounded-3xl border border-[#DCE4F3] bg-white p-6 sm:p-10 shadow-sm text-left">
          <div className="grid gap-6 md:grid-cols-12 items-center">
            {/* Left: Overall Score & Streak Badge */}
            <div className="md:col-span-5 rounded-2xl border border-[#DCE4F3] bg-[#F7F9FD] p-6 text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FCB625]/20 border border-[#FCB625] px-3 py-1 font-mono text-xs font-bold text-[#204195]">
                <Flame className="size-4 text-[#FCB625] fill-[#FCB625]" />
                <span>{PROGRESS_DATA.streakDays}-Day Practice Streak</span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#607096]">Interview Readiness Score</span>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="font-mono text-5xl font-extrabold text-[#204195]">
                    {PROGRESS_DATA.readinessScore}
                  </span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">
                    /100
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                  <TrendingUp className="size-3.5" /> {PROGRESS_DATA.scoreIncrease}
                </p>
              </div>
            </div>

            {/* Right: Category Progress Bars */}
            <div className="md:col-span-7 space-y-4">
              <h3 className="font-sans text-base font-bold text-[#14244B]">
                {t("progress.domainProgress")}
              </h3>

              <div className="space-y-3 text-xs">
                {PROGRESS_DATA.categories.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between font-semibold text-[#14244B]">
                      <span className="flex items-center gap-1.5">
                        {cat.completed ? (
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="size-4 text-amber-500 shrink-0" />
                        )}
                        {cat.name}
                      </span>
                      <span className="font-mono font-bold text-[#204195]">{cat.progress}%</span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-[#EEF3FC] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          cat.completed ? "bg-[#204195]" : "bg-[#FCB625]"
                        }`}
                        style={{ width: `${cat.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default ProgressPreview;
