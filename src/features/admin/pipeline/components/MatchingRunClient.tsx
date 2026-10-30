"use client";

import { useState } from "react";
import { CheckCircle2, Circle, CircleSlash, Loader2, XCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { usePolledResource } from "../hooks/usePolledResource";
import {
  matchingRunsService,
  type MatchRunDetail,
  type MatchStep,
  type MatchStepKey,
  type MatchStepStatus,
} from "../services/matchingRuns.service";
import { clock, fill, formatMs } from "../utils/pipelineFormat";
import {
  FIT_TONE,
  REQ_TONE,
  RUN_STATUS_TONE,
  STEP_STATUS_TONE,
  eligibilityLabel,
  evaluatorLabel,
  factorLabel,
  fitBandMatchLabel,
  flowLabel,
  percent,
  priorityLabel,
  reasonLabel,
  requirementStatusLabel,
  stepLabel,
  stepSummary,
  warningLabel,
} from "../utils/matchingFormat";
import { AiCallTable, AiPurposeTable, AiSummaryFacts } from "./AiCallTables";
import { Chip, Fact, Muted, TableShell, Th, usePagedRows } from "./ui";

const ICONS: Record<MatchStepStatus, { icon: typeof Circle; className: string }> = {
  done: { icon: CheckCircle2, className: "text-[#287A4B]" },
  running: { icon: Loader2, className: "text-[#204195] animate-spin motion-reduce:animate-none" },
  error: { icon: XCircle, className: "text-[#C43B3B]" },
  pending: { icon: Circle, className: "text-[#B6C2DA]" },
  skipped: { icon: CircleSlash, className: "text-stone-500" },
};

const FRAME: Record<MatchStepStatus, string> = {
  done: "border-[#DCE4F3] bg-white",
  running: "border-[#204195] bg-[#F5F8FF] ring-2 ring-[#204195]/15",
  error: "border-[#F3C4C4] bg-[#FFF8F8]",
  pending: "border-dashed border-[#DCE4F3] bg-[#FBFCFE]",
  skipped: "border-stone-200 bg-stone-50",
};

/** request → inputs → cache → reparse → requirements → semantic → scoring → cache write → done (+ clarification steps). */
function MatchingStepper({
  steps,
  selected,
  onSelect,
}: {
  steps: MatchStep[];
  selected: MatchStepKey | null;
  onSelect: (key: MatchStepKey) => void;
}) {
  const { t } = useLanguage();
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6" aria-label={t("matching.detail.steps")}>
      {steps.map((step, index) => {
        const { icon: Icon, className } = ICONS[step.status];
        const summary = stepSummary(step, t);
        const isSelected = selected === step.key;
        return (
          <li key={step.key}>
            <button
              type="button"
              onClick={() => onSelect(step.key)}
              aria-pressed={isSelected}
              aria-current={step.status === "running" ? "step" : undefined}
              className={`flex h-full w-full flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors hover:border-[#204195]/50 focus-visible:outline-2 focus-visible:outline-[#204195] ${FRAME[step.status]} ${
                isSelected ? "outline outline-2 outline-[#204195]" : ""
              }`}
            >
              <span className="flex w-full items-center gap-1.5">
                <Icon className={`size-4 shrink-0 ${className}`} aria-hidden="true" />
                <span className="text-[11px] font-semibold tabular-nums text-[#8A98B8]">{index + 1}</span>
              </span>
              <span className="text-sm font-bold leading-tight text-[#14244B]">{stepLabel(step.key, t)}</span>
              <span className="text-xs font-medium text-[#607096]">
                {t(`aiPipeline.status.${step.status}`)}
                {step.durationMs != null ? <span className="tabular-nums"> · {formatMs(step.durationMs)}</span> : null}
              </span>
              {summary ? <span className="text-[11px] font-semibold leading-snug text-[#204195] [overflow-wrap:anywhere]">{summary}</span> : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Field values of a step in words: booleans as Có/Không, numbers as is, objects as "a: 1 · b: 2". */
function valueText(value: unknown, t: (key: string) => string): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? t("matching.yes") : t("matching.no");
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(value < 1 ? 2 : 1);
  if (Array.isArray(value)) return value.length ? value.map((item) => valueText(item, t)).join(", ") : "—";
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length ? entries.map(([k, v]) => `${k}: ${valueText(v, t)}`).join(" · ") : "—";
  }
  return String(value);
}

function fieldLabel(name: string, t: (key: string) => string): string {
  const key = `matching.field.${name}`;
  const text = t(key);
  return text && text !== key ? text : name.replace(/_/g, " ");
}

function StepDetail({ step }: { step: MatchStep }) {
  const { t } = useLanguage();
  const entries = Object.entries(step.summary || {});
  return (
    <div className="rounded-2xl border border-[#DCE4F3] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-[#14244B]">{stepLabel(step.key, t)}</h3>
        <Chip tone={STEP_STATUS_TONE[step.status]}>{t(`aiPipeline.status.${step.status}`)}</Chip>
        {step.startedAt ? <span className="text-xs tabular-nums text-[#607096]">{clock(step.startedAt)}</span> : null}
        {step.durationMs != null ? <span className="text-xs tabular-nums text-[#607096]">· {formatMs(step.durationMs)}</span> : null}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#607096]">{t(`matching.stepHelp.${step.key}`)}</p>
      {entries.length ? (
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([name, value]) => (
            <div key={name} className="min-w-0">
              <dt className="text-[11px] font-semibold text-[#607096]">{fieldLabel(name, t)}</dt>
              <dd className="text-sm font-semibold text-[#14244B] [overflow-wrap:anywhere]">
                {name === "reason" || name === "skipped_reason" || name === "warning_code" ? reasonLabel(String(value), t) : valueText(value, t)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-xs text-[#8A98B8]">{t("matching.detail.noStepData")}</p>
      )}
    </div>
  );
}

function CountChips({ counts, label, tone }: { counts: Record<string, number>; label: (key: string) => string; tone?: (key: string) => Parameters<typeof Chip>[0]["tone"] }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, count]) => (
        <Chip key={key} tone={tone?.(key) ?? "outline"}>
          {label(key)} · {count}
        </Chip>
      ))}
    </div>
  );
}

function Requirements({ data }: { data: NonNullable<MatchRunDetail["requirements"]> }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState("all");
  const items = filter === "all" ? data.items : data.items.filter((item) => item.status === filter);
  const paged = usePagedRows(items, 15);
  const statuses = ["all", ...Object.keys(data.byStatus)];
  return (
    <div className="space-y-3">
      <CountChips counts={data.byEvaluator} label={(key) => evaluatorLabel(key, t)} />
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("matching.detail.filterStatus")}>
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={filter === status}
            onClick={() => setFilter(status)}
            className={`h-8 rounded-xl px-3 text-xs font-semibold transition-colors ${
              filter === status ? "bg-[#204195] text-white" : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"
            }`}
          >
            {status === "all"
              ? fill(t("matching.detail.allReq"), { n: data.total })
              : `${requirementStatusLabel(status, t)} · ${data.byStatus[status] ?? 0}`}
          </button>
        ))}
      </div>
      {items.length ? (
        <>
          <TableShell minWidth={720}>
            <thead>
              <tr>
                <Th>{t("matching.detail.colRequirement")}</Th>
                <Th>{t("matching.detail.colPriority")}</Th>
                <Th>{t("matching.detail.colEvaluator")}</Th>
                <Th>{t("matching.detail.colResult")}</Th>
                <Th align="right">{t("matching.detail.colConfidence")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {paged.rows.map((item) => (
                <tr key={item.requirementId} className="align-top">
                  <td className="max-w-[320px] py-2 pr-4">
                    <span className="block font-semibold text-[#14244B] [overflow-wrap:anywhere]">{item.label || item.requirementId}</span>
                    <span className="block font-mono text-[11px] text-[#8A98B8] [overflow-wrap:anywhere]">{item.requirementId}</span>
                  </td>
                  <td className="py-2 pr-4 text-xs text-[#475569]">{priorityLabel(item.priority, t)}</td>
                  <td className="py-2 pr-4 text-xs text-[#475569]">{evaluatorLabel(item.evaluator, t)}</td>
                  <td className="py-2 pr-4">
                    <Chip tone={REQ_TONE[item.status] ?? "neutral"}>{requirementStatusLabel(item.status, t)}</Chip>
                    {item.reasonCode ? (
                      <span className="mt-1 block text-[11px] leading-snug text-[#607096] [overflow-wrap:anywhere]">{reasonLabel(item.reasonCode, t)}</span>
                    ) : null}
                  </td>
                  <td className="py-2 text-right tabular-nums text-[#14244B]">{item.confidence != null ? percent(item.confidence) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
          {paged.pager}
        </>
      ) : (
        <Muted>{t("matching.detail.noRequirements")}</Muted>
      )}
    </div>
  );
}

function Scoring({ scoring }: { scoring: NonNullable<MatchRunDetail["scoring"]> }) {
  const { t } = useLanguage();
  const weightTotal = scoring.factors.reduce((sum, factor) => sum + (factor.weight ?? 0), 0) || 1;
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Fact label={t("matching.detail.fit")}>
          {scoring.fitBand ? <Chip tone={FIT_TONE[scoring.fitBand] ?? "neutral"}>{fitBandMatchLabel(scoring.fitBand, t)}</Chip> : "—"}
        </Fact>
        <Fact label={t("matching.detail.suitability")}>{percent(scoring.suitabilityScore)}</Fact>
        <Fact label={t("matching.detail.diagnostic")} hint={t("matching.detail.diagnosticHint")}>
          {percent(scoring.diagnosticScore)}
        </Fact>
        <Fact label={t("matching.detail.eligibility")}>{eligibilityLabel(scoring.eligibility, t)}</Fact>
        <Fact label={t("matching.detail.compatibility")}>{fieldLabel(scoring.compatibilityStatus ?? "—", t)}</Fact>
        <Fact label={t("matching.detail.provenance")}>{fieldLabel(scoring.provenanceMode ?? "—", t)}</Fact>
      </dl>
      {scoring.factors.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#607096]">{t("matching.detail.factors")}</p>
          {scoring.factors.map((factor) => (
            <div key={factor.name} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto] items-center gap-3 text-xs">
              <span className="truncate font-semibold text-[#14244B]" title={factor.name}>
                {factorLabel(factor.name, t)}
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-[#EEF2FD]" aria-hidden="true">
                <span className="block h-full rounded-full bg-[#204195]" style={{ width: `${Math.round((factor.score ?? 0) * 100)}%` }} />
              </span>
              <span className="whitespace-nowrap tabular-nums text-[#475569]">
                {percent(factor.score)} · {fill(t("matching.detail.weight"), { w: Math.round(((factor.weight ?? 0) / weightTotal) * 100) })}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {scoring.warnings.length ? (
        <div className="flex flex-wrap gap-1.5">
          {scoring.warnings.map((code) => (
            <Chip key={code} tone="warn">
              {warningLabel(code, t)}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Events({ events }: { events: MatchRunDetail["events"] }) {
  const { t } = useLanguage();
  const paged = usePagedRows(events, 20);
  if (!events.length) return <Muted>{t("matching.detail.noEvents")}</Muted>;
  return (
    <>
      <TableShell minWidth={620}>
        <thead>
          <tr>
            <Th>{t("matching.detail.colTime")}</Th>
            <Th>{t("matching.detail.colStep")}</Th>
            <Th>{t("matching.detail.colEvent")}</Th>
            <Th>{t("matching.detail.colStatus")}</Th>
            <Th align="right">{t("matching.detail.colDuration")}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAEFF8]">
          {paged.rows.map((event, index) => (
            <tr key={`${event.at}-${event.event}-${index}`}>
              <td className="py-2 pr-4 tabular-nums text-[#607096]">{clock(event.at)}</td>
              <td className="py-2 pr-4 text-[#14244B]">{stepLabel(event.stage, t)}</td>
              <td className="py-2 pr-4 font-mono text-[11px] text-[#475569]">{event.event}</td>
              <td className="py-2 pr-4">
                <Chip tone={event.status === "error" ? "bad" : event.status === "warning" ? "warn" : event.status === "skipped" ? "outline" : event.status === "started" ? "brand" : "good"}>
                  {t(`matching.eventStatus.${event.status}`)}
                </Chip>
              </td>
              <td className="py-2 text-right tabular-nums text-[#607096]">{formatMs(event.durationMs)}</td>
            </tr>
          ))}
        </tbody>
      </TableShell>
      {paged.pager}
    </>
  );
}

/** One CV–JD match, step by step: what each step did, the per-requirement verdicts, the score and the AI calls. */
export default function MatchingRunClient({ runId }: { runId: string }) {
  const { t } = useLanguage();
  const { state, refresh } = usePolledResource(
    () => matchingRunsService.detail(runId),
    (data) => (data?.run.status === "running" ? 3_000 : null),
    [runId],
  );
  const [selected, setSelected] = useState<MatchStepKey | null>(null);

  const header = (
    <AdminPageHeader
      title={t("matching.detail.title")}
      description={t("matching.detail.subtitle")}
      breadcrumbs={[
        { label: "Quản trị", href: "/admin/dashboard" },
        { label: t("matching.title"), href: "/admin/matching" },
        { label: runId.slice(0, 8) },
      ]}
      statusBadge={
        state.status === "ready" ? (
          <Chip tone={RUN_STATUS_TONE[state.data.run.status] ?? "neutral"}>{t(`matching.runStatus.${state.data.run.status}`)}</Chip>
        ) : undefined
      }
    />
  );

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
            title={t(state.httpStatus === 404 ? "matching.detail.notFound" : state.httpStatus === 503 ? "matching.notMigrated" : "matching.loadError")}
            description=""
            onRetry={() => void refresh()}
          />
        )}
      </div>
    );
  }

  const { run, steps, requirements, scoring, clarification, events, ai } = state.data;
  const current = steps.find((step) => step.key === selected) ?? steps.find((step) => step.status === "running" || step.status === "error") ?? null;

  return (
    <div className="space-y-6">
      {header}

      <AdminSection title={t("matching.detail.overview")}>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Fact label={t("matching.detail.candidate")} hint={run.user?.email ?? undefined}>
            {run.user?.name || run.user?.email || "—"}
          </Fact>
          <Fact label={t("matching.detail.cv")}>{run.cv?.fileName || "—"}</Fact>
          <Fact label={t("matching.detail.job")}>{run.job?.title || "—"}</Fact>
          <Fact label={t("matching.detail.flow")}>{flowLabel(run.flow, t)}</Fact>
          <Fact label={t("matching.detail.started")} hint={run.durationMs != null ? fill(t("matching.detail.took"), { time: formatMs(run.durationMs) }) : undefined}>
            {clock(run.startedAt)}
          </Fact>
          <Fact label={t("matching.detail.result")} hint={run.cacheHit ? t("matching.list.cached") : undefined}>
            {run.fitBand ? (
              <span className="inline-flex items-center gap-1.5">
                <Chip tone={FIT_TONE[run.fitBand] ?? "neutral"}>{fitBandMatchLabel(run.fitBand, t)}</Chip>
                <span className="tabular-nums">{percent(run.suitabilityScore)}</span>
              </span>
            ) : (
              "—"
            )}
          </Fact>
        </dl>
        {run.warnings.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {run.warnings.map((code) => (
              <Chip key={code} tone="warn">
                {warningLabel(code, t)}
              </Chip>
            ))}
          </div>
        ) : null}
      </AdminSection>

      <AdminSection title={t("matching.detail.steps")} description={t("matching.detail.stepsHint")}>
        <div className="space-y-4">
          <MatchingStepper steps={steps} selected={current?.key ?? null} onSelect={setSelected} />
          {current ? <StepDetail step={current} /> : <p className="text-xs text-[#607096]">{t("matching.detail.pickStep")}</p>}
        </div>
      </AdminSection>

      {requirements ? (
        <AdminSection title={t("matching.detail.requirements")} description={t("matching.detail.requirementsHint")}>
          <Requirements data={requirements} />
        </AdminSection>
      ) : null}

      {scoring ? (
        <AdminSection title={t("matching.detail.scoring")} description={t("matching.detail.scoringHint")}>
          <Scoring scoring={scoring} />
        </AdminSection>
      ) : null}

      {clarification && (clarification.gate || clarification.questions || clarification.rescore) ? (
        <AdminSection title={t("matching.detail.clarification")} description={t("matching.detail.clarificationHint")}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {(["gate", "questions", "rescore"] as const).map((part) =>
              clarification[part] ? (
                <div key={part} className="rounded-2xl border border-[#DCE4F3] bg-white p-4">
                  <h3 className="text-sm font-bold text-[#14244B]">{t(`matching.clarify.${part}`)}</h3>
                  <dl className="mt-2 space-y-1.5">
                    {Object.entries(clarification[part] as Record<string, unknown>).map(([name, value]) => (
                      <div key={name} className="flex min-w-0 justify-between gap-3 text-xs">
                        <dt className="text-[#607096]">{fieldLabel(name, t)}</dt>
                        <dd className="text-right font-semibold text-[#14244B] [overflow-wrap:anywhere]">{valueText(value, t)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null,
            )}
          </div>
        </AdminSection>
      ) : null}

      <AdminSection title={t("matching.detail.ai")} description={t("matching.detail.aiHint")}>
        {ai.summary.total ? (
          <div className="space-y-5">
            <AiSummaryFacts summary={ai.summary} />
            <AiPurposeTable summary={ai.summary} />
            <AiCallTable calls={ai.calls} pageSize={10} />
          </div>
        ) : (
          <Muted>{run.cacheHit ? t("matching.detail.noAiCached") : t("matching.detail.noAi")}</Muted>
        )}
      </AdminSection>

      <AdminSection title={t("matching.detail.events")}>
        <Events events={events} />
      </AdminSection>
    </div>
  );
}
