"use client";

import { useLanguage } from "@/i18n/LanguageProvider";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import type { SessionPipeline } from "../services/pipeline.service";
import {
  EVENT_TONE,
  clock,
  difficultyReason,
  endReasonLabel,
  entryReason,
  eventDetail,
  eventLabel,
  fill,
  fitBandLabel,
  formatMs,
  tr,
} from "../utils/pipelineFormat";
import { Chip, Fact, Muted, ProgressBar, Reason, TableShell, Th } from "./ui";

function sourceLabel(source: string, t: (key: string) => string): string {
  const inferred = source.startsWith("~");
  const key = `adminPlan.source.${inferred ? source.slice(1) : source}`;
  return tr(t, key, source);
}

export function EntrySection({ pipeline }: { pipeline: SessionPipeline }) {
  const { t } = useLanguage();
  const { entry } = pipeline;
  const tier = entry.practiceTier;
  return (
    <AdminSection title={t("aiPipeline.entry.title")} description={entryReason(entry, t)}>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label={t("aiPipeline.entry.match")}>
          {entry.matchPercent != null ? <span className="tabular-nums">{entry.matchPercent}%</span> : "—"}
        </Fact>
        <Fact label={t("aiPipeline.entry.fitBand")}>{fitBandLabel(entry.fitBand, t)}</Fact>
        <Fact label={t("aiPipeline.entry.tier")}>
          {tier ? (
            <Chip tone={tier === "challenge" ? "brand" : tier === "basic" ? "warn" : "neutral"}>
              {t(`aiPipeline.tier.${tier}`)}
            </Chip>
          ) : (
            "—"
          )}
        </Fact>
        <Fact label={t("aiPipeline.entry.warnings")}>
          {entry.warnings.length ? (
            <span className="flex flex-wrap gap-1">
              {entry.warnings.map((warning) => (
                <Chip key={warning} tone="warn">
                  {tr(t, `aiPipeline.warning.${warning}`, warning)}
                </Chip>
              ))}
            </span>
          ) : (
            t("aiPipeline.questions.none")
          )}
        </Fact>
      </dl>
      <p className="mt-4 text-xs text-[#607096]">
        {fill(t("aiPipeline.entry.thresholds"), {
          low: entry.policy.lowFitPercent,
          challenge: entry.policy.challengePercent,
          min: entry.policy.minMatchPercent,
        })}
      </p>
    </AdminSection>
  );
}

