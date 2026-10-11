"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";

export type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking";
const wave = [20, 38, 56, 32, 72, 48, 62, 34, 22];

export function VoiceWaveform({ state }: { state: VoiceOrbState }) {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const active = state !== "idle";
  const yellow = state === "thinking" || state === "speaking";

  return (
    <div
      className="relative grid h-60 w-60 place-items-center sm:h-68 sm:w-68"
      aria-label={t(`room.wave.${state}`)}
      role="img"
    >
      {/* Main Orb */}
      <motion.div
        className="absolute inset-6 border border-white/20 shadow-xl"
        animate={
          shouldReduceMotion
            ? {
                borderRadius: "50%",
                background: yellow
                  ? "linear-gradient(135deg, #FCB625 0%, #E59E10 100%)"
                  : "linear-gradient(135deg, #204195 0%, #183275 100%)",
              }
            : {
                borderRadius: [
                  "44% 56% 61% 39% / 45% 38% 62% 55%",
                  "61% 39% 43% 57% / 55% 63% 37% 45%",
                  "44% 56% 61% 39% / 45% 38% 62% 55%",
                ],
                rotate: yellow ? [0, 8, -6, 0] : [0, -4, 4, 0],
                scale:
                  state === "thinking"
                    ? [0.95, 1.05, 0.97]
                    : active
                    ? [0.98, 1.04, 0.98]
                    : [0.98, 1, 0.98],
                background: yellow
                  ? "linear-gradient(135deg, #FCB625 0%, #E59E10 100%)"
                  : "linear-gradient(135deg, #204195 0%, #183275 100%)",
              }
        }
        transition={
          shouldReduceMotion
            ? undefined
            : {
                duration: state === "thinking" ? 1.2 : 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      />

      {/* Waveform Bars */}
      <motion.div
        className="relative z-10 flex h-20 items-center justify-center gap-1.5"
        animate={shouldReduceMotion ? undefined : { scale: active ? [1, 1.06, 1] : 1 }}
        transition={shouldReduceMotion ? undefined : { duration: 1.2, repeat: Infinity }}
        aria-hidden
      >
        {wave.map((height, index) => (
          <motion.span
            key={index}
            className={`w-2.5 rounded-full ${yellow ? "bg-[#204195]" : "bg-[#FCB625]"}`}
            animate={
              shouldReduceMotion
                ? { height: active ? height * 0.6 : 12 }
                : { height: active ? [height * 0.4, height, height * 0.55] : 12 }
            }
            transition={
              shouldReduceMotion
                ? undefined
                : {
                    duration: 0.6 + (index % 3) * 0.15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.04,
                  }
            }
          />
        ))}
      </motion.div>

      {/* Ripple Rings when AI is speaking */}
      {/* Rendered on server and client alike (no hydration mismatch); CSS hides them
          under reduced motion, and they only animate when motion is allowed. */}
      {state === "speaking" && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[#FCB625] motion-reduce:hidden"
            animate={shouldReduceMotion ? undefined : { scale: [0.8, 1.15], opacity: [0.8, 0] }}
            transition={shouldReduceMotion ? undefined : { duration: 1.3, repeat: Infinity }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[#204195] motion-reduce:hidden"
            animate={shouldReduceMotion ? undefined : { scale: [0.75, 1.25], opacity: [0.6, 0] }}
            transition={shouldReduceMotion ? undefined : { duration: 1.6, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}

    </div>
  );
}
