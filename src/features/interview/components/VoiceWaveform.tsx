"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";

export type VoiceOrbState = "idle" | "listening" | "thinking" | "speaking";
const wave = [20, 38, 56, 32, 72, 48, 62, 34, 22];

export function VoiceWaveform({
  state,
  size = "compact",
}: {
  state: VoiceOrbState;
  size?: "default" | "compact";
}) {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const active = state !== "idle";
  const yellow = state === "thinking" || state === "speaking";
  const compact = size === "compact";

  return (
    <div
      className={`relative grid place-items-center ${
        compact ? "h-36 w-36 sm:h-44 sm:w-44" : "h-60 w-60 sm:h-68 sm:w-68"
      }`}
      aria-label={t(`room.wave.${state}`)}
      role="img"
    >
      {/* Main Orb */}
      <motion.div
        className={`absolute border border-white/20 shadow-xl ${
          compact ? "inset-4" : "inset-6"
        }`}
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
        className={`relative z-10 flex items-center justify-center ${
          compact ? "h-14 gap-1" : "h-20 gap-1.5"
        }`}
        animate={shouldReduceMotion ? undefined : { scale: active ? [1, 1.06, 1] : 1 }}
        transition={shouldReduceMotion ? undefined : { duration: 1.2, repeat: Infinity }}
        aria-hidden
      >
        {wave.map((h, index) => {
          const height = compact ? Math.round(h * 0.7) : h;
          const minH = compact ? 8 : 12;
          return (
            <motion.span
              key={index}
              className={`${compact ? "w-2" : "w-2.5"} rounded-full ${
                yellow ? "bg-[#204195]" : "bg-[#FCB625]"
              }`}
              animate={
                shouldReduceMotion
                  ? { height: active ? height * 0.6 : minH }
                  : { height: active ? [height * 0.4, height, height * 0.55] : minH }
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
          );
        })}
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
