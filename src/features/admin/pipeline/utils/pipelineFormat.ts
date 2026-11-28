import type { AdminStatusType } from "@features/admin/components/primitives/AdminStatusBadge";
import type {
  AdminAlert,
  BoardStepKey,
  EventStatus,
  LiveSession,
  LiveState,
  PipelineEvent,
  PipelineStage,
  Rate,
  SessionPipeline,
  SpeechCheck,
  StageStatus,
  TurnExchange,
  VoiceIncident,
} from "../services/pipeline.service";

type Translate = (key: string) => string;

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** A translation, or `fallback` when the key has none (the dictionary returns the key itself). */
export function tr(t: Translate, key: string, fallback: string): string {
  const value = t(key);
  return value === key ? fallback : value;
}

/** 820 ms · 3.1 s · 2 min 05 s */
export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}

/** 14:05:09, the same in every runtime. */
export function clock(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return [date.getHours(), date.getMinutes(), date.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
}

export function percentText(rate: Rate | null | undefined): string {
  if (!rate || rate.rate === null) return "—";
  return `${Math.round(rate.rate * 1000) / 10}%`;
}

/** USD cost: small LLM amounts keep enough digits to differ ($0.0085, $0.128, $12.40). */
export function formatUsd(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n === 0) return "$0";
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(4)}`;
}

export function compactNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export const STAGE_TONE: Record<StageStatus, AdminStatusType> = {
  done: "success",
  running: "active",
  error: "error",
  pending: "pending",
  skipped: "archived",
};

export const EVENT_TONE: Record<EventStatus, AdminStatusType> = {
  completed: "success",
  started: "active",
  error: "error",
  warning: "warning",
  info: "unknown",
};

export function eventLabel(event: string, t: Translate): string {
  return tr(t, `aiPipeline.event.${event}`, event.replaceAll("_", " "));
}

/**
 * Plain-language name of a model call. The backend names it after the calling
 * function (``area.file.Class.method``); the last segment identifies the step.
 */
const PURPOSES: [match: string, key: string][] = [
  ["_evaluate_candidate_response", "readAnswer"],
  ["_generate_probe_question", "probe"],
  ["_generate_clarify_text", "clarify"],
  ["_handle_closing_turn", "closingQna"],
  ["add_spoken_versions", "spoken"],
  ["generate_question_payloads", "generateQuestion"],
  ["judge_question_payloads", "judgeQuestion"],
  ["_call_grader", "grade"],
  ["_ask_grader", "grade"],
  ["aggregate_session_evaluation", "summary"],
  ["user_cvs.", "parseCv"],
  ["job_descriptions.", "parseJd"],
  ["matching.semantic.embeddings", "semanticEmb"],
  ["matching.clarification.semantic_check", "clarifyCheck"],
  ["matching.clarification.jev_gate", "jevGate"],
  ["matching.targeted_reparse", "evidence"],
  ["matching.clarification_question", "matchClarify"],
  ["matching.embeddings", "embeddings"],
  ["matching.rag", "rag"],
];

export function purposeKey(purpose: string | null | undefined): string | null {
  if (!purpose) return null;
  const last = purpose.split(".").pop() ?? purpose;
  for (const [match, key] of PURPOSES) {
    if (match.includes(".") ? purpose.startsWith(match) : last === match) return key;
  }
  return null;
}

export function purposeLabel(purpose: string | null | undefined, t: Translate): string {
  const key = purposeKey(purpose);
  return key ? t(`aiPipeline.purpose.${key}`) : purpose || "—";
}

/** Why the candidate got this practice tier, with the thresholds that decided it. */
export function entryReason(entry: SessionPipeline["entry"], t: Translate): string {
  if (entry.blocked) return t("aiPipeline.entry.reason.blocked");
  const percent = entry.matchPercent;
  const vars = {
    percent: percent ?? "—",
    low: entry.policy.lowFitPercent,
    challenge: entry.policy.challengePercent,
  };
  if (entry.practiceTier === "challenge") return fill(t("aiPipeline.entry.reason.challenge"), vars);
  if (entry.practiceTier === "basic") {
    if (entry.warnings.includes("match_not_eligible")) return fill(t("aiPipeline.entry.reason.basicNotEligible"), vars);
    if (percent === null) return t("aiPipeline.entry.reason.noScore");
    return fill(t("aiPipeline.entry.reason.basicLow"), vars);
  }
  if (percent === null) return t("aiPipeline.entry.reason.noScore");
  if (entry.practiceTier === "standard" && percent >= entry.policy.challengePercent) {
    return fill(t("aiPipeline.entry.reason.standardNotEligible"), vars);
  }
  return fill(t("aiPipeline.entry.reason.standard"), vars);
}

/** "Advanced (JD: intermediate, one level harder: challenge tier)". */
export function difficultyReason(difficulty: SessionPipeline["plan"]["difficulty"], t: Translate): string | null {
  if (!difficulty?.level) return null;
  const level = tr(t, `adminPlan.difficulty.${difficulty.level}`, difficulty.level);
  const adjustment = difficulty.fitAdjustment;
  if (!adjustment || !difficulty.jobLevel) return level;
  return fill(t(`aiPipeline.plan.difficulty.${adjustment.direction}`), {
    level,
    job: tr(t, `adminPlan.difficulty.${difficulty.jobLevel}`, difficulty.jobLevel),
  });
}

/**
 * What the interviewer decided after one answer and why, as short phrases:
 * ["Answer, sufficient", "Next question", "Acknowledgement replaced: …"].
 */
export function exchangeReasons(exchange: TurnExchange, t: Translate): string[] {
  const reasons: string[] = [];
  const intent = exchange.intent ? tr(t, `aiPipeline.intent.${exchange.intent}`, exchange.intent) : null;
  const sufficiency = exchange.sufficiency
    ? tr(t, `aiPipeline.sufficiency.${exchange.sufficiency}`, exchange.sufficiency)
    : null;
  if (intent || sufficiency) reasons.push([intent, sufficiency].filter(Boolean).join(" · "));
  if (exchange.action === "PROBE") {
    reasons.push(
      exchange.probeKind === "deepen"
        ? t("aiPipeline.turn.probeDeepen")
        : fill(t("aiPipeline.turn.probeGap"), { aspect: exchange.missingAspect || "—" }),
    );
  }
  if (exchange.hardAnswerTimeout) reasons.push(t("aiPipeline.turn.hardTimeout"));
  // Turns with the speech-control log show each replaced line in their own block.
  if (exchange.speechChecks?.length) {
    if (exchange.repeatsRecent) reasons.push(t("aiPipeline.turn.repeated"));
    return reasons;
  }
  if (exchange.ackSource === "fallback") {
    const why = exchange.ackReason ? tr(t, `aiPipeline.ackReason.${exchange.ackReason}`, exchange.ackReason) : null;
    reasons.push(why ? fill(t("aiPipeline.turn.ackReplacedWhy"), { reason: why }) : t("aiPipeline.turn.ackFallback"));
  }
  if (exchange.generatedBy === "fixed_fallback") reasons.push(t("aiPipeline.turn.fixedFollowup"));
  if (exchange.repeatsRecent) reasons.push(t("aiPipeline.turn.repeated"));
  return reasons;
}

/** Warnings worth a colored row in the turn view (fallbacks, timeouts, repeats). */
export function exchangeHasWarning(exchange: TurnExchange): boolean {
  return (
    exchange.ackSource === "fallback" ||
    exchange.generatedBy === "fixed_fallback" ||
    Boolean(exchange.repeatsRecent) ||
    Boolean(exchange.hardAnswerTimeout) ||
    Boolean(exchange.speechChecks?.some((check) => check.outcome === "error"))
  );
}

/** Short detail for an event row: the most useful payload fields, in order, in words. */
const DETAIL_FIELDS = [
  "error_type",
  "error_message",
  "reason",
  "action",
  "intent",
  "practice_tier",
  "difficulty_level",
  "targets_count",
  "turns_count",
  "saved",
  "rejected",
  "score",
  "outcome",
  "overall_score",
  "decision",
  "coverage_ratio",
];

/** Fields whose values are codes with a translation (aiPipeline.value.<field>.<code>). */
const CODED_FIELDS = new Set(["reason", "action", "intent", "practice_tier", "difficulty_level", "outcome", "decision", "error_type"]);

export function eventDetail(event: PipelineEvent, t?: Translate): string {
  const parts: string[] = [];
  for (const field of DETAIL_FIELDS) {
    const value = event.payload[field];
    if (value === null || value === undefined || value === "") continue;
    const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
    if (!t) {
      parts.push(`${field}=${raw}`);
    } else {
      const label = tr(t, `aiPipeline.field.${field}`, field.replaceAll("_", " "));
      const shown =
        CODED_FIELDS.has(field) && typeof value === "string"
          ? tr(t, `aiPipeline.value.${field}.${value}`, tr(t, `aiPipeline.value.any.${value}`, raw.replaceAll("_", " ")))
          : field === "coverage_ratio" && typeof value === "number"
            ? `${Math.round(value * 100)}%`
            : raw;
      parts.push(`${label}: ${shown}`);
    }
    if (parts.length >= 4) break;
  }
  return parts.join(" · ");
}

/**
 * How often to poll. A live session refreshes every 4 s; with the push socket
 * connected the poll is only a safety net (20 s). Finished sessions do not poll.
 */
export function pollInterval(pipeline: Pick<SessionPipeline, "live"> | null, socketConnected = false): number | null {
  if (!pipeline?.live) return null;
  return socketConnected ? 20_000 : 4000;
}

/** 0:07 · 4:05 · 1:02:09 (a running clock). */
export function formatClock(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = hours ? String(minutes).padStart(2, "0") : String(minutes);
  return `${hours ? `${hours}:` : ""}${mm}:${String(seconds).padStart(2, "0")}`;
}

/** Milliseconds from `iso` to `now`, or null. */
export function msSince(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  const at = new Date(iso).getTime();
  return Number.isNaN(at) ? null : Math.max(0, now - at);
}

/** "Warm-up", "Deep dive", ... for a question stage code (WARM_UP, DEEP_DIVE, ...). */
export function questionStageLabel(stage: string | null | undefined, t: Translate): string {
  if (!stage) return "—";
  return tr(t, `aiPipeline.qstage.${stage.toUpperCase()}`, stage.replaceAll("_", " ").toLowerCase());
}

export function fitBandLabel(band: string | null | undefined, t: Translate): string {
  if (!band) return "—";
  return tr(t, `aiPipeline.fitBand.${band.toLowerCase()}`, band);
}

export function endReasonLabel(reason: string | null | undefined, t: Translate): string {
  if (!reason) return "—";
  return tr(t, `aiPipeline.endReason.${reason}`, reason.replaceAll("_", " ").toLowerCase());
}

/** "The candidate is speaking", "AI is reading the question", ... */
export function liveStateLabel(live: Pick<LiveState, "state" | "kind"> | null | undefined, t: Translate): string | null {
  if (!live?.state) return null;
  if (live.state === "ai_speaking" && live.kind) {
    return tr(t, `aiPipeline.liveState.ai_speaking.${live.kind}`, t("aiPipeline.liveState.ai_speaking"));
  }
  return t(`aiPipeline.liveState.${live.state}`);
}

/** States that call for attention when they last long (waiting, processing, away). */
export function liveStateTone(state: string | null | undefined, sinceMs: number | null): "neutral" | "brand" | "warn" | "bad" {
  if (state === "candidate_away") return "bad";
  if (state === "processing" && sinceMs !== null && sinceMs > 15_000) return "warn";
  if (state === "waiting_answer" && sinceMs !== null && sinceMs > 90_000) return "warn";
  if (state === "candidate_speaking" || state === "ai_speaking") return "brand";
  return "neutral";
}

export function boardStepLabel(step: LiveSession["step"], t: Translate): string {
  if (step.step === "interviewing") {
    return liveStateLabel({ state: step.state ?? null, kind: step.kind ?? null }, t) ?? t("aiPipeline.board.step.interviewing");
  }
  if (step.step === "grading" && step.total) {
    return fill(t("aiPipeline.board.step.gradingProgress"), { graded: step.graded ?? 0, total: step.total });
  }
  return t(`aiPipeline.board.step.${step.step satisfies BoardStepKey}`);
}

/** "Question 3/4" for the board, with the warm-up counted. */
export function boardProgress(session: LiveSession, t: Translate): string | null {
  const { total, answered, current } = session.turns;
  if (!total) return null;
  const n = current !== null && current !== undefined ? current + 1 : Math.min(total, answered + 1);
  return fill(t("aiPipeline.board.question"), { n, total });
}

export function voiceIncidentLabel(incident: VoiceIncident, t: Translate): string {
  const base = tr(t, `aiPipeline.voice.${incident.event}`, incident.event.replace(/^voice_/, "").replaceAll("_", " "));
  const detail = incident.reason
    ? tr(t, `aiPipeline.value.reason.${incident.reason}`, incident.reason.replaceAll("_", " "))
    : incident.action
      ? tr(t, `aiPipeline.value.action.${incident.action}`, incident.action)
      : incident.error_type || incident.component || null;
  return detail ? `${base} (${detail})` : base;
}

/**
 * The result of one pipeline step in a few words, for its card in the stepper:
 * "74% · Challenge", "3 skills · Advanced", "4 questions · 1 by AI", ...
 */
export function stageSummary(stage: PipelineStage, pipeline: SessionPipeline, t: Translate): string | null {
  switch (stage.key) {
    case "entry": {
      const { entry } = pipeline;
      if (entry.blocked) return t("aiPipeline.summary.blocked");
      const parts = [
        entry.matchPercent != null ? `${entry.matchPercent}%` : null,
        entry.practiceTier ? t(`aiPipeline.tier.${entry.practiceTier}`) : null,
      ].filter(Boolean);
      return parts.length ? parts.join(" · ") : null;
    }
    case "plan": {
      const { plan } = pipeline;
      if (stage.status !== "done") return null;
      const level = plan.difficulty?.level ? tr(t, `adminPlan.difficulty.${plan.difficulty.level}`, plan.difficulty.level) : null;
      return [fill(t("aiPipeline.summary.skills"), { n: plan.targets.length }), level].filter(Boolean).join(" · ");
    }
    case "questions": {
      if (stage.status !== "done") return null;
      const { turnCounts, questions } = pipeline;
      const generated = (questions.sources.generated_unreviewed ?? 0) + (questions.sources.generated ?? 0);
      const main = fill(t("aiPipeline.summary.questions"), { main: turnCounts.main, warmup: turnCounts.warmup });
      return generated ? `${main} · ${fill(t("aiPipeline.summary.generated"), { n: generated })}` : main;
    }
    case "interview": {
      const answered = pipeline.turns.filter((turn) => turn.status === "ANSWERED").length;
      const total = pipeline.turns.length;
      if (!total) return null;
      if (stage.status === "running" && pipeline.currentTurnIndex != null) {
        return fill(t("aiPipeline.summary.atQuestion"), { n: pipeline.currentTurnIndex + 1, total });
      }
      const reason = pipeline.session.endReason ? ` · ${endReasonLabel(pipeline.session.endReason, t)}` : "";
      return `${fill(t("aiPipeline.summary.answered"), { answered, total })}${reason}`;
    }
    case "evaluation": {
      const { evaluation } = pipeline;
      if (stage.status === "running" && evaluation.progress?.total) {
        return fill(t("aiPipeline.grading.progress"), { graded: evaluation.progress.graded, total: evaluation.progress.total });
      }
      if (stage.status === "error" && evaluation.job) return fill(t("aiPipeline.grading.attempts"), { n: evaluation.job.attemptCount });
      return null;
    }
    case "report": {
      const { evaluation } = pipeline;
      if (evaluation.overallScore == null) return null;
      const decision = evaluation.decision ? tr(t, `aiPipeline.value.decision.${evaluation.decision}`, evaluation.decision) : null;
      return [`${formatScore(evaluation.overallScore)}/10`, decision].filter(Boolean).join(" · ");
    }
    default:
      return null;
  }
}

/** 7.25 -> "7.3", 5 -> "5". */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return "—";
  return String(Math.round(score * 10) / 10);
}

/** Alert title and detail, in words (aiPipeline.alert.<kind>). */
export function alertText(alert: AdminAlert, t: Translate): { title: string; detail: string } {
  const vars = {
    count: alert.count,
    total: alert.total ?? 0,
    rate: alert.rate != null ? `${Math.round(alert.rate * 100)}%` : "—",
    threshold: alert.threshold != null ? `${Math.round(alert.threshold * 100)}%` : "—",
    minutes: alert.minutes ?? 0,
    p95: formatMs(alert.p95Ms ?? null),
    limit: formatMs(alert.thresholdMs ?? null),
  };
  return {
    title: fill(t(`aiPipeline.alert.${alert.kind}.title`), vars),
    detail: fill(t(`aiPipeline.alert.${alert.kind}.detail`), vars),
  };
}

/** An alert stays dismissed until it has a newer occurrence. */
export function alertKey(alert: AdminAlert): string {
  return `${alert.kind}@${alert.lastAt ?? ""}`;
}

// --- Kiểm soát lời nói (backend core/speech_checks.py) ----------------------------------

/** Why a guard refused or edited a line, in words; "topic_*" is the topic-mode acknowledgement. */
export function speechReasonLabel(reason: string | null | undefined, t: Translate): string {
  if (!reason || reason === "-") return "—";
  if (reason.startsWith("topic_")) {
    const inner = reason.slice("topic_".length);
    return fill(t("aiPipeline.speech.reason.topicPrefix"), { reason: tr(t, `aiPipeline.speech.reason.${inner}`, inner) });
  }
  return tr(t, `aiPipeline.speech.reason.${reason}`, reason);
}

/** "Câu hỏi thêm: quá dài" (the outcome is shown beside it as a chip). */
export function speechCheckLabel(check: SpeechCheck, t: Translate): string {
  const kind = tr(t, `aiPipeline.speech.kind.${check.kind}`, check.kind);
  return check.reason ? `${kind}: ${speechReasonLabel(check.reason, t)}` : kind;
}

export function speechSourceLabel(source: string | null | undefined, t: Translate): string {
  const code = source || "-";
  return tr(t, `aiPipeline.speech.source.${code}`, code);
}

/** The guard decisions worth showing on a turn: everything but a clean pass. */
export function notableSpeechChecks(exchange: TurnExchange): SpeechCheck[] {
  return (exchange.speechChecks ?? []).filter((check) => check.outcome !== "pass");
}

/** Tone of a guard outcome: refused and failed lines stand out, edits less so. */
export function speechOutcomeTone(outcome: string): "bad" | "warn" | "good" | "neutral" {
  if (outcome === "error") return "bad";
  if (outcome === "reject") return "warn";
  if (outcome === "pass") return "good";
  return "neutral";
}

// --- Theo dõi LLM (backend application/llm_checks.py) ------------------------------------

export function decisionRuleLabel(rule: string | null | undefined, t: Translate): string | null {
  if (!rule) return null;
  if (rule.startsWith("end_")) return fill(t("aiPipeline.llm.rule.end"), { reason: rule.slice(4) });
  return tr(t, `aiPipeline.llm.rule.${rule}`, rule);
}

export function flagLabel(flag: string, t: Translate): string {
  return tr(t, `aiPipeline.llm.flag.${flag}`, flag);
}

/** Link to one turn's trace in Langfuse. */
export function langfuseTraceUrl(projectUrl: string | null | undefined, traceId: string | null | undefined): string | null {
  return projectUrl && traceId ? `${projectUrl}/traces/${encodeURIComponent(traceId)}` : null;
}
