"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import WorkspacePageHeader from "@features/resume/components/WorkspacePageHeader";
import Pagination from "@components/shared/Pagination";
import { Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { fmt, formatMinutes, localeOf } from "@/i18n/format";
import {
  interviewRuntimeApi,
  type InterviewRuntimeSession,
} from "@/features/interview/services/interviewRuntime.service";
import { endReasonKey } from "@/features/interview/components/ChatInterviewProgress";
import { MODE_NAME_KEY, modeKeyFromRuntime } from "@/features/interview/utils/interviewModes";
import { scoreToLevel, type DebriefLevel } from "@/features/interview/utils/debrief";

type Filter = "all" | "reported" | "open" | "failed";

const PAGE_SIZE = 10;

const LEVEL_TONE: Record<DebriefLevel, string> = {
  1: "bg-[#FDF2F2] text-[#C43B3B]",
  2: "bg-[#FFF8E6] text-[#8A5A00]",
  3: "bg-[#EEF2FD] text-[#204195]",
  4: "bg-[#EAF5EE] text-[#287A4B]",
};

function isFailedStart(session: InterviewRuntimeSession) {
  return session.endReason === "TECHNICAL_FAILURE";
}

function bucketOf(session: InterviewRuntimeSession): Exclude<Filter, "all"> | null {
  if (isFailedStart(session)) return "failed";
  if (session.status !== "CLOSED") return "open";
  if (session.overallScore != null) return "reported";
  return null;
}

export default function InterviewHistoryPage() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [sessions, setSessions] = useState<InterviewRuntimeSession[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const changeFilter = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };

  const load = useCallback(async () => {
    setError(false);
    try {
      setSessions(await interviewRuntimeApi.list());
    } catch {
      setError(true);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: 0, reported: 0, open: 0, failed: 0 };
    sessions?.forEach((session) => {
      result.all += 1;
      const bucket = bucketOf(session);
      if (bucket) result[bucket] += 1;
    });
    return result;
  }, [sessions]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return (sessions ?? []).filter(
      (session) =>
        (filter === "all" || bucketOf(session) === filter) &&
        (!needle || (session.jobTitle ?? "").toLocaleLowerCase().includes(needle)),
    );
  }, [filter, query, sessions]);
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goToPage = (next: number) => {
    setPage(next);
    document.getElementById("history-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Oldest → newest, last 10 reported sessions.
  const trend = useMemo(
    () =>
      (sessions ?? [])
        .filter((session) => session.overallScore != null && !isFailedStart(session))
        .slice(0, 10)
        .reverse(),
    [sessions]
  );

  const open = (session: InterviewRuntimeSession) => {
    if (isFailedStart(session)) router.push("/interview/select");
    else if (session.status === "CLOSED") router.push(`/interview/results/${session.sessionId}`);
    else if (session.experienceType === "question_practice") router.push(`/practice/room/${session.sessionId}`);
    else router.push(`/interview/room/${session.sessionId}`);
  };

  const actionLabel = (session: InterviewRuntimeSession) =>
    isFailedStart(session)
      ? t("userDash.activity.startNew")
      : session.status === "CLOSED"
        ? t("userDash.activity.viewReport")
        : t("userDash.activity.resume");

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: t("history.filter.all") },
    { id: "reported", label: t("history.filter.reported") },
    { id: "open", label: t("history.filter.open") },
    { id: "failed", label: t("history.filter.failed") },
  ];

  if (sessions == null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-label={t("userDash.loading")}>
        <div className="w-full max-w-3xl space-y-3">{[0, 1, 2].map((item) => <div key={item} className="anim-shimmer h-20 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        title={t("history.title")}
        subtitle={t("history.subtitle")}
        aside={
          sessions.length > 0 ? (
            <p className="rounded-2xl border border-[#DCE4F3] bg-white px-4 py-3 text-sm text-[#607096] shadow-xs" role="status">
              {fmt(t("uxWs.history.summary"), { all: counts.all, reported: counts.reported, open: counts.open })}
              {counts.open > 0 ? <span className="mt-0.5 block text-xs">{t("uxWs.history.openHint")}</span> : null}
            </p>
          ) : null
        }
      >
        <button
          type="button"
          onClick={() => router.push("/interview/select")}
          className="inline-flex h-10 items-center rounded-xl bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
        >
          {t("userDash.activity.startNew")}
        </button>
      </WorkspacePageHeader>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FDF2F2] px-4 py-3 text-sm text-[#C43B3B]" role="alert">
          <span>{t("history.error")}</span>
          <button type="button" onClick={() => void load()} className="font-semibold underline">
            {t("history.retry")}
          </button>
        </div>
      )}

      {trend.length >= 2 && (
        <section className="rounded-2xl bg-white p-4 border border-[#DCE4F3] sm:p-5" aria-labelledby="history-trend">
          <h2 id="history-trend" className="text-lg font-bold text-[#14244B]">
            {t("history.trend.title")}
          </h2>
          <ol className="mt-4 flex h-32 items-end gap-1 sm:gap-2" aria-label={t("history.trend.title")}>
            {trend.map((session) => {
              const score = session.overallScore ?? 0;
              return (
                <li key={session.sessionId} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[11px] font-semibold tabular-nums text-[#14244B]">{score.toFixed(1)}</span>
                  <button
                    type="button"
                    onClick={() => open(session)}
                    title={`${session.jobTitle ?? ""} · ${new Date(session.startedAt).toLocaleDateString(localeOf(lang))}`}
                    className="anim-grow-y w-full max-w-10 rounded-t-xl bg-[#204195]/80 transition-colors hover:bg-[#204195]"
                    style={{ height: `${Math.max(4, (score / 10) * 100)}%`, ["--i" as string]: trend.indexOf(session) }}
                    aria-label={`${score.toFixed(1)} / 10`}
                  />
                  <span className="whitespace-nowrap text-[9px] tabular-nums text-[#607096] sm:text-[10px]">
                    {new Date(session.startedAt).toLocaleDateString(localeOf(lang), { day: "2-digit", month: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs leading-5 text-[#607096]">{t("history.trend.caveat")}</p>
        </section>
      )}

      <section aria-label={t("history.title")} id="history-list" className="scroll-mt-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("fixApp.history.filterAria")}>
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => changeFilter(item.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold transition-colors ${
                filter === item.id ? "bg-[#14244B] text-white" : "bg-white text-[#607096] border border-[#DCE4F3] hover:bg-[#F0F4FC] hover:text-[#14244B]"
              }`}
            >
              {item.label}
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${filter === item.id ? "bg-white/20" : "bg-[#F0F4FC]"}`}>
                {counts[item.id]}
              </span>
            </button>
          ))}
        </div>
        {sessions.length > 0 ? (
          <label className="relative block w-full lg:w-72">
            <span className="sr-only">{t("history.search")}</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#9AA6C2]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={t("history.search")}
              className="h-10 w-full rounded-xl border border-[#DCE4F3] bg-white pl-10 pr-4 text-sm text-[#14244B] outline-none transition placeholder:text-[#9AA6C2] focus:border-[#204195] focus:ring-2 focus:ring-[#204195]/15"
            />
          </label>
        ) : null}
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center border border-[#DCE4F3]">
            <p className="mt-3 text-lg font-semibold text-[#14244B]">{t("history.empty.title")}</p>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-[#607096]">{t("history.empty.body")}</p>
            <button
              type="button"
              onClick={() => router.push("/interview/select")}
              className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#204195] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#183275]"
            >
              {t("history.empty.cta")}
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-8 text-center border border-[#DCE4F3]">
            <p className="mt-3 text-sm text-[#607096]">{t("history.filterEmpty")}</p>
            <button
              type="button"
              onClick={() => {
                changeFilter("all");
                setQuery("");
              }}
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#F8FAFC] px-5 text-sm font-semibold text-[#14244B] transition-colors hover:bg-[#F0F4FC]"
            >
              {t("history.filter.all")}
            </button>
          </div>
        ) : (
          <>
          <ul key={`${filter}-${currentPage}`} className="divide-y divide-[#EAEFF8] overflow-hidden rounded-2xl bg-white border border-[#DCE4F3]">
            {pageItems.map((session, index) => {
              const modeKey = modeKeyFromRuntime(session.mode);
              const started = new Date(session.startedAt);
              const minutes =
                session.endedAt != null ? (new Date(session.endedAt).getTime() - started.getTime()) / 60000 : null;
              const level = session.overallScore != null ? scoreToLevel(session.overallScore) : null;
              const status = isFailedStart(session)
                ? t("userDash.activity.failedStart")
                : session.status === "CLOSED"
                  ? t(endReasonKey(session.endReason))
                  : t("userDash.activity.inProgress");
              return (
                <li
                  key={session.sessionId}
                  style={{ ["--i" as string]: index }}
                  className="anim-rise grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3.5 transition-colors hover:bg-[#F8FAFC] sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto_auto] sm:gap-5 sm:px-6"
                >
                  <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#14244B]" title={session.jobTitle || undefined}>
                        {session.jobTitle || "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-[#607096]">
                        {started.toLocaleString(localeOf(lang), { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                        {t(MODE_NAME_KEY[modeKey])}
                        {minutes != null && minutes > 0 ? ` · ${formatMinutes(t, minutes)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 min-w-0 text-xs text-[#607096] [overflow-wrap:anywhere] sm:col-span-1">
                    <p className={isFailedStart(session) ? "font-semibold text-[#C43B3B]" : ""}>{status}</p>
                    {(session.totalTurns ?? 0) > 0 && (
                      <p className="mt-0.5 tabular-nums">
                        {fmt(t("history.answered"), {
                          answered: session.answeredTurns ?? 0,
                          total: session.totalTurns ?? 0,
                        })}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 text-left sm:text-right">
                    {session.overallScore != null && level ? (
                      <div className="flex items-center gap-2 sm:justify-end">
                        <span className="text-base font-semibold tabular-nums text-[#14244B]">
                          {session.overallScore.toFixed(1)}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${LEVEL_TONE[level]}`}>
                          {t(`level.${level}`)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#607096]">{t("history.noScore")}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => open(session)}
                    className="inline-flex h-9 items-center justify-center gap-1 justify-self-end rounded-xl px-4 text-[13px] font-semibold text-[#204195] ring-1 ring-[#C9D7F1] transition-colors hover:bg-[#204195] hover:text-white"
                  >
                    {actionLabel(session)}
                    <span aria-hidden="true">→</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Pagination className="mt-4" page={currentPage} pageSize={PAGE_SIZE} total={visible.length} onPageChange={goToPage} />
          </>
        )}
      </section>
    </div>
  );
}
