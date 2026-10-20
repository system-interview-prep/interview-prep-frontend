"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import AdminStatusBadge from "@features/admin/components/primitives/AdminStatusBadge";
import AdminSessionPlanClient from "@features/admin/components/AdminSessionPlanClient";
import { usePolledResource } from "../hooks/usePolledResource";
import { useDebounced, usePipelineSocket } from "../hooks/usePipelineSocket";
import { pipelineService, type StageKey } from "../services/pipeline.service";
import { clock, fill, pollInterval, stageSummary, tr } from "../utils/pipelineFormat";
import PipelineStepper from "./PipelineStepper";
import LiveNowPanel from "./LiveNowPanel";
import RoomObserverPanel from "./RoomObserverPanel";
import { EntrySection, InterviewSection, PlanSection, QuestionsSection, VoiceSection } from "./PipelineOverview";
import PipelineTurns from "./PipelineTurns";
import PipelineGrading from "./PipelineGrading";
import PipelineEvents from "./PipelineEvents";
import { AiCallTable, AiPurposeTable, AiSummaryFacts } from "./AiCallTables";

type Tab = "overview" | "turns" | "grading" | "ai" | "events" | "plan";
const TABS: Tab[] = ["overview", "turns", "grading", "ai", "events", "plan"];
const TAB_OF_STAGE: Record<StageKey, Tab> = {
  created: "overview",
  entry: "overview",
  plan: "overview",
  questions: "overview",
  interview: "turns",
  evaluation: "grading",
  report: "grading",
};

/**
 * One interview as the AI handled it: what is happening right now, a stepper
 * of the pipeline stages with their results, then the decisions behind each
 * one. The backend pushes a notice when it stores new events (socket.io), and
 * the page refetches; a 4 s poll takes over when the socket is down.
 */
