"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { PipelineTurn, TurnExchange, VoiceIncident } from "../services/pipeline.service";
import {
  clock,
  exchangeHasWarning,
  exchangeReasons,
  fill,
  formatMs,
  formatScore,
  msSince,
  questionStageLabel,
  tr,
  voiceIncidentLabel,
} from "../utils/pipelineFormat";
import AnswerReveal from "./AnswerReveal";
import { Chip, Muted, type ChipTone } from "./ui";

/** One color per next step the interviewer chose. */
const ACTION_TONE: Record<string, ChipTone> = {
  PROBE: "violet",
  NEXT_QUESTION: "teal",
  CLARIFY: "orange",
  CONFIRM_ABORT: "bad",
  END_SESSION: "bad",
  CLOSING: "sky",
};

/** One color per question state: asking now, not asked yet, answered. */
const TURN_STATUS: Record<string, { tone: ChipTone; key: string }> = {
  ASKED: { tone: "live", key: "aiPipeline.turn.asking" },
  PLANNED: { tone: "neutral", key: "aiPipeline.turn.notAsked" },
  ANSWERED: { tone: "good", key: "aiPipeline.turn.answered" },
};

function ExchangeRow({ exchange, index }: { exchange: TurnExchange; index: number }) {
  const { t } = useLanguage();
  const reasons = exchangeReasons(exchange, t);
  const warn = exchangeHasWarning(exchange);
  const action = exchange.action ? tr(t, `aiPipeline.action.${exchange.action}`, exchange.action) : null;
  return (
    <li className={`rounded-lg border p-3 ${warn ? "border-[#F3DFB0] bg-[#FFFBF2]" : "border-[#EAEFF8] bg-[#FBFCFE]"}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-[#14244B]">{fill(t("aiPipeline.turn.exchange"), { n: index + 1 })}</span>
        <span className="tabular-nums text-[#8A98B8]">{clock(exchange.at)}</span>
        {action ? <Chip tone={ACTION_TONE[exchange.action ?? ""] ?? "neutral"}>{action}</Chip> : null}
        {exchange.coreMs != null ? (
          <span className="tabular-nums text-[#607096]">{fill(t("aiPipeline.turn.latency"), { ms: formatMs(exchange.coreMs) })}</span>
        ) : null}
        {exchange.preScore != null ? (
          <span className="tabular-nums text-[#607096]">{fill(t("aiPipeline.turn.preScore"), { score: formatScore(exchange.preScore) })}</span>
        ) : null}
        {exchange.answerChars != null ? (
          <span className="tabular-nums text-[#8A98B8]">{fill(t("aiPipeline.turn.answerChars"), { n: exchange.answerChars })}</span>
        ) : null}
      </div>
      {reasons.length ? (
        <ul className="mt-2 space-y-0.5">
          {reasons.map((reason) => (
            <li key={reason} className="text-xs leading-5 text-[#475569]">
              {reason}
            </li>
          ))}
        </ul>
      ) : null}
      {exchange.interviewer ? (
        <p className="mt-2 border-l-2 border-[#DCE4F3] pl-3 text-xs leading-5 text-[#14244B]">
          <span className="font-semibold text-[#607096]">{t("aiPipeline.turn.reply")}: </span>
          {exchange.interviewer}
        </p>
      ) : null}
    </li>
  );
}

function VoiceIncidents({ incidents }: { incidents: VoiceIncident[] }) {
  const { t } = useLanguage();
  if (!incidents.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#607096]">{t("aiPipeline.turn.voiceIncidents")}</p>
      <ul className="mt-1.5 space-y-1">
        {incidents.map((incident, index) => (
          <li key={`${incident.at}-${index}`} className="flex flex-wrap items-baseline gap-x-2 text-xs">
            <span className="tabular-nums text-[#8A98B8]">{clock(incident.at)}</span>
            <span className={incident.status === "warning" || incident.status === "error" ? "text-[#8A5A00]" : "text-[#475569]"}>
              {voiceIncidentLabel(incident, t)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** How long the question took: the measured answer time, else first ask to last answer. */
function turnDurationMs(turn: PipelineTurn): number | null {
  if (turn.answerSeconds != null) return turn.answerSeconds * 1000;
  if (turn.askedAt && turn.lastAnswerAt) return msSince(turn.askedAt, new Date(turn.lastAnswerAt).getTime());
  return null;
}

function TurnCard({
  turn,
  current,
  defaultOpen,
  sessionId,
}: {
  turn: PipelineTurn;
  current: boolean;
  defaultOpen: boolean;
  sessionId: string;
}) {
  const { t } = useLanguage();
  // Follows the live default (the current turn opens) until the admin toggles it.
  const [choice, setChoice] = useState<boolean | null>(null);
  const open = choice ?? defaultOpen;
  const warnings =
    turn.exchanges.filter(exchangeHasWarning).length +
    turn.voiceIncidents.filter((incident) => incident.status === "warning" || incident.status === "error").length;
  const duration = turn.status === "ANSWERED" ? turnDurationMs(turn) : null;
  const status = TURN_STATUS[turn.status] ?? null;
  return (
    <li
      className={`rounded-xl border ${current ? "border-[#204195] ring-2 ring-[#204195]/15" : "border-[#DCE4F3]"} bg-white`}
    >
      <button
        type="button"
        onClick={() => setChoice(!open)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {status ? <Chip tone={status.tone}>{t(status.key)}</Chip> : null}
            <Chip tone="outline">
              {fill(t("aiPipeline.turn.question"), { n: turn.turnIndex + 1 })} · {questionStageLabel(turn.stage, t)}
            </Chip>
            {turn.difficulty ? (
              <Chip tone="outline">{tr(t, `adminPlan.difficulty.${turn.difficulty}`, turn.difficulty)}</Chip>
            ) : null}
            {turn.spokenRejected ? <Chip tone="warn">{t("aiPipeline.turn.spokenRejected")}</Chip> : null}
            {warnings ? <Chip tone="warn">⚠ {warnings}</Chip> : null}
            {turn.grade?.score != null ? (
              <Chip tone="good">{fill(t("aiPipeline.turn.grade"), { score: formatScore(turn.grade.score) })}</Chip>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#14244B]">{turn.questionText}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-[#607096]">
            {turn.target ? <span>{turn.target}</span> : null}
            {turn.askedAt ? <span className="tabular-nums">{fill(t("aiPipeline.turn.askedAt"), { time: clock(turn.askedAt) })}</span> : null}
            {duration !== null ? (
              <span className="tabular-nums">{fill(t("aiPipeline.turn.duration"), { time: formatMs(duration) })}</span>
            ) : null}
          </p>
        </div>
        <ChevronDown
          className={`mt-1 size-4 shrink-0 text-[#607096] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="border-t border-[#F1F5F9] px-4 pb-4 pt-3">
          {turn.exchanges.length ? (
            <ol className="space-y-2">
              {turn.exchanges.map((exchange, index) => (
                <ExchangeRow key={`${exchange.at}-${index}`} exchange={exchange} index={index} />
              ))}
            </ol>
          ) : (
            <Muted>{t("aiPipeline.turn.noExchanges")}</Muted>
          )}
          <VoiceIncidents incidents={turn.voiceIncidents} />
          {turn.answerCount > 0 ? (
            <div className="mt-3">
              <AnswerReveal sessionId={sessionId} turnId={turn.turnId} />
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/** Every question with each exchange: how the AI read the answer, what it did next and why. */
export default function PipelineTurns({
  turns,
  currentTurnIndex,
  sessionId,
}: {
  turns: PipelineTurn[];
  currentTurnIndex: number | null;
  sessionId: string;
}) {
  return (
    <ol className="space-y-3">
      {turns.map((turn) => (
        <TurnCard
          key={turn.turnId}
          turn={turn}
          current={turn.turnIndex === currentTurnIndex}
          sessionId={sessionId}
          defaultOpen={
            turn.turnIndex === currentTurnIndex ||
            turn.exchanges.some(exchangeHasWarning) ||
            turn.voiceIncidents.some((incident) => incident.status === "warning" || incident.status === "error")
          }
        />
      ))}
    </ol>
  );
}
