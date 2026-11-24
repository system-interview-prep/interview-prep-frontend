import type { EvaluationReport } from "@features/interview/services/interviewReport.service";
import type { StoredDashboardSession } from "../components/DashboardSections";

export type AIReview = {
  session: StoredDashboardSession & { overallScore: number };
  strengths: string[];
  weaknesses: string[];
  nextTopics: string[];
};

function cleanList(items: unknown[] | undefined, limit = 3): string[] {
  const values = (items ?? []).filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(values)).slice(0, limit);
}

/** Build a concise review from the saved evaluation for one scored session. */
export function buildAIReview(
  session: StoredDashboardSession & { overallScore: number },
  report: EvaluationReport,
): AIReview | null {
  const turns = report.turnEvaluations ?? report.turn_evaluations ?? [];
  const strengths = cleanList(turns.flatMap((turn) => turn.strengths ?? []));
  const weaknesses = cleanList(turns.flatMap((turn) => turn.weaknesses ?? []));
  const nextTopics = cleanList(report.nextRoundTopics ?? report.next_round_topics);

  if (strengths.length === 0 && weaknesses.length === 0 && nextTopics.length === 0) return null;
  return { session, strengths, weaknesses, nextTopics };
}
