"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Flame, Play } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { localeOf } from "@/i18n/format";
import { cn } from "@/utils";
import type { GapItem, JobReadiness, PracticeProgress, ProgressSession, RoomName, RoundReadiness } from "../services/progress.service";
import { fill, longDate, percent, shortDate, trendLabel } from "../utils/progressFormat";
import { adviceRoundOf, dueOf, lastResumeFor, practiceHref, readyCountOf, recentRecords, ROUND_READY_LEVEL } from "../utils/progressModel";
import {
  conclusionOf,
  defaultRoom,
  isRepeated,
  latestFeedbackOf,
  plotPoints,
  repeatedGapOf,
  roomCounts,
  roomProgressOf,
  ROOMS,
  roundsToPractise,
  yOf,
} from "../utils/progressV3";
import { ladderRule, recordText } from "./ProgressOverview";

/*
 * Progress page v3 (design 29/10, DOC_AND_PLAN PROGRESS_PAGE_V3_DESIGN).
 * Top to bottom: the room (Chat or Voice), what got better and where the
 * candidate stands, the one thing to practise today, the feedback of the
 * latest session, then the detail on demand. Plain surfaces, one dark button.
 */

type Translate = (key: string) => string;
type Tab = "topics" | "answers" | "knowledge" | "history";

