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

export const interviewReportApi = {
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
