"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, ChevronDown, Eye, MessageSquare, Mic, Radio, Search, Video } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { usePolledResource } from "../hooks/usePolledResource";
import { useDebounced, usePipelineSocket } from "../hooks/usePipelineSocket";
import { useNow } from "../hooks/useNow";
import { Pagination } from "@components/shared/Pagination";
import { pipelineService, type LiveBoardGroup, type LiveSession } from "../services/pipeline.service";
import { boardProgress, boardStepLabel, fill, formatClock, liveStateTone, msSince } from "../utils/pipelineFormat";
import { Chip } from "./ui";

/**
 * One dot color per step (and per room state while interviewing), so the
 * board can be scanned by color; the label next to it always says the same.
 */
const DOT = {
  planning: "bg-violet-600",
  selecting: "bg-fuchsia-600",
  not_started: "bg-slate-400",
  ai_speaking: "bg-[#204195]",
  candidate_speaking: "bg-cyan-600",
  answer_pending: "bg-sky-500",
  processing: "bg-indigo-500",
  waiting_answer: "bg-slate-500",
  waiting_long: "bg-amber-500",
  candidate_away: "bg-red-600",
  grading: "bg-teal-600",
  grading_failed: "bg-red-600",
  finished: "bg-emerald-600",
  error: "bg-red-600",
} as const;

function ModeIcon({ mode }: { mode: string | null }) {
  const m = (mode ?? "").toLowerCase();
  const Icon = m === "video" || m === "call" ? Video : m === "voice" ? Mic : MessageSquare;
  return <Icon className="size-3.5 shrink-0 text-[#607096]" aria-label={mode ?? "chat"} />;
}

function tone(session: LiveSession, sinceMs: number | null): keyof typeof DOT {
  const { step, state } = session.step;
  if (step !== "interviewing") return step;
  if (state === "waiting_answer" && liveStateTone(state, sinceMs) === "warn") return "waiting_long";
  if (state === "processing" && liveStateTone(state, sinceMs) === "warn") return "waiting_long";
  return state && state in DOT ? (state as keyof typeof DOT) : "ai_speaking";
}

type Group = LiveBoardGroup;
const PAGE = 30;
const GROUPS: Group[] = ["all", "attention", "interviewing", "preparing", "grading", "finished"];
const GROUP_DOT: Record<Exclude<Group, "all">, string> = {
  attention: "bg-red-600",
  interviewing: "bg-[#204195]",
  preparing: "bg-violet-600",
  grading: "bg-teal-600",
  finished: "bg-emerald-600",
};
function needsAttention(session: LiveSession, sinceMs: number | null): boolean {
  if (session.errors > 0 || session.step.step === "grading_failed") return true;
  return session.step.step === "interviewing" && ["bad", "warn"].includes(liveStateTone(session.step.state, sinceMs));
}

const COLLAPSE_KEY = "admin.liveBoard.collapsed";

