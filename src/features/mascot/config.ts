import type { MascotMood } from "./types";

export type MascotIntensity = "NONE" | "SUBTLE" | "MEDIUM" | "STRONG";

export type MascotScene =
  | "hidden"
  | "marketing-hero"
  | "marketing-how-upload"
  | "marketing-how-match"
  | "marketing-how-understand"
  | "marketing-how-practice"
  | "marketing-how-improve"
  | "marketing-interview"
  | "marketing-final-cta"
  | "resources-coach"
  | "resources-empty"
  | "solutions-coach"
  | "pricing-help"
  | "pricing-modal"
  | "login-artwork"
  | "signup-welcome"
  | "dashboard-welcome"
  | "dashboard-no-cv"
  | "dashboard-no-target"
  | "dashboard-ready"
  | "cv-empty"
  | "cv-processing"
  | "cv-success"
  | "cv-error"
  | "jobs-empty"
  | "jobs-target-selected"
  | "job-detail-prep"
  | "help-guide"
  | "help-empty"
  | "practice-start"
  | "practice-progress"
  | "practice-complete"
  | "interview-select"
  | "interview-preparing"
  | "interview-active"
  | "interview-error"
  | "interview-complete"
  | "results-encourage"
  | "results-celebrate"
  | string;

export interface MascotSceneConfig {
  mood: MascotMood;
  speechKey: string;
  anchorId: string;
  intensity: MascotIntensity;
  priority: number; // Higher number = takes precedence (100 = active interview, 90 = modal, 80 = error, 60 = task, 40 = section, 20 = ambient)
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  enableCursorTracking?: boolean;
}

export const MASCOT_PRIORITIES = {
  ACTIVE_INTERVIEW: 100,
  MODAL: 90,
  ERROR: 80,
  ACTIVE_TASK: 60,
  SECTION_GUIDE: 40,
  AMBIENT: 20,
};

