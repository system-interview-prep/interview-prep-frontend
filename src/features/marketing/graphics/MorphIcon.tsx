"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { useReducedMotion } from "framer-motion";
import { MORPH_PATHS, type MorphPathKey } from "./morphPaths";

interface MorphIconProps {
  currentKey: MorphPathKey;
  targetKey?: MorphPathKey;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  autoMorphOnKeyChange?: boolean;
  duration?: number;
  ariaLabel?: string;
}

export function MorphIcon({
  currentKey,
  targetKey,
  size = 48,
  color = "#204195",
  strokeWidth = 2.5,
  className = "",
  autoMorphOnKeyChange = true,
  duration = 0.8,
  ariaLabel,
}: MorphIconProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const currentPathObj = MORPH_PATHS[currentKey] || MORPH_PATHS.document;
  const targetPathObj = targetKey ? MORPH_PATHS[targetKey] : null;

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;

    const destinationPath = targetPathObj ? targetPathObj.path : currentPathObj.path;

    if (shouldReduceMotion) {
      gsap.set(el, { attr: { d: destinationPath } });
      return;
    }

    if (autoMorphOnKeyChange && destinationPath) {
      gsap.to(el, {
        attr: { d: destinationPath },
        duration: duration,
        ease: "power2.inOut",
      });
    }

    return () => {
      if (el) {
        gsap.killTweensOf(el);
      }
    };
  }, [currentKey, targetKey, autoMorphOnKeyChange, duration, shouldReduceMotion, currentPathObj.path, targetPathObj]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={!ariaLabel}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      <path
        ref={pathRef}
        d={currentPathObj.path}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MorphIcon;
