"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Sparkles, CheckCircle2, Volume2, UserCheck, Shield } from "lucide-react";
import { VoiceWaveform, type VoiceOrbState } from "@features/interview/components/VoiceWaveform";
import { useLanguage } from "@/i18n/LanguageProvider";
import { INTERVIEW_SHOWCASE_DATA } from "../../data/landing.data";
import { fadeInReveal } from "../../motion/variants";

import { useMascot } from "@features/mascot/MascotContext";

export function InterviewExperience() {
  const { t } = useLanguage();
  const { setActiveScene } = useMascot();
  const [orbState, setOrbState] = useState<VoiceOrbState>("speaking");
  const sectionRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveScene("interview");
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [setActiveScene]);

  const evidenceDetected = [
    { label: "RESTful Architecture", status: "verified" },
    { label: "Spring Boot Microservices", status: "verified" },
    { label: "AWS EC2 / S3 Cloud", status: "verified" },
    { label: "PostgreSQL Query Tuning", status: "gap" },
  ];

  return (
    <section ref={sectionRef} id="interview-experience" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-[#204195] text-white overflow-hidden border-b border-white/10">
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-[#FCB625]/15 blur-[150px]" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="relative z-10 mx-auto w-full max-w-[1320px]"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* TEXT COLUMN LEFT (42% width = lg:col-span-5) */}
          <div data-mascot-anchor="interview" className="lg:col-span-5 text-left space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3.5 py-1 font-mono text-xs font-bold text-[#FCB625]">
              <Sparkles className="size-3.5" /> {t("landing.interviewExp.eyebrow")}
            </span>

            <h2 className="font-sans text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl leading-tight">
              {t("landing.interviewExp.title")}
            </h2>

            <p className="text-base leading-relaxed text-white/80 sm:text-lg">
              {t("landing.interviewExp.desc")}
            </p>

            {/* Evidence Detected Chips */}
            <div className="pt-2 space-y-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FCB625]">
                Real-Time Evidence Extraction
              </span>
              <div className="flex flex-wrap gap-2">
                {evidenceDetected.map((ev) => (
                  <span
                    key={ev.label}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold ${
                      ev.status === "verified"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5" />
                    {ev.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Voice state selector pills */}
            <div className="pt-4 flex flex-wrap items-center gap-2">
              {(["speaking", "listening", "thinking", "idle"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrbState(st)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    orbState === st
                      ? "bg-[#FCB625] text-[#204195] shadow-md"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {st === "speaking" ? "AI Coach Speaking" : st === "listening" ? "Candidate Answering" : st === "thinking" ? "AI Analyzing" : "Idle"}
                </button>
              ))}
            </div>
          </div>

          {/* INTERVIEW CINEMATIC VISUAL RIGHT (58% width = lg:col-span-7) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
              {/* Header Bar: Candidate vs AI Avatar */}
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-white text-xs">
                    <UserCheck className="size-5 text-[#FCB625]" />
                  </div>
                  <div className="text-left">
                    <span className="font-mono text-[10px] text-white/60 uppercase block">Candidate Session</span>
                    <h4 className="text-xs font-bold text-white">Nguyen Van A · Senior Backend Role</h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-[#FCB625] text-[#204195] px-3 py-1 rounded-full font-mono text-xs font-extrabold">
                  <Volume2 className="size-3.5 animate-pulse" /> LIVE WEBRTC
                </div>
              </div>

              {/* Central Waveform Component */}
              <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-2xl border border-white/10">
                <VoiceWaveform state={orbState} />
                <span className="mt-3 font-mono text-[11px] text-[#FCB625] tracking-widest uppercase">
                  ▁▂▃▅▇▆▃▂▅▇▅▃▁
                </span>
              </div>

              {/* Target Question & Live Transcript */}
              <div className="rounded-2xl bg-black/30 border border-white/15 p-4 text-left space-y-3">
                <div className="flex items-center justify-between font-mono text-[10px] text-[#FCB625] font-bold">
                  <span>AI QUESTION #{INTERVIEW_SHOWCASE_DATA.questionNumber}</span>
                  <span>STAR TRANSCRIPT REVEAL</span>
                </div>
                <p className="font-sans text-sm font-bold text-white leading-relaxed">
                  &quot;{INTERVIEW_SHOWCASE_DATA.questionText}&quot;
                </p>

                {/* Candidate Response Transcript */}
                <div className="mt-2 pt-2 border-t border-white/10 text-xs font-mono text-white/80 leading-relaxed bg-white/5 p-3 rounded-xl">
                  <span className="text-[#FCB625] font-bold mr-2">Candidate Response:</span>
                  &quot;Trong dự án gần nhất, tôi đã tối ưu hóa truy vấn SQL bằng cách thêm compound index và triển khai Redis caching layer...&quot;
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


