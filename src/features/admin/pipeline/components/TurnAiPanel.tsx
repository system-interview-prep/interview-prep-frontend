"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  langfuseService,
  scorePasses,
  scoreValueText,
  type LangfuseOff,
  type LangfuseScore,
  type LangfuseTrace,
} from "@features/admin/services/langfuse.service";
import { fill, tr } from "../utils/pipelineFormat";

type Translate = (key: string) => string;

/** "decision_ok" from "human.decision_ok" / "judge.decision_ok". */
export function criterionOf(name: string): string {
  const dot = name.indexOf(".");
  return dot >= 0 ? name.slice(dot + 1) : name;
}

/** Scores grouped for display: rules (rule.* and flag.*), AI judges, reviewers, the rest. */
export function groupScores(scores: LangfuseScore[]): { kind: "rule" | "judge" | "human" | "other"; scores: LangfuseScore[] }[] {
  const order = ["rule", "judge", "human", "other"] as const;
  return order
    .map((kind) => ({
      kind,
      scores: scores.filter((s) => (kind === "rule" ? s.kind === "rule" || s.kind === "flag" : s.kind === kind)),
    }))
    .filter((group) => group.scores.length > 0);
}

function scoreLabel(score: LangfuseScore, t: Translate): string {
  if (score.name === "rule.flagged") return t("langfuseUi.score.ruleFlagged");
  if (score.name.startsWith("flag.")) return tr(t, `aiPipeline.flag.${criterionOf(score.name)}`, criterionOf(score.name));
  if (score.kind === "judge" || score.kind === "human") return tr(t, `langfuseUi.criterion.${criterionOf(score.name)}`, score.name);
  return tr(t, `langfuseUi.sessionScore.${score.name}`, score.name);
}

