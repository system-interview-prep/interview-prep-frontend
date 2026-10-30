"use client";

import { useState } from "react";
import { ClipboardCheck, ExternalLink, FlaskConical, Gavel, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminMetricCard from "@features/admin/components/primitives/AdminMetricCard";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { usePolledResource } from "@features/admin/pipeline/hooks/usePolledResource";
import { Chip, Muted, TableShell, Th } from "@features/admin/pipeline/components/ui";
import { clock, fill, tr } from "@features/admin/pipeline/utils/pipelineFormat";
import { aiAdminService, type AiEvaluation, type ScoreRate } from "@features/admin/ai/services/aiAdmin.service";
import FlaggedTurnsSection from "./FlaggedTurnsSection";

const WINDOWS = [1, 7, 30];
type Connected = Extract<AiEvaluation, { connected: true }>;

function pct(rate: ScoreRate | null | undefined): string {
  return rate ? `${Math.round(rate.rate * 1000) / 10}%` : "—";
}

/** Tone of a pass rate: green from 90%, amber from 70%, red below. */
function tone(rate: ScoreRate | null | undefined): "good" | "warn" | "bad" | "neutral" {
  if (!rate) return "neutral";
  if (rate.rate >= 0.9) return "good";
  if (rate.rate >= 0.7) return "warn";
  return "bad";
}

function SectionError({ error }: { error: string }) {
  const { t } = useLanguage();
  return <p className="text-xs text-[#C43B3B]">{fill(t("aiAdmin.eval.sectionError"), { error })}</p>;
}

function LinkCard({ href, title, note }: { href: string; title: string; note: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex min-w-0 flex-col rounded-xl border border-[#DCE4F3] bg-white p-4 transition-colors hover:border-[#204195]"
    >
      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#14244B] group-hover:text-[#204195]">
        {title}
        <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
      </span>
      <span className="mt-1 text-xs leading-5 text-[#607096]">{note}</span>
    </a>
  );
}

function ConnectedView({ data }: { data: Connected }) {
  const { t } = useLanguage();
  const quality = data.quality;
  const experiments = data.experiments;
  const review = data.review;
  const flagged = quality.ok ? quality.rates["rule.flagged"] : undefined;
  const judgeInScope = quality.ok ? quality.rates["judge.reply_in_scope"] : undefined;
  const latestRun = experiments.ok ? experiments.runs[0] : undefined;
  const runPass = (rates: Record<string, ScoreRate>) => {
    const values = Object.values(rates);
    const passed = values.reduce((sum, r) => sum + r.passed, 0);
    const count = values.reduce((sum, r) => sum + r.count, 0);
    return count ? { count, passed, rate: passed / count } : null;
  };
  const criteria = experiments.ok
    ? Array.from(new Set(experiments.runs.flatMap((run) => Object.keys(run.rates)))).sort()
    : [];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title={t("aiAdmin.eval.inScope")}
          value={pct(judgeInScope)}
          subtitle={judgeInScope ? fill(t("aiAdmin.eval.ofJudged"), { n: judgeInScope.count }) : t("aiAdmin.eval.noJudge")}
          icon={ShieldAlert}
        />
        <AdminMetricCard
          title={t("aiAdmin.eval.flagged")}
          value={pct(flagged)}
          subtitle={flagged ? fill(t("aiAdmin.eval.ofTurns"), { n: flagged.count }) : t("aiAdmin.eval.noTurns")}
          icon={Gavel}
        />
        <AdminMetricCard
          title={t("aiAdmin.eval.pending")}
          value={review.ok && review.configured ? (review.pending ?? "—") : "—"}
          subtitle={
            review.ok && review.configured
              ? fill(t("aiAdmin.eval.completed"), { n: review.completed ?? 0 })
              : t("aiAdmin.eval.noQueue")
          }
          icon={ClipboardCheck}
        />
        <AdminMetricCard
          title={t("aiAdmin.eval.latestRun")}
          value={latestRun ? pct(runPass(latestRun.rates)) : "—"}
          subtitle={latestRun ? latestRun.name : t("aiAdmin.eval.noRuns")}
          icon={FlaskConical}
        />
      </div>

      <AdminSection title={t("aiAdmin.eval.criteria")} description={t("aiAdmin.eval.criteriaNote")}>
        {!quality.ok ? (
          <SectionError error={quality.error} />
        ) : (
          <TableShell minWidth={520}>
            <thead>
              <tr>
                <Th>{t("aiAdmin.eval.criterion")}</Th>
                <Th align="right">{t("aiAdmin.eval.judge")}</Th>
                <Th align="right">{t("aiAdmin.eval.human")}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {quality.criteria.map((row) => (
                <tr key={row.criterion}>
                  <td className="py-2 pr-4">
                    <span className="font-semibold text-[#14244B]">{tr(t, `aiAdmin.criterion.${row.criterion}`, row.criterion)}</span>
                    <span className="block font-mono text-[11px] text-[#8A98B8]">judge.{row.criterion}</span>
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <Chip tone={tone(row.judge)}>{pct(row.judge)}</Chip>
                    <span className="block text-[11px] tabular-nums text-[#8A98B8]">{row.judge ? fill(t("aiAdmin.eval.n"), { n: row.judge.count }) : ""}</span>
                  </td>
                  <td className="py-2 text-right">
                    <Chip tone={tone(row.human)}>{pct(row.human)}</Chip>
                    <span className="block text-[11px] tabular-nums text-[#8A98B8]">{row.human ? fill(t("aiAdmin.eval.n"), { n: row.human.count }) : ""}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </AdminSection>

      <AdminSection
        title={t("aiAdmin.eval.runs")}
        description={t("aiAdmin.eval.runsNote")}
        action={
          <a href={data.links.datasets} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#204195] hover:underline">
            {t("aiAdmin.eval.openDatasets")}
          </a>
        }
      >
        {!experiments.ok ? (
          <SectionError error={experiments.error} />
        ) : experiments.runs.length ? (
          <TableShell minWidth={Math.max(520, 260 + criteria.length * 110)}>
            <thead>
              <tr>
                <Th>{t("aiAdmin.eval.run")}</Th>
                {criteria.map((name) => (
                  <Th key={name} align="right">
                    {tr(t, `aiAdmin.check.${name}`, name)}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFF8]">
              {experiments.runs.map((run) => (
                <tr key={run.id}>
                  <td className="py-2 pr-4">
                    <span className="font-semibold text-[#14244B]">{run.name}</span>
                    <span className="block text-[11px] tabular-nums text-[#8A98B8]">
                      {run.startTime ? `${new Date(run.startTime).toLocaleDateString("vi-VN")} ${clock(run.startTime)}` : ""}
                      {run.model ? ` · ${run.model}` : ""} · {fill(t("aiAdmin.eval.items"), { n: run.items })}
                    </span>
                  </td>
                  {criteria.map((name) => (
                    <td key={name} className="py-2 pr-4 text-right">
                      <Chip tone={tone(run.rates[name])}>{pct(run.rates[name])}</Chip>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <Muted>{t("aiAdmin.eval.noRunsHint")}</Muted>
        )}
      </AdminSection>

      <FlaggedTurnsSection days={data.windowDays} projectUrl={data.projectUrl} />

      <AdminSection title={t("aiAdmin.eval.inLangfuse")} description={t("aiAdmin.eval.inLangfuseNote")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LinkCard href={data.links.traces} title={t("aiAdmin.link.traces")} note={t("aiAdmin.link.tracesNote")} />
          <LinkCard href={data.links.queues} title={t("aiAdmin.link.queues")} note={t("aiAdmin.link.queuesNote")} />
          <LinkCard href={data.links.evaluators} title={t("aiAdmin.link.evaluators")} note={t("aiAdmin.link.evaluatorsNote")} />
          <LinkCard href={data.links.scores} title={t("aiAdmin.link.scores")} note={t("aiAdmin.link.scoresNote")} />
          <LinkCard href={data.links.datasets} title={t("aiAdmin.link.datasets")} note={t("aiAdmin.link.datasetsNote")} />
          <LinkCard
            href={data.links.prompts}
            title={t("aiAdmin.link.prompts")}
            note={
              data.prompts.ok && data.prompts.count
                ? fill(t("aiAdmin.link.promptsCount"), { n: data.prompts.count })
                : t("aiAdmin.link.promptsNote")
            }
          />
          <LinkCard href={data.links.dashboards} title={t("aiAdmin.link.dashboards")} note={t("aiAdmin.link.dashboardsNote")} />
          <LinkCard href={data.links.sessions} title={t("aiAdmin.link.sessions")} note={t("aiAdmin.link.sessionsNote")} />
        </div>
      </AdminSection>
    </>
  );
}

/** "Đánh giá AI": the Langfuse project in short, with links to where the work is done. */
export default function AdminEvaluationOverviewClient() {
  const { t } = useLanguage();
  const [days, setDays] = useState(7);
  const { state, refresh } = usePolledResource(() => aiAdminService.evaluation(days), () => 120_000, [days]);

  const header = (
    <AdminPageHeader
      title={t("aiAdmin.eval.title")}
      description={t("aiAdmin.eval.subtitle")}
      breadcrumbs={[{ label: "Quản trị", href: "/admin/dashboard" }, { label: t("admin.sidebar.evalOverview") }]}
      primaryAction={
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("aiPipeline.health.window")}>
          {state.status === "ready" && state.data.connected ? (
            <a
              href={state.data.projectUrl}
              target="_blank"
              rel="noreferrer"
              className="mr-1 inline-flex items-center gap-1.5 rounded-xl border border-[#DCE4F3] bg-white px-3 py-1.5 text-xs font-semibold text-[#204195] hover:bg-[#F8FAFC]"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {t("aiPipeline.llm.openLangfuse")}
            </a>
          ) : null}
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

  if (state.status !== "ready") {
    return (
      <div className="space-y-6">
        {header}
        {state.status === "loading" ? (
          <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
            <span className="sr-only">{t("aiPipeline.loading")}</span>
          </div>
        ) : (
          <AdminEmptyState variant="error" title={t("aiAdmin.loadError")} description="" onRetry={() => void refresh()} />
        )}
      </div>
    );
  }

  const data = state.data;
  return (
    <div className="space-y-6">
      {header}
      {data.connected ? (
        <ConnectedView data={data} />
      ) : (
        <AdminSection title={t("aiAdmin.eval.notConnected")}>
          <p className="text-sm leading-6 text-[#475569]">{tr(t, `aiAdmin.eval.reason.${data.reason}`, data.reason)}</p>
          <p className="mt-2 text-xs text-[#607096]">{t("aiAdmin.eval.setupHint")}</p>
        </AdminSection>
      )}
      <p className="text-[11px] text-[#8A98B8]">
        {fill(t("aiAdmin.eval.updated"), { time: clock(data.generatedAt) })}
      </p>
    </div>
  );
}
