"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/** Makes every framer-motion animation on marketing pages respect prefers-reduced-motion. */
export default function MarketingMotionConfig({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
