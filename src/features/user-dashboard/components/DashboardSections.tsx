"use client";

import { useState, type ReactNode } from "react";
import { endReasonKey } from "@/features/interview/components/ChatInterviewProgress";
import { fmt, localeOf } from "@/i18n/format";
import { JobCard, mapJobToJobCard } from "@/components/jobs";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { CachedFit } from "@features/matching/utils/fitCache";
import { cn } from "@/utils";
import CountUp from "@components/shared/CountUp";
import { WEEKLY_GOAL_OPTIONS } from "@features/user-dashboard/hooks/useWeeklyGoal";

export type CompetencyScore = { competency: string; score: number; weight?: number };

export type StoredDashboardSession = {
  sessionId: string;
  jobId?: string | null;
  jobTitle?: string;
  startedAt: string;
  mode: "text" | "voice" | "video";
  status: string;
  experienceType?: string;
  endedAt?: string | null;
  endReason?: string | null;
  /** Latest overall score (0–10); null/undefined when the session wasn't graded. */
  overallScore?: number | null;
  answeredTurns?: number;
  totalTurns?: number;
  /** Per-competency scores of the latest evaluation (names come from the job's requirements). */
  competencyScores?: CompetencyScore[];
};

/** Sessions closed because start-up failed are not practice and are excluded from stats. */
export function isFailedStart(session: StoredDashboardSession): boolean {
  return session.endReason === "TECHNICAL_FAILURE";
}

/** Where a session card leads: a new start, the report, or back into the room. */
export function sessionHref(session: StoredDashboardSession): string {
  if (isFailedStart(session)) return "/interview/select";
  if (session.status === "CLOSED") return `/interview/results/${session.sessionId}`;
  if (session.experienceType === "question_practice") return `/practice/room/${session.sessionId}`;
  return `/interview/room/${session.sessionId}`;
}

type Translate = (key: string) => string;

function modeLabel(mode: StoredDashboardSession["mode"], t: Translate) {
  if (mode === "text") return t("userDash.mode.chat.short");
  if (mode === "voice") return t("userDash.mode.voice.short");
  return t("userDash.mode.video.short");
}

function hasScore(session: StoredDashboardSession): session is StoredDashboardSession & { overallScore: number } {
  return typeof session.overallScore === "number" && Number.isFinite(session.overallScore);
}

const CARD = "rounded-3xl border border-[#DCE4F3] bg-white";