function Card({ session, now }: { session: LiveSession & { attention?: boolean }; now: number }) {
  const { t } = useLanguage();
  const sinceMs = msSince(session.step.since, now);
  const running = session.step.step !== "finished" && session.step.step !== "grading_failed";
  const elapsed =
    session.startedAt && running && session.step.step === "interviewing" ? msSince(session.startedAt, now) : session.elapsedMs;
  const progress = boardProgress(session, t);
  const dot = DOT[tone(session, sinceMs)];
  const pulsing = session.step.state === "candidate_speaking" || session.step.state === "ai_speaking";
  const attention = session.attention ?? needsAttention(session, sinceMs);
  const total = session.turns.total || 0;
  const done = Math.min(total, session.turns.answered || 0);
  const canObserve = session.step.step === "interviewing" && ["voice", "video"].includes((session.mode ?? "").toLowerCase());
  const name = session.candidateName || session.candidateEmail || session.id.slice(0, 8);
  return (
    <li
      className={`flex min-w-0 flex-col gap-2 rounded-xl border bg-white p-3 transition-colors hover:border-[#204195]/40 ${
        attention ? "border-[#F3C4C4] bg-[#FFFBFB]" : "border-[#DCE4F3]"
      }`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-[#14244B]">
            <ModeIcon mode={session.mode} />
            <span className="truncate" title={name}>
              {name}
            </span>
          </p>
          <p className="truncate text-[11px] text-[#607096]" title={session.jobTitle ?? undefined}>
            {session.jobTitle ?? "—"}
          </p>
        </div>
        {elapsed !== null && session.step.step === "interviewing" ? (
          <span className="shrink-0 rounded-md bg-[#F0F4FC] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#204195]" title={fill(t("aiPipeline.board.elapsed"), { time: formatClock(elapsed) })}>
            {formatClock(elapsed)}
            {session.budgetMinutes ? <span className="font-normal text-[#607096]">/{session.budgetMinutes}′</span> : null}
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-[#14244B]">
          <span className="relative flex size-2 shrink-0" aria-hidden="true">
            {pulsing ? (
              <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${dot}`} />
            ) : null}
            <span className={`relative inline-flex size-2 rounded-full ${dot}`} />
          </span>
          <span className="min-w-0 truncate font-semibold" title={boardStepLabel(session.step, t)}>
            {boardStepLabel(session.step, t)}
          </span>
          {sinceMs !== null && running ? <span className="shrink-0 tabular-nums text-[#607096]">{formatClock(sinceMs)}</span> : null}
        </p>
        {total ? (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-[#EEF2FD]" aria-hidden="true">
              <span className="block h-full rounded-full bg-[#204195]" style={{ width: `${Math.round((done / total) * 100)}%` }} />
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-[#607096]">{progress}</span>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        {session.errors || session.warnings ? (
          // Errors first (the one to act on); the full count is in the tooltip.
          <span
            className="min-w-0 whitespace-nowrap"
            title={[
              session.errors ? fill(t("aiPipeline.board.errors"), { n: session.errors }) : null,
              session.warnings ? fill(t("aiPipeline.board.warnings"), { n: session.warnings }) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          >
            <Chip tone={session.errors ? "bad" : "warn"}>
              <AlertTriangle className="mr-1 size-3" aria-hidden="true" />
              {session.errors
                ? fill(t("aiPipeline.board.errors"), { n: session.errors })
                : fill(t("aiPipeline.board.warnings"), { n: session.warnings })}
            </Chip>
          </span>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {canObserve ? (
            <Link
              href={`/admin/interviews/${encodeURIComponent(session.id)}?observe=1`}
              className="inline-flex h-7 items-center gap-1 rounded-full bg-[#204195] px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#14244B]"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              {t("observe.joinShort")}
            </Link>
          ) : null}
          <Link
            href={`/admin/interviews/${encodeURIComponent(session.id)}`}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-[#DCE4F3] bg-white px-2.5 text-[11px] font-semibold text-[#204195] transition-colors hover:bg-[#F5F8FF]"
          >
            {t("aiPipeline.board.open")}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </li>
  );
}

/**
 * Interviews running now, as small cards grouped by what they are doing.
 * Filter chips with counts and a search keep a long list scannable; the list
 * scrolls inside the board so the page below stays in reach. Updated when the
 * backend pushes a notice (socket.io), with a poll as a fallback.
 */
export default function LiveSessionsBoard() {
  const { t } = useLanguage();
  const [group, setGroup] = useState<Group>("all");
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const filterKey = `${group}|${q}`;
  const [page, setPage] = useState({ key: filterKey, offset: 0 });
  const offset = page.key === filterKey ? page.offset : 0;
  useEffect(() => {
    const timer = window.setTimeout(() => setQ(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const onPush = useRef<() => void>(() => undefined);
  const { connected } = usePipelineSocket(() => onPush.current());
  // Filtering, sorting and paging happen on the server, so a thousand live rooms cost one page.
  const { state, refresh } = usePolledResource(
    () => pipelineService.live({ group, q, limit: PAGE, offset }),
    () => (connected ? 30_000 : 10_000),
    [group, q, offset],
  );
  const refreshSoon = useDebounced(() => void refresh(), 800);
  useEffect(() => {
    onPush.current = refreshSoon;
  });
  const data = state.status === "ready" ? state.data : null;
  const sessions = useMemo(() => data?.sessions ?? [], [data]);
  const counts = data?.counts;
  // "Tất cả" counts what still needs watching; sessions that just ended normally are only under "Vừa kết thúc".
  const totalLive = counts?.all ?? 0;
  const anything = totalLive + (counts?.finished ?? 0) > 0;
  const now = useNow(1000, sessions.length > 0);
  const listRef = useRef<HTMLUListElement>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, value ? "0" : "1");
      } catch {
        // Storage blocked: the choice lasts for this page only.
      }
      return !value;
    });
  };
  const goTo = (next: number) => {
    setPage({ key: filterKey, offset: (next - 1) * PAGE });
    listRef.current?.scrollTo({ top: 0 });
  };

  return (
    <section aria-labelledby="live-board-title" className="rounded-2xl border border-[#DCE4F3] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="live-board-title" className="flex items-center gap-2 text-base font-bold text-[#14244B]">
          <Radio className="size-4 text-[#204195]" aria-hidden="true" />
          {t("aiPipeline.board.title")}
          {totalLive ? <Chip tone="brand">{fill(t("aiPipeline.board.count"), { n: totalLive })}</Chip> : null}
          {counts?.attention ? <Chip tone="bad">{fill(t("aiPipeline.board.attentionCount"), { n: counts.attention })}</Chip> : null}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-[#607096]">
            {t(connected ? "aiPipeline.push.on" : "aiPipeline.push.offBoard")}
          </span>
          {anything ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-controls="live-board-list"
              className="inline-flex items-center gap-1 rounded-full border border-[#DCE4F3] px-2.5 py-1 text-[11px] font-semibold text-[#607096] hover:text-[#204195]"
            >
              {t(collapsed ? "aiPipeline.board.expand" : "aiPipeline.board.collapse")}
              <ChevronDown className={`size-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {state.status === "loading" ? (
        <div className="mt-3 h-16 animate-pulse rounded-xl bg-[#F1F5F9] motion-reduce:animate-none" role="status">
          <span className="sr-only">{t("aiPipeline.loading")}</span>
        </div>
      ) : state.status === "error" ? (
        <p className="mt-3 text-sm text-[#C43B3B]">{t("aiPipeline.board.error")}</p>
      ) : !anything ? (
        <p className="mt-2 text-sm text-[#607096]">{t("aiPipeline.board.empty")}</p>
      ) : collapsed ? null : (
        <div id="live-board-list">
          <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0" role="group" aria-label={t("aiPipeline.board.filter")}>
              {GROUPS.filter((key) => key === "all" || key === group || (counts?.[key] ?? 0) > 0).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={group === key}
                  onClick={() => setGroup(key)}
                  className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                    group === key ? "bg-[#204195] text-white" : "border border-[#DCE4F3] bg-white text-[#607096] hover:text-[#204195]"
                  }`}
                >
                  {key !== "all" ? <span className={`size-2 rounded-full ${GROUP_DOT[key]}`} aria-hidden="true" /> : null}
                  {t(`aiPipeline.board.group.${key}`)}
                  <span className="tabular-nums opacity-80">{counts?.[key] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8A98B8]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={t("aiPipeline.board.search")}
                placeholder={t("aiPipeline.board.search")}
                className="h-8 w-full rounded-full border border-[#DCE4F3] bg-[#F8FAFC] pl-8 pr-3 text-xs text-[#14244B] placeholder-[#8A98B8] focus:border-[#204195] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {sessions.length ? (
            <ul ref={listRef} className="mt-3 grid max-h-[26rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {sessions.map((session) => (
                <Card key={session.id} session={session} now={now} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-[#DCE4F3] p-3 text-xs text-[#607096]">
              {t(group === "all" && !q ? "aiPipeline.board.noneRunning" : "aiPipeline.board.noMatch")}
            </p>
          )}

          {data && data.total > PAGE ? (
            <Pagination page={Math.floor(offset / PAGE) + 1} pageSize={PAGE} total={data.total} onPageChange={goTo} className="mt-3" />
          ) : null}
        </div>
      )}
    </section>
  );
}