const card = "min-w-0 rounded-[10px] border border-[#E4E4E0] bg-white p-5 sm:p-6 [overflow-wrap:anywhere]";
const darkButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#204195] px-5 text-base font-bold text-white hover:bg-[#183275] active:bg-[#122557] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#204195]";
const lightButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-4 text-[15px] font-semibold text-[#204195] hover:border-[#204195] hover:bg-[#F0F4FC]";
const muted = "text-[#4A505C]";
/** Colour of a score on the 10-point scale: green from 7 (the target), amber from 5.5 (the floor), red below. */
function scoreTone(score: number) {
  if (score >= 7) return { text: "text-[#1E6B34]", chip: "bg-[#E3F4E7] text-[#1E6B34]" };
  if (score >= 5.5) return { text: "text-[#8A5300]", chip: "bg-[#FDF0D5] text-[#8A5300]" };
  return { text: "text-[#B42318]", chip: "bg-[#FDE8E6] text-[#B42318]" };
}
const scoreChip = "inline-flex items-center rounded-md px-2 py-0.5 font-semibold tabular-nums";
const PIP = ["#A8A8A2", "#E0A030", "#2F8A47", "#204195"];
const LEVEL_TEXT = ["#4A505C", "#8A5300", "#1E6B34", "#204195"];

function areaName(area: string | undefined, t: Translate): string {
  return t(`practiceProgress.area.${area ?? "other"}`);
}

function levelName(level: number, t: Translate): string {
  return t(`practiceProgress.ladder.level.${level}`);
}

function roomLabel(session: ProgressSession, t: Translate): string {
  if (session.room === "chat") return t("practiceProgress.v3.room.chat");
  return session.camera ? t("practiceProgress.v3.room.voiceCamera") : t("practiceProgress.v3.room.voice");
}

export function ProgressV3({
  progress,
  onGoal,
  savingGoal,
}: {
  progress: PracticeProgress;
  onGoal: (goal: number) => void;
  savingGoal: boolean;
}) {
  const { t } = useLanguage();
  const [room, setRoom] = useState<RoomName>(() => defaultRoom(progress));
  const counts = roomCounts(progress);
  const data = useMemo(() => roomProgressOf(progress, room), [progress, room]);
  const jobs = data.readiness ?? [];
  const [jobId, setJobId] = useState<string | null>(null);
  const job = jobs.find((item) => item.jobId === jobId) ?? jobs[0] ?? null;
  const gaps = useMemo(
    () => (data.gaps?.open ?? []).filter((gap) => !job || gap.lastSeen.jobId === job.jobId),
    [data.gaps, job],
  );
  const [tab, setTab] = useState<Tab>("topics");
  const [openArea, setOpenArea] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  /** "Cần luyện thêm": open the topic in the detail, scroll to it and light it up for a moment. */
  const goTopic = (area: string) => {
    setTab("topics");
    setOpenArea(area);
    setFlash(area);
    window.setTimeout(() => {
      const row = document.getElementById(`topic-${area}`);
      row?.scrollIntoView({ behavior: "smooth", block: "start" });
      row?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    }, 60);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1800);
  };

  const other: RoomName = room === "chat" ? "voice" : "chat";
  return (
    <div className="space-y-5 text-[#16181D]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t("practiceProgress.v3.room.label")} className="flex flex-wrap gap-2">
          {ROOMS.map((name) => {
            const on = name === room;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setRoom(name)}
                className={cn(
                  "min-h-12 rounded-xl border px-4 text-left text-base font-semibold",
                  on ? "border-[#204195] bg-[#204195] text-white" : "border-[#DCE4F3] bg-white text-[#204195] hover:border-[#204195] hover:bg-[#F0F4FC]",
                )}
              >
                {t(`practiceProgress.v3.room.${name}`)}
                <span className={cn("ml-2 text-sm font-medium", on ? "text-white/85" : muted)}>
                  {name === "voice" && counts.camera > 0
                    ? fill(t("practiceProgress.v3.room.countCamera"), { n: counts.voice, camera: counts.camera })
                    : fill(t("practiceProgress.v3.room.count"), { n: counts[name] })}
                </span>
              </button>
            );
          })}
        </div>
        {jobs.length > 1 && job && (
          <label className="flex w-full flex-col gap-1 text-sm font-semibold text-[#4A505C] sm:w-auto">
            {t("practiceProgress.v2.job")}
            <select
              className="h-11 w-full min-w-0 rounded-xl border border-[#DCE4F3] bg-white px-3 text-[15px] font-semibold text-[#14244B] focus:border-[#204195] sm:w-72"
              value={job.jobId}
              onChange={(event) => setJobId(event.target.value)}
            >
              {jobs.map((choice) => (
                <option key={choice.jobId} value={choice.jobId}>
                  {choice.jobTitle ?? choice.jobId}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {counts[room] === 0 || !job ? (
        <EmptyRoom room={room} other={other} otherCount={counts[other]} onSwitch={() => setRoom(other)} />
      ) : (
        <>
          <StatusCard progress={data} job={job} onGoal={onGoal} savingGoal={savingGoal} onTopic={goTopic} />
          <TodayCard progress={progress} job={job} gaps={gaps} />
          <FeedbackCard progress={data} />
          <div className="flex flex-wrap items-start gap-5">
            <DetailCard
              progress={data}
              job={job}
              tab={tab}
              onTab={setTab}
              openArea={openArea}
              onOpenArea={setOpenArea}
              flash={flash}
              room={room}
            />
            <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
              <DueList progress={progress} gaps={gaps} />
              <RecordsList progress={data} jobId={job.jobId} />
            </aside>
          </div>
          <HowItWorks k={data.overview?.window ?? 0} />
        </>
      )}
    </div>
  );
}

function EmptyRoom({ room, other, otherCount, onSwitch }: { room: RoomName; other: RoomName; otherCount: number; onSwitch: () => void }) {
  const { t } = useLanguage();
  const name = t(`practiceProgress.v3.room.${room}`);
  return (
    <section className={cn(card, "space-y-4 border-l-4 border-l-[#204195]")}>
      <h2 className="text-2xl font-semibold">{fill(t("practiceProgress.v3.empty.title"), { room: name })}</h2>
      <p className="text-[17px] text-[#2A2F38]">
        {otherCount > 0
          ? fill(t("practiceProgress.v3.empty.desc"), { other: t(`practiceProgress.v3.room.${other}`), n: otherCount })
          : t("practiceProgress.v3.empty.first")}
      </p>
      <Link href="/interview/select" className={cn(darkButton, "w-full")}>
        <Play className="size-4" aria-hidden="true" />
        {fill(t("practiceProgress.v3.empty.cta"), { room: name })}
      </Link>
      {otherCount > 0 && (
        <button type="button" onClick={onSwitch} className="min-h-11 text-[17px] font-semibold text-[#204195] underline">
          {fill(t("practiceProgress.v3.empty.switch"), { other: t(`practiceProgress.v3.room.${other}`) })}
        </button>
      )}
    </section>
  );
}

function StatusCard({
  progress,
  job,
  onGoal,
  savingGoal,
  onTopic,
}: {
  progress: PracticeProgress;
  job: JobReadiness;
  onGoal: (goal: number) => void;
  savingGoal: boolean;
  onTopic: (area: string) => void;
}) {
  const { t } = useLanguage();
  const [editGoal, setEditGoal] = useState(false);
  const overview = progress.overview;
  const conclusion = conclusionOf(job, overview);
  const ready = readyCountOf(job);
  const total = job.rounds.length;
  const toPractise = roundsToPractise(job);
  const streak = progress.streak;
  const compared = Boolean(overview && overview.window > 0 && overview.change !== null);
  const change = overview?.change ?? 0;
  const tile = "flex min-w-0 flex-col gap-1.5 rounded-lg border p-4";
  return (
    <section className={cn(card, "space-y-4")} aria-label={t("practiceProgress.v3.status.label")}>
      {conclusion && (
        <p className={cn("text-xl font-semibold leading-snug", conclusion.kind === "down" ? "text-[#B42318]" : "text-[#1E6B34]")}>
          <span aria-hidden="true" className="mr-1.5">{conclusion.kind === "down" ? "▼" : "▲"}</span>
          {conclusion.kind === "up"
            ? fill(t("practiceProgress.v3.status.up"), { round: areaName(conclusion.round.area, t) })
            : conclusion.round
              ? fill(t("practiceProgress.v3.status.downRound"), { round: areaName(conclusion.round.area, t) })
              : t("practiceProgress.v3.status.down")}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Average now, and how it moved since the first sessions */}
        <div className={cn(tile, "border-[#E4E4E0] bg-white")}>
          <p className={cn("text-sm font-medium", muted)}>{t("practiceProgress.v3.status.avg")}</p>
          {compared && overview ? (
            <>
              <p className="flex flex-wrap items-baseline gap-2">
                <span className={cn("text-[32px] font-bold leading-none tabular-nums", scoreTone(overview.recent ?? 0).text)}>
                  {overview.recent?.toFixed(1)}
                </span>
                <span
                  className={cn(
                    scoreChip,
                    "text-sm",
                    change <= -0.5 ? "bg-[#FDE8E6] text-[#B42318]" : change >= 0.5 ? "bg-[#E3F4E7] text-[#1E6B34]" : "bg-[#F0F0ED] text-[#4A505C]",
                  )}
                >
                  {change >= 0.5 ? "▲ " : change <= -0.5 ? "▼ " : ""}
                  {`${change > 0 ? "+" : ""}${change.toFixed(1)}`}
                </span>
              </p>
              <p className={cn("text-sm", muted)}>
                {fill(t("practiceProgress.v3.status.since"), { k: overview.window, start: overview.start?.toFixed(1) ?? "—" })}
              </p>
            </>
          ) : (
            <p className={cn("text-sm", muted)}>{fill(t("practiceProgress.v3.status.few"), { n: overview?.sessions ?? 0 })}</p>
          )}
        </div>

        {/* Topics at the target */}
        <div className={cn(tile, "border-[#CBE6D2] bg-[#F1F8F3]")}>
          <p className={cn("text-sm font-medium", muted)}>{t("practiceProgress.v3.status.readyShort")}</p>
          <p className="text-[32px] font-bold leading-none tabular-nums text-[#1E6B34]">
            {ready}
            <span className="text-lg font-semibold text-[#4A505C]">/{total}</span>
          </p>
          <div className="mt-1 flex gap-1" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={cn("h-2 flex-1 rounded-sm", i < ready ? "bg-[#2F8A47]" : "bg-[#D5E3D9]")} />
            ))}
          </div>
        </div>

        {/* This week against the goal, and the weekly chain */}
        <div className={cn(tile, "border-[#CFDCF5] bg-[#EEF3FD]")}>
          <p className="flex items-center justify-between gap-2">
            <span className={cn("text-sm font-medium", muted)}>{t("practiceProgress.v3.week.short")}</span>
            <button
              type="button"
              onClick={() => setEditGoal((value) => !value)}
              aria-expanded={editGoal}
              className="text-sm font-semibold text-[#204195] underline-offset-4 hover:underline"
            >
              {fill(t("practiceProgress.v3.week.edit"), { n: streak.goal })}
            </button>
          </p>
          <p className="flex items-baseline gap-1.5">
            <span className="text-[32px] font-bold leading-none tabular-nums text-[#204195]">
              {streak.thisWeekCount}
              <span className="text-lg font-semibold text-[#4A505C]">/{streak.goal}</span>
            </span>
            <span className={cn("text-sm", muted)}>{t("practiceProgress.v3.week.unit")}</span>
            {streak.thisWeekCount >= streak.goal && <span className={cn(scoreChip, "bg-[#E3F4E7] text-sm text-[#1E6B34]")}>✓</span>}
          </p>
          {editGoal ? (
            <label className="flex items-center gap-2 text-sm text-[#2A2F38]">
              {t("practiceProgress.v3.week.perWeek")}
              <select
                className="h-9 rounded-lg border border-[#DCE4F3] bg-white px-2 font-semibold text-[#14244B] focus:border-[#204195]"
                value={streak.goal}
                disabled={savingGoal}
                onChange={(event) => onGoal(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          ) : streak.weeks > 0 ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-[#C2410C]">
              <Flame className="size-4 fill-[#F97316] text-[#EA580C]" aria-hidden="true" />
              {fill(t("practiceProgress.v3.week.streak"), { n: streak.weeks })}
            </p>
          ) : null}
        </div>
      </div>

      {toPractise.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[15px] font-semibold text-[#8A5300]">{t("practiceProgress.v3.status.toPractise")}</span>
          {toPractise.map((round) => (
            <a
              key={round.area}
              href={`#topic-${round.area}`}
              onClick={(event) => {
                event.preventDefault();
                onTopic(round.area);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#DCE4F3] bg-white px-3 text-[15px] font-semibold text-[#204195] no-underline hover:border-[#204195] hover:bg-[#F0F4FC]"
            >
              <span aria-hidden="true" className="size-2 rounded-full bg-[#E0A030]" />
              {areaName(round.area, t)}
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function TodayCard({ progress, job, gaps }: { progress: PracticeProgress; job: JobReadiness; gaps: GapItem[] }) {
  const { t } = useLanguage();
  const advice = adviceRoundOf(job);
  const repeated = repeatedGapOf(advice?.round ?? null, gaps);
  const resume = lastResumeFor(progress, job.jobId);
  const href = practiceHref(
    job.jobId,
    resume,
    advice?.round.area,
    isRepeated(repeated) ? { conceptId: repeated.skillKey, skill: repeated.skill } : null,
  );
  const why = !advice
    ? t("practiceProgress.v3.today.topWhy")
    : isRepeated(repeated)
      ? fill(t("practiceProgress.v3.today.repeat"), { point: repeated.point, missed: repeated.timesMissed, asked: repeated.timesAsked })
      : advice.reason === "risk"
        ? fill(t("practiceProgress.v3.today.risk"), { round: areaName(advice.round.area, t) })
        : ladderRule(advice.round, t);
  return (
    <section className={cn(card, "flex flex-wrap items-center gap-x-6 gap-y-4 border-[#CFDCF5] border-l-4 border-l-[#204195] bg-[#F7F9FE]")} aria-labelledby="v3-today">
      <div className="min-w-0 flex-[999_1_380px] space-y-2">
        <p className="text-[15px] font-semibold text-[#204195]">{t("practiceProgress.v3.today.label")}</p>
        <h2 id="v3-today" className="text-[22px] font-semibold leading-snug">
          {advice ? fill(t("practiceProgress.v3.today.title"), { round: areaName(advice.round.area, t) }) : t("practiceProgress.v3.today.top")}
        </h2>
        <p className="text-base text-[#2A2F38]">{why}</p>
      </div>
      <Link href={href} className={cn(darkButton, "flex-[1_1_240px]")}>
        <Play className="size-4" aria-hidden="true" />
        {t("practiceProgress.v3.today.cta")}
      </Link>
    </section>
  );
}

function FeedbackCard({ progress }: { progress: PracticeProgress }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const [showQuestion, setShowQuestion] = useState(false);
  const feedback = latestFeedbackOf(progress);
  if (!feedback) return null;
  const { session, better, fix } = feedback;
  const report = `/interview/results/${session.sessionId}`;
  return (
    <section className={cn(card, "space-y-3")} aria-labelledby="v3-feedback">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="v3-feedback" className="text-lg font-semibold">
          {t("practiceProgress.v3.feedback.title")}
          <span className={cn("ml-2 text-sm font-normal", muted)}>
            {shortDate(session.date, locale)} · {roomLabel(session, t)}
          </span>
        </h2>
        <Link href={report} className="text-sm font-semibold text-[#204195] underline-offset-4 hover:underline">
          {t("practiceProgress.v3.feedback.report")} →
        </Link>
      </div>
      <div className={cn("grid gap-3", better && "md:grid-cols-2")}>
        {better && (
        <div className="space-y-1 rounded-lg border-l-4 border-l-[#2F8A47] bg-[#F1F8F3] px-4 py-3">
          <p className="text-sm font-semibold text-[#1E6B34]">▲ {t("practiceProgress.v3.feedback.better")}</p>
          <p className="text-base font-semibold">
            {better.kind === "level"
              ? fill(t("practiceProgress.v3.feedback.levelUp"), { round: areaName(better.area, t), level: levelName(better.to, t) })
              : recordText(better.entry.records[0], t)}
          </p>
        </div>
        )}
        <div className="space-y-1 rounded-lg border-l-4 border-l-[#E8912D] bg-[#FFF8EB] px-4 py-3">
          {fix ? (
            <>
              <p className="text-sm font-semibold text-[#9A4A00]">{fill(t("practiceProgress.v3.feedback.fix"), { skill: fix.skill })}</p>
              <p className="text-base font-semibold">{fix.point}</p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-sm">
                {isRepeated(fix) && (
                  <span className={cn(scoreChip, "bg-[#FDF0D5] text-[#8A5300]")}>
                    {fill(t("practiceProgress.v3.feedback.missed"), { missed: fix.timesMissed, asked: fix.timesAsked })}
                  </span>
                )}
                {fix.lastSeen.question && (
                  <button
                    type="button"
                    onClick={() => setShowQuestion((value) => !value)}
                    aria-expanded={showQuestion}
                    className="inline-flex min-h-8 items-center gap-1 font-semibold text-[#204195]"
                  >
                    {t(showQuestion ? "practiceProgress.v3.feedback.hideQuestion" : "practiceProgress.v3.feedback.showQuestion")}
                    <ChevronDown className={cn("size-4 transition-transform", showQuestion && "rotate-180")} aria-hidden="true" />
                  </button>
                )}
              </p>
              {showQuestion && <p className="rounded-md bg-white p-3 text-[15px]">{fix.lastSeen.question}</p>}
            </>
          ) : (
            <p className="text-base text-[#2A2F38]">{t("practiceProgress.v3.feedback.noFix")}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function DetailCard({
  progress,
  job,
  tab,
  onTab,
  openArea,
  onOpenArea,
  flash,
  room,
}: {
  progress: PracticeProgress;
  job: JobReadiness;
  tab: Tab;
  onTab: (tab: Tab) => void;
  openArea: string | null;
  onOpenArea: (area: string | null) => void;
  flash: string | null;
  room: RoomName;
}) {
  const { t } = useLanguage();
  const tabs: Tab[] = ["topics", "answers", "knowledge", "history"];
  return (
    <section id="chi-tiet" className={cn(card, "flex-[999_1_560px] p-0 sm:p-0")} aria-labelledby="v3-detail">
      <div className="px-5 pt-5 sm:px-6">
        <h2 id="v3-detail" className="text-lg font-semibold">
          {fill(t("practiceProgress.v3.detail.title"), { room: t(`practiceProgress.v3.room.${room}`) })}
        </h2>
      </div>
      <div role="tablist" aria-label={t("practiceProgress.v3.detail.tabs")} className="flex gap-1 overflow-x-auto border-b border-[#ECECE8] px-3 py-2 sm:px-4">
        {tabs.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            onClick={() => onTab(name)}
            className={cn(
              "min-h-11 shrink-0 whitespace-nowrap rounded-md px-3.5 text-[15px] font-semibold",
              tab === name ? "bg-[#E6EEFB] text-[#204195]" : "text-[#2A2F38] hover:bg-[#F7F7F5]",
            )}
          >
            {t(`practiceProgress.v3.detail.tab.${name}`)}
          </button>
        ))}
      </div>
      {tab === "topics" && <TopicsTab progress={progress} job={job} openArea={openArea} onOpenArea={onOpenArea} flash={flash} />}
      {tab === "answers" && <AnswersTab progress={progress} room={room} />}
      {tab === "knowledge" && <KnowledgeTab progress={progress} />}
      {tab === "history" && <HistoryTab progress={progress} />}
    </section>
  );
}

function TopicsTab({
  progress,
  job,
  openArea,
  onOpenArea,
  flash,
}: {
  progress: PracticeProgress;
  job: JobReadiness;
  openArea: string | null;
  onOpenArea: (area: string | null) => void;
  flash: string | null;
}) {
  const { t } = useLanguage();
  const rounds = job.rounds.filter((round) => (round.series?.length ?? 0) > 0);
  return (
    <div>
      {rounds.length === 0 ? (
        <p className="px-5 py-6 text-base text-[#2A2F38] sm:px-6">{t("practiceProgress.v3.topics.none")}</p>
      ) : (
        rounds.map((round, index) => (
          <TopicRow
            key={round.area}
            progress={progress}
            job={job}
            round={round}
            first={index === 0}
            open={openArea === round.area}
            flash={flash === round.area}
            onToggle={() => onOpenArea(openArea === round.area ? null : round.area)}
          />
        ))
      )}
    </div>
  );
}

function TopicRow({
  progress,
  job,
  round,
  first,
  open,
  flash,
  onToggle,
}: {
  progress: PracticeProgress;
  job: JobReadiness;
  round: RoundReadiness;
  first: boolean;
  open: boolean;
  flash: boolean;
  onToggle: () => void;
}) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const level = round.level ?? 0;
  const next = round.next;
  const reached = level >= ROUND_READY_LEVEL;
  const top = level >= 3 || next?.kind === "top";
  const series = round.series ?? [];
  return (
    <div id={`topic-${round.area}`} className={cn("scroll-mt-4", !first && "border-t border-[#ECECE8]")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 text-left transition-colors duration-700 sm:px-6",
          flash ? "bg-[#FFF1C2]" : open ? "bg-[#FAFAF8]" : "bg-white",
        )}
      >
        <span className="flex min-w-0 flex-[1_1_180px] flex-wrap items-center gap-2">
          <span className="text-base font-semibold">{areaName(round.area, t)}</span>
          {reached && <span className="rounded-md bg-[#E3F4E7] px-2 py-0.5 text-sm font-semibold text-[#1E6B34]">{t("practiceProgress.v3.topics.reached")}</span>}
          {round.atRisk && <span className="rounded-md bg-[#FDE8E6] px-2 py-0.5 text-sm font-semibold text-[#B42318]">{t("practiceProgress.v3.topics.atRisk")}</span>}
        </span>
        <span className="flex flex-[1_1_320px] flex-wrap items-center gap-3">
          <span className="flex w-24 gap-1 py-2" title={levelName(level, t)} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-2 flex-1 rounded-sm" style={{ background: i <= level ? PIP[level] : "#E4E4E0" }} />
            ))}
          </span>
          <span className="w-24 text-[15px] font-semibold" style={{ color: LEVEL_TEXT[level] }}>
            {levelName(level, t)}
          </span>
          <span className="min-w-0 flex-[1_1_120px] text-[15px] text-[#4A505C]">
            {top ? (
              t("practiceProgress.v3.topics.top")
            ) : (
              <>
                <b className="font-semibold tabular-nums text-[#16181D]">
                  {next?.have ?? 0}/{next?.need ?? 1}
                </b>{" "}
                {fill(t("practiceProgress.v3.topics.toLevel"), { level: levelName(level + 1, t) })}
              </>
            )}
          </span>
          <ChevronDown className={cn("size-5 shrink-0 text-[#2A2F38] transition-transform", open && "rotate-180")} aria-hidden="true" />
        </span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-6 bg-[#FAFAF8] px-5 pb-6 pt-2 sm:px-6">
          <div className="min-w-0 flex-[1_1_280px] space-y-3">
            <p className="text-base font-semibold text-[#2A2F38]">{t("practiceProgress.v3.topics.chartTitle")}</p>
            <ScoreChart points={series.map((point) => ({ score: point.score, date: point.date }))} locale={locale} />
            {series.length < 3 && <p className="rounded-md bg-[#F2F2EF] p-2.5 text-[15px] text-[#2A2F38]">{t("practiceProgress.v3.topics.thin")}</p>}
            <div>
              <p className="text-[15px] font-semibold text-[#2A2F38]">{fill(t("practiceProgress.v3.topics.evidence"), { n: series.length })}</p>
              <ul>
                {[...series].reverse().map((point) => (
                  <li key={point.sessionId} className="flex min-h-12 items-center gap-3 border-b border-[#ECECE8]">
                    <span className="w-28 text-base text-[#2A2F38]">{longDate(point.date, locale)}</span>
                    <span className={cn(scoreChip, "text-base", scoreTone(point.score).chip)}>{point.score.toFixed(1)}/10</span>
                    {point.score >= 7 && <span className="text-sm font-semibold text-[#1E6B34]">✓ {t("practiceProgress.v3.topics.met")}</span>}
                    <Link href={`/interview/results/${point.sessionId}`} className="ml-auto inline-flex min-h-11 items-center px-2 text-[15px] font-semibold text-[#204195] underline">
                      {t("practiceProgress.v3.topics.session")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="min-w-0 flex-[1_1_230px] space-y-4">
            <div className="space-y-1.5 rounded-lg border border-[#E4E4E0] bg-white p-3.5">
              <p className="text-[15px] font-semibold text-[#2A2F38]">
                {fill(t("practiceProgress.v3.topics.current"), { level: levelName(level, t) })}
              </p>
              <p className="text-[17px] text-[#2A2F38]">{ladderRule(round, t)}</p>
              {round.atRisk && <p className="text-base text-[#9C3D08]">{t("practiceProgress.v3.topics.riskNote")}</p>}
            </div>
            <Link
              href={practiceHref(job.jobId, lastResumeFor(progress, job.jobId), round.area)}
              className={lightButton}
            >
              {t("practiceProgress.v3.topics.practise")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** Scores of one topic on a 0–10 axis with the target line at 7 (no cut axis: changes keep their real size). */
export function ScoreChart({ points, locale }: { points: { score: number; date: string }[]; locale: string }) {
  const { t } = useLanguage();
  const positions = plotPoints(points.map((point) => point.score));
  const line = positions.map((p, i) => `${i ? "L" : "M"}${p.left.toFixed(1)} ${p.top.toFixed(1)}`).join(" ");
  const target = yOf(7);
  const label = fill(t("practiceProgress.v3.chart.aria"), {
    values: points.map((point) => `${shortDate(point.date, locale)} ${point.score.toFixed(1)}`).join(", "),
  });
  return (
    <div role="img" aria-label={label} className="rounded-lg border border-[#ECECE8] bg-white pb-2 pl-10 pr-24 pt-6">
      <div className="relative h-40">
        {[10, 7, 5, 0].map((tick) => (
          <span
            key={tick}
            aria-hidden="true"
            className={cn("absolute -left-9 w-6 -translate-y-1/2 text-right text-sm", tick === 7 ? "font-semibold text-[#22672F]" : "text-[#2A2F38]")}
            style={{ top: `${yOf(tick)}%` }}
          >
            {tick}
          </span>
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
          <line x1="0" x2="104" y1={target} y2={target} stroke="#22672F" strokeWidth="2" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
          {positions.length > 1 && (
            <path d={line} fill="none" stroke="#204195" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        <span
          aria-hidden="true"
          className="absolute whitespace-nowrap text-sm font-semibold text-[#22672F]"
          style={{ top: `${target}%`, left: "calc(104% + 6px)", transform: "translateY(-50%)" }}
        >
          {t("practiceProgress.v3.chart.target")}
        </span>
        {positions.map((p, i) => (
          <span
            key={`${points[i].date}-${i}`}
            title={`${longDate(points[i].date, locale)}: ${points[i].score.toFixed(1)}/10`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
          >
            {(points.length <= 6 || i === 0 || i === points.length - 1) && (
              <span aria-hidden="true" className={cn("absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white px-1 text-sm font-semibold", scoreTone(points[i].score).text)}>
                {points[i].score.toFixed(1)}
              </span>
            )}
            <span aria-hidden="true" className={cn(
                "block size-3 rounded-full border-2 border-white ring-1",
                points[i].score >= 7 ? "bg-[#2F8A47] ring-[#2F8A47]" : points[i].score >= 5.5 ? "bg-[#E0A030] ring-[#E0A030]" : "bg-[#D92D20] ring-[#D92D20]",
              )} />
          </span>
        ))}
      </div>
      <div aria-hidden="true" className="relative mt-1.5 h-5">
        {positions.map((p, i) =>
          points.length <= 6 || i === 0 || i === points.length - 1 ? (
            <span key={i} className="absolute -translate-x-1/2 whitespace-nowrap text-sm text-[#2A2F38]" style={{ left: `${p.left}%` }}>
              {shortDate(points[i].date, locale)}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

function AnswersTab({ progress, room }: { progress: PracticeProgress; room: RoomName }) {
  const { t } = useLanguage();
  const first = progress.behavior.firstTimeSufficientRate;
  const skipped = progress.behavior.skippedPerSession;
  const rows = [
    {
      key: "first",
      name: t("practiceProgress.v3.answers.first"),
      value: percent(first.latest),
      trend: first.trend,
      note: t("practiceProgress.v3.answers.firstNote"),
    },
    {
      key: "skipped",
      name: t("practiceProgress.v3.answers.skipped"),
      value: skipped.latest === null ? "—" : String(skipped.latest),
      trend: skipped.trend,
      note: t("practiceProgress.v3.answers.skippedNote"),
    },
  ];
  return (
    <div>
      {rows.map((row, index) => (
        <div key={row.key} className={cn("space-y-1 px-5 py-4 sm:px-6", index > 0 && "border-t border-[#ECECE8]")}>
          <p className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-base font-semibold">{row.name}</span>
            <span className="flex items-center gap-2">
              <span className="text-lg font-semibold tabular-nums">{row.value}</span>
              <span className="rounded bg-[#F2F2EF] px-2 py-0.5 text-sm font-semibold text-[#2A2F38]">{trendLabel(row.trend.status, t)}</span>
            </span>
          </p>
          <p className="text-base text-[#2A2F38]">{row.note}</p>
        </div>
      ))}
      {room === "voice" && <p className="border-t border-[#ECECE8] px-5 py-4 text-base text-[#2A2F38] sm:px-6">{t("practiceProgress.v3.answers.camera")}</p>}
    </div>
  );
}

function KnowledgeTab({ progress }: { progress: PracticeProgress }) {
  const { t } = useLanguage();
  const skills = progress.skills.filter((skill) => !skill.minor).sort((a, b) => a.latest - b.latest);
  if (skills.length === 0) return <p className="px-5 py-6 text-base text-[#2A2F38] sm:px-6">{t("practiceProgress.v3.topics.none")}</p>;
  return (
    <ul>
      {skills.map((skill, index) => (
        <li key={skill.conceptId} className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 sm:px-6", index > 0 && "border-t border-[#ECECE8]")}>
          <span className="min-w-0 flex-[1_1_200px] text-base font-semibold">{skill.label}</span>
          <span className={cn("text-[15px]", muted)}>{fill(t("practiceProgress.skills.sessions"), { n: skill.points.length })}</span>
          <span className="rounded bg-[#F2F2EF] px-2 py-0.5 text-sm font-semibold text-[#2A2F38]">
            {skill.points.length < 3 ? t("practiceProgress.v3.knowledge.thin") : trendLabel(skill.trend.status, t)}
          </span>
          <span className={cn("w-16 text-right text-lg font-bold tabular-nums", scoreTone(skill.latest).text)}>{skill.latest.toFixed(1)}</span>
        </li>
      ))}
    </ul>
  );
}

function HistoryTab({ progress }: { progress: PracticeProgress }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const sessions = [...progress.sessions].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <ul>
      {sessions.map((session, index) => (
        <li key={session.sessionId} className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 sm:px-6", index > 0 && "border-t border-[#ECECE8]")}>
          <span className="min-w-0 flex-[1_1_220px]">
            <span className="block text-base font-semibold">{longDate(session.date, locale)}</span>
            <span className={cn("block text-[15px]", muted)}>
              {roomLabel(session, t)}
              {session.jobTitle ? ` · ${session.jobTitle}` : ""}
            </span>
          </span>
          {session.valid === false ? (
            <span
              className="rounded-md bg-[#F0F0ED] px-2 py-0.5 text-sm font-semibold text-[#6B6F78]"
              title={session.invalidReason ? t(`practiceProgress.v3.history.reason.${session.invalidReason}`) : undefined}
            >
              {session.invalidReason === "technical_failure"
                ? t("practiceProgress.v3.history.notCountedTechnical")
                : t("practiceProgress.v3.history.notCounted")}
            </span>
          ) : (
            session.overallScore === null ? (
              <span className="text-lg font-semibold">—</span>
            ) : (
              <span className={cn(scoreChip, "text-base", scoreTone(session.overallScore).chip)}>{session.overallScore.toFixed(1)}/10</span>
            )
          )}
          <Link href={`/interview/results/${session.sessionId}`} className={lightButton}>
            {t("practiceProgress.v3.history.open")}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DueList({ progress, gaps }: { progress: PracticeProgress; gaps: GapItem[] }) {
  const { t } = useLanguage();
  const { due } = dueOf(gaps);
  if (due.length === 0) return null;
  return (
    <section className={cn(card, "space-y-3")} aria-labelledby="v3-due">
      <h2 id="v3-due" className="text-[17px] font-semibold text-[#8A5300]">
        {t("practiceProgress.v3.due.title")}
      </h2>
      <ul className="space-y-2">
        {due.slice(0, 4).map((gap) => (
          <li key={`${gap.skillKey}-${gap.point}`} className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium">{gap.point}</span>
              <span className="block text-[15px] text-[#2A2F38]">{gap.skill}</span>
            </span>
            <Link
              href={practiceHref(
                gap.lastSeen.jobId,
                gap.lastSeen.resumeId ?? (gap.lastSeen.jobId ? lastResumeFor(progress, gap.lastSeen.jobId) : null),
                gap.area,
                { conceptId: gap.skillKey, skill: gap.skill },
              )}
              className={lightButton}
            >
              {t("practiceProgress.v3.due.cta")}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecordsList({ progress, jobId }: { progress: PracticeProgress; jobId: string }) {
  const { t, lang } = useLanguage();
  const locale = localeOf(lang);
  const records = recentRecords(progress.timeline ?? [], jobId);
  return (
    <section className={cn(card, "space-y-3")} aria-labelledby="v3-records">
      <h2 id="v3-records" className="text-[17px] font-semibold">
        {t("practiceProgress.records.title")}
      </h2>
      {records.length === 0 ? (
        <p className="text-base text-[#2A2F38]">{t("practiceProgress.v3.records.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {records.map((record, index) => (
            <li key={`${record.sessionId}-${record.kind}-${index}`} className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium">
                  <span aria-hidden="true" className="mr-1.5 text-[#B7791F]">★</span>
                  {recordText(record, t)}
                </span>
                <span className="block text-[15px] text-[#2A2F38]">{longDate(record.date, locale)}</span>
              </span>
              <Link href={`/interview/results/${record.sessionId}`} className={lightButton}>
                {t("practiceProgress.v3.topics.session")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** How scores are compared and how levels work, always shown at the end of the page (no toggle). */
function HowItWorks({ k }: { k: number }) {
  const { t } = useLanguage();
  return (
    <section className="grid gap-5 rounded-[10px] border border-[#E4E4E0] bg-[#FAFAF8] p-5 text-sm leading-relaxed text-[#4A505C] sm:p-6 md:grid-cols-2">
      <div className="space-y-2">
        <h2 className="text-[15px] font-semibold text-[#16181D]">{t("practiceProgress.v3.status.howLabel")}</h2>
        <p>{fill(t("practiceProgress.v3.status.how"), { k: k > 0 ? k : 2 })}</p>
      </div>
      <div className="space-y-2">
        <h2 className="text-[15px] font-semibold text-[#16181D]">{t("practiceProgress.v3.topics.rules")}</h2>
        <ul className="space-y-1.5">
          {[0, 1, 2, 3].map((level) => (
            <li key={level}>
              <b style={{ color: LEVEL_TEXT[level] }}>{levelName(level, t)}</b>: {t(`practiceProgress.v3.topics.rule.${level}`)}
            </li>
          ))}
          <li>{t("practiceProgress.v3.topics.rule.chain")}</li>
          <li>{t("practiceProgress.v3.topics.rule.down")}</li>
        </ul>
      </div>
    </section>
  );
}