export default function SessionPipelineClient({ sessionId }: { sessionId: string }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("overview");
  const [tabChosen, setTabChosen] = useState(false);
  // A pushed notice refetches the journey (debounced: one burst, one request).
  const onPush = useRef<() => void>(() => undefined);
  const { connected } = usePipelineSocket(() => onPush.current(), sessionId);
  const { state, refresh, polling, paused } = usePolledResource(
    () => pipelineService.session(sessionId),
    (data) => pollInterval(data, connected),
    [sessionId],
  );
  const refreshSoon = useDebounced(() => void refresh(), 300);
  // "Vào xem" on the live board links here with ?observe=1: join the room right away.
  // Only read in an effect of the panel, so the server/client difference never reaches markup.
  const [observeOnOpen] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("observe") === "1",
  );
  useEffect(() => {
    onPush.current = refreshSoon;
  });

  const pipeline = state.status === "ready" ? state.data : null;
  const summaries = useMemo(
    () =>
      pipeline
        ? Object.fromEntries(pipeline.stages.map((stage) => [stage.key, stageSummary(stage, pipeline, t)]))
        : {},
    [pipeline, t],
  );
  // A live interview opens on its turns until the admin picks a tab.
  const activeTab: Tab = !tabChosen && pipeline?.live ? (pipeline.evaluation.job?.status === "PROCESSING" ? "grading" : "turns") : tab;
  const choose = (next: Tab) => {
    setTab(next);
    setTabChosen(true);
  };

  const session = pipeline?.session;
  const header = (
    <AdminPageHeader
      title={t("aiPipeline.title")}
      description={
        session
          ? [
              session.candidateName || session.candidateEmail,
              session.jobTitle,
              session.companyName,
              session.mode ? tr(t, `aiPipeline.mode.${session.mode.toLowerCase()}`, session.mode) : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : t("aiPipeline.subtitle")
      }
      breadcrumbs={[
        { label: t("fixAdmin.detail.breadcrumbAdmin"), href: "/admin/dashboard" },
        { label: t("admin.sidebar.interviews"), href: "/admin/interviews" },
        { label: sessionId.slice(0, 8) },
      ]}
      statusBadge={
        pipeline ? (
          polling || (pipeline.live && connected) ? (
            <AdminStatusBadge status="info" label={t("aiPipeline.live")} />
          ) : paused ? (
            <AdminStatusBadge status="pending" label={t("aiPipeline.paused")} />
          ) : null
        ) : null
      }
      primaryAction={
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-full border border-[#DCE4F3] bg-white px-3.5 py-2 text-xs font-semibold text-[#14244B] shadow-2xs transition-colors hover:bg-[#F8FAFC]"
        >
          <RefreshCw
            className={`size-3.5 ${state.status === "ready" && state.refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
            aria-hidden="true"
          />
          {t("aiPipeline.refresh")}
        </button>
      }
    />
  );

  if (state.status !== "ready" || !pipeline) {
    const httpStatus = state.status === "error" ? state.httpStatus : null;
    return (
      <div className="space-y-6">
        {header}
        {state.status === "loading" ? (
          <div className="h-40 animate-pulse rounded-2xl border border-[#DCE4F3] bg-white motion-reduce:animate-none" role="status">
            <span className="sr-only">{t("aiPipeline.loading")}</span>
          </div>
        ) : (
          <AdminEmptyState
            variant={httpStatus === 404 ? "empty" : "error"}
            title={t(httpStatus === 404 ? "aiPipeline.notFound" : "aiPipeline.loadError")}
            description=""
            onRetry={() => void refresh()}
          />
        )}
        <Link href="/admin/interviews" className="text-sm font-semibold text-[#204195] hover:underline">
          {t("aiPipeline.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <div className="flex flex-col gap-2 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[#204195]" aria-hidden="true" />
          <span>{t("aiPipeline.privacy")}</span>
        </p>
        <p className="shrink-0 tabular-nums" aria-live="polite">
          {fill(t("aiPipeline.updatedAt"), { time: clock(new Date(state.fetchedAt).toISOString()) })}
        </p>
      </div>

      <LiveNowPanel pipeline={pipeline} pushConnected={connected} />

      {pipeline.live &&
      (pipeline.session.status ?? "").toUpperCase() === "OPEN" &&
      pipeline.stages.some((stage) => stage.key === "interview" && stage.status === "running") &&
      ["voice", "video"].includes((pipeline.session.mode ?? "").toLowerCase()) ? (
        <RoomObserverPanel sessionId={sessionId} autoJoin={observeOnOpen} />
      ) : null}

      <PipelineStepper stages={pipeline.stages} summaries={summaries} onSelect={(key) => choose(TAB_OF_STAGE[key])} />

      {pipeline.events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#DCE4F3] bg-white p-3 text-xs text-[#607096]">
          {t("aiPipeline.noEvents")}
        </p>
      ) : null}

      <div className="-mx-1 overflow-x-auto px-1">
        <div role="tablist" aria-label={t("aiPipeline.title")} className="flex min-w-max gap-1 border-b border-[#DCE4F3]">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`pipeline-tab-${key}`}
              aria-selected={activeTab === key}
              aria-controls={`pipeline-panel-${key}`}
              onClick={() => choose(key)}
              className={`-mb-px border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                activeTab === key
                  ? "border-[#204195] text-[#204195]"
                  : "border-transparent text-[#607096] hover:text-[#14244B]"
              }`}
            >
              {t(`aiPipeline.tab.${key}`)}
              {key === "ai" && pipeline.ai.errors ? (
                <span className="ml-1.5 rounded-full bg-[#FDF2F2] px-1.5 text-[11px] text-[#C43B3B]">{pipeline.ai.errors}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`pipeline-panel-${activeTab}`} aria-labelledby={`pipeline-tab-${activeTab}`} className="space-y-6">
        {activeTab === "overview" ? (
          <>
            <EntrySection pipeline={pipeline} />
            <PlanSection pipeline={pipeline} />
            <QuestionsSection pipeline={pipeline} />
            <InterviewSection pipeline={pipeline} />
            <VoiceSection pipeline={pipeline} />
          </>
        ) : null}
        {activeTab === "turns" ? <PipelineTurns turns={pipeline.turns} currentTurnIndex={pipeline.currentTurnIndex} sessionId={sessionId} /> : null}
        {activeTab === "grading" ? <PipelineGrading pipeline={pipeline} /> : null}
        {activeTab === "ai" ? (
          <>
            <AdminSection
              title={t("aiPipeline.ai.title")}
              action={
                <Link
                  href={`/admin/ai/traces?sessionId=${encodeURIComponent(sessionId)}`}
                  className="text-xs font-semibold text-[#204195] hover:underline"
                >
                  {t("aiPipeline.ai.viewAll")}
                </Link>
              }
            >
              <AiSummaryFacts summary={pipeline.ai} />
            </AdminSection>
            <AdminSection title={t("aiPipeline.ai.byPurpose")}>
              <AiPurposeTable summary={pipeline.ai} />
            </AdminSection>
            <AdminSection title={t("aiPipeline.ai.recent")}>
              <AiCallTable calls={pipeline.ai.recent} />
            </AdminSection>
          </>
        ) : null}
        {activeTab === "events" ? (
          <AdminSection title={t("aiPipeline.events.title")}>
            <PipelineEvents events={pipeline.events} truncated={pipeline.eventsTruncated} />
          </AdminSection>
        ) : null}
        {activeTab === "plan" ? <AdminSessionPlanClient sessionId={sessionId} embedded /> : null}
      </div>

      <Link href="/admin/interviews" className="inline-block text-sm font-semibold text-[#204195] hover:underline">
        {t("aiPipeline.back")}
      </Link>
    </div>
  );
}
