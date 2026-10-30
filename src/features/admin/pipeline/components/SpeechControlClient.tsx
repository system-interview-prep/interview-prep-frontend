"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, CircleSlash, MessageSquareWarning, MessagesSquare, Quote, Repeat, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { usePolledResource } from "../hooks/usePolledResource";
import { pipelineService, type Rate, type SpeechControl, type SpeechVerdict } from "../services/pipeline.service";
import {
  clock,
  fill,
  percentText,
  speechCheckLabel,
  speechOutcomeTone,
  speechReasonLabel,
  speechSourceLabel,
  tr,
} from "../utils/pipelineFormat";
import { Chip, Fact, Muted, ProgressBar, TableShell, Th, usePagedRows } from "./ui";

const WINDOWS = [1, 7, 30];

function rateLevel(rate: Rate, warnAt: number, badAt: number): "error" | "warning" | "healthy" | undefined {
  if (rate.rate === null) return undefined;
  if (rate.rate >= badAt) return "error";
  if (rate.rate >= warnAt) return "warning";
  return "healthy";
}

/** Share of each source for one part of the reply (acknowledgement or question). */
function SourceBars({ title, rows }: { title: string; rows: { source: string; count: number }[] }) {
  const { t } = useLanguage();
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#607096]">{title}</p>
      {total ? (
        <div className="mt-3 space-y-3">
          {rows.map((row) => (
            <ProgressBar
              key={row.source}
              value={row.count}
              total={total}
              label={`${speechSourceLabel(row.source, t)} (${row.count})`}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2">
          <Muted>{t("aiPipeline.health.noData")}</Muted>
        </div>
      )}
    </div>
  );
}

/** "Was the guard right?": an admin's hand check of one refused or edited line. */
function ReviewButtons({
  eventId,
  checkIndex,
  initial,
  onSaved,
}: {
  eventId: number;
  checkIndex: number;
  initial: SpeechVerdict | null;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [verdict, setVerdict] = useState<SpeechVerdict | null>(initial);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const choose = async (next: SpeechVerdict) => {
    const target = verdict === next ? "clear" : next;
    setBusy(true);
    setFailed(false);
    try {
      setVerdict(await pipelineService.reviewSpeech(eventId, checkIndex, target));
      onSaved();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  const button = (value: SpeechVerdict, label: string, activeClass: string) => (
    <button
      type="button"
      disabled={busy}
      aria-pressed={verdict === value}
      onClick={() => void choose(value)}
      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
        verdict === value ? activeClass : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="text-[#607096]">{t("aiPipeline.speech.review.ask")}</span>
      {button("correct", t("aiPipeline.speech.review.correct"), "bg-[#EEF7F1] text-[#287A4B] ring-1 ring-[#BFE3CC]")}
      {button("wrong", t("aiPipeline.speech.review.wrong"), "bg-[#FDF2F2] text-[#C43B3B] ring-1 ring-[#F3C9C9]")}
      {failed ? <span className="text-[#C43B3B]">{t("aiPipeline.speech.review.failed")}</span> : null}
    </div>
  );
}

/** Config switches as the backend reads them. */
function ConfigFacts({ config }: { config: SpeechControl["config"] }) {
  const { t } = useLanguage();
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Fact label={t("aiPipeline.speech.config.speechV2")}>
        <Chip tone={config.speechV2 ? "good" : "warn"}>{t(config.speechV2 ? "aiPipeline.speech.on" : "aiPipeline.speech.off")}</Chip>
      </Fact>
      <Fact label={t("aiPipeline.speech.config.ackMode")}>
        {tr(t, `aiPipeline.speech.ackMode.${config.ackMode}`, config.ackMode)}
      </Fact>
      <Fact label={t("aiPipeline.speech.config.dialect")}>
        {tr(t, `aiPipeline.speech.dialect.${config.dialect}`, config.dialect)}
      </Fact>
      <Fact label={t("aiPipeline.speech.config.nhe")}>{config.maxNhePerTurn}</Fact>
      <Fact label={t("aiPipeline.speech.config.interjection")}>
        {fill(t("aiPipeline.speech.config.interjectionValue"), {
          share: Math.round(config.interjectionShare * 100),
          window: config.interjectionWindow,
        })}
      </Fact>
      <Fact label={t("aiPipeline.speech.config.model")}>
        <span className="font-mono text-xs">{config.model}</span>
      </Fact>
    </dl>
  );
}

/** Admin page "Lời nói AI": how the interviewer's lines were controlled across sessions. */
export default function SpeechControlClient() {
  const { t } = useLanguage();
  const [days, setDays] = useState(7);
  const { state, refresh } = usePolledResource(() => pipelineService.speech(days), () => 60_000, [days]);

  const header = (
    <AdminPageHeader
      title={t("aiPipeline.speech.title")}
      description={t("aiPipeline.speech.subtitle")}
      breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("aiPipeline.speech.title") }]}
      primaryAction={
        <div className="flex items-center gap-1.5" role="group" aria-label={t("aiPipeline.health.window")}>
          {WINDOWS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={days === option}
              onClick={() => setDays(option)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                days === option ? "bg-[#204195] text-white" : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"
              }`}
            >
              {fill(t("aiPipeline.calls.days"), { n: option })}
            </button>
          ))}
        </div>
      }
    />
  );

  const ready = state.status === "ready" ? state.data : null;
  const reasonRows = usePagedRows(ready?.reasons ?? [], 10);
  const recentRows = usePagedRows(ready?.recent ?? [], 8);

  if (state.status !== "ready") {
    return (
      <div className="space-y-6">
        {header}
        {state.status === "loading" ? (
          <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
            <span className="sr-only">{t("aiPipeline.loading")}</span>
          </div>
        ) : (
          <AdminEmptyState
            variant="error"
            title={t(state.httpStatus === 503 ? "aiPipeline.notMigrated" : "aiPipeline.loadError")}
            description=""
            onRetry={() => void refresh()}
          />
        )}
      </div>
    );
  }

  const data = state.data;
  const guard = (kind: string) => data.guards.find((row) => row.kind === kind);
  const ratioSub = (rate: Rate) => fill(t("aiPipeline.health.ratioSub"), { count: rate.count, total: rate.total });
  const rateStatus = (rate: Rate | undefined, warnAt: number, badAt: number) => {
    const level = rate ? rateLevel(rate, warnAt, badAt) : undefined;
    return level
      ? {
          status: level,
          statusLabel: fill(t(`aiPipeline.speech.level.${level}`), {
            warn: Math.round(warnAt * 100),
            bad: Math.round(badAt * 100),
          }),
        }
      : {};
  };
  const ackReject = guard("ack")?.rejectRate;
  const probeReject = guard("probe")?.rejectRate;

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title={t("aiPipeline.speech.turns")}
          value={data.turns.count}
          subtitle={fill(t("aiPipeline.speech.turnsSub"), { s: data.turns.sessions, c: data.turns.withChecks })}
          icon={MessagesSquare}
        />
        <AdminMetricCard
          title={t("aiPipeline.speech.ackRejected")}
          value={percentText(ackReject)}
          subtitle={ackReject ? ratioSub(ackReject) : undefined}
          {...rateStatus(ackReject, 0.2, 0.4)}
          icon={MessageSquareWarning}
        />
        <AdminMetricCard
          title={t("aiPipeline.speech.probeRejected")}
          value={percentText(probeReject)}
          subtitle={probeReject ? ratioSub(probeReject) : undefined}
          {...rateStatus(probeReject, 0.2, 0.4)}
          icon={ShieldCheck}
        />
        <AdminMetricCard
          title={t("aiPipeline.speech.overNhe")}
          value={percentText(data.style.overNhe)}
          subtitle={ratioSub(data.style.overNhe)}
          {...rateStatus(data.style.overNhe, 0.01, 0.05)}
          icon={Quote}
        />
        <AdminMetricCard
          title={t("aiPipeline.speech.interjection")}
          value={percentText(data.style.interjectionOpenings)}
          subtitle={ratioSub(data.style.interjectionOpenings)}
          {...rateStatus(data.style.interjectionOpenings, data.config.interjectionShare, 0.8)}
          icon={Sparkles}
        />
        <AdminMetricCard
          title={t("aiPipeline.speech.repeated")}
          value={percentText(data.style.repeatedAck)}
          subtitle={ratioSub(data.style.repeatedAck)}
          {...rateStatus(data.style.repeatedAck, 0.05, 0.15)}
          icon={Repeat}
        />
        <AdminMetricCard
          title={t("aiPipeline.speech.newTermsTurns")}
          value={percentText(data.style.newTermsTurns)}
          subtitle={ratioSub(data.style.newTermsTurns)}
          icon={BookOpen}
        />
        <AdminMetricCard
          title={t("aiPipeline.speech.falseBlocks")}
          value={data.review?.falseBlocks.total ? percentText(data.review.falseBlocks) : "—"}
          subtitle={
            data.review?.falseBlocks.total ? ratioSub(data.review.falseBlocks) : t("aiPipeline.speech.falseBlocksEmpty")
          }
          {...(data.review?.falseBlocks.total ? rateStatus(data.review.falseBlocks, 0.1, 0.25) : {})}
          icon={CircleSlash}
        />
      </div>
      <Muted>{t("aiPipeline.speech.lowRateNote")}</Muted>
      {data.truncated ? <Muted>{t("aiPipeline.speech.truncated")}</Muted> : null}

      <AdminSection title={t("aiPipeline.speech.config")} description={t("aiPipeline.speech.configNote")}>
        <ConfigFacts config={data.config} />
      </AdminSection>

      <AdminSection title={t("aiPipeline.speech.guards")} description={t("aiPipeline.speech.guardsNote")}>
        <TableShell minWidth={620}>
          <thead>
            <tr>
              <Th>{t("aiPipeline.speech.guard")}</Th>
              <Th align="right">{t("aiPipeline.speech.turns")}</Th>
              <Th align="right">{t("aiPipeline.speech.outcome.pass")}</Th>
              <Th align="right">{t("aiPipeline.speech.outcome.reject")}</Th>
              <Th align="right">{t("aiPipeline.speech.outcome.fix")}</Th>
              <Th align="right">{t("aiPipeline.speech.outcome.error")}</Th>
              <Th align="right">{t("aiPipeline.speech.rejectRate")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAEFF8]">
            {data.guards.map((row) => (
              <tr key={row.kind}>
                <td className="py-2 pr-4 font-semibold text-[#14244B]">{tr(t, `aiPipeline.speech.kind.${row.kind}`, row.kind)}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{row.turns}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-[#287A4B]">{row.pass}</td>
                <td className={`py-2 pr-4 text-right tabular-nums ${row.reject ? "text-[#8A5A00]" : ""}`}>{row.reject}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{row.fix}</td>
                <td className={`py-2 pr-4 text-right tabular-nums ${row.error ? "text-[#C43B3B]" : ""}`}>{row.error}</td>
                <td className="py-2 text-right tabular-nums">{percentText(row.rejectRate)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </AdminSection>

      <AdminSection title={t("aiPipeline.speech.reasons")}>
        {data.reasons.length ? (
          <TableShell minWidth={560}>
            <thead>
              <tr>
                <Th>{t("aiPipeline.speech.reason")}</Th>
                <Th>{t("aiPipeline.speech.guard")}</Th>
                <Th align="right">{t("aiPipeline.health.count")}</Th>
                <Th align="right">{t("aiPipeline.health.sessions")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {reasonRows.rows.map((row) => (
                <tr key={`${row.kind}-${row.outcome}-${row.reason}`}>
                  <td className="py-2 pr-4">
                    <span className="font-semibold text-[#14244B]">{speechReasonLabel(row.reason, t)}</span>
                    <span className="block font-mono text-[11px] text-[#8A98B8]">{row.reason}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="flex flex-wrap items-center gap-1.5 text-xs">
                      <Chip tone={speechOutcomeTone(row.outcome)}>{tr(t, `aiPipeline.speech.outcome.${row.outcome}`, row.outcome)}</Chip>
                      <span className="text-[#475569]">{tr(t, `aiPipeline.speech.kind.${row.kind}`, row.kind)}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{row.count}</td>
                  <td className="py-2 text-right tabular-nums">{row.sessions}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <Muted>{t("aiPipeline.health.noData")}</Muted>
        )}
        {reasonRows.pager}
      </AdminSection>

      <AdminSection title={t("aiPipeline.speech.sources")}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <SourceBars title={t("aiPipeline.speech.sourcesAck")} rows={data.sources.ack} />
          <SourceBars title={t("aiPipeline.speech.sourcesQuestion")} rows={data.sources.question} />
        </div>
        {data.newTerms.length ? (
          <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-[#F1F5F9] pt-4 text-xs">
            <span className="text-[#607096]">{t("aiPipeline.speech.newTerms")}:</span>
            {data.newTerms.map((row) => (
              <Chip key={row.term} tone="orange">
                {row.term} · {row.count}
              </Chip>
            ))}
          </div>
        ) : null}
      </AdminSection>

      <AdminSection title={t("aiPipeline.speech.recent")} description={t("aiPipeline.speech.recentNoteReview")}>
        {data.recent.length ? (
          <ul className="space-y-2">
            {recentRows.rows.map((row, index) => (
              <li key={`${row.eventId ?? row.at}-${row.checkIndex}-${index}`} className="rounded-lg border border-[#EAEFF8] bg-[#FBFCFE] p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Chip tone={speechOutcomeTone(row.outcome)}>{tr(t, `aiPipeline.speech.outcome.${row.outcome}`, row.outcome)}</Chip>
                  <span className="font-semibold text-[#14244B]">
                    {speechCheckLabel({ kind: row.kind, outcome: row.outcome, reason: row.reason }, t)}
                  </span>
                  <span className="tabular-nums text-[#8A98B8]">
                    {row.at ? `${new Date(row.at).toLocaleDateString("vi-VN")} ${clock(row.at)}` : "—"}
                  </span>
                  <Link
                    href={`/admin/interviews/${encodeURIComponent(row.sessionId)}`}
                    className="ml-auto font-semibold text-[#204195] hover:underline"
                  >
                    {t("aiPipeline.speech.openSession")}
                    {row.turnIndex != null ? ` · ${fill(t("aiPipeline.turn.question"), { n: row.turnIndex + 1 })}` : ""}
                  </Link>
                </div>
                {row.draft ? (
                  <p className="mt-1.5 break-words text-xs leading-5 text-[#8A98B8]">
                    {t("aiPipeline.speech.draft")}: <s>{row.draft}</s>
                  </p>
                ) : null}
                {row.said ? (
                  <p className="mt-1 whitespace-pre-line break-words border-l-2 border-[#DCE4F3] pl-3 text-xs leading-5 text-[#14244B]">
                    <span className="font-semibold text-[#607096]">{t("aiPipeline.speech.said")}: </span>
                    {row.said}
                  </p>
                ) : null}
                {row.eventId != null && row.outcome !== "error" ? (
                  <ReviewButtons
                    eventId={row.eventId}
                    checkIndex={row.checkIndex}
                    initial={row.verdict}
                    onSaved={() => void refresh()}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Muted>{t("aiPipeline.health.noData")}</Muted>
        )}
        {recentRows.pager}
      </AdminSection>
    </div>
  );
}
