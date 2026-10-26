import { apiClient } from "@/lib/apiClient";

/** Langfuse data read back by Core (modules/admin/langfuse_view.py). */
export type LangfuseOff = { connected: false; reason: "not_configured" | "client_unavailable" | "unreachable"; error?: string };

export type LangfuseObservation = {
  id: string;
  parentId: string | null;
  type: string | null;
  name: string | null;
  level: string | null;
  statusMessage: string | null;
  model: string | null;
  startTime: string | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  cost: number | null;
  prompt: string | null;
  input: string | null;
  output: string | null;
};

export type LangfuseScoreKind = "rule" | "flag" | "judge" | "human" | "other";
export type LangfuseScore = {
  name: string;
  value: number | string | boolean | null;
  dataType: string | null;
  source: string | null;
  comment: string | null;
  at: string | null;
  kind: LangfuseScoreKind;
};

export type LangfuseTrace = {
  connected: true;
  traceId: string;
  traceUrl: string | null;
  syncing: boolean;
  observations: LangfuseObservation[];
  totals: { calls: number; tokens: number; latencyMs: number; cost: number };
  scores: LangfuseScore[];
  humanScoreNames: string[];
};

export type LangfuseSession = {
  connected: true;
  sessionUrl: string | null;
  traces: { traceId: string; name: string | null; startTime: string | null; calls: number; tokens: number; warnings: number }[];
  scores: LangfuseScore[];
  syncing: boolean;
};

export type FlaggedTurn = { traceId: string; at: string | null; sessionId?: string | null; turnIndex?: number | null; flags?: string[] };
export type FlaggedTurns = { connected: true; items: FlaggedTurn[] };

export const langfuseService = {
  /** One turn's model calls and scores. Viewing a turn with the candidate's text is written to the access log. */
  async trace(traceId: string, sessionId?: string): Promise<LangfuseTrace | LangfuseOff> {
    const response = await apiClient.get<{ success: boolean } & (LangfuseTrace | LangfuseOff)>(
      `/admin/langfuse/traces/${encodeURIComponent(traceId)}`,
      { params: { sessionId } },
    );
    return response.data;
  },
  /** A reviewer's verdict on a turn, stored in Langfuse as a human.* score. */
  async review(traceId: string, payload: { name: string; value: boolean; comment?: string; sessionId?: string }): Promise<void> {
    await apiClient.post(`/admin/langfuse/traces/${encodeURIComponent(traceId)}/reviews`, {
      name: payload.name,
      value: payload.value,
      comment: payload.comment || null,
      sessionId: payload.sessionId ?? null,
    });
  },
  async session(sessionId: string): Promise<LangfuseSession | LangfuseOff> {
    const response = await apiClient.get<{ success: boolean } & (LangfuseSession | LangfuseOff)>(
      `/admin/sessions/${encodeURIComponent(sessionId)}/langfuse`,
    );
    return response.data;
  },
  async flagged(days = 7): Promise<FlaggedTurns | LangfuseOff> {
    const response = await apiClient.get<{ success: boolean } & (FlaggedTurns | LangfuseOff)>("/admin/langfuse/flagged", {
      params: { days },
    });
    return response.data;
  },
};

const isProblemFlag = (name: string) => name === "rule.flagged" || name.startsWith("flag.");

/** "true"/"false", 1/0 or a number, as shown in a score chip. Flags read "có"/"không" (1 = a problem). */
export function scoreValueText(score: Pick<LangfuseScore, "name" | "value" | "dataType">): string {
  const { value, dataType } = score;
  if (value === null || value === undefined) return "—";
  if (dataType === "BOOLEAN" || typeof value === "boolean") {
    const on = value === true || value === 1 || value === "1" || value === "true";
    if (isProblemFlag(score.name)) return on ? "có" : "không";
    return on ? "✓" : "✗";
  }
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

/** Whether a boolean-ish score is a pass (rule.flagged and flag.* are inverted: 1 means a problem). */
export function scorePasses(score: Pick<LangfuseScore, "name" | "value" | "dataType">): boolean | null {
  // Counts and grades (NUMERIC) are facts, not pass/fail.
  if (score.dataType === "NUMERIC") return null;
  const raw = score.value;
  const truthy = raw === true || raw === 1 || raw === "1" || raw === "true";
  const falsy = raw === false || raw === 0 || raw === "0" || raw === "false";
  if (!truthy && !falsy) return null;
  return isProblemFlag(score.name) ? falsy : truthy;
}
