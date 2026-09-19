import type { Variants } from "framer-motion";

export const EASE_CUSTOM = [0.16, 1, 0.3, 1] as const;

export const fadeInReveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_CUSTOM },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const cardHoverVariant: Variants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.015,
    y: -2,
    transition: { duration: 0.25, ease: EASE_CUSTOM },
  },
};
