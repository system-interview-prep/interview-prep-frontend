import apiClient from "@/lib/apiClient";

export interface StarAnalysis {
  situation?: string;
  task?: string;
  action?: string;
  result?: string;
  is_star_complete?: boolean;
  isStarComplete?: boolean;
}

export interface TurnEvaluation {
  id?: string;
  turn_id?: string;
  turnId?: string;
  turn_index?: number;
  turnIndex?: number;
  competency?: string;
  stage?: string;
  question_text?: string;
  questionText?: string;
  score: number;
  star_analysis?: StarAnalysis;
  starAnalysis?: StarAnalysis;
  evidence_quotes?: string[];
  evidenceQuotes?: string[];
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  /**
   * SKIPPED: the candidate skipped the question or said they could not answer; scored 0.
   * NOT_GRADABLE: unreadable voice transcript or a system failure; left out of the score.
   */
  outcome?: 'ANSWERED' | 'SKIPPED' | 'NOT_GRADABLE';
  /** Checklist verdicts; empty when the question has no expected points (graded holistically). */
  rubric_points?: RubricPoint[];
  rubricPoints?: RubricPoint[];
}

export interface RubricPoint {
  key: string;
  description: string;
  importance: 'CORE' | 'BONUS';
  status: 'COVERED' | 'PARTIAL' | 'INCORRECT' | 'MISSING';
  /** Verbatim from the answer; checked by the server, empty when MISSING. */
  quote: string;
  /** Why the server changed the grader's label (e.g. unverified_quote). */
  adjusted: string;
}

export interface CompetencyScore {
  competency: string;
  score: number;
  summary?: string;
}

export interface EvaluationReport {
  id?: string;
  session_id?: string;
  sessionId?: string;
  overall_score?: number;
  overallScore?: number;
  decision_recommendation?: 'STRONG_PASS' | 'PASS' | 'CONSIDER' | 'REJECT';
  decisionRecommendation?: 'STRONG_PASS' | 'PASS' | 'CONSIDER' | 'REJECT';
  competency_scores?: CompetencyScore[];
  competencyScores?: CompetencyScore[];
  turn_evaluations?: TurnEvaluation[];
  turnEvaluations?: TurnEvaluation[];
  recruiter_summary?: string;
  recruiterSummary?: string;
  candidate_feedback?: string;
  candidateFeedback?: string;
  next_round_topics?: string[];
  nextRoundTopics?: string[];
  red_flags?: string[];
  redFlags?: string[];
  evaluated_at?: string;
  evaluatedAt?: string;
}

export interface SessionReflection {
  sessionId: string;
  /** turnId → 1..4 (Còn yếu · Tạm được · Khá · Tốt) */
  selfRatings: Record<string, number>;
  takeaway: string | null;
  submitted: boolean;
  updatedAt: string | null;
}

export const interviewReportApi = {
  getReflection: async (sessionId: string): Promise<SessionReflection> => {
    const res = await apiClient.get<SessionReflection>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/reflection`
    );
    return res.data;
  },

  saveReflection: async (
    sessionId: string,
    payload: { selfRatings: Record<string, number>; takeaway?: string | null }
  ): Promise<SessionReflection> => {
    const res = await apiClient.put<SessionReflection>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/reflection`,
      payload
    );
    return res.data;
  },

  getEvaluation: async (sessionId: string): Promise<EvaluationReport> => {
    const res = await apiClient.get<EvaluationReport>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/evaluation`
    );
    return res.data;
  },

  evaluateSession: async (sessionId: string): Promise<EvaluationReport> => {
    const res = await apiClient.post<EvaluationReport>(
      `/api/v1/interviews/sessions/${encodeURIComponent(sessionId)}/evaluate`
    );
    return res.data;
  },
};
