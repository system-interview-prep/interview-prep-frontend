"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { VoiceWaveform, type VoiceOrbState } from "@features/interview/components/VoiceWaveform";
import { useLanguage } from "@/i18n/LanguageProvider";
import { INTERVIEW_SHOWCASE_DATA } from "../../data/landing.data";
import { fadeInReveal } from "../../motion/variants";

export function InterviewExperience() {
  const { t } = useLanguage();
  const [orbState, setOrbState] = useState<VoiceOrbState>("speaking");

  const evidenceDetected = [
    { label: t("fixm.interview.chip1"), status: "verified" },
    { label: t("fixm.interview.chip2"), status: "verified" },
    { label: t("fixm.interview.chip3"), status: "verified" },
    { label: t("fixm.interview.chip4"), status: "gap" },
  ];

  const stateLabel: Record<VoiceOrbState, string> = {
    speaking: t("uxm.interview.state.speaking"),
    listening: t("uxm.interview.state.listening"),
    thinking: t("uxm.interview.state.thinking"),
    idle: t("uxm.interview.state.idle"),
  };

  return (
    <section id="interview-experience" className="relative overflow-hidden bg-[#204195] px-4 py-14 text-white sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="relative z-10 mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Copy */}
          <div className="space-y-6 text-left lg:col-span-5">
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-[44px]">
              {t("landing.interviewExp.title")}
            </h2>

            <p className="text-base leading-relaxed text-white/75 sm:text-lg">
              {t("landing.interviewExp.desc")}
            </p>

            {/* Evidence picked up while answering */}
            <div className="space-y-2.5 pt-2">
              <p className="text-[12px] font-semibold text-[#FCB625]">
                {t("uxm.interview.evidenceLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {evidenceDetected.map((ev) => (
                  <span
                    key={ev.label}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                      ev.status === "verified"
                        ? "bg-white/10 text-white"
                        : "bg-[#FCB625]/20 text-[#FCB625]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${ev.status === "verified" ? "bg-[#287A4B]" : "bg-[#FCB625]"}`}
                    />
                    {ev.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Voice state selector */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {(["speaking", "listening", "thinking", "idle"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrbState(st)}
                  aria-pressed={orbState === st}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    orbState === st
                      ? "bg-[#FCB625] text-[#14244B]"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {stateLabel[st]}
                </button>
              ))}
            </div>
          </div>

          {/* Room preview */}
          <div className="lg:col-span-7">
            <div className="space-y-6 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="text-left">
                  <p className="text-[12px] text-white/60">{t("uxm.interview.session")}</p>
                  <p className="text-sm font-semibold text-white">{t("fixm.interview.sessionRole")}</p>
                </div>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  {t("fixm.common.example")}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl bg-black/20 py-6">
                <VoiceWaveform state={orbState} />
                <p className="mt-3 text-[12px] font-semibold text-[#FCB625]">{stateLabel[orbState]}</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-black/25 p-4 text-left">
                <p className="text-[12px] font-semibold text-[#FCB625]">
                  {t("uxm.interview.question")} {INTERVIEW_SHOWCASE_DATA.questionNumber}
                </p>
                <p className="text-sm font-semibold leading-relaxed text-white">
                  &quot;{INTERVIEW_SHOWCASE_DATA.questionText}&quot;
                </p>

                <div className="mt-2 rounded-2xl bg-white/5 p-3 text-xs leading-relaxed text-white/80">
                  <span className="mr-2 font-semibold text-[#FCB625]">{t("uxm.interview.answerLabel")}</span>
                  &quot;{t("fixm.interview.sampleAnswer")}&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default InterviewExperience;
