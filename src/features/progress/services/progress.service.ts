import apiClient from "@/lib/apiClient";

/** Mirrors interview-prep-core `application/progress.py`. */
export type PracticeTier = "basic" | "standard" | "challenge";
export type TrendStatus = "up" | "down" | "flat" | "insufficient";
/** `probability`: chance the change is real (beyond the smallest worthwhile change), when computed with the measured noise. */
export type Trend = { status: TrendStatus; delta: number | null; probability?: number | null };

export type SessionBehavior = {
  technicalTurns: number;
  answeredTurns: number;
  firstTimeSufficient: number;
  firstTimeSufficientRate: number | null;
  probesNeeded: number;
  skipped: number;
  /** Checklist evidence (backend from 20/10; absent on older data). */
  recoveredAfterProbe?: number;
  checklistTurns?: number;
  coreCovered?: number;
  coreTotal?: number;
  fullCoreTurns?: number;
  incorrectTurns?: number;
  starTurns?: number;
  starComplete?: number;
  measurableResult?: number;
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
  graderVersion?: string | null;
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
  graderVersion?: string | null;
  /** Smoothed estimate after this point (null when not comparable with the latest point). */
  estimate?: number | null;
  estimateSd?: number | null;
};
export type LevelEvent = { sessionId: string; date: string; from: number; to: number };
export type SkillProgress = {
  conceptId: string;
  label: string;
  points: SkillPoint[];
  latest: number;
  best: number;
  trend: Trend;
  comparablePoints?: number;
  estimate?: number | null;
  estimateSd?: number | null;
  /** 0 Bắt đầu · 1 Cơ bản · 2 Đạt yêu cầu · 3 Vững · 4 Xuất sắc */
  level?: number;
  levelEvents?: LevelEvent[];
  /** Area the skill belongs to (application/skill_display.py); `label` is already the candidate-facing name. */
  area?: SkillArea;
  taxonomyLabel?: string | null;
  /** Newest first: what was asked, the score and the key points the answer missed. */
  recentQuestions?: SkillQuestion[];
  /** JSON, XML, Git…: listed in job posts, no longer asked as a topic of their own. */
  minor?: boolean;
};
export type SkillArea = "project" | "language" | "framework" | "data" | "api" | "infra" | "ai" | "teamwork" | "general" | "other";
export const SKILL_AREAS: SkillArea[] = ["project", "language", "framework", "data", "api", "infra", "ai", "teamwork", "general", "other"];
export type SkillQuestion = {
  sessionId: string;
  date: string;
  question: string;
  score: number;
  missing: { point: string; status: "MISSING" | "PARTIAL" | "INCORRECT" }[];
  /** The grader recorded what the answer covered; false: no list to compare with. */
  checked?: boolean;
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
  kind: "first_session" | "first_challenge" | "tier_up" | "no_skip_session" | "skill_reached" | "skill_level_up";
  date: string;
  sessionId: string;
  jobTitle?: string | null;
  tier?: PracticeTier;
  skill?: string;
  score?: number;
  level?: number;
};

/** Measured noise behind the trend labels (progress_calibration); defaults until measured. */
export type ProgressCalibration = {
  measured: boolean;
  measuredAt: string | null;
  typicalError: number;
  swc: number;
  gradingSd: number | null;
  tierOffsets: Record<string, number>;
  tierAdjusted: boolean;
};

/** A key point followed across sessions (backend progress.gap_notebook). */
export type GapItem = {
  skill: string;
  skillKey: string;
  area: SkillArea;
  point: string;
  /** Latest status: COVERED for a fixed point. */
  status: "MISSING" | "PARTIAL" | "INCORRECT" | "COVERED";
  timesAsked: number;
  timesMissed: number;
  lastSeen: { sessionId: string; date: string; question: string; jobId: string | null; resumeId: string | null };
};
export type RoundStatus = "ready" | "almost" | "practice" | "thin" | "unseen";
export type RoundReadiness = {
  area: SkillArea;
  status: RoundStatus;
  estimate: number | null;
  sessions: number;
  skills: { conceptId: string; label: string; estimate: number }[];
  topGap: { point: string; skill: string; timesMissed: number } | null;
};
export type JobReadiness = { jobId: string; jobTitle: string | null; sessions: number; rounds: RoundReadiness[] };

export type RealInterviewStage = "screening" | "technical" | "final" | "other";
export type RealInterviewResult = "passed" | "failed" | "waiting";
export type RealInterviewReport = {
  id: string;
  jobId: string | null;
  company: string | null;
  date: string;
  stage: RealInterviewStage;
  result: RealInterviewResult;
  askedAreas: SkillArea[];
  hardParts: string | null;
  /** Readiness rounds the page showed when the report was made. */
  readiness: { jobId?: string; sessions?: number; rounds?: Partial<Record<SkillArea, { status: RoundStatus; estimate: number | null }>> };
};
export type RealInterviewInput = Omit<RealInterviewReport, "id" | "readiness">;

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
  trendRule: {
    minPoints: number;
    window: number;
    flatDelta: number;
    probability?: number;
    levelEdges?: number[];
    levelMargin?: number;
    processSd?: number;
  };
  calibration?: ProgressCalibration;
  /** Points still missing, and points fixed (absent on older backends). */
  gaps?: { open: GapItem[]; fixed: GapItem[] };
  /** Readiness per position, by interview round (absent on older backends). */
  readiness?: JobReadiness[];
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
    coreCoverage?: { before: number | null; now: number | null };
  };
  levelChanges?: { skill: string; from: number; to: number }[];
  firsts?: ("full_core" | "star_complete" | "measurable_result" | "recovered_after_probe" | "no_incorrect")[];
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
  realInterviews: async (): Promise<RealInterviewReport[]> => {
    const response = await apiClient.get<{ reports: RealInterviewReport[] }>("/api/v1/interviews/progress/real-interviews");
    return response.data.reports;
  },
  saveRealInterview: async (input: RealInterviewInput, id?: string): Promise<RealInterviewReport> => {
    const url = "/api/v1/interviews/progress/real-interviews";
    const response = id
      ? await apiClient.put<{ report: RealInterviewReport }>(`${url}/${encodeURIComponent(id)}`, input)
      : await apiClient.post<{ report: RealInterviewReport }>(url, input);
    return response.data.report;
  },
  deleteRealInterview: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/interviews/progress/real-interviews/${encodeURIComponent(id)}`);
  },
  compare: async (sessionId: string): Promise<ProgressComparison | null> => {
    const response = await apiClient.get<{ comparison: ProgressComparison | null }>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/progress-compare`,
      { params: { tzOffsetMinutes: localTzOffsetMinutes() } },
    );
    return response.data.comparison;
  },
};