/** Plain section title: no eyebrow pill, no icon. */
export function SectionHeading({
  id,
  title,
  subtitle,
  action,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className="font-display text-[22px] font-semibold leading-tight tracking-tight text-[#14244B] sm:text-[26px]">
          {title}
        </h2>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-6 text-[#607096]">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Small heading inside a card. */
function CardTitle({ id, title, action }: { id: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-base font-semibold text-[#14244B]">{title}</h2>
      {action}
    </div>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 text-[13px] font-semibold text-[#204195] underline-offset-4 hover:underline">
      {children}
    </button>
  );
}

/** This week's practice, honest about zero, with the action that changes it. */
export function WeekStats({
  sessions,
  streak,
  minutes,
  goal,
  onGoalChange,
  onStart,
  t,
}: {
  sessions: number;
  streak: number;
  minutes: number;
  /** Sessions per week the candidate chose; a goal, never a streak penalty. */
  goal: number;
  onGoalChange: (goal: number) => void;
  onStart: () => void;
  t: Translate;
}) {
  const reached = Math.min(sessions, goal);
  const stats = [
    { value: sessions, label: t("userDash.overview.weekSessions") },
    { value: streak, label: t("userDash.overview.streak") },
    { value: minutes, label: t("uxWs.dash.week.minutes") },
  ];
  return (
    <section aria-labelledby="week-title" className="flex h-full flex-col rounded-3xl bg-white/90 p-5 ring-1 ring-[#DCE4F3] sm:p-6">
      <CardTitle id="week-title" title={t("uxWs.dash.week.title")} />
      <dl className="mt-4 grid grid-cols-3 divide-x divide-[#EAEFF8]">
        {stats.map((stat, index) => (
          <div key={stat.label} className={cn("flex min-w-0 flex-col-reverse justify-end", index > 0 && "pl-3 sm:pl-4")}>
            <dt className="mt-1.5 text-[12px] leading-snug text-[#607096]">{stat.label}</dt>
            <dd className="font-display text-[28px] font-semibold leading-none text-[#14244B] tabular-nums"><CountUp value={stat.value} /></dd>
          </div>
        ))}
      </dl>
      <div className="mt-auto border-t border-[#EAEFF8] pt-4">
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <label className="flex items-center gap-1.5 font-semibold text-[#14244B]">
            {t("uxWs.dash.week.goalLabel")}
            <select
              value={goal}
              onChange={(event) => onGoalChange(Number(event.target.value))}
              aria-label={t("uxWs.dash.week.goalAria")}
              className="h-7 rounded-full border-0 bg-[#F0F4FC] px-2.5 text-[12px] font-semibold text-[#204195] outline-none ring-1 ring-[#DCE4F3] focus:ring-2 focus:ring-[#204195]"
            >
              {WEEKLY_GOAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {fmt(t("uxWs.dash.week.goalOption"), { n: option })}
                </option>
              ))}
            </select>
          </label>
          <span className="tabular-nums text-[#607096]">
            {reached}/{goal}
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-[#EAEFF8]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={reached}
          aria-label={t("uxWs.dash.week.goalLabel")}
        >
          <div
            className={cn("anim-grow-x h-full rounded-full", sessions >= goal ? "bg-[#287A4B]" : "bg-[#FCB625]")}
            style={{ width: `${(reached / goal) * 100}%` }}
            key={goal}
          />
        </div>
        <p className="mt-2.5 text-[12px] leading-5 text-[#607096]">
          {sessions >= goal ? (
            t("uxWs.dash.week.goalMet")
          ) : sessions === 0 ? (
            <>
              {t("uxWs.dash.week.zero")} <LinkButton onClick={onStart}>{t("uxWs.dash.week.start")} →</LinkButton>
            </>
          ) : (
            fmt(t("uxWs.dash.week.goalLeft"), { n: goal - sessions })
          )}
        </p>
      </div>
    </section>
  );
}

/**
 * Overall score (0–10) of the latest graded sessions, oldest → newest. One
 * series in brand blue; the newest column is yellow and named in text.
 */
export function ScoreTrend({
  sessions,
  lang,
  onNavigate,
  t,
}: {
  sessions: StoredDashboardSession[];
  lang: string;
  onNavigate: (href: string) => void;
  t: Translate;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const graded = sessions
    .filter(hasScore)
    .slice()
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
    .slice(-8);
  const latest = graded[graded.length - 1];
  const previous = graded[graded.length - 2];
  const best = graded.reduce<number | null>((max, s) => (max == null || s.overallScore > max ? s.overallScore : max), null);
  const average = graded.length ? graded.reduce((sum, s) => sum + s.overallScore, 0) / graded.length : null;
  const delta = latest && previous ? latest.overallScore - previous.overallScore : null;
  const dateOf = (iso: string) => new Date(iso).toLocaleDateString(localeOf(lang), { day: "2-digit", month: "2-digit" });

  return (
    <section aria-labelledby="score-title" className={cn(CARD, "anim-rise flex h-full flex-col p-5 sm:p-6")} style={{ ["--i" as string]: 2 }}>
      <CardTitle
        id="score-title"
        title={t("uxWs.dash.progress.title")}
        action={graded.length ? <LinkButton onClick={() => onNavigate("/dashboard/history")}>{t("userDash.activity.viewAll")} →</LinkButton> : null}
      />
      <p className="mt-0.5 text-[13px] text-[#607096]">{t("uxWs.dash.progress.subtitle")}</p>

      {graded.length === 0 ? (
        <div className="mt-5 flex flex-1 flex-col justify-center rounded-2xl border border-dashed border-[#DCE4F3] bg-[#F8FAFC] px-5 py-8 text-center">
          <p className="font-display text-3xl font-semibold text-[#9AA6C2]">— / 10</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#607096]">{t("uxWs.dash.progress.empty")}</p>
        </div>
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            <div>
              <dt className="text-[12px] text-[#607096]">{t("uxWs.dash.progress.latest")}</dt>
              <dd className="mt-1 font-display text-[28px] font-semibold leading-none text-[#14244B] tabular-nums">
                <CountUp value={latest.overallScore} decimals={1} />
                <span className="ml-1 text-sm font-normal text-[#9AA6C2]">/10</span>
              </dd>
              {delta != null ? (
                <dd className={cn("mt-1 text-[12px] font-semibold", delta > 0 ? "text-[#287A4B]" : delta < 0 ? "text-[#C43B3B]" : "text-[#607096]")}>
                  {fmt(t("uxWs.dash.progress.delta"), { n: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}` })}
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="text-[12px] text-[#607096]">{t("uxWs.dash.progress.best")}</dt>
              <dd className="mt-1 font-display text-[28px] font-semibold leading-none text-[#14244B] tabular-nums">{best != null ? <CountUp value={best} decimals={1} /> : null}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-[#607096]">{t("uxWs.dash.progress.average")}</dt>
              <dd className="mt-1 font-display text-[28px] font-semibold leading-none text-[#14244B] tabular-nums">{average != null ? <CountUp value={average} decimals={1} /> : null}</dd>
            </div>
          </dl>

          <div className="relative mt-6 flex-1">
            {/* Recessive guides at 5 and 10. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40">
              {[10, 5].map((mark) => (
                <div key={mark} className="absolute inset-x-0 flex items-center gap-2" style={{ top: `${(1 - mark / 10) * 100}%` }}>
                  <span className="w-5 text-right text-[10px] tabular-nums text-[#9AA6C2]">{mark}</span>
                  <span className="h-px flex-1 bg-[#EAEFF8]" />
                </div>
              ))}
            </div>
            <ol aria-label={t("uxWs.dash.progress.chartAria")} className="relative ml-7 flex h-40 items-end gap-2 border-b border-[#DCE4F3] sm:gap-3">
              {graded.map((session) => {
                const isLatest = session === latest;
                const label = `${dateOf(session.startedAt)} · ${session.jobTitle ?? t("userDash.activity.eyebrow")} · ${session.overallScore.toFixed(1)}/10`;
                return (
                  <li key={session.sessionId} className="relative flex h-full flex-1 items-end justify-center">
                    <button
                      type="button"
                      onClick={() => onNavigate(sessionHref(session))}
                      onMouseEnter={() => setHovered(session.sessionId)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(session.sessionId)}
                      onBlur={() => setHovered(null)}
                      aria-label={label}
                      className="group flex h-full w-full max-w-10 items-end justify-center rounded-t-md outline-offset-2"
                    >
                      <span
                        className={cn(
                          "anim-grow-y w-full max-w-7 rounded-t-[4px] transition-opacity",
                          isLatest ? "bg-[#FCB625]" : "bg-[#204195]",
                          hovered && hovered !== session.sessionId && "opacity-40",
                        )}
                        style={{ height: `${Math.max(2, (session.overallScore / 10) * 100)}%`, ["--i" as string]: graded.indexOf(session) }}
                      />
                    </button>
                    {hovered === session.sessionId ? (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-[#14244B] px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg"
                      >
                        {label}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <div aria-hidden="true" className="ml-7 mt-1.5 flex gap-2 sm:gap-3">
              {graded.map((session) => (
                <span key={session.sessionId} className="flex-1 text-center text-[10px] tabular-nums text-[#9AA6C2]">
                  {dateOf(session.startedAt)}
                </span>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#607096]">
              <span aria-hidden="true" className="inline-block size-2.5 rounded-sm bg-[#FCB625]" />
              {t("uxWs.dash.progress.latestLegend")}
            </p>
          </div>
        </>
      )}
    </section>
  );
}

/** The three newest sessions, each with its state, score and one action. */
export function RecentActivity({
  sessions,
  lang,
  onNavigate,
  t,
}: {
  sessions: StoredDashboardSession[];
  lang: string;
  onNavigate: (href: string) => void;
  t: Translate;
}) {
  return (
    <section aria-labelledby="activity-title" className={cn(CARD, "anim-rise flex h-full flex-col p-5 sm:p-6")} style={{ ["--i" as string]: 3 }}>
      <CardTitle
        id="activity-title"
        title={t("userDash.activity.title")}
        action={<LinkButton onClick={() => onNavigate("/dashboard/history")}>{t("userDash.activity.viewAll")} →</LinkButton>}
      />
      <ol className="mt-3 flex-1 divide-y divide-[#EAEFF8]">
        {sessions.slice(0, 4).map((session) => {
          const failed = isFailedStart(session);
          const closed = session.status === "CLOSED";
          const state = failed
            ? t("userDash.activity.failedStart")
            : closed
              ? t(endReasonKey(session.endReason))
              : t("userDash.activity.inProgress");
          return (
            <li key={session.sessionId}>
              <button
                type="button"
                onClick={() => onNavigate(sessionHref(session))}
                className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-[#F8FAFC]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#14244B]">{session.jobTitle || t("userDash.activity.eyebrow")}</span>
                  <span className="mt-0.5 block truncate text-xs text-[#607096]">
                    {new Date(session.startedAt).toLocaleDateString(localeOf(lang), { day: "2-digit", month: "2-digit", year: "numeric" })}
                    {" · "}
                    {modeLabel(session.mode, t)}
                    {" · "}
                    <span className={cn(!closed && !failed && "font-semibold text-[#8A5A00]")}>{state}</span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {hasScore(session) ? (
                    <span className="font-display text-lg font-semibold tabular-nums text-[#14244B]">
                      {session.overallScore.toFixed(1)}
                      <span className="text-xs font-normal text-[#9AA6C2]">/10</span>
                    </span>
                  ) : (
                    <span className="text-[12px] font-semibold text-[#204195]">
                      {failed ? t("userDash.activity.startNew") : closed ? t("userDash.activity.viewReport") : t("userDash.activity.resume")} →
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Open roles, rendered with the same `JobCard` as the jobs page (saved jobs
 * first) so the overview and the jobs page always look and behave alike.
 */
export function SuggestedJobs({
  profiles,
  savedJobIds,
  fits,
  onToggleSave,
  onNavigate,
  onPractice,
  t,
}: {
  profiles: JobProfile[];
  savedJobIds: Set<string>;
  fits: Record<string, CachedFit>;
  onToggleSave: (jobId: string, currentSaved: boolean) => void;
  onNavigate: (href: string) => void;
  onPractice: (profile: JobProfile) => void;
  t: Translate;
}) {
  const ordered = [...profiles].sort((a, b) => Number(savedJobIds.has(b.id)) - Number(savedJobIds.has(a.id)));
  return (
    <section aria-labelledby="jobs-title" className="anim-rise" style={{ ["--i" as string]: 4 }}>
      <SectionHeading
        id="jobs-title"
        title={t("uxWs.dash.jobs.title")}
        subtitle={t("uxWs.dash.jobs.subtitle")}
        action={<LinkButton onClick={() => onNavigate("/dashboard/jobs")}>{t("userDash.jobProfiles.viewAll")} →</LinkButton>}
      />
      {ordered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.slice(0, 3).map((profile) => (
            <JobCard
              key={profile.id}
              job={mapJobToJobCard(profile, { savedJobIds, fit: fits[profile.id] })}
              onToggleSave={onToggleSave}
              onInterview={() => onPractice(profile)}
            />
          ))}
        </div>
      ) : (
        <div className={cn(CARD, "p-8 text-center")}>
          <h3 className="text-lg font-semibold text-[#14244B]">{t("userDash.jobs.emptyTitle")}</h3>
          <p className="mx-auto mt-1 max-w-lg text-sm text-[#607096]">{t("userDash.jobs.emptyBody")}</p>
          <div className="mt-4">
            <LinkButton onClick={() => onNavigate("/dashboard/jobs")}>{t("userDash.jobs.browse")} →</LinkButton>
          </div>
        </div>
      )}
    </section>
  );
}

export type OverviewTile = {
  key: string;
  /** The nav section this tile summarises. */
  section: string;
  value: string;
  /** When set, the value counts up once (it is then rendered from these numbers). */
  count?: { value: number; decimals?: number; suffix?: string };
  caption: string;
  /** One short line: the state or what to do next. */
  note: string;
  noteTone?: "neutral" | "good" | "bad" | "attention";
  href: string;
};

/** One tile per nav section, so the top of the page sums up the whole workspace. */
export function OverviewTiles({ tiles, onNavigate, label }: { tiles: OverviewTile[]; onNavigate: (href: string) => void; label: string }) {
  return (
    <section aria-label={label}>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {tiles.map((tile, index) => (
          <li key={tile.key} className="anim-rise" style={{ ["--i" as string]: index + 1 }}>
            <button
              type="button"
              onClick={() => onNavigate(tile.href)}
              className="group flex h-full w-full flex-col rounded-3xl border border-[#DCE4F3] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#204195]/40 hover:shadow-[0_18px_40px_-28px_rgba(20,36,75,0.5)] sm:p-5"
            >
              <span className="flex items-center justify-between gap-2 text-[12px] font-semibold text-[#204195]">
                {tile.section}
                <span aria-hidden="true" className="text-[#9AA6C2] transition-transform group-hover:translate-x-0.5 group-hover:text-[#204195]">→</span>
              </span>
              <span className="mt-3 font-display text-[30px] font-semibold leading-none text-[#14244B] tabular-nums">
                {tile.count ? <CountUp value={tile.count.value} decimals={tile.count.decimals} suffix={tile.count.suffix} /> : tile.value}
              </span>
              <span className="mt-1.5 text-[13px] text-[#607096]">{tile.caption}</span>
              <span
                className={cn(
                  "mt-3 border-t border-[#EAEFF8] pt-2.5 text-[12px] font-medium leading-snug",
                  tile.noteTone === "good" && "text-[#287A4B]",
                  tile.noteTone === "bad" && "text-[#C43B3B]",
                  tile.noteTone === "attention" && "text-[#8A5A00]",
                  (!tile.noteTone || tile.noteTone === "neutral") && "text-[#607096]",
                )}
              >
                {tile.note}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The default bucket for turns without a planned competency; never named as a weak skill. */
const DEFAULT_COMPETENCY = "Chuyên môn";

/**
 * Competencies of the latest graded session, weakest first, with the change
 * since the previous graded session for the same job. Names come from each
 * job's requirements, so they are only compared within one job.
 */
export function CompetencyFocus({
  sessions,
  onPractice,
  t,
}: {
  /** Newest first. */
  sessions: StoredDashboardSession[];
  onPractice: (job: { id: string; title: string }) => void;
  t: Translate;
}) {
  const scored = (session: StoredDashboardSession) =>
    (session.competencyScores ?? []).filter((item) => (item.weight ?? 1) > 0 && Number.isFinite(item.score));
  const latest = sessions.find((session) => hasScore(session) && scored(session).length > 0);
  if (!latest) return null;

  const items = scored(latest).slice().sort((a, b) => a.score - b.score);
  const named = items.filter((item) => item.competency !== DEFAULT_COMPETENCY);
  const weakest = (named.length ? named : items)[0];
  const previous = latest.jobId
    ? sessions.find(
        (session) =>
          session !== latest &&
          session.jobId === latest.jobId &&
          new Date(session.startedAt) < new Date(latest.startedAt) &&
          scored(session).length > 0,
      )
    : undefined;
  const before = new Map((previous ? scored(previous) : []).map((item) => [item.competency, item.score]));

  return (
    <section aria-labelledby="competency-title" className={cn(CARD, "anim-rise flex h-full flex-col p-5 sm:p-6")} style={{ ["--i" as string]: 3 }}>
      <CardTitle id="competency-title" title={t("uxWs.dash.comp.title")} />
      <p className="mt-0.5 truncate text-[13px] text-[#607096]">
        {fmt(t("uxWs.dash.comp.subtitle"), { role: latest.jobTitle || t("userDash.activity.eyebrow") })}
      </p>

      <div className="mt-4 rounded-2xl bg-[#FFF8E6] p-4 ring-1 ring-[#FCB625]/40">
        <p className="text-[12px] font-semibold text-[#204195]">{t("uxWs.dash.comp.weakest")}</p>
        <p className="mt-1 flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-[17px] font-semibold text-[#14244B]">{weakest.competency}</span>
          <span className="shrink-0 font-display text-xl font-semibold tabular-nums text-[#14244B]">
            {weakest.score.toFixed(1)}
            <span className="text-xs font-normal text-[#9AA6C2]">/10</span>
          </span>
        </p>
        {latest.jobId ? (
          <button
            type="button"
            onClick={() => onPractice({ id: latest.jobId as string, title: latest.jobTitle || t("userDash.activity.eyebrow") })}
            className="mt-3 inline-flex h-9 items-center rounded-full bg-[#204195] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#183275]"
          >
            {t("uxWs.dash.comp.practice")}
          </button>
        ) : null}
        <p className="mt-2 text-[12px] leading-5 text-[#607096]">{t("uxWs.dash.comp.practiceNote")}</p>
      </div>

      <ul className="mt-4 flex-1 space-y-3">
        {items.slice(0, 5).map((item) => {
          const prev = before.get(item.competency);
          const delta = prev != null ? item.score - prev : null;
          return (
            <li key={item.competency}>
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <span className="min-w-0 truncate font-medium text-[#14244B]">{item.competency}</span>
                <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                  {delta != null && delta !== 0 ? (
                    <span className={cn("text-[11px] font-semibold", delta > 0 ? "text-[#287A4B]" : "text-[#C43B3B]")}>
                      {delta > 0 ? "+" : ""}
                      {delta.toFixed(1)}
                    </span>
                  ) : null}
                  <span className="font-semibold text-[#14244B]">{item.score.toFixed(1)}</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EAEFF8]">
                <div
                  className={cn("anim-grow-x h-full rounded-[4px]", item === weakest ? "bg-[#FCB625]" : "bg-[#204195]")}
                  style={{ width: `${Math.max(2, (item.score / 10) * 100)}%`, ["--i" as string]: items.indexOf(item) }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {previous ? <p className="mt-3 text-[12px] text-[#607096]">{t("uxWs.dash.comp.deltaNote")}</p> : null}
    </section>
  );
}

/** An open session older than a day: resume it, or close it (with a confirmation). */
export function StaleSessionNotice({
  session,
  lang,
  onResume,
  onClose,
  t,
}: {
  session: StoredDashboardSession;
  lang: string;
  onResume: () => void;
  onClose: () => void;
  t: Translate;
}) {
  const answered = session.answeredTurns ?? 0;
  const started = new Date(session.startedAt).toLocaleString(localeOf(lang), { dateStyle: "medium", timeStyle: "short" });
  return (
    <div role="status" className="anim-rise flex flex-col gap-3 rounded-3xl border border-[#FCB625]/50 bg-[#FFF8E6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#14244B]">
          {fmt(t("uxWs.dash.stale.title"), { role: session.jobTitle || t("userDash.activity.eyebrow"), date: started })}
        </p>
        <p className="mt-0.5 text-[13px] text-[#607096]">
          {answered > 0
            ? fmt(t("uxWs.dash.stale.bodyAnswered"), { n: answered, total: session.totalTurns ?? answered })
            : t("uxWs.dash.stale.bodyEmpty")}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onResume}
          className="inline-flex h-9 items-center rounded-full bg-[#204195] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#183275]"
        >
          {t("uxWs.dash.stale.resume")}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#14244B] ring-1 ring-[#DCE4F3] transition-colors hover:bg-[#F8FAFC]"
        >
          {answered > 0 ? t("uxWs.dash.stale.closeReport") : t("uxWs.dash.stale.close")}
        </button>
      </div>
    </div>
  );
}
