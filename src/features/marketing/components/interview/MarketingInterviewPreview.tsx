"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Mic, Volume2, CheckCircle2, AlertCircle } from "lucide-react";
import { VoiceWaveform, type VoiceOrbState } from "@features/interview/components/VoiceWaveform";
import { INTERVIEW_SHOWCASE_DATA } from "../../data/landing.data";

export function MarketingInterviewPreview() {
  const [orbState, setOrbState] = useState<VoiceOrbState>("speaking");
  const shouldReduceMotion = useReducedMotion();

  const stateLabels: Record<VoiceOrbState, string> = {
    idle: "Sẵn sàng",
    listening: "Ứng viên đang nói (Listening)",
    thinking: "AI Phân tích (Thinking)",
    speaking: "AI Coach đang trả lời (Speaking)",
  };

  return (
    <div className="w-full rounded-3xl border border-white/20 bg-white/5 backdrop-blur-xl p-6 sm:p-10 shadow-2xl relative text-white">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-left">
        <div>
          <span className="font-mono text-xs font-bold text-[#FCB625] uppercase tracking-wider">
            DEMO INTERVIEW · Question {INTERVIEW_SHOWCASE_DATA.questionNumber}
          </span>
          <h3 className="text-sm font-bold text-white mt-0.5">
            {INTERVIEW_SHOWCASE_DATA.roleTitle}
          </h3>
        </div>

        {/* State Toggle Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["speaking", "listening", "thinking", "idle"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setOrbState(st)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                orbState === st
                  ? "bg-[#FCB625] text-[#204195]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {st === "speaking" ? "AI Speaking" : st === "listening" ? "Candidate Voice" : st === "thinking" ? "Thinking" : "Idle"}
            </button>
          ))}
        </div>
      </div>

      {/* Central Stage: Voice Orb & Question Box */}
      <div className="my-8 flex flex-col items-center justify-center">
        <VoiceWaveform state={orbState} />

        {/* Question Text Box */}
        <div className="mt-8 max-w-2xl rounded-2xl bg-white/10 border border-white/15 p-5 text-center backdrop-blur-md">
          <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#FCB625]">
            Target Question
          </span>
          <p className="mt-1.5 font-sans text-base font-bold text-white leading-relaxed sm:text-lg">
            &quot;{INTERVIEW_SHOWCASE_DATA.questionText}&quot;
          </p>
        </div>

        {/* Simulated Transcript Line */}
        <div className="mt-3 text-xs font-mono text-white/80 max-w-lg text-center bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          {orbState === "listening" && "Candidate: \"Tôi đã sử dụng index PostgreSQL và phân tách query...\""}
          {orbState === "speaking" && "AI Coach: \"Hãy giải thích rõ hơn về trade-off latency khi đánh index?\""}
          {orbState === "thinking" && "AI Coach: Đang phân tích cấu trúc trả lời theo tiêu chuẩn STAR..."}
          {orbState === "idle" && "Hệ thống sẵn sàng. Nhấp nút Voice để bắt đầu phiên."}
        </div>
      </div>

      {/* Live Feedback Indicator Chips */}
      <div className="grid gap-3 sm:grid-cols-3 text-left">
        {INTERVIEW_SHOWCASE_DATA.indicators.map((ind) => (
          <div key={ind.label} className="rounded-xl bg-white/10 border border-white/15 p-3.5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/80">{ind.label}</span>
              <span className="font-mono text-xs font-bold text-[#FCB625]">{ind.score}</span>
            </div>
            <p className="mt-1 text-xs font-bold text-white">{ind.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarketingInterviewPreview;