export function PlanSection({ pipeline }: { pipeline: SessionPipeline }) {
  const { t } = useLanguage();
  const { plan } = pipeline;
  const totalImportance = plan.targets.reduce((sum, target) => sum + (target.importance ?? 0), 0);
  return (
    <AdminSection title={t("aiPipeline.plan.title")}>
      <dl className="grid gap-4 sm:grid-cols-3">
        <Fact label={t("aiPipeline.plan.budget")}>
          {plan.questionBudget == null
            ? "—"
            : pipeline.turnCounts.warmup
              ? fill(t("aiPipeline.plan.budgetValue"), { main: plan.questionBudget, warmup: pipeline.turnCounts.warmup })
              : plan.questionBudget}
        </Fact>
        <Fact label={t("aiPipeline.plan.difficulty")}>{difficultyReason(plan.difficulty, t) ?? "—"}</Fact>
        <Fact label={t("aiPipeline.plan.targets")}>{plan.targets.length}</Fact>
      </dl>
      {plan.targets.length ? (
        <div className="mt-5">
          <TableShell>
            <thead>
              <tr>
                <Th>{t("aiPipeline.plan.skill")}</Th>
                <Th align="right">{t("aiPipeline.plan.weight")}</Th>
                <Th align="right">{t("aiPipeline.plan.questions")}</Th>
                <Th>{t("aiPipeline.plan.why")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {plan.targets.map((target) => (
                <tr key={target.label}>
                  <td className="py-2 pr-4 font-semibold text-[#14244B]">{target.label}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {target.importance != null && totalImportance > 0
                      ? `${Math.round((target.importance / totalImportance) * 100)}%`
                      : "—"}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{target.questionCount ?? "—"}</td>
                  <td className="py-2 text-xs text-[#607096]">
                    {[
                      ...target.matchStatuses.map((status) => tr(t, `aiPipeline.match.${status.toLowerCase()}`, status)),
                      ...target.priorities.map((priority) => tr(t, `aiPipeline.priority.${priority.toLowerCase()}`, priority)),
                    ].join(" · ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      ) : (
        <div className="mt-4">
          <Muted>{t("aiPipeline.plan.noTargets")}</Muted>
        </div>
      )}
    </AdminSection>
  );
}

export function QuestionsSection({ pipeline }: { pipeline: SessionPipeline }) {
  const { t } = useLanguage();
  const { questions } = pipeline;
  const sources = Object.entries(questions.sources);
  return (
    <AdminSection title={t("aiPipeline.questions.title")}>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact
          label={t("aiPipeline.questions.count")}
          hint={
            pipeline.turnCounts.warmup
              ? fill(t("aiPipeline.summary.questions"), { main: pipeline.turnCounts.main, warmup: pipeline.turnCounts.warmup })
              : undefined
          }
        >
          {questions.turnsCount}
        </Fact>
        <Fact label={t("aiPipeline.questions.sources")}>
          {sources.length ? (
            <span className="flex flex-wrap gap-1">
              {sources.map(([source, count]) => (
                <Chip key={source} tone={source === "generated_unreviewed" ? "bad" : source === "question_bank" ? "good" : "neutral"}>
                  {sourceLabel(source, t)}: {count}
                </Chip>
              ))}
            </span>
          ) : (
            "—"
          )}
        </Fact>
        <Fact label={t("aiPipeline.questions.spoken")}>
          {questions.spoken
            ? fill(t("aiPipeline.questions.spokenDetail"), {
                saved: questions.spoken.saved,
                total: questions.spoken.total,
                rejected: questions.spoken.rejected,
              })
            : "—"}
        </Fact>
        <Fact label={t("aiPipeline.questions.uncovered")}>
          {questions.uncoveredTargets.length || t("aiPipeline.questions.none")}
        </Fact>
      </dl>
      {questions.generation.length ? (
        <div className="mt-4 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#607096]">
            {t("aiPipeline.questions.generated")}
          </p>
          {questions.generation.map((item, index) => (
            <Reason key={`${item.conceptId}-${index}`}>
              {fill(t("aiPipeline.questions.generatedDetail"), {
                concept: item.conceptId ?? "—",
                requested: item.requested ?? 0,
                filed: item.filed ?? 0,
                rejected: item.rejected ?? 0,
              })}
            </Reason>
          ))}
        </div>
      ) : null}
    </AdminSection>
  );
}

export function InterviewSection({ pipeline }: { pipeline: SessionPipeline }) {
  const { t } = useLanguage();
  const answered = pipeline.turns.filter((turn) => turn.status === "ANSWERED").length;
  const total = pipeline.turns.length;
  const { session } = pipeline;
  return (
    <AdminSection
      title={t("aiPipeline.interview.title")}
      description={
        pipeline.currentTurnIndex != null
          ? fill(t("aiPipeline.interview.current"), { n: pipeline.currentTurnIndex + 1 })
          : session.endReason
            ? fill(t("aiPipeline.interview.endReason"), { reason: endReasonLabel(session.endReason, t) })
            : undefined
      }
    >
      {total ? (
        <ProgressBar value={answered} total={total} label={fill(t("aiPipeline.interview.progress"), { answered, total })} />
      ) : null}
      <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-[#607096]">
        {t("aiPipeline.interview.warnings")}
      </h3>
      {pipeline.warnings.length ? (
        <ul className="mt-2 divide-y divide-[#EAEFF8]">
          {pipeline.warnings
            .slice()
            .reverse()
            .slice(0, 30)
            .map((warning, index) => (
              <li key={`${warning.id}-${index}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-xs">
                <span className="tabular-nums text-[#8A98B8]">{clock(warning.at)}</span>
                <AdminStatusBadge status={EVENT_TONE[warning.status]} label={eventLabel(warning.event, t)} size="sm" />
                {warning.turnIndex != null ? (
                  <span className="text-[#607096]">{fill(t("aiPipeline.turn.question"), { n: warning.turnIndex + 1 })}</span>
                ) : null}
                {warning.durationMs != null ? <span className="tabular-nums text-[#607096]">{formatMs(warning.durationMs)}</span> : null}
                <span className="min-w-0 break-words text-[#475569]">{eventDetail(warning, t)}</span>
              </li>
            ))}
        </ul>
      ) : (
        <div className="mt-2">
          <Muted>{t("aiPipeline.interview.noWarnings")}</Muted>
        </div>
      )}
    </AdminSection>
  );
}

/** Voice-room health for this session: synthesis and processing delays, incidents, providers. */
export function VoiceSection({ pipeline }: { pipeline: SessionPipeline }) {
  const { t } = useLanguage();
  const voice = pipeline.voice;
  if (!voice) return null;
  const pair = (a: number | null, b: number | null) => `${formatMs(a)} / ${formatMs(b)}`;
  const troubled = voice.notHeard + voice.unclear + voice.coreFailures + voice.providerDegraded + voice.candidateLeft > 0;
  return (
    <AdminSection title={t("aiPipeline.voice.title")}>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label={t("aiPipeline.voice.tts")}>
          <span className="tabular-nums">{pair(voice.ttsTtfbP50Ms, voice.ttsTtfbP95Ms)}</span>
        </Fact>
        <Fact label={t("aiPipeline.voice.core")}>
          <span className="tabular-nums">{pair(voice.coreP50Ms, voice.coreP95Ms)}</span>
        </Fact>
        <Fact label={t("aiPipeline.voice.incidents")}>
          <span className={troubled ? "text-[#8A5A00]" : undefined}>
            {fill(t("aiPipeline.voice.incidentsValue"), {
              notHeard: voice.notHeard,
              unclear: voice.unclear,
              replayed: voice.replayed,
              reprompts: voice.reprompts,
            })}
          </span>
        </Fact>
        <Fact label={t("aiPipeline.voice.providers")}>
          {fill(t("aiPipeline.voice.providersValue"), { stt: voice.sttModel ?? "—", tts: voice.ttsProvider ?? "—" })}
        </Fact>
      </dl>
      {voice.providerDegraded || voice.ttsFallback || voice.candidateLeft ? (
        <p className="mt-3 text-xs text-[#8A5A00]">
          {fill(t("aiPipeline.voice.failovers"), {
            degraded: voice.providerDegraded,
            fallback: voice.ttsFallback,
            left: voice.candidateLeft,
          })}
        </p>
      ) : null}
    </AdminSection>
  );
}
