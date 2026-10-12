"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { MORPH_PATHS, type MorphPathKey } from "./morphPaths";

const HERO_SEQUENCE: Array<{ key: MorphPathKey; label: string }> = [
  { key: "document", label: "01. CV Profile" },
  { key: "classification", label: "02. Career Signal" },
  { key: "target", label: "03. Target Job Profile" },
  { key: "evidence", label: "04. Requirement ↔ Evidence" },
  { key: "interview", label: "05. Voice AI Practice" },
  { key: "feedback", label: "06. STAR Feedback" },
];

export function HeroCareerMorph() {
  const [seqIndex, setSeqIndex] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const pathRef = useRef<SVGPathElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const runSequence = useCallback(() => {
    if (shouldReduceMotion) {
      setSeqIndex(HERO_SEQUENCE.length - 1);
      setIsFinished(true);
      if (pathRef.current) {
        gsap.set(pathRef.current, { attr: { d: MORPH_PATHS.target.path } });
      }
      return;
    }

    setSeqIndex(0);
    setIsFinished(false);
    if (pathRef.current) {
      gsap.set(pathRef.current, { attr: { d: MORPH_PATHS.document.path } });
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex < HERO_SEQUENCE.length) {
        setSeqIndex(currentIndex);
        const targetPath = MORPH_PATHS[HERO_SEQUENCE[currentIndex].key].path;
        if (pathRef.current) {
          gsap.to(pathRef.current, {
            attr: { d: targetPath },
            duration: 0.6,
            ease: "power2.inOut",
          });
        }
      } else {
        clearInterval(interval);
        setIsFinished(true); // Stop after 1 full pass
      }
    }, 1200);
  }, [shouldReduceMotion]);

  useEffect(() => {
    const el = pathRef.current;
    runSequence();

    return () => {
      if (el) {
        gsap.killTweensOf(el);
      }
    };
  }, [runSequence]);

  const currentItem = HERO_SEQUENCE[seqIndex];

  return (
    <div className="inline-flex items-center gap-3 rounded-2xl bg-white border border-[#DCE4F3] p-2.5 px-4 shadow-xs">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#EEF3FC] border border-[#204195]/20 shrink-0">
        <svg
          width={36}
          height={36}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label={`Trạng thái tiến trình: ${currentItem.label}`}
          role="img"
        >
          <path
            ref={pathRef}
            d={MORPH_PATHS[HERO_SEQUENCE[0].key].path}
            stroke="#204195"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="text-left">
        <p className="font-mono text-[10px] font-bold text-[#607096] uppercase">INTERVIA Pipeline Journey</p>
        <p className="font-sans text-xs font-extrabold text-[#204195]">{currentItem.label}</p>
      </div>

      {isFinished && !shouldReduceMotion && (
        <button
          type="button"
          onClick={runSequence}
          aria-label="Phát lại chuỗi chuyển động"
          className="ml-2 grid h-7 w-7 place-items-center rounded-lg border border-[#DCE4F3] bg-[#F7F9FD] text-[#204195] hover:bg-[#EEF3FC] cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export default HeroCareerMorph;