export const MASCOT_SCENES: Record<string, MascotSceneConfig> = {
  hidden: {
    mood: "idle",
    speechKey: "",
    anchorId: "",
    intensity: "NONE",
    priority: 0,
  },

  // --- MARKETING ---
  "marketing-hero": {
    mood: "happy",
    speechKey: "mascot.hero.greeting",
    anchorId: "hero",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    offsetX: 12,
    offsetY: -10,
    scale: 1,
    enableCursorTracking: true,
  },
  "marketing-how-upload": {
    mood: "happy",
    speechKey: "mascot.walkthrough.upload",
    anchorId: "how-upload",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    offsetX: 16,
    offsetY: 0,
    scale: 0.95,
    enableCursorTracking: true,
  },
  "marketing-how-match": {
    mood: "thinking",
    speechKey: "mascot.walkthrough.match",
    anchorId: "how-match",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    offsetX: 16,
    offsetY: 0,
    scale: 0.95,
    enableCursorTracking: true,
  },
  "marketing-how-understand": {
    mood: "surprised",
    speechKey: "mascot.walkthrough.understand",
    anchorId: "how-understand",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    offsetX: 16,
    offsetY: 0,
    scale: 0.95,
    enableCursorTracking: true,
  },
  "marketing-how-practice": {
    mood: "coaching",
    speechKey: "mascot.walkthrough.practice",
    anchorId: "how-practice",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    offsetX: 16,
    offsetY: 0,
    scale: 0.95,
    enableCursorTracking: true,
  },
  "marketing-how-improve": {
    mood: "encouraging",
    speechKey: "mascot.walkthrough.improve",
    anchorId: "how-improve",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    offsetX: 16,
    offsetY: 0,
    scale: 0.95,
    enableCursorTracking: true,
  },
  "marketing-interview": {
    mood: "listening",
    speechKey: "mascot.interview.headline",
    anchorId: "interview",
    intensity: "SUBTLE",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    offsetX: 16,
    offsetY: -8,
    scale: 0.95,
  },
  "marketing-final-cta": {
    mood: "encouraging",
    speechKey: "mascot.cta.encouragement",
    anchorId: "final-cta",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    offsetX: 20,
    offsetY: -10,
    scale: 1,
  },

  // --- RESOURCES & SOLUTIONS & PRICING ---
  "resources-coach": {
    mood: "coaching",
    speechKey: "mascot.resources.coach",
    anchorId: "resources-coach",
    intensity: "SUBTLE",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "resources-empty": {
    mood: "confused",
    speechKey: "mascot.resources.empty",
    anchorId: "resources-search",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "solutions-coach": {
    mood: "coaching",
    speechKey: "mascot.solutions.coach",
    anchorId: "solutions-coach",
    intensity: "SUBTLE",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "pricing-help": {
    mood: "thinking",
    speechKey: "mascot.pricing.help",
    anchorId: "pricing-plans",
    intensity: "SUBTLE",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "pricing-modal": {
    mood: "idle",
    speechKey: "",
    anchorId: "",
    intensity: "NONE",
    priority: MASCOT_PRIORITIES.MODAL,
  },

  // --- AUTH ---
  "login-artwork": {
    mood: "happy",
    speechKey: "",
    anchorId: "login-artwork",
    intensity: "SUBTLE",
    priority: MASCOT_PRIORITIES.AMBIENT,
    scale: 0.85,
  },
  "signup-welcome": {
    mood: "happy",
    speechKey: "mascot.signup.welcome",
    anchorId: "signup-card",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },

  // --- WORKSPACE ---
  "dashboard-welcome": {
    mood: "happy",
    speechKey: "mascot.dashboard.welcome",
    anchorId: "dashboard-header",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "dashboard-no-cv": {
    mood: "coaching",
    speechKey: "mascot.dashboard.noCv",
    anchorId: "dashboard-cv-card",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "dashboard-no-target": {
    mood: "thinking",
    speechKey: "mascot.dashboard.noTarget",
    anchorId: "dashboard-target-card",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "dashboard-ready": {
    mood: "encouraging",
    speechKey: "mascot.dashboard.ready",
    anchorId: "dashboard-prep-card",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "cv-empty": {
    mood: "coaching",
    speechKey: "mascot.cv.empty",
    anchorId: "cv-uploader",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "cv-processing": {
    mood: "thinking",
    speechKey: "mascot.cv.processing",
    anchorId: "cv-uploader",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "cv-success": {
    mood: "happy",
    speechKey: "mascot.cv.success",
    anchorId: "cv-list",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "cv-error": {
    mood: "confused",
    speechKey: "mascot.cv.error",
    anchorId: "cv-uploader",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ERROR,
    scale: 0.9,
  },
  "jobs-empty": {
    mood: "thinking",
    speechKey: "mascot.jobs.empty",
    anchorId: "jobs-header",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "jobs-target-selected": {
    mood: "happy",
    speechKey: "mascot.jobs.selected",
    anchorId: "jobs-header",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "job-detail-prep": {
    mood: "coaching",
    speechKey: "mascot.jobs.detailPrep",
    anchorId: "job-prep-cta",
    intensity: "SUBTLE",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "help-guide": {
    mood: "coaching",
    speechKey: "mascot.help.guide",
    anchorId: "help-search",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "help-empty": {
    mood: "confused",
    speechKey: "mascot.help.empty",
    anchorId: "help-search",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "practice-start": {
    mood: "happy",
    speechKey: "mascot.practice.start",
    anchorId: "practice-header",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "practice-progress": {
    mood: "encouraging",
    speechKey: "mascot.practice.progress",
    anchorId: "practice-header",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "practice-complete": {
    mood: "happy",
    speechKey: "mascot.practice.complete",
    anchorId: "practice-header",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },

  // --- INTERVIEW FULLSCREEN ---
  "interview-select": {
    mood: "coaching",
    speechKey: "mascot.interview.select",
    anchorId: "interview-select-header",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "interview-preparing": {
    mood: "thinking",
    speechKey: "mascot.interview.preparing",
    anchorId: "interview-prep-box",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.85,
  },
  // CRITICAL RULE: Active interview session mascot MUST BE HIDDEN (intensity = NONE, priority = 100)
  "interview-active": {
    mood: "idle",
    speechKey: "",
    anchorId: "",
    intensity: "NONE",
    priority: MASCOT_PRIORITIES.ACTIVE_INTERVIEW,
  },
  "interview-error": {
    mood: "confused",
    speechKey: "mascot.interview.error",
    anchorId: "interview-error-box",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ERROR,
    scale: 0.9,
  },
  "interview-complete": {
    mood: "encouraging",
    speechKey: "mascot.interview.complete",
    anchorId: "interview-complete-box",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.ACTIVE_TASK,
    scale: 0.9,
  },
  "results-encourage": {
    mood: "coaching",
    speechKey: "mascot.results.encourage",
    anchorId: "results-header",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
  "results-celebrate": {
    mood: "happy",
    speechKey: "mascot.results.celebrate",
    anchorId: "results-header",
    intensity: "MEDIUM",
    priority: MASCOT_PRIORITIES.SECTION_GUIDE,
    scale: 0.9,
  },
};
