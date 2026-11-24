"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Circle, CircleSlash, Loader2, X, XCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { usePolledResource } from "../hooks/usePolledResource";
import {
  cvParsingRunsService,
  type CvExtraction,
  type CvQuality,
  type CvRunDetail,
  type CvStep,
  type CvStepKey,
  type CvStepStatus,
} from "../services/cvParsingRuns.service";
import { clock, fill, formatMs } from "../utils/pipelineFormat";
import {
  COVERAGE_TONE,
  CV_RUN_TONE,
  CV_STEP_TONE,
  cvLabel,
  cvStepLabel,
  cvStepSummary,
  formatBytes,
  formatCount,
} from "../utils/cvParsingFormat";
import { AiCallTable, AiPurposeTable, AiSummaryFacts } from "./AiCallTables";
import ReparseCvButton from "./ReparseCvButton";
import { Chip, Fact, Muted, TableShell, Th, usePagedRows } from "./ui";

type Translate = (key: string) => string;

const ICONS: Record<CvStepStatus, { icon: typeof Circle; className: string }> = {
  done: { icon: CheckCircle2, className: "text-[#287A4B]" },
  running: { icon: Loader2, className: "text-[#204195] animate-spin motion-reduce:animate-none" },
  error: { icon: XCircle, className: "text-[#C43B3B]" },
  pending: { icon: Circle, className: "text-[#B6C2DA]" },
  skipped: { icon: CircleSlash, className: "text-stone-500" },
};

const FRAME: Record<CvStepStatus, string> = {
  done: "border-[#DCE4F3] bg-white",
  running: "border-[#204195] bg-[#F5F8FF] ring-2 ring-[#204195]/15",
  error: "border-[#F3C4C4] bg-[#FFF8F8]",
  pending: "border-dashed border-[#DCE4F3] bg-[#FBFCFE]",
  skipped: "border-stone-200 bg-stone-50",
};

const SECTIONS = ["profile", "skills", "employment", "education", "projects", "certifications", "languages", "career_classifications"];

function fieldLabel(name: string, t: Translate): string {
  const key = `cvParse.field.${name}`;
  const text = t(key);
  return text && text !== key ? text : name.replace(/_/g, " ");
}

/** Field values in words: booleans as Có/Không, objects as "a: 1 · b: 2" with known keys translated. */
function valueText(value: unknown, t: Translate): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? t("cvParse.yes") : t("cvParse.no");
  if (typeof value === "number") return Number.isInteger(value) ? formatCount(value) : value.toFixed(2);
  if (Array.isArray(value)) return value.length ? value.map((item) => valueText(item, t)).join(", ") : "—";
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length ? entries.map(([k, v]) => `${cvLabel(t, "section", k)}: ${valueText(v, t)}`).join(" · ") : "—";
  }
  return String(value);
}

/** Shown in their own sections (quality, extraction) instead of the step panel. */
const HIDDEN_FIELDS = new Set(["checks", "canonical_section_coverage", "warnings", "coverage_reason_codes", "source_artifact_key"]);

const CODE_FIELDS = new Set(["reason", "failed_stage", "status", "parsing_status", "canonical_status", "outcome"]);

