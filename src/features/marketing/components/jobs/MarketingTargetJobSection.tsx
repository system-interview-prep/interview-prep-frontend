"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fadeInReveal } from "../../motion/variants";

export function MarketingTargetJobSection() {
  const { t } = useLanguage();
  const [activeRoleIndex, setActiveRoleIndex] = useState<number>(0);

  const roles = [
    {
      title: "Senior Java Backend Engineer",
      category: "Backend Development",
      matchScore: "6/8 Matches",
      requirements: [
        { name: "RESTful APIs Spring Boot Microservices", matched: true },
        { name: "AWS EC2 & S3 Cloud Deployment", matched: true },
        { name: "PostgreSQL Query Optimization", matched: true },
        { name: "Kubernetes Cluster Management", matched: false },
      ],
    },
    {
      title: "DevOps Platform Engineer",
      category: "Platform Engineering",
      matchScore: "5/7 Matches",
      requirements: [
        { name: "CI/CD Automation Pipelines", matched: true },
        { name: "Docker Containerization", matched: true },
        { name: "Terraform Infrastructure as Code", matched: false },
      ],
    },
  ];

  const currentRole = roles[activeRoleIndex];

  return (
    <section id="target-job" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-white border-b border-[#E7ECF5]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* TEXT COLUMN LEFT (40-45% width = lg:col-span-5) */}
          <div className="lg:col-span-5 text-left">
            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl leading-tight">
              {t("landing.targetJob.title")}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-[#607096] sm:text-lg">
              {t("landing.targetJob.desc")}
            </p>

            {/* Role Selector Tabs under text / visual */}
            <div className="mt-6 flex flex-wrap gap-2">
              {roles.map((r, idx) => (
                <button
                  key={r.title}
                  type="button"
                  onClick={() => setActiveRoleIndex(idx)}
                  className={`px-3.5 py-1.5 rounded-xl font-sans text-xs font-bold transition-all cursor-pointer ${
                    activeRoleIndex === idx
                      ? "bg-[#204195] text-white shadow-xs"
                      : "bg-[#F7F9FD] border border-[#DCE4F3] text-[#607096] hover:text-[#204195]"
                  }`}
                >
                  {r.category}
                </button>
              ))}
            </div>
          </div>

          {/* VISUAL COLUMN RIGHT (55-60% width = lg:col-span-7) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-[#DCE4F3] bg-[#F7F9FD] p-6 sm:p-8 shadow-xs text-left">
              <div className="flex items-center justify-between border-b border-[#DCE4F3] pb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#607096] uppercase">{currentRole.category}</span>
                  <h3 className="font-sans text-lg font-bold text-[#14244B] mt-0.5">{currentRole.title}</h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF3FC] border border-[#DCE4F3] px-3 py-1 font-mono text-xs font-bold text-[#204195]">
                  <Sparkles className="size-3 text-[#FCB625]" /> {currentRole.matchScore}
                </span>
              </div>

              {/* Requirement Checklist State */}
              <div className="mt-5 space-y-2.5">
                {currentRole.requirements.map((req) => (
                  <div
                    key={req.name}
                    className={`flex items-center justify-between rounded-xl p-3 text-xs font-medium border ${
                      req.matched
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                        : "bg-amber-50/80 border-amber-200 text-amber-950"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {req.matched ? (
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="size-4 text-amber-600 shrink-0" />
                      )}
                      {req.name}
                    </span>
                    <span className={`font-mono text-[10px] font-bold ${req.matched ? "text-emerald-700" : "text-amber-700"}`}>
                      {req.matched ? "Đã khớp" : "Thiếu minh chứng"}
                    </span>
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

export default MarketingTargetJobSection;

