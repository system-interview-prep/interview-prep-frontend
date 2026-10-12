export type MorphPathKey =
  | "document"
  | "classification"
  | "target"
  | "evidence"
  | "interview"
  | "feedback"
  | "emptyDocument";

/**
 * Centralized INTERVIA Branded SVG Signature Path Library
 * All paths share viewBox="0 0 64 64" with consistent stroke/fill geometry
 */
export const MORPH_PATHS: Record<MorphPathKey, { path: string; label: string }> = {
  // Shape 01 — Resume / CV Document
  document: {
    label: "CV Document Profile",
    path: "M 16 8 L 40 8 L 48 16 L 48 56 L 16 56 Z M 24 24 L 40 24 M 24 32 L 40 32 M 24 40 L 32 40",
  },

  // Shape 02 — Career Classification (Branching Experience Nodes / Direction Compass)
  classification: {
    label: "Career Signal & Direction",
    path: "M 32 10 L 32 32 M 32 32 L 14 48 M 32 32 L 50 48 M 32 10 A 5 5 0 1 1 31.9 10 M 14 48 A 5 5 0 1 1 13.9 48 M 50 48 A 5 5 0 1 1 49.9 48",
  },

  // Shape 03 — Target Job Profile (Directional Target Goal)
  target: {
    label: "Target Role Goal",
    path: "M 32 8 A 24 24 0 1 1 31.9 8 Z M 32 18 A 14 14 0 1 1 31.9 18 Z M 32 28 A 4 4 0 1 1 31.9 28 Z",
  },

  // Shape 04 — Evidence (Requirement ↔ CV Snippet Link)
  evidence: {
    label: "Requirement ↔ Evidence Connection",
    path: "M 10 20 L 26 20 L 26 44 L 10 44 Z M 38 20 L 54 20 L 54 44 L 38 44 Z M 26 32 L 38 32 M 16 28 L 20 28 M 44 28 L 48 28",
  },

  // Shape 05 — AI Interview (Interviewer Bubble Stage)
  interview: {
    label: "AI Interviewer Bubble",
    path: "M 12 12 C 12 12, 52 12, 52 12 C 52 32, 52 36, 52 36 C 36 36, 28 44, 20 52 C 20 44, 20 36, 12 36 Z M 22 24 L 42 24 M 22 30 L 34 30",
  },

  // Shape 06 — STAR Feedback (Upward Evidence Progress Path)
  feedback: {
    label: "Structured STAR Feedback",
    path: "M 12 52 L 52 52 M 16 44 L 28 32 L 38 38 L 48 16 M 48 16 L 48 26 M 48 16 L 38 16",
  },

  // Empty Document / Missing Evidence Marker ("No evidence found in CV")
  emptyDocument: {
    label: "Missing Evidence Marker",
    path: "M 16 8 L 48 8 L 48 56 L 16 56 Z M 24 24 L 40 40 M 40 24 L 24 40 M 24 48 L 40 48",
  },
};