function CvStepper({ steps, selected, onSelect }: { steps: CvStep[]; selected: CvStepKey | null; onSelect: (key: CvStepKey) => void }) {
  const { t } = useLanguage();
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={t("cvParse.detail.steps")}>
      {steps.map((step, index) => {
        const { icon: Icon, className } = ICONS[step.status];
        const summary = cvStepSummary(step, t);
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
              <span className="text-sm font-bold leading-tight text-[#14244B]">{cvStepLabel(step.key, t)}</span>
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

function StepDetail({ step }: { step: CvStep }) {
  const { t } = useLanguage();
  const entries = Object.entries(step.summary || {}).filter(([name]) => !HIDDEN_FIELDS.has(name));
  return (
    <div className="rounded-2xl border border-[#DCE4F3] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-[#14244B]">{cvStepLabel(step.key, t)}</h3>
        <Chip tone={CV_STEP_TONE[step.status]}>{t(`aiPipeline.status.${step.status}`)}</Chip>
        {step.startedAt ? <span className="text-xs tabular-nums text-[#607096]">{clock(step.startedAt)}</span> : null}
        {step.durationMs != null ? <span className="text-xs tabular-nums text-[#607096]">· {formatMs(step.durationMs)}</span> : null}
      </div>
      <p className="mt-1 text-xs leading-5 text-[#607096]">{t(`cvParse.stepHelp.${step.key}`)}</p>
      {entries.length ? (
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([name, value]) => (
            <div key={name} className="min-w-0">
              <dt className="text-[11px] font-semibold text-[#607096]">{fieldLabel(name, t)}</dt>
              <dd className="text-sm font-semibold text-[#14244B] [overflow-wrap:anywhere]">
                {name === "failed_stage"
                  ? cvStepLabel(String(value), t)
                  : name === "size_bytes" || name === "bytes"
                    ? formatBytes(typeof value === "number" ? value : null)
                    : name === "duration_ms"
                      ? formatMs(typeof value === "number" ? value : null)
                      : (name.endsWith("_coverage") || name === "coverage") && typeof value === "string"
                        ? cvLabel(t, "coverage", value)
                        : CODE_FIELDS.has(name) && typeof value === "string"
                          ? cvLabel(t, "reason", value)
                        : valueText(value, t)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-xs text-[#8A98B8]">{t("cvParse.detail.noStepData")}</p>
      )}
    </div>
  );
}

function Extraction({ extraction }: { extraction: CvExtraction }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact label={t("cvParse.detail.provider")}>{extraction.provider || "—"}</Fact>
        <Fact label={t("cvParse.detail.extractorVersion")}>{extraction.extractorVersion || "—"}</Fact>
        <Fact label={t("cvParse.detail.markdownChars")}>{formatCount(extraction.markdownCharacters)}</Fact>
        <Fact label={t("cvParse.detail.contentBlocks")}>{formatCount(extraction.contentBlocks)}</Fact>
      </dl>
      {extraction.attempts.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#607096]">{t("cvParse.detail.providerTries")}</p>
          <ol className="flex flex-wrap items-center gap-1.5">
            {extraction.attempts.map((attempt, index) => (
              <li key={`${attempt.provider}-${index}`} className="flex items-center gap-1.5">
                {index ? <span className="text-xs text-[#8A98B8]" aria-hidden="true">→</span> : null}
                <Chip tone={attempt.outcome === "used" ? "good" : attempt.outcome === "failed" ? "bad" : "outline"}>
                  {attempt.provider || "—"} · {t(`cvParse.outcome.${attempt.outcome}`)}
                  {attempt.errorType ? ` (${attempt.errorType})` : ""}
                </Chip>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function Quality({ quality }: { quality: CvQuality }) {
  const { t } = useLanguage();
  const counts = quality.sectionCounts ?? {};
  const sections = SECTIONS.filter((name) => quality.coverage.sections[name] != null || counts[name] != null);
  const checks = Object.entries(quality.checks);
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Fact label={t("cvParse.detail.gate")}>
          {quality.status ? <Chip tone={quality.status === "review_required" ? "warn" : "good"}>{cvLabel(t, "quality", quality.status)}</Chip> : "—"}
        </Fact>
        <Fact label={t("cvParse.detail.rawText")}>
          {quality.coverage.rawText ? <Chip tone={COVERAGE_TONE[quality.coverage.rawText] ?? "neutral"}>{cvLabel(t, "coverage", quality.coverage.rawText)}</Chip> : "—"}
        </Fact>
        <Fact label={t("cvParse.detail.evidence")} hint={counts.evidence != null ? fill(t("cvParse.detail.evidenceCount"), { n: counts.evidence }) : undefined}>
          {quality.coverage.evidence ? <Chip tone={COVERAGE_TONE[quality.coverage.evidence] ?? "neutral"}>{cvLabel(t, "coverage", quality.coverage.evidence)}</Chip> : "—"}
        </Fact>
        <Fact label={t("cvParse.detail.sourceChars")}>{formatCount(quality.sourceCharacters)}</Fact>
        <Fact label={t("cvParse.detail.parserVersion")}>{quality.parserVersion || "—"}</Fact>
      </dl>

      {sections.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#607096]">{t("cvParse.detail.sections")}</p>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {sections.map((name) => {
              const coverage = quality.coverage.sections[name];
              return (
                <li key={name} className="flex items-center justify-between gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3 py-2">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight text-[#14244B]">{cvLabel(t, "section", name)}</span>
                    {counts[name] != null ? (
                      <span className="block text-[11px] tabular-nums text-[#607096]">{fill(t("cvParse.detail.entries"), { n: counts[name] })}</span>
                    ) : null}
                  </span>
                  {coverage ? (
                    <span className="shrink-0">
                      <Chip tone={COVERAGE_TONE[coverage] ?? "neutral"}>{cvLabel(t, "coverage", coverage)}</Chip>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {checks.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#607096]">{t("cvParse.detail.checks")}</p>
          <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {checks.map(([name, ok]) => (
              <li key={name} className="flex items-center gap-2 text-xs text-[#14244B]">
                {ok ? (
                  <Check className="size-4 shrink-0 text-[#287A4B]" aria-label={t("cvParse.yes")} />
                ) : (
                  <X className="size-4 shrink-0 text-[#C43B3B]" aria-label={t("cvParse.no")} />
                )}
                {cvLabel(t, "check", name)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {quality.reasonCodes.length || quality.warnings.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold text-[#607096]">{t("cvParse.detail.warnings")}</p>
          <div className="flex flex-wrap gap-1.5">
            {quality.reasonCodes.map((code) => (
              <Chip key={code} tone="warn">
                {cvLabel(t, "reason", code)}
              </Chip>
            ))}
            {quality.warnings.map((warning, index) => (
              <Chip key={`${warning.code}-${index}`} tone={warning.severity === "error" ? "bad" : "warn"}>
                {cvLabel(t, "parserWarning", warning.code)}
                {warning.section ? ` · ${cvLabel(t, "section", warning.section)}` : ""}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Events({ events }: { events: CvRunDetail["events"] }) {
  const { t } = useLanguage();
  const paged = usePagedRows(events, 20);
  const attempts = [...new Set(events.map((event) => event.attemptId).filter(Boolean))];
  if (!events.length) return <Muted>{t("cvParse.detail.noEvents")}</Muted>;
  return (
    <>
      <TableShell minWidth={680}>
        <thead>
          <tr>
            <Th>{t("cvParse.detail.colTime")}</Th>
            <Th>{t("cvParse.detail.colStep")}</Th>
            <Th>{t("cvParse.detail.colEvent")}</Th>
            <Th>{t("cvParse.detail.colAttempt")}</Th>
            <Th>{t("cvParse.detail.colStatus")}</Th>
            <Th align="right">{t("cvParse.detail.colDuration")}</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAEFF8]">
          {paged.rows.map((event, index) => (
            <tr key={`${event.at}-${event.event}-${index}`}>
              <td className="py-2 pr-4 tabular-nums text-[#607096]">{clock(event.at)}</td>
              <td className="py-2 pr-4 text-[#14244B]">{cvStepLabel(event.stage, t)}</td>
              <td className="py-2 pr-4 font-mono text-[11px] text-[#475569]">{event.event}</td>
              <td className="py-2 pr-4 tabular-nums text-xs text-[#607096]">
                {event.attemptId ? `#${attempts.indexOf(event.attemptId) + 1}` : "—"}
              </td>
              <td className="py-2 pr-4">
                <Chip
                  tone={
                    event.status === "error" ? "bad" : event.status === "warning" ? "warn" : event.status === "skipped" ? "outline" : event.status === "started" ? "brand" : "good"
                  }
                >
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

/** One uploaded CV, step by step: upload, queue, text extraction, parse, quality gate, save. */
export default function CvParsingRunClient({ cvId }: { cvId: string }) {
  const { t } = useLanguage();
  const { state, refresh } = usePolledResource(
    () => cvParsingRunsService.detail(cvId),
    (data) => (data?.run.status === "running" ? 3_000 : null),
    [cvId],
  );
  const [selected, setSelected] = useState<CvStepKey | null>(null);

  const header = (
    <AdminPageHeader
      title={t("cvParse.detail.title")}
      description={t("cvParse.detail.subtitle")}
      breadcrumbs={[
        { label: "Quản trị", href: "/admin/dashboard" },
        { label: t("cvParse.title"), href: "/admin/cv-parsing" },
        { label: cvId.slice(0, 8) },
      ]}
      statusBadge={
        state.status === "ready" ? (
          <Chip tone={CV_RUN_TONE[state.data.run.status] ?? "neutral"}>{t(`cvParse.runStatus.${state.data.run.status}`)}</Chip>
        ) : undefined
      }
      primaryAction={
        state.status === "ready" && state.data.run.status !== "running" ? (
          <ReparseCvButton cvId={cvId} onDone={() => void refresh()} />
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
            title={t(state.httpStatus === 404 ? "cvParse.detail.notFound" : state.httpStatus === 503 ? "cvParse.notMigrated" : "cvParse.loadError")}
            description={state.httpStatus === 503 ? t("cvParse.notMigratedHint") : ""}
            onRetry={() => void refresh()}
          />
        )}
      </div>
    );
  }

  const { run, steps, extraction, quality, events, ai } = state.data;
  const current =
    steps.find((step) => step.key === selected) ??
    steps.find((step) => step.status === "running" || step.status === "error") ??
    steps.find((step) => step.key === "quality" && run.status === "review") ??
    null;

  return (
    <div className="space-y-6">
      {header}

      {!run.tracked ? (
        <div className="rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs leading-5 text-[#607096]">{t("cvParse.detail.untrackedNote")}</div>
      ) : null}

      <AdminSection title={t("cvParse.detail.overview")}>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Fact label={t("cvParse.detail.candidate")} hint={run.user?.email ?? undefined}>
            {run.user?.id ? (
              <Link href={`/admin/users/${encodeURIComponent(run.user.id)}`} className="text-[#204195] hover:underline">
                {run.user.name || run.user.email || "—"}
              </Link>
            ) : (
              run.user?.name || run.user?.email || "—"
            )}
          </Fact>
          <Fact label={t("cvParse.detail.file")} hint={`${formatBytes(run.cv.sizeBytes)}${run.cv.contentType ? ` · ${run.cv.contentType}` : ""}`}>
            {run.cv.fileName || "—"}
          </Fact>
          <Fact label={t("cvParse.detail.uploaded")}>{clock(run.uploadedAt)}</Fact>
          <Fact label={t("cvParse.detail.duration")} hint={run.attempts > 1 ? fill(t("cvParse.list.attempts"), { n: run.attempts }) : undefined}>
            {run.durationMs != null ? formatMs(run.durationMs) : "—"}
          </Fact>
          <Fact label={t("cvParse.detail.provider")}>{run.provider || "—"}</Fact>
          <Fact label={t("cvParse.detail.result")} hint={run.dbStatus ? fill(t("cvParse.detail.dbStatus"), { s: run.dbStatus }) : undefined}>
            <Chip tone={CV_RUN_TONE[run.status] ?? "neutral"}>{t(`cvParse.runStatus.${run.status}`)}</Chip>
          </Fact>
        </dl>
        {run.warnings.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {run.warnings.map((code) => (
              <Chip key={code} tone="warn">
                {cvLabel(t, "warning", code)}
              </Chip>
            ))}
          </div>
        ) : null}
      </AdminSection>

      <AdminSection title={t("cvParse.detail.steps")} description={t("cvParse.detail.stepsHint")}>
        <div className="space-y-4">
          <CvStepper steps={steps} selected={current?.key ?? null} onSelect={setSelected} />
          {current ? <StepDetail step={current} /> : <p className="text-xs text-[#607096]">{t("cvParse.detail.pickStep")}</p>}
        </div>
      </AdminSection>

      {extraction ? (
        <AdminSection title={t("cvParse.detail.extraction")} description={t("cvParse.detail.extractionHint")}>
          <Extraction extraction={extraction} />
        </AdminSection>
      ) : null}

      {quality ? (
        <AdminSection title={t("cvParse.detail.quality")} description={t("cvParse.detail.qualityHint")}>
          <Quality quality={quality} />
        </AdminSection>
      ) : null}

      <AdminSection title={t("cvParse.detail.ai")} description={t("cvParse.detail.aiHint")}>
        {ai.summary.total ? (
          <div className="space-y-5">
            <AiSummaryFacts summary={ai.summary} />
            <AiPurposeTable summary={ai.summary} />
            <AiCallTable calls={ai.calls} pageSize={10} />
          </div>
        ) : (
          <Muted>{run.tracked ? t("cvParse.detail.noAi") : t("cvParse.detail.noAiUntracked")}</Muted>
        )}
      </AdminSection>

      {run.tracked ? (
        <AdminSection title={t("cvParse.detail.events")}>
          <Events events={events} />
        </AdminSection>
      ) : null}
    </div>
  );
}
