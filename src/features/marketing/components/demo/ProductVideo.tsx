"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Sparkles } from "lucide-react";
import { fadeInReveal } from "../../motion/variants";

interface ProductVideoProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function ProductVideo({ isOpen = false, onClose }: ProductVideoProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const activeOpen = isOpen || internalOpen;

  const handleClose = () => {
    setInternalOpen(false);
    if (onClose) onClose();
  };

  return (
    <section id="product-video" className="relative px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20 xl:px-12 xl:py-20 bg-[#F7F9FD] border-b border-[#DCE4F3]">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={fadeInReveal}
        className="mx-auto w-full max-w-[1320px] text-center"
      >
        <h2 className="font-sans text-3xl font-extrabold tracking-tight text-[#14244B] sm:text-4xl md:text-5xl">
          See INTERVIA in action.
        </h2>

        {/* 16:9 Video Poster Box */}
        <div className="mt-8 relative mx-auto max-w-4xl rounded-3xl border border-[#DCE4F3] bg-white p-3 shadow-md overflow-hidden group">
          <div className="relative aspect-video w-full rounded-2xl bg-[#14244B] flex flex-col items-center justify-center text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#204195] to-[#0F172A] opacity-90" />

            <div className="relative z-10 text-center p-6">
              <button
                type="button"
                onClick={() => setInternalOpen(true)}
                aria-label="Xem video demo"
                className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[#FCB625] text-[#204195] shadow-xl transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              >
                <Play className="size-8 fill-[#204195] ml-1" />
              </button>

              <p className="mt-4 font-mono text-xs font-bold text-[#FCB625] uppercase tracking-wider">
                90-Second Walkthrough
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Video Modal Player */}
      <AnimatePresence>
        {activeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl rounded-2xl bg-black overflow-hidden shadow-2xl"
            >
              <button
                type="button"
                onClick={handleClose}
                aria-label="Đóng video"
                className="absolute top-4 right-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
              >
                <X className="size-5" />
              </button>

              <div className="aspect-video w-full flex items-center justify-center bg-slate-900 text-white p-8 text-center">
                <div>
                  <Sparkles className="size-12 text-[#FCB625] mx-auto mb-4" />
                  <h4 className="font-sans text-2xl font-bold">INTERVIA Product Journey</h4>
                  <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
                    Video 90s minh họa so khớp CV - JD và phòng phỏng vấn giọng nói AI.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default ProductVideo;
