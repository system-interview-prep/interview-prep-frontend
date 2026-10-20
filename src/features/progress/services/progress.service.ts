import apiClient from "@/lib/apiClient";

/** Mirrors interview-prep-core `application/progress.py`. */
export type PracticeTier = "basic" | "standard" | "challenge";
export type TrendStatus = "up" | "down" | "flat" | "insufficient";
export type Trend = { status: TrendStatus; delta: number | null };

export type SessionBehavior = {
  technicalTurns: number;
  answeredTurns: number;
  firstTimeSufficient: number;
  firstTimeSufficientRate: number | null;
  probesNeeded: number;
  skipped: number;
};

export type ProgressSession = {
  sessionId: string;
  date: string;
  jobId: string | null;
  jobTitle: string | null;
  overallScore: number | null;
  tier: PracticeTier;
  difficulty: string | null;
  resumeId: string | null;
  resumeName: string | null;
  behavior: SessionBehavior;
};

export type SkillPoint = {
  sessionId: string;
  date: string;
  score: number;
  difficulty: string | null;
  tier: PracticeTier;
  jobId: string | null;
  resumeId: string | null;
};
export type SkillProgress = {
  conceptId: string;
  label: string;
  points: SkillPoint[];
  latest: number;
  best: number;
  trend: Trend;
};

export type JobPoint = { sessionId: string; date: string; score: number; tier: PracticeTier };
export type JobProgress = {
  jobId: string;
  jobTitle: string | null;
  points: JobPoint[];
  tierChanges: { sessionId: string; date: string; from: PracticeTier; to: PracticeTier }[];
  currentTier: PracticeTier;
  trend: Trend;
};

export type StreakWeek = { weekStart: string; count: number; met: boolean; frozen: boolean; current: boolean };
export type WeeklyStreak = {
  weeks: number;
  goal: number;
  thisWeekCount: number;
  thisWeekRemaining: number;
  freezeAvailableThisMonth: boolean;
  history: StreakWeek[];
};

export type Milestone = {
  kind: "first_session" | "first_challenge" | "tier_up" | "no_skip_session" | "skill_reached";
  date: string;
  sessionId: string;
  jobTitle?: string | null;
  tier?: PracticeTier;
  skill?: string;
  score?: number;
};

export type PracticeProgress = {
  generatedAt: string;
  weeklyGoal: number;
  /** CVs used in graded interviews, most used first (for the CV filter). */
  resumes: { resumeId: string; name: string | null; sessions: number }[];
  streak: WeeklyStreak;
  sessions: ProgressSession[];
  skills: SkillProgress[];
  jobs: JobProgress[];
  behavior: {
    firstTimeSufficientRate: { latest: number | null; trend: Trend };
    skippedPerSession: { latest: number | null; trend: Trend };
  };
  milestones: Milestone[];
  trendRule: { minPoints: number; window: number; flatDelta: number };
};

export type SkillDelta = { skill: string; before?: number; now: number; delta?: number };
export type ProgressComparison = {
  sessionId: string;
  previousSessionId: string;
  previousDate: string;
  sameJob: boolean;
  tier: { before: PracticeTier; now: PracticeTier };
  overall: { before: number; now: number; delta: number; comparable: boolean; status: TrendStatus } | null;
  improvedSkills: SkillDelta[];
  focusSkills: SkillDelta[];
  behavior: {
    firstTimeSufficientRate: { before: number | null; now: number | null };
    skipped: { before: number; now: number };
  };
};

/** Minutes ahead of UTC in the browser (Vietnam: 420); weeks follow the candidate's local days. */
export function localTzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export const progressApi = {
  get: async (): Promise<PracticeProgress> => {
    const response = await apiClient.get<PracticeProgress>("/api/v1/interviews/progress", {
      params: { tzOffsetMinutes: localTzOffsetMinutes() },
    });
    return response.data;
  },
  setWeeklyGoal: async (weeklyGoal: number): Promise<number> => {
    const response = await apiClient.put<{ weeklyGoal: number }>("/api/v1/interviews/progress/weekly-goal", {
      weeklyGoal,
    });
    return response.data.weeklyGoal;
  },
  compare: async (sessionId: string): Promise<ProgressComparison | null> => {
    const response = await apiClient.get<{ comparison: ProgressComparison | null }>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/progress-compare`,
      { params: { tzOffsetMinutes: localTzOffsetMinutes() } },
    );
    return response.data.comparison;
  },
};
