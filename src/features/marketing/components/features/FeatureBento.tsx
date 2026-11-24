"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Mic, FileText } from "lucide-react";
import { fadeInReveal } from "../../motion/variants";

export function FeatureBento() {
  return (
    <section id="bento-features" className="relative px-5 py-24 sm:px-8 md:py-36 bg-white border-b border-[#DCE4F3]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto max-w-7xl text-left"
      >
        <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl max-w-2xl mb-12">
          Hành trình chuẩn bị phỏng vấn toàn diện
        </h2>

        {/* 3 Core Bento Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Evidence */}
          <div className="rounded-3xl border border-[#DCE4F3] bg-[#F7F9FD] p-6 sm:p-8 flex flex-col justify-between shadow-xs transition-all hover:border-[#204195]/40">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#DCE4F3] px-3 py-1 font-mono text-xs font-bold text-[#204195]">
                <FileText className="size-3.5" /> EVIDENCE MATCH
              </div>
              <h3 className="mt-4 font-sans text-xl font-extrabold text-[#14244B]">
                So khớp Bằng chứng
              </h3>
              <p className="mt-2 text-xs text-[#607096] leading-relaxed sm:text-sm">
                Định vị từng đoạn văn bản trong CV chứng minh bạn đáp ứng tiêu chuẩn tuyển dụng.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-white p-3 border border-[#DCE4F3] text-xs font-mono text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" /> Evidence Verified
            </div>
          </div>

          {/* Card 2: Interview */}
          <div className="rounded-3xl border border-[#204195] bg-[#204195] p-6 sm:p-8 text-white flex flex-col justify-between shadow-md">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/20 px-3 py-1 font-mono text-xs font-bold text-[#FCB625]">
                <Mic className="size-3.5" /> VOICE PRACTICE
              </div>
              <h3 className="mt-4 font-sans text-xl font-extrabold text-white">
                Phỏng vấn Thoại AI
              </h3>
              <p className="mt-2 text-xs text-white/80 leading-relaxed sm:text-sm">
                Tương tác 2 chiều bằng giọng nói. Phản xạ thời gian thực bám sát JD.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-white/10 p-3 border border-white/15 text-xs font-mono text-[#FCB625]">
              ● Voice WebRTC Active
            </div>
          </div>

          {/* Card 3: Feedback */}
          <div className="rounded-3xl border border-[#DCE4F3] bg-[#F7F9FD] p-6 sm:p-8 flex flex-col justify-between shadow-xs transition-all hover:border-[#204195]/40">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-[#DCE4F3] px-3 py-1 font-mono text-xs font-bold text-[#204195]">
                STAR REPORT
              </div>
              <h3 className="mt-4 font-sans text-xl font-extrabold text-[#14244B]">
                Báo cáo STAR
              </h3>
              <p className="mt-2 text-xs text-[#607096] leading-relaxed sm:text-sm">
                Phản hồi có cấu trúc giúp bạn biết chính xác những điểm cần sửa cho lần tới.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-white p-3 border border-[#DCE4F3] text-xs font-mono text-[#204195]">
              STAR Evaluation Ready
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default FeatureBento;
