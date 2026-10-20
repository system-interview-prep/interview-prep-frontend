import type { ChipTone } from "../components/ui";
import type { MatchRun, MatchStep, MatchStepKey, MatchStepStatus } from "../services/matchingRuns.service";
import { fill, formatMs } from "./pipelineFormat";

type Translate = (key: string) => string;

/** Label from `matching.<group>.<value>`; falls back to the raw value (admins can still read codes). */
function labelOf(t: Translate, group: string, value: string | null | undefined): string {
  if (!value) return "—";
  const key = `matching.${group}.${value}`;
  const text = t(key);
  return text && text !== key ? text : value.replace(/_/g, " ");
}

export const stepLabel = (key: string, t: Translate) => labelOf(t, "step", key);
export const flowLabel = (flow: string, t: Translate) => labelOf(t, "flow", flow);
export const fitBandMatchLabel = (band: string | null | undefined, t: Translate) => labelOf(t, "fit", band);
export const requirementStatusLabel = (status: string, t: Translate) => labelOf(t, "req", status);
export const evaluatorLabel = (name: string | null | undefined, t: Translate) => labelOf(t, "evaluator", name);
export const priorityLabel = (priority: string | null | undefined, t: Translate) => labelOf(t, "priority", priority);
export const warningLabel = (code: string, t: Translate) => labelOf(t, "warning", code);
export const factorLabel = (name: string, t: Translate) => labelOf(t, "factor", name);
export const eligibilityLabel = (value: string | null | undefined, t: Translate) => labelOf(t, "eligibility", value);

/** Reason codes are many and grow over time: known ones in words, others as the code itself. */
export function reasonLabel(code: string | null | undefined, t: Translate): string {
  if (!code) return "—";
  const key = `matching.reason.${code}`;
  const text = t(key);
  return text && text !== key ? text : code;
}

export const RUN_STATUS_TONE: Record<string, ChipTone> = { running: "live", completed: "good", failed: "bad" };

export const STEP_STATUS_TONE: Record<MatchStepStatus, ChipTone> = {
  done: "good",
  running: "live",
  error: "bad",
  pending: "neutral",
  skipped: "outline",
};

export const FIT_TONE: Record<string, ChipTone> = {
  strong_fit: "good",
  partial_fit: "sky",
  review_required: "warn",
  insufficient_evidence: "orange",
  not_eligible: "bad",
};

export const REQ_TONE: Record<string, ChipTone> = {
  met: "good",
  not_met: "bad",
  unknown: "warn",
  not_applicable: "outline",
};

export function percent(score: number | null | undefined): string {
  return score == null ? "—" : `${Math.round(score * 100)}%`;
}

const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const str = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

/** One short line per step: what it produced ("12 tiêu chí · 8 đạt"). Pure; used by the stepper. */
export function stepSummary(step: MatchStep, t: Translate): string | null {
  const s = step.summary || {};
  if (step.status === "skipped") {
    const reason = str(s.reason) ?? str(s.skipped_reason);
    return reason ? labelOf(t, "skip", reason) : null;
  }
  if (step.status === "error") {
    const reason = str(s.reason) ?? str(s.error_type) ?? str(s.http_status != null ? `http_${s.http_status}` : null);
    return reason ? labelOf(t, "error", reason) : t("matching.summary.failed");
  }
  if (step.status !== "done") return null;
  switch (step.key as MatchStepKey) {
    case "request":
      return str(s.endpoint) ? fill(t("matching.summary.request"), { endpoint: String(s.endpoint) }) : null;
    case "inputs": {
      const total = num(s.requirement_count);
      const path = str(s.jd_path);
      if (total == null) return null;
      return fill(t(path === "legacy" ? "matching.summary.inputsLegacy" : "matching.summary.inputs"), { n: total });
    }
    case "cache":
      return s.hit === true ? t("matching.summary.cacheHit") : t("matching.summary.cacheMiss");
    case "reparse": {
      const recovered = (num(s.alias_recovered_count) ?? 0) + (num(s.llm_recovered_count) ?? 0);
      const asked = num(s.llm_requested_count) ?? 0;
      return fill(t(asked ? "matching.summary.reparseAi" : "matching.summary.reparse"), { n: recovered, asked });
    }
    case "requirements": {
      const total = num(s.total);
      const byStatus = (s.counts_by_status ?? {}) as Record<string, number>;
      if (total == null) return null;
      return fill(t("matching.summary.requirements"), { n: total, met: byStatus.met ?? 0, unknown: byStatus.unknown ?? 0 });
    }
    case "semantic": {
      const sparse = num(s.sparse_score);
      const dense = num(s.dense_score);
      if (dense != null) return fill(t("matching.summary.semanticDense"), { score: percent(dense) });
      if (sparse != null) return fill(t("matching.summary.semanticSparse"), { score: percent(sparse) });
      return str(s.mode) ? labelOf(t, "semanticMode", String(s.mode)) : null;
    }
    case "scoring": {
      const band = str(s.fit_band);
      const score = num(s.suitability_score);
      if (!band) return null;
      return score != null ? `${fitBandMatchLabel(band, t)} · ${percent(score)}` : fitBandMatchLabel(band, t);
    }
    case "cache_write":
      return str(s.outcome) ? labelOf(t, "cacheWrite", String(s.outcome)) : null;
    case "done": {
      const ms = num(s.duration_ms) ?? step.durationMs;
      return ms != null ? fill(t("matching.summary.done"), { time: formatMs(ms) }) : null;
    }
    case "clarify":
      return num(s.approved_count) != null
        ? fill(t("matching.summary.clarify"), { n: num(s.approved_count) ?? 0, of: num(s.unknown_count) ?? 0 })
        : null;
    case "questions":
      return num(s.generated_count) != null ? fill(t("matching.summary.questions"), { n: num(s.generated_count) ?? 0 }) : null;
    case "rescore": {
      const before = num(s.suitability_before);
      const after = num(s.suitability_after);
      return before != null || after != null ? `${percent(before)} → ${percent(after)}` : null;
    }
    default:
      return null;
  }
}

/** Steps that ran out of the steps the run has (skipped count as passed), for the list's progress bar. */
export function runProgress(run: Pick<MatchRun, "status" | "currentStep">, keys: readonly string[]): number {
  if (run.status === "completed") return keys.length;
  const index = keys.indexOf(run.currentStep);
  return index < 0 ? 0 : index + (run.status === "failed" ? 0 : 1);
}

export const BASE_STEP_KEYS = ["request", "inputs", "cache", "reparse", "requirements", "semantic", "scoring", "cache_write", "done"] as const;
