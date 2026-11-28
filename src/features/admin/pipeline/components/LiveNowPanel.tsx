"use client";

import { Radio, Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { SessionPipeline } from "../services/pipeline.service";
import { useNow } from "../hooks/useNow";
import {
  endReasonLabel,
  fill,
  formatClock,
  formatMs,
  liveStateLabel,
  liveStateTone,
  msSince,
} from "../utils/pipelineFormat";
import { Fact } from "./ui";

const TONE = {
  neutral: { frame: "border-[#DCE4F3] bg-white", dot: "bg-[#8A98B8]", text: "text-[#14244B]" },
  brand: { frame: "border-[#204195] bg-[#F5F8FF]", dot: "bg-[#204195]", text: "text-[#14244B]" },
  warn: { frame: "border-[#F3DFB0] bg-[#FFFBF2]", dot: "bg-[#C98A00]", text: "text-[#8A5A00]" },
  bad: { frame: "border-[#F3C4C4] bg-[#FFF8F8]", dot: "bg-[#C43B3B]", text: "text-[#C43B3B]" },
} as const;

/**
 * "Right now": what the room is doing and for how long, the interview clock
 * against its budget, and the current question's time. Clocks tick every
 * second between refreshes; the state itself comes from the backend.
 */
export default function LiveNowPanel({
  pipeline,
  pushConnected,
}: {
  pipeline: SessionPipeline;
  pushConnected: boolean;
}) {
  const { t } = useLanguage();
  const ticking = pipeline.live || pipeline.liveState?.state === "not_started";
  const now = useNow(1000, ticking);
  const { timing, liveState } = pipeline;
  const ended = Boolean(timing.endedAt);

  const elapsed = timing.startedAt
    ? ended
      ? timing.elapsedMs
      : msSince(timing.startedAt, now)
    : null;
  const budgetMs = timing.budgetMinutes != null ? timing.budgetMinutes * 60_000 : null;
  const remaining = !ended && budgetMs !== null && elapsed !== null ? budgetMs - elapsed : null;

  const current = pipeline.turns.find((turn) => turn.turnIndex === pipeline.currentTurnIndex) ?? null;
  const questionMs = current ? msSince(current.askedAt, now) : null;

  const sinceMs = msSince(liveState?.since, now);
  const label = liveStateLabel(liveState, t);
  const tone = TONE[liveStateTone(liveState?.state, sinceMs)];
  const pulsing = liveState?.state === "candidate_speaking" || liveState?.state === "ai_speaking";

  if (!label && ended) {
    return (
      <section className="rounded-2xl border border-[#DCE4F3] bg-white p-4 text-sm text-[#475569]" aria-label={t("aiPipeline.now.title")}>
        <span className="font-semibold text-[#14244B]">{t("aiPipeline.now.ended")}</span>
        {pipeline.session.endReason ? <> · {endReasonLabel(pipeline.session.endReason, t)}</> : null}
        {elapsed !== null ? (
          <span className="tabular-nums"> · {fill(t("aiPipeline.now.for"), { time: formatMs(elapsed) })}</span>
        ) : null}
      </section>
    );
  }

  return (
    <section
      aria-label={t("aiPipeline.now.title")}
      className={`grid gap-4 rounded-2xl border p-4 sm:p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] ${tone.frame}`}
    >
      <div className="min-w-0" aria-live="polite">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#607096]">
          <Radio className="size-3.5" aria-hidden="true" />
          {t("aiPipeline.now.title")}
        </p>
        <p className={`mt-1.5 flex items-center gap-2 text-lg font-bold leading-snug ${tone.text}`}>
          <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
            {pulsing ? (
              <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${tone.dot}`} />
            ) : null}
            <span className={`relative inline-flex size-2.5 rounded-full ${tone.dot}`} />
          </span>
          <span className="min-w-0">{label ?? "—"}</span>
        </p>
        <p className="mt-1 text-xs text-[#607096]">
          {sinceMs !== null ? (
            <span className="font-semibold tabular-nums text-[#14244B]">{fill(t("aiPipeline.now.for"), { time: formatClock(sinceMs) })}</span>
          ) : null}
          {sinceMs !== null && liveState?.source ? " · " : null}
          {liveState?.source ? t(`aiPipeline.now.source.${liveState.source}`) : null}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#607096]">
          <Zap className={`size-3 ${pushConnected ? "text-[#287A4B]" : "text-[#8A98B8]"}`} aria-hidden="true" />
          {t(pushConnected ? "aiPipeline.push.on" : "aiPipeline.push.off")}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Fact
          label={t("aiPipeline.now.elapsed")}
          hint={timing.budgetMinutes != null ? fill(t("aiPipeline.now.budgetValue"), { n: timing.budgetMinutes }) : undefined}
        >
          <span className="tabular-nums">{elapsed !== null ? formatClock(elapsed) : "—"}</span>
        </Fact>
        <Fact label={t("aiPipeline.now.remaining")}>
          {remaining === null ? (
            "—"
          ) : remaining >= 0 ? (
            <span className="tabular-nums">{formatClock(remaining)}</span>
          ) : (
            <span className="tabular-nums text-[#C43B3B]">{fill(t("aiPipeline.now.overtime"), { time: formatClock(-remaining) })}</span>
          )}
        </Fact>
        <Fact label={t("aiPipeline.now.question")}>
          {current ? (
            <span className="tabular-nums">
              {fill(t("aiPipeline.now.questionValue"), {
                n: current.turnIndex + 1,
                total: pipeline.turns.length,
                time: questionMs !== null ? formatClock(questionMs) : "—",
              })}
            </span>
          ) : (
            "—"
          )}
        </Fact>
      </dl>
    </section>
  );
}
