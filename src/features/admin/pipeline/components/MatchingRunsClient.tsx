"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Database, Search, Sparkles } from "lucide-react";
import { Pagination } from "@components/shared/Pagination";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { usePolledResource } from "../hooks/usePolledResource";
import { matchingRunsService, type MatchRun, type MatchRunStatus } from "../services/matchingRuns.service";
import { clock, fill, formatMs } from "../utils/pipelineFormat";
import {
  BASE_STEP_KEYS,
  FIT_TONE,
  RUN_STATUS_TONE,
  fitBandMatchLabel,
  flowLabel,
  percent,
  runProgress,
  stepLabel,
} from "../utils/matchingFormat";
import { Chip } from "./ui";

const PAGE = 20;
const DAY_OPTIONS = [1, 7, 30];
type StatusFilter = "all" | MatchRunStatus;

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 rounded-xl px-3 text-xs font-semibold transition-colors ${
        active ? "bg-[#204195] text-white" : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"
      }`}
    >
      {children}
    </button>
  );
}

/** Nine small segments: done (green), current (blue / red on failure), not reached (grey). */
function MiniProgress({ run }: { run: MatchRun }) {
  const { t } = useLanguage();
  const done = runProgress(run, BASE_STEP_KEYS);
  const failedAt = run.status === "failed" ? Math.max(0, BASE_STEP_KEYS.indexOf(run.currentStep as (typeof BASE_STEP_KEYS)[number])) : -1;
  return (
    <div className="min-w-0">
      <div className="flex gap-0.5" aria-hidden="true">
        {BASE_STEP_KEYS.map((key, index) => {
          const color =
            index === failedAt
              ? "bg-[#C43B3B]"
              : index < done
                ? run.status === "running" && index === done - 1
                  ? "bg-[#204195] animate-pulse motion-reduce:animate-none"
                  : "bg-[#287A4B]"
                : "bg-[#DCE4F3]";
          return <span key={key} className={`h-1.5 flex-1 rounded-full ${color}`} />;
        })}
      </div>
      <p className="mt-1 truncate text-[11px] text-[#607096]">
        {run.status === "completed"
          ? fill(t("matching.list.stepsDone"), { n: BASE_STEP_KEYS.length })
          : fill(t(run.status === "failed" ? "matching.list.failedAt" : "matching.list.runningAt"), { step: stepLabel(run.currentStep, t) })}
      </p>
    </div>
  );
}

function RunRow({ run }: { run: MatchRun }) {
  const { t } = useLanguage();
  const who = run.user?.name || run.user?.email || t("matching.list.unknownUser");
  return (
    <li>
      <Link
        href={`/admin/matching/${encodeURIComponent(run.runId)}`}
        className="group grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-2xs transition-colors hover:border-[#204195]/40 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#14244B] group-hover:text-[#204195]" title={who}>
            {who}
          </p>
          <p className="truncate text-xs text-[#607096]" title={run.cv?.fileName ?? undefined}>
            {run.cv?.fileName || t("matching.list.noCv")}
          </p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#14244B]" title={run.job?.title ?? undefined}>
            {run.job?.title || t("matching.list.noJob")}
          </p>
          <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#607096]">
            <span>{flowLabel(run.flow, t)}</span>
            {run.cacheHit ? (
              <span className="inline-flex items-center gap-0.5 text-[#475569]">
                <Database className="size-3" aria-hidden="true" />
                {t("matching.list.cached")}
              </span>
            ) : null}
          </p>
        </div>
        <MiniProgress run={run} />
        <div className="flex items-center justify-between gap-3 md:justify-end">
          <div className="flex flex-col items-start gap-1 md:items-end">
            <span className="flex items-center gap-1.5">
              {run.status !== "completed" ? (
                <Chip tone={RUN_STATUS_TONE[run.status] ?? "neutral"}>{t(`matching.runStatus.${run.status}`)}</Chip>
              ) : null}
              {run.fitBand ? <Chip tone={FIT_TONE[run.fitBand] ?? "neutral"}>{fitBandMatchLabel(run.fitBand, t)}</Chip> : null}
              {run.suitabilityScore != null ? (
                <span className="text-sm font-bold tabular-nums text-[#14244B]">{percent(run.suitabilityScore)}</span>
              ) : null}
            </span>
            <span className="text-[11px] tabular-nums text-[#607096]">
              {clock(run.startedAt)} · {run.durationMs != null ? formatMs(run.durationMs) : "—"}
              {" · "}
              <span className={run.aiErrors ? "font-semibold text-[#C43B3B]" : ""}>
                {fill(t(run.aiErrors ? "matching.list.aiWithErrors" : "matching.list.ai"), { n: run.aiCalls, e: run.aiErrors })}
              </span>
            </span>
          </div>
          <ChevronRight className="size-4 shrink-0 text-[#8A98B8] group-hover:text-[#204195]" aria-hidden="true" />
        </div>
      </Link>
    </li>
  );
}

/** Every CV–JD match: who, which job, how far it got, the result. Refreshes while a match is running. */
export default function MatchingRunsClient() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [days, setDays] = useState(7);
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const filterKey = `${status}|${days}|${q}`;
  const [page, setPage] = useState({ key: filterKey, offset: 0 });
  const offset = page.key === filterKey ? page.offset : 0;

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { state, refresh } = usePolledResource(
    () => matchingRunsService.list({ status, days, q, limit: PAGE, offset }),
    (data) => (data?.items.some((run) => run.status === "running") ? 4_000 : 30_000),
    [status, days, q, offset],
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("matching.title")} description={t("matching.subtitle")} />

      <div className="flex items-start gap-3 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs leading-5 text-[#607096]">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-[#204195]" aria-hidden="true" />
        <p>{t("matching.howItWorks")}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t("matching.list.search")}
            placeholder={t("matching.list.search")}
            className="h-9 w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] pl-9 pr-4 text-xs text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "running", "completed", "failed"] as const).map((value) => (
            <Toggle key={value} active={status === value} onClick={() => setStatus(value)}>
              {value === "all" ? t("aiPipeline.calls.all") : t(`matching.runStatus.${value}`)}
            </Toggle>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-[#DCE4F3] sm:block" aria-hidden="true" />
          {DAY_OPTIONS.map((option) => (
            <Toggle key={option} active={days === option} onClick={() => setDays(option)}>
              {fill(t("aiPipeline.calls.days"), { n: option })}
            </Toggle>
          ))}
        </div>
      </div>

      {state.status === "loading" ? (
        <div className="h-60 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
          <span className="sr-only">{t("aiPipeline.loading")}</span>
        </div>
      ) : state.status === "error" ? (
        <AdminEmptyState
          variant="error"
          title={t(state.httpStatus === 503 ? "matching.notMigrated" : "matching.loadError")}
          description={state.httpStatus === 503 ? t("matching.notMigratedHint") : ""}
          onRetry={() => void refresh()}
        />
      ) : state.data.items.length === 0 ? (
        <AdminEmptyState title={t("matching.list.emptyTitle")} description={t("matching.list.emptyDesc")} />
      ) : (
        <section aria-label={t("matching.title")} className="space-y-3">
          <p className="text-xs text-[#607096]">{fill(t("matching.list.count"), { n: state.data.total })}</p>
          <ul className="space-y-2">
            {state.data.items.map((run) => (
              <RunRow key={run.runId} run={run} />
            ))}
          </ul>
          {state.data.total > PAGE ? (
            <Pagination
              page={Math.floor(offset / PAGE) + 1}
              pageSize={PAGE}
              total={state.data.total}
              onPageChange={(next) => setPage({ key: filterKey, offset: (next - 1) * PAGE })}
              className="mt-4"
            />
          ) : null}
        </section>
      )}
    </div>
  );
}
