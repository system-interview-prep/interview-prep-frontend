import type { ChipTone } from "../components/ui";
import type { CvRun, CvStep, CvStepStatus } from "../services/cvParsingRuns.service";
import { fill, formatMs } from "./pipelineFormat";

type Translate = (key: string) => string;

/** Label from `cvParse.<group>.<value>`; falls back to the raw value (admins can still read codes). */
export function cvLabel(t: Translate, group: string, value: string | null | undefined): string {
  if (!value) return "—";
  const key = `cvParse.${group}.${value}`;
  const text = t(key);
  return text && text !== key ? text : value.replace(/_/g, " ");
}

export const cvStepLabel = (key: string, t: Translate) => cvLabel(t, "step", key);

export const CV_STEP_KEYS = ["upload", "queue", "extract", "source", "parse", "quality", "save", "done"] as const;

export const CV_RUN_TONE: Record<string, ChipTone> = { running: "live", completed: "good", review: "warn", failed: "bad" };

export const CV_STEP_TONE: Record<CvStepStatus, ChipTone> = {
  done: "good",
  running: "live",
  error: "bad",
  pending: "neutral",
  skipped: "outline",
};

export const COVERAGE_TONE: Record<string, ChipTone> = {
  complete: "good",
  complete_empty: "outline",
  partial: "warn",
  unavailable: "bad",
};

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatCount(value: number | null | undefined): string {
  return value == null ? "—" : value.toLocaleString("vi-VN");
}

const num = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const str = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

/** One short line per step ("3 trang · 12.400 ký tự"). Pure; used by the stepper. */
export function cvStepSummary(step: CvStep, t: Translate): string | null {
  const s = step.summary || {};
  const reason = str(s.reason);
  if (step.status === "skipped") return reason ? cvLabel(t, "reason", reason) : null;
  if (step.status === "error") return reason ? cvLabel(t, "reason", reason) : t("cvParse.summary.failed");
  if (reason === "untracked") return t("cvParse.reason.untracked");
  if (step.status !== "done" && step.status !== "running") return null;
  switch (step.key) {
    case "upload":
      if (reason === "duplicate") return t("cvParse.reason.duplicate");
      return num(s.size_bytes) != null ? fill(t("cvParse.summary.upload"), { size: formatBytes(num(s.size_bytes)) }) : null;
    case "queue": {
      const attempt = num(s.attempt);
      if (step.status === "running") return t("cvParse.summary.queueWaiting");
      return attempt != null ? fill(t("cvParse.summary.queue"), { n: attempt }) : null;
    }
    case "extract": {
      const provider = str(s.provider);
      const chars = num(s.markdown_characters);
      if (!provider) return null;
      return chars != null ? `${provider} · ${fill(t("cvParse.summary.chars"), { n: formatCount(chars) })}` : provider;
    }
    case "source":
      return num(s.source_characters) != null
        ? fill(t("cvParse.summary.source"), { n: formatCount(num(s.source_characters)), b: num(s.block_count) ?? 0 })
        : null;
    case "parse": {
      const skills = num(s.skills_count);
      const llm = num(s.llm_calls);
      if (skills == null) return null;
      const base = fill(t("cvParse.summary.parse"), { skills, jobs: num(s.employment_count) ?? 0 });
      return llm ? `${base} · ${fill(t("cvParse.summary.llm"), { n: llm })}` : base;
    }
    case "quality":
      return str(s.status) ? cvLabel(t, "quality", String(s.status)) : null;
    case "save":
      return t("cvParse.summary.saved");
    case "done": {
      const ms = num(s.duration_ms) ?? step.durationMs;
      return ms != null ? fill(t("cvParse.summary.done"), { time: formatMs(ms) }) : null;
    }
    default:
      return null;
  }
}

/** Steps passed, for the list's progress bar. */
export function cvRunProgress(run: Pick<CvRun, "status" | "currentStep">): number {
  if (run.status === "completed" || run.status === "review") return CV_STEP_KEYS.length;
  const index = CV_STEP_KEYS.indexOf(run.currentStep as (typeof CV_STEP_KEYS)[number]);
  return index < 0 ? 0 : index + (run.status === "failed" ? 0 : 1);
}
