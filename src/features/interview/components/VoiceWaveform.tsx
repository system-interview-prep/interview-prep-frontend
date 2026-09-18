"use client";
import { motion } from "framer-motion";

export type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking";
const wave = [18, 34, 52, 28, 68, 44, 58, 30, 20];

export function VoiceWaveform({ state }: { state: VoiceOrbState }) {
  const active = state !== "idle";
  const yellow = state === "thinking" || state === "speaking";
  return (
    <div className="relative grid h-64 w-64 place-items-center sm:h-72 sm:w-72" aria-label={`Trạng thái giọng nói: ${state}`} role="img">
      <motion.div
        className="absolute inset-4 border-2 border-[#234196]"
        animate={{
          borderRadius: ["44% 56% 61% 39% / 45% 38% 62% 55%", "61% 39% 43% 57% / 55% 63% 37% 45%", "44% 56% 61% 39% / 45% 38% 62% 55%"],
          rotate: yellow ? [0, 7, -5, 0] : [0, -3, 3, 0],
          scale: state === "thinking" ? [0.94, 1.06, 0.96] : active ? [0.98, 1.03, 0.98] : [0.98, 1, 0.98],
          backgroundColor: yellow ? ["#FCB625", "#FFD56C", "#FCB625"] : ["#234196", "#3155B7", "#234196"],
        }}
        transition={{ duration: state === "thinking" ? 1.15 : 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ boxShadow: "8px 8px 0 #234196" }}
      />
      <motion.div
        className="relative z-10 flex h-20 items-center justify-center gap-1.5"
        animate={{ scale: active ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 1.2, repeat: Infinity }}
        aria-hidden
      >
        {wave.map((height, index) => (
          <motion.span
            key={index}
            className={`w-2 rounded-full ${yellow ? "bg-[#234196]" : "bg-white"}`}
            animate={{ height: active ? [height * 0.45, height, height * 0.6] : 12 }}
            transition={{ duration: .65 + (index % 3) * .16, repeat: Infinity, ease: "easeInOut", delay: index * .045 }}
          />
        ))}
      </motion.div>
      {state === "speaking" && <>
        <motion.span className="absolute inset-0 rounded-full border-2 border-[#FCB625]" animate={{ scale: [0.75, 1.08], opacity: [0.8, 0] }} transition={{ duration: 1.25, repeat: Infinity }} />
        <motion.span className="absolute inset-0 rounded-full border-2 border-[#234196]" animate={{ scale: [0.7, 1.2], opacity: [0.55, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: .35 }} />
      </>}
      <span className={`sticker absolute -bottom-2 rotate-1 ${yellow ? "bg-white" : "bg-[#FCB625]"}`}>{state === "idle" ? "Sẵn sàng" : state === "listening" ? "Đang nghe" : state === "thinking" ? "Đang nghĩ" : "AI đang nói"}</span>
    </div>
  );
}
