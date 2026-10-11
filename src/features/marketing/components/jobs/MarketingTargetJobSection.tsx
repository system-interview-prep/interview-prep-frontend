"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../../motion/variants";

export function MarketingTargetJobSection() {
  const { t } = useLanguage();
  const [activeRoleIndex, setActiveRoleIndex] = useState<number>(0);

  // Sample roles (illustration only, not real job posts).
  const roles = [
    {
      title: "Senior Java Backend Engineer",
      category: t("fixm.jobs.role1.category"),
      requirements: [
        { name: t("fixm.jobs.role1.req1"), matched: true },
        { name: t("fixm.jobs.role1.req2"), matched: true },
        { name: t("fixm.jobs.role1.req3"), matched: true },
        { name: t("fixm.jobs.role1.req4"), matched: false },
      ],
    },
    {
      title: "DevOps Platform Engineer",
      category: t("fixm.jobs.role2.category"),
      requirements: [
        { name: t("fixm.jobs.role2.req1"), matched: true },
        { name: t("fixm.jobs.role2.req2"), matched: true },
        { name: t("fixm.jobs.role2.req3"), matched: false },
      ],
    },
  ];

  const currentRole = roles[activeRoleIndex];
  const matchedCount = currentRole.requirements.filter((req) => req.matched).length;

  return (
    <section id="target-job" className="relative bg-[#F7F9FD] px-4 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Copy */}
          <div className="text-left lg:col-span-5">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-[#14244B] sm:text-4xl md:text-[44px]">
              {t("landing.targetJob.title")}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-[#607096] sm:text-lg">
              {t("landing.targetJob.desc")}
            </p>

            {/* Role selector */}
            <div className="mt-6 flex flex-wrap gap-2">
              {roles.map((r, idx) => (
                <button
                  key={r.title}
                  type="button"
                  onClick={() => setActiveRoleIndex(idx)}
                  aria-pressed={activeRoleIndex === idx}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                    activeRoleIndex === idx
                      ? "bg-[#204195] text-white"
                      : "bg-white text-[#607096] ring-1 ring-[#DCE4F3] hover:bg-[#EEF3FC] hover:text-[#14244B]"
                  }`}
                >
                  {r.category}
                </button>
              ))}
            </div>
          </div>

          {/* Product preview */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-white p-6 text-left ring-1 ring-[#DCE4F3] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#DCE4F3] pb-4">
                <div>
                  <span className="text-[12px] font-semibold text-[#204195]">{currentRole.category}</span>
                  <h3 className="mt-0.5 text-lg font-semibold text-[#14244B]">{currentRole.title}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F0F4FC] px-3.5 py-1 text-xs font-semibold text-[#204195]">
                    {matchedCount}/{currentRole.requirements.length} {t("fixm.jobs.matchedSuffix")}
                  </span>
                  <span className="rounded-full bg-[#F7F9FD] px-2.5 py-1 text-[11px] font-semibold text-[#607096]">
                    {t("fixm.common.example")}
                  </span>
                </div>
              </div>

              <ul className="mt-5 space-y-2.5">
                {currentRole.requirements.map((req) => (
                  <li
                    key={req.name}
                    className="flex flex-col gap-1 rounded-2xl bg-[#F7F9FD] p-3.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                  >
                    <span className="flex items-center gap-2.5 font-medium text-[#14244B]">
                      <span
                        aria-hidden="true"
                        className={`h-2 w-2 shrink-0 rounded-full ${req.matched ? "bg-[#287A4B]" : "bg-[#FCB625]"}`}
                      />
                      {req.name}
                    </span>
                    <span className={`pl-[18px] text-xs font-semibold sm:pl-0 ${req.matched ? "text-[#287A4B]" : "text-[#14244B]"}`}>
                      {req.matched ? t("uxm.match.matched") : t("uxm.match.missing")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default MarketingTargetJobSection;
