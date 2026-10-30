"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pagination } from "@components/shared/Pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ShieldAlert, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import AdminPageHeader from "@features/admin/components/primitives/AdminPageHeader";
import AdminSection from "@features/admin/components/primitives/AdminSection";
import AdminEmptyState from "@features/admin/components/primitives/AdminEmptyState";
import { usePolledResource } from "../hooks/usePolledResource";
import { pipelineService } from "../services/pipeline.service";
import { fill } from "../utils/pipelineFormat";
import { AiCallTable, AiPurposeTable, AiSummaryFacts } from "./AiCallTables";

const PAGE = 20;
const DAY_OPTIONS = [1, 7, 30];
type StatusFilter = "all" | "ok" | "error";

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active ? "bg-[#204195] text-white" : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"
      }`}
    >
      {children}
    </button>
  );
}

/** Every model call (ai_call_logs): filters in one row, summary, then the list. */
export default function AiCallsClient() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("sessionId") ?? undefined;
  const [status, setStatus] = useState<StatusFilter>(
    params.get("status") === "error" ? "error" : params.get("status") === "ok" ? "ok" : "all",
  );
  const [days, setDays] = useState(7);
  const [query, setQuery] = useState("");
  const [purpose, setPurpose] = useState("");
  // The page offset belongs to one set of filters: changing a filter starts again at the first page.
  const filterKey = `${status}|${days}|${purpose}|${sessionId ?? ""}`;
  const [page, setPage] = useState({ key: filterKey, offset: 0 });
  const offset = page.key === filterKey ? page.offset : 0;
  const setOffset = (next: number) => setPage({ key: filterKey, offset: next });

  useEffect(() => {
    const timer = window.setTimeout(() => setPurpose(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const { state, refresh } = usePolledResource(
    () =>
      pipelineService.calls({
        purpose: purpose || undefined,
        status: status === "all" ? undefined : status,
        sessionId,
        days,
        limit: PAGE,
        offset,
      }),
    () => null,
    [purpose, status, sessionId, days, offset],
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("aiPipeline.calls.title")}
        description={t("aiPipeline.calls.subtitle")}
        breadcrumbs={[
          { label: "Quản trị", href: "/admin/dashboard" },
          { label: t("admin.sidebar.aiOverview"), href: "/admin/ai" },
          { label: t("admin.sidebar.aiTraces") },
        ]}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-[#DCE4F3] bg-[#F8FAFC] p-4 text-xs text-[#607096]">
        <ShieldAlert className="size-4 shrink-0 text-[#204195]" aria-hidden="true" />
        <p>{t("aiPipeline.privacy")}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4F3] bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#607096]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t("aiPipeline.calls.search")}
            placeholder={t("aiPipeline.calls.search")}
            className="w-full rounded-xl border border-[#DCE4F3] bg-[#F8FAFC] py-2 pl-9 pr-4 text-xs font-medium text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {sessionId ? (
            <button
              type="button"
              onClick={() => router.push("/admin/ai/traces")}
              className="inline-flex items-center gap-1 rounded-xl border border-[#204195]/30 bg-[#EEF2FD] px-3 py-1.5 font-mono text-xs font-semibold text-[#204195]"
            >
              {t("aiPipeline.calls.session")}: {sessionId.slice(0, 8)}
              <X className="size-3" aria-hidden="true" />
            </button>
          ) : null}
          <Toggle active={status === "all"} onClick={() => setStatus("all")}>
            {t("aiPipeline.calls.all")}
          </Toggle>
          <Toggle active={status === "ok"} onClick={() => setStatus("ok")}>
            {t("aiPipeline.calls.onlyOk")}
          </Toggle>
          <Toggle active={status === "error"} onClick={() => setStatus("error")}>
            {t("aiPipeline.calls.onlyErrors")}
          </Toggle>
          <span className="mx-1 h-5 w-px bg-[#DCE4F3]" aria-hidden="true" />
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
          title={t(state.httpStatus === 503 ? "aiPipeline.notMigrated" : "aiPipeline.loadError")}
          description=""
          onRetry={() => void refresh()}
        />
      ) : (
        <>
          <AdminSection title={t("aiPipeline.ai.title")}>
            <AiSummaryFacts summary={state.data.summary} />
          </AdminSection>
          <AdminSection title={t("aiPipeline.ai.byPurpose")}>
            <AiPurposeTable summary={state.data.summary} />
          </AdminSection>
          <AdminSection title={t("aiPipeline.ai.recent")}>
            <AiCallTable calls={state.data.calls} showSession pageSize={PAGE} />
            {state.data.total > PAGE ? (
              <Pagination
                page={Math.floor(offset / PAGE) + 1}
                pageSize={PAGE}
                total={state.data.total}
                onPageChange={(next) => setOffset((next - 1) * PAGE)}
                className="mt-4"
              />
            ) : null}
          </AdminSection>
        </>
      )}
      {sessionId ? (
        <Link href={`/admin/interviews/${encodeURIComponent(sessionId)}`} className="text-sm font-semibold text-[#204195] hover:underline">
          {t("aiPipeline.calls.openSession")}
        </Link>
      ) : null}
    </div>
  );
}
