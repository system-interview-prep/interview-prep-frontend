/**
 * Design System Brand Colors & Surface Tokens
 * Standardizing brand palette across components
 */

export const colors = {
  brand: {
    primary: "#204195",
    navy: "#204195",
    navyHover: "#183275",
    navyLight: "#3155B7",
    accent: "#FCB625",
    gold: "#FCB625",
    goldHover: "#E5A21D",
    white: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceSub: "#F8FAFC",
    paper: "#FEF9EE",
    border: "#204195",
    borderLight: "#E2E8F0",
    borderMuted: "#CBD5E1",
    muted: "#5A6B8F",
    error: "#D32F2F",
    success: "#2E7D32",
  },
  shadows: {
    gold: "0 4px 14px rgba(252, 182, 37, 0.35)",
    navy: "0 4px 14px rgba(32, 65, 149, 0.15)",
    chunky: "3px 3px 0 #204195",
    chunkyLg: "6px 6px 0 #204195",
  },
} as const;

export type BrandColors = typeof colors;
export default colors;