function ScoreChip({ score, t }: { score: LangfuseScore; t: Translate }) {
  const pass = scorePasses(score);
  const tone =
    pass === true
      ? "border-[#BFE3CF] bg-[#F1FAF5] text-[#1F7A4D]"
      : pass === false
        ? "border-[#F3C9C9] bg-[#FDF3F3] text-[#C43B3B]"
        : "border-[#DCE4F3] bg-white text-[#475569]";
  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`} title={score.comment ?? undefined}>
      <span className="truncate">{scoreLabel(score, t)}</span>
      <span className="tabular-nums">{scoreValueText(score)}</span>
    </span>
  );
}

function ReviewForm({
  trace,
  sessionId,
  onSaved,
}: {
  trace: LangfuseTrace;
  sessionId?: string;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const given = new Map(trace.scores.filter((s) => s.kind === "human").map((s) => [s.name, s]));

  const save = async (name: string, value: boolean) => {
    setBusy(`${name}:${value}`);
    setMessage(null);
    try {
      await langfuseService.review(trace.traceId, { name, value, comment, sessionId });
      setMessage({ ok: true, text: t("langfuseUi.review.saved") });
      setComment("");
      onSaved();
    } catch {
      setMessage({ ok: false, text: t("langfuseUi.review.failed") });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-[#EAEFF8] bg-white p-3">
      <p className="text-xs font-semibold text-[#14244B]">{t("langfuseUi.review.title")}</p>
      <p className="text-[11px] leading-4 text-[#607096]">{t("langfuseUi.review.hint")}</p>
      <ul className="space-y-1.5">
        {trace.humanScoreNames.map((name) => {
          const previous = given.get(name);
          return (
            <li key={name} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="min-w-0 flex-1 text-[#14244B]">{tr(t, `langfuseUi.criterion.${criterionOf(name)}`, name)}</span>
              {previous ? <ScoreChip score={previous} t={t} /> : null}
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void save(name, true)}
                className="rounded-full border border-[#BFE3CF] px-2.5 py-1 font-semibold text-[#1F7A4D] hover:bg-[#F1FAF5] disabled:opacity-50"
              >
                {t("langfuseUi.review.correct")}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void save(name, false)}
                className="rounded-full border border-[#F3C9C9] px-2.5 py-1 font-semibold text-[#C43B3B] hover:bg-[#FDF3F3] disabled:opacity-50"
              >
                {t("langfuseUi.review.wrong")}
              </button>
            </li>
          );
        })}
      </ul>
      <label className="block text-[11px] font-semibold text-[#607096]">
        {t("langfuseUi.review.comment")}
        <input
          value={comment}
          maxLength={500}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#DCE4F3] px-2 py-1.5 text-xs text-[#14244B]"
        />
      </label>
      {message ? (
        <p role="status" className={`text-xs font-semibold ${message.ok ? "text-[#1F7A4D]" : "text-[#C43B3B]"}`}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

/**
 * "AI đã làm gì" for one exchange: its Langfuse trace read back into the
 * console (model calls, tokens, latency, input/output when the turn carried
 * text) with the rule, AI-judge and reviewer scores, and a form to add a
 * reviewer verdict that goes back to Langfuse.
 */
export default function TurnAiPanel({ traceId, traceUrl }: { traceId: string; traceUrl: string | null }) {
  const { t } = useLanguage();
  const params = useParams<{ id?: string }>();
  const sessionId = typeof params?.id === "string" ? params.id : undefined;
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<{ status: "idle" | "loading" } | { status: "ready"; data: LangfuseTrace | LangfuseOff } | { status: "error" }>({
    status: "idle",
  });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "ready", data: await langfuseService.trace(traceId, sessionId) });
    } catch {
      setState({ status: "error" });
    }
  }, [traceId, sessionId]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && state.status === "idle") void load();
  };

  let body;
  if (state.status === "ready") {
    const data = state.data;
    body = !data.connected ? (
      <p className="text-xs text-[#8A5A00]">{tr(t, `langfuseUi.off.${data.reason}`, t("langfuseUi.error"))}</p>
    ) : data.syncing ? (
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#607096]">
        <span>{t("langfuseUi.syncing")}</span>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1 font-semibold text-[#204195] hover:underline">
          <RefreshCw className="size-3" aria-hidden="true" />
          {t("langfuseUi.retry")}
        </button>
      </div>
    ) : (
      <TraceBody trace={data} traceUrl={data.traceUrl ?? traceUrl} sessionId={sessionId} onReload={() => void load()} />
    );
  } else if (state.status === "error") {
    body = <p className="text-xs text-[#C43B3B]">{t("langfuseUi.error")}</p>;
  } else {
    body = <p className="text-xs text-[#607096]">{t("langfuseUi.loading")}</p>;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#204195] hover:underline"
      >
        <Bot className="size-3.5" aria-hidden="true" />
        {t("langfuseUi.toggle")}
        {open ? <ChevronUp className="size-3" aria-hidden="true" /> : <ChevronDown className="size-3" aria-hidden="true" />}
      </button>
      {open ? (
        <div className="mt-2 space-y-2 rounded-lg border border-[#DCE4F3] bg-[#F8FAFE] p-3">
          {body}
        </div>
      ) : null}
    </div>
  );
}

function TraceBody({
  trace,
  traceUrl,
  sessionId,
  onReload,
}: {
  trace: LangfuseTrace;
  traceUrl: string | null;
  sessionId?: string;
  onReload: () => void;
}) {
  const { t } = useLanguage();
  const calls = trace.observations.filter((o) => o.type === "GENERATION" || o.level === "WARNING" || o.level === "ERROR");
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#475569]">
        <span>
          {fill(t("langfuseUi.totals"), {
            calls: trace.totals.calls,
            tokens: trace.totals.tokens.toLocaleString("vi-VN"),
            seconds: (trace.totals.latencyMs / 1000).toFixed(1),
          })}
        </span>
        {traceUrl ? (
          <a href={traceUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 font-semibold text-[#204195] hover:underline">
            {t("aiPipeline.llm.openTrace")}
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      {calls.length ? (
        <ol className="space-y-1.5">
          {calls.map((call) => (
            <li key={call.id} className="rounded-md border border-[#EAEFF8] bg-white p-2 text-xs">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-semibold text-[#14244B]">{tr(t, `langfuseUi.step.${call.name}`, call.name ?? "—")}</span>
                {call.model ? <span className="text-[#607096]">{call.model}</span> : null}
                {call.latencyMs != null ? <span className="tabular-nums text-[#607096]">{(call.latencyMs / 1000).toFixed(1)} s</span> : null}
                {call.totalTokens != null ? (
                  <span className="tabular-nums text-[#8A98B8]">
                    {fill(t("langfuseUi.tokens"), { input: call.inputTokens ?? "?", output: call.outputTokens ?? "?" })}
                  </span>
                ) : null}
                {call.prompt ? <span className="font-mono text-[11px] text-[#8A98B8]">{call.prompt}</span> : null}
                {call.level === "WARNING" || call.level === "ERROR" ? (
                  <span className="font-semibold text-[#C43B3B]">{call.statusMessage || call.level}</span>
                ) : null}
              </div>
              {call.input || call.output ? (
                <details className="mt-1">
                  <summary className="cursor-pointer text-[11px] font-semibold text-[#204195]">{t("langfuseUi.io")}</summary>
                  {call.input ? (
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-[#F8FAFC] p-2 text-[11px] text-[#334155]">{call.input}</pre>
                  ) : null}
                  {call.output ? (
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-[#F1FAF5] p-2 text-[11px] text-[#334155]">{call.output}</pre>
                  ) : null}
                </details>
              ) : (
                <p className="mt-1 text-[11px] text-[#8A98B8]">{t("langfuseUi.noText")}</p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-[#607096]">{t("langfuseUi.noCalls")}</p>
      )}
      {groupScores(trace.scores).map((group) => (
        <div key={group.kind} className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#607096]">{t(`langfuseUi.scoreGroup.${group.kind}`)}:</span>
          {group.scores.map((score, i) => (
            <ScoreChip key={`${score.name}-${i}`} score={score} t={t} />
          ))}
        </div>
      ))}
      {!trace.scores.some((s) => s.kind === "judge") ? <p className="text-[11px] text-[#8A98B8]">{t("langfuseUi.noJudge")}</p> : null}
      <ReviewForm trace={trace} sessionId={sessionId} onSaved={onReload} />
    </>
  );
}
