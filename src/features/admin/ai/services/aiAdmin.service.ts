import { apiClient } from "@/lib/apiClient";

/** One AI feature and the provider/model the backend configuration selects (GET /admin/ai/models). */
export type ConfiguredModel = {
  capability: string;
  provider: string;
  model: string;
  /** Environment variable that selects it. */
  source: string;
  /** False when the feature is switched off (e.g. a parser in deterministic mode). */
  active: boolean;
  mode?: string;
};

/** A provider/model pair seen in ai_call_logs for one caller. */
export type ObservedModel = {
  purpose: string;
  provider: string | null;
  model: string | null;
  calls: number;
  errors: number;
  lastAt: string | null;
};

export type AiModels = {
  windowDays: number;
  configured: ConfiguredModel[];
  observed: ObservedModel[];
  generatedAt: string;
};

export type ScoreRate = { count: number; passed: number; rate: number };

type Section<T> = ({ ok: true } & T) | { ok: false; error: string };

/** Summary of the Langfuse project (GET /admin/ai/evaluation). */
export type AiEvaluation =
  | { windowDays: number; connected: false; reason: "not_configured" | "client_unavailable" | "unreachable"; generatedAt: string }
  | {
      windowDays: number;
      connected: true;
      projectUrl: string;
      links: Record<"traces" | "sessions" | "scores" | "datasets" | "prompts" | "queues" | "evaluators" | "dashboards", string>;
      quality: Section<{
        rates: Record<string, ScoreRate>;
        criteria: { criterion: string; judge: ScoreRate | null; human: ScoreRate | null }[];
      }>;
      experiments: Section<{
        datasets: { id: string; name: string; description: string | null }[];
        goldenDatasetId: string | null;
        runs: { id: string; name: string; startTime: string | null; items: number; model: string | null; rates: Record<string, ScoreRate> }[];
      }>;
      review: Section<{ configured: boolean; queueId?: string; pending: number | null; completed: number | null }>;
      prompts: Section<{ count: number }>;
      generatedAt: string;
    };

/** One slice of LLM cost: USD as Langfuse prices it, over model calls (generations). */
export type CostRow = { cost: number; tokens: number; calls: number };

/** LLM cost read from the Langfuse Metrics API (GET /admin/ai/cost). */
export type AiCost =
  | { windowDays: number; connected: false; reason: "not_configured" | "client_unavailable" | "unreachable"; error?: string }
  | {
      windowDays: number;
      connected: true;
      currency: "USD";
      total: CostRow;
      byModel: ({ model: string | null } & CostRow)[];
      /** interview_turn, session_grading, judge, experiment, playbook, or a raw trace name. */
      byFeature: ({ feature: string } & CostRow)[];
      daily: { day: string; cost: number; calls: number }[];
      dashboardUrl: string | null;
      generatedAt: string;
    };

export const aiAdminService = {
  async cost(days = 7, refresh = false): Promise<AiCost> {
    const response = await apiClient.get<{ success: boolean } & AiCost>("/admin/ai/cost", { params: { days, refresh } });
    return response.data;
  },
  async models(days = 30): Promise<AiModels> {
    const response = await apiClient.get<{ success: boolean } & AiModels>("/admin/ai/models", { params: { days } });
    return response.data;
  },
  async evaluation(days = 7, refresh = false): Promise<AiEvaluation> {
    const response = await apiClient.get<{ success: boolean } & AiEvaluation>("/admin/ai/evaluation", {
      params: { days, refresh },
    });
    return response.data;
  },
};
