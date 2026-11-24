import api from "@/lib/apiClient";

/** Suggestions from real interviews (question_bank/insights.py, interviews/evaluation/bank_insights.py). */
export type SuggestionKind = "REVISE" | "RETIRE" | "DIFFICULTY" | "RUBRIC_GAP" | "VARIANT" | "DUPLICATE";
export type SuggestionStatus = "OPEN" | "ACCEPTED" | "DISMISSED";

export type SuggestionEvidence = {
  asked?: number;
  sessions?: number;
  graded?: number;
  skipRate?: number | null;
  overtimeRate?: number | null;
  meanScore?: number | null;
  scoreStdDev?: number | null;
  empiricalDifficulty?: number | null;
  discrimination?: number | null;
  repeatUsers?: number;
  lowData?: boolean;
  criterion?: string;
  criterionAnswers?: number;
  missedRate?: number;
  twinQuestionId?: string;
  twinStableKey?: string;
};

export type SuggestionProposal = {
  difficultyBand?: string | null;
  misconception?: string;
  probe?: string;
  anchor_partial?: string;
  anchor_full?: string;
  basedOnAnswers?: number;
  count?: number;
};

export type BankSuggestion = {
  id: string;
  kind: SuggestionKind;
  reason: string;
  status: SuggestionStatus;
  severity: "HIGH" | "MEDIUM" | "LOW";
  questionId: string | null;
  questionVersionId: string | null;
  stableKey: string | null;
  questionText: string | null;
  difficultyBand: string | null;
  criterionKey: string | null;
  evidence: SuggestionEvidence;
  proposal: SuggestionProposal;
  result: { revisionVersionId?: string; generated?: number; retired?: boolean };
  note: string | null;
  decidedAt: string | null;
  updatedAt: string | null;
};

export type InsightsRun = {
  running: boolean;
  runId?: string;
  withAi?: boolean;
  startedAt?: string;
  finishedAt?: string;
  questions?: number;
  suggestions?: number;
  calibrated?: number;
  created?: number;
  refreshed?: number;
  quiet?: number;
  autoResolved?: number;
  aiProposals?: number;
  aiFailed?: number;
  error?: string | null;
};

export const bankInsightsApi = {
  state: () => api.get<{ run: InsightsRun; open: Partial<Record<SuggestionKind, number>> }>("/admin/question-bank/insights"),
  run: (withAi: boolean) => api.post<{ run: InsightsRun }>("/admin/question-bank/insights/run", { withAi }),
  list: (params: { status?: SuggestionStatus; questionId?: string; kind?: SuggestionKind } = {}) =>
    api.get<{ items: BankSuggestion[] }>("/admin/question-bank/suggestions", { params }),
  decide: (id: string, decision: "ACCEPT" | "DISMISS", note?: string) =>
    api.post<{ status: SuggestionStatus; result: BankSuggestion["result"] }>(
      `/admin/question-bank/suggestions/${encodeURIComponent(id)}/decision`,
      { decision, note: note || null },
    ),
};

/** Kinds only ADMIN accepts (the others: the author too, who gets a revision draft). */
export const ADMIN_KINDS: ReadonlySet<SuggestionKind> = new Set(["VARIANT", "RETIRE", "DUPLICATE"]);

/** Whether these roles can accept / dismiss this kind (mirrors question_bank/insights.can_decide). */
export function suggestionAbilities(kind: SuggestionKind, roles: readonly string[]): { accept: boolean; dismiss: boolean } {
  const held = new Set(roles.map((role) => role.toUpperCase()));
  if (held.has("ADMIN")) return { accept: true, dismiss: true };
  // Reviewer and bank-manager duties belong to ADMIN since 28/10.
  return { accept: !ADMIN_KINDS.has(kind) && held.has("QUESTION_AUTHOR"), dismiss: false };
}

/** "45%" for a 0-1 rate, "—" when unknown. */
export function percent(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `${Math.round(value * 100)}%`;
}
