"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { MORPH_PATHS, type MorphPathKey } from "./morphPaths";

const STEP_MORPH_MAP: Record<number, { key: MorphPathKey; color: string }> = {
  0: { key: "document", color: "#204195" },
  1: { key: "classification", color: "#204195" },
  2: { key: "target", color: "#204195" },
  3: { key: "evidence", color: "#FCB625" },
  4: { key: "interview", color: "#204195" },
  5: { key: "feedback", color: "#287A4B" },
};

interface CareerJourneyMorphProps {
  activeStepIndex: number;
  size?: number;
}

export function CareerJourneyMorph({ activeStepIndex, size = 64 }: CareerJourneyMorphProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const stepConfig = STEP_MORPH_MAP[activeStepIndex] || STEP_MORPH_MAP[0];
  const targetPath = MORPH_PATHS[stepConfig.key].path;

  useEffect(() => {
    if (!pathRef.current) return;

    if (shouldReduceMotion) {
      gsap.set(pathRef.current, {
        attr: { d: targetPath },
        stroke: stepConfig.color,
      });
      return;
    }

    gsap.to(pathRef.current, {
      attr: { d: targetPath },
      stroke: stepConfig.color,
      duration: 0.7,
      ease: "power2.inOut",
    });

    return () => {
      if (pathRef.current) {
        gsap.killTweensOf(pathRef.current);
      }
    };
  }, [activeStepIndex, targetPath, stepConfig.color, shouldReduceMotion]);

  return (
    <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white border border-[#DCE4F3] shadow-xs">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d={MORPH_PATHS.document.path}
          stroke="#204195"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default CareerJourneyMorph;
