"use client";

import { type ReactNode } from "react";
import { Award, CalendarCheck, Clock, Flame, MessageSquare, Mic, Video } from "lucide-react";
import { endReasonKey } from "@/features/interview/components/ChatInterviewProgress";
import { localeOf } from "@/i18n/format";
import { JobCard, mapJobToJobCard } from "@/components/jobs";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { CachedFit } from "@features/matching/utils/fitCache";
import { cn } from "@/utils";

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

/**
 * The name to greet a candidate by. Vietnamese full names end with the given name
 * ("Nguyễn Văn An" → "An"), but a profile name may carry a title or role after it
 * ("Hiền – Ứng viên Backend & Dữ liệu"), so anything after a separator is dropped first
 * and only word-like tokens count. Returns "" when nothing usable is left.
 */
export function greetingName(fullName?: string | null): string {
  const raw = (fullName ?? "").trim();
  if (!raw) return "";
  const isWord = (token: string) => /^\p{L}[\p{L}'’.-]*$/u.test(token);
  const head = raw.split(/\s+[-/]\s*|[–—&|,;:()[\]@]/)[0] ?? "";
  const words = head.split(/\s+/).filter(isWord);
  return words[words.length - 1] ?? "";
}

type Translate = (key: string) => string;

function modeLabel(mode: StoredDashboardSession["mode"], t: Translate) {
  if (mode === "text") return t("userDash.mode.chat.short");
  if (mode === "voice") return t("userDash.mode.voice.short");
  return t("userDash.mode.video.short");
}

export function hasScore(session: StoredDashboardSession): session is StoredDashboardSession & { overallScore: number } {
  return typeof session.overallScore === "number" && Number.isFinite(session.overallScore);
}

const CARD = "rounded-lg border border-[#E4E4E0] bg-white";
/**
 * Colour of a score on the 10-point scale, on the same bars as the topic
 * levels: green from 7 (the target), amber from 5.5 (the floor), red below.
 */
export function scoreTone(score: number) {
  if (score >= 7) return { text: "text-[#1E6B34]", chip: "bg-[#E3F4E7] text-[#1E6B34]" };
  if (score >= 5.5) return { text: "text-[#8A5300]", chip: "bg-[#FDF0D5] text-[#8A5300]" };
  return { text: "text-[#B42318]", chip: "bg-[#FDE8E6] text-[#B42318]" };
}

/** A small coloured label for a number or a state. */
function Chip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[13px] font-semibold tabular-nums", className)}>
      {children}
    </span>
  );
}

const LIGHT_BUTTON =
  "inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-[#DCE4F3] bg-white px-4 text-sm font-semibold text-[#204195] hover:border-[#204195] hover:bg-[#F0F4FC]";

/** Plain section title. */
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
    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold text-[#16181D]">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-sm text-[#4A505C]">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Small heading inside a card. */
function CardTitle({ id, title, action }: { id: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 id={id} className="min-w-0 text-base font-semibold text-[#16181D]">{title}</h3>
      {action}
    </div>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-8 shrink-0 text-sm font-semibold text-[#204195] underline-offset-4 hover:underline"
    >
      {children}
    </button>
  );
}

/** Local calendar day, e.g. "2026-9-12" (month is 0-based); compares days, not instants. */
export function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Monday 00:00 of the week that contains `date`. */
export function weekStart(date: Date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

/** Practice days (local) of these sessions. */
export function practiceDays(sessions: StoredDashboardSession[]) {
  return new Set(
    sessions
      .map((item) => new Date(item.startedAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map(dayKey),
  );
}

/** Days in a row with practice, ending today (or yesterday, if today is still open). */
export function practiceStreak(days: Set<string>, now: number) {
  if (!days.size) return 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

/**
 * This week's numbers in one plain card: latest score, sessions this week,
 * the streak (weekly from the server, else daily) and practice time.
 */
export function OverviewMetrics({
  latestScore,
  prevScore,
  weekSessions,
  totalSessions,
  streak,
  weeklyStreak,
  minutes,
  t,
}: {
  latestScore: number | null;
  prevScore?: number | null;
  weekSessions: number;
  totalSessions: number;
  streak: number;
  /** Weekly streak from the server (features/progress); replaces the daily streak when present. */
  weeklyStreak?: { weeks: number; goal: number; thisWeekCount: number } | null;
  minutes: number;
  t: Translate;
}) {
  const scoreDiff =
    latestScore !== null && prevScore !== null && prevScore !== undefined
      ? latestScore - prevScore
      : null;
  const showDiff = scoreDiff !== null && Math.abs(scoreDiff) >= 0.1;
  const goalMet = weeklyStreak ? weeklyStreak.thisWeekCount >= weeklyStreak.goal : false;

  return (
    <dl className={cn(CARD, "grid grid-cols-2 lg:grid-cols-4")}>
      <MetricCell
        label={t("userDash.overview.readiness")}
        icon={<Award className="size-4 text-[#B7791F]" />}
        valueClass={latestScore !== null ? scoreTone(latestScore).text : undefined}
        value={latestScore !== null ? latestScore.toFixed(1) : "—"}
        unit={latestScore !== null ? "/10" : undefined}
        help={
          latestScore === null ? (
            t("userDash.overview.readinessEmpty")
          ) : showDiff ? (
            <>
              <Chip className={scoreDiff > 0 ? "bg-[#E3F4E7] text-[#1E6B34]" : "bg-[#FDE8E6] text-[#B42318]"}>
                {scoreDiff > 0 ? `▲ +${scoreDiff.toFixed(1)}` : `▼ ${scoreDiff.toFixed(1)}`}
              </Chip>{" "}
              so với buổi trước
            </>
          ) : (
            "Buổi đã chấm gần nhất"
          )
        }
      />
      <MetricCell
        label={t("userDash.overview.weekSessions")}
        icon={<CalendarCheck className="size-4 text-[#204195]" />}
        valueClass={weekSessions > 0 ? "text-[#204195]" : undefined}
        value={String(weekSessions)}
        unit="buổi"
        help={
          goalMet ? (
            <Chip className="bg-[#E3F4E7] text-[#1E6B34]">✓ Đạt mục tiêu tuần</Chip>
          ) : totalSessions > 0 ? (
            `Tổng ${totalSessions} buổi`
          ) : (
            t("userDash.overview.weekSessionsHelp")
          )
        }
      />
      <MetricCell
        label={weeklyStreak ? t("practiceProgress.dashboard.streakLabel") : t("userDash.overview.streak")}
        icon={<Flame className="size-4 fill-[#F97316] text-[#EA580C]" />}
        valueClass={(weeklyStreak ? weeklyStreak.weeks : streak) > 0 ? "text-[#C2410C]" : undefined}
        value={String(weeklyStreak ? weeklyStreak.weeks : streak)}
        unit={weeklyStreak ? t("practiceProgress.dashboard.streakUnit") : "ngày"}
        help={
          weeklyStreak
            ? t("practiceProgress.dashboard.streakHelp")
                .replace("{count}", String(weeklyStreak.thisWeekCount))
                .replace("{goal}", String(weeklyStreak.goal))
            : streak > 0
              ? "Ngày liên tiếp có luyện"
              : "Luyện hôm nay để bắt đầu chuỗi"
        }
      />
      <MetricCell
        label={t("userDash.overview.time")}
        icon={<Clock className="size-4 text-[#0F766E]" />}
        valueClass={minutes > 0 ? "text-[#0F766E]" : undefined}
        value={String(minutes)}
        unit="phút"
        help={minutes > 0 ? "Tổng thời gian các buổi tuần này" : t("userDash.overview.timeUnavailable")}
      />
    </dl>
  );
}

/** One number with its label and a short note. */
function MetricCell({
  label,
  icon,
  value,
  valueClass,
  unit,
  help,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  /** Colour of the number; grey-black when there is nothing to show yet. */
  valueClass?: string;
  unit?: string;
  help: ReactNode;
}) {
  return (
    <div className="min-w-0 border-[#EDEDEA] px-4 py-3.5 [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+2)]:border-l lg:[&:nth-child(n+3)]:border-t-0 [&:nth-child(even)]:border-l">
      <dt className="flex items-center gap-1.5 text-sm text-[#4A505C]">
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2">
        <span className={cn("text-[28px] font-bold leading-none tabular-nums", valueClass ?? "text-[#16181D]")}>{value}</span>
        {unit ? <span className="ml-1 text-sm text-[#4A505C]">{unit}</span> : null}
      </dd>
      <dd className="mt-1.5 text-[13px] leading-snug text-[#4A505C]">{help}</dd>
    </div>
  );
}

/** The default bucket for turns without a planned competency; never named as a weak skill. */
const DEFAULT_COMPETENCY = "Chuyên môn";

function scoredCompetencies(session: StoredDashboardSession) {
  return (session.competencyScores ?? []).filter((item) => (item.weight ?? 1) > 0 && Number.isFinite(item.score));
}

/**
 * The latest graded session with competency scores,
 * its competencies weakest first, and the weakest named one.
 */
export function weakestCompetency(sessions: StoredDashboardSession[]) {
  const latest = sessions.find((session) => hasScore(session) && scoredCompetencies(session).length > 0);
  if (!latest) return null;
  const items = scoredCompetencies(latest).slice().sort((a, b) => a.score - b.score);
  const named = items.filter((item) => item.competency !== DEFAULT_COMPETENCY);
  return { latest, items, weakest: (named.length ? named : items)[0] };
}

/**
 * The skill to practise next: the weakest competency of the latest graded
 * session, with one action to practise that position again.
 */
export function ImprovementFocus({
  focus,
  onPractice,
}: {
  focus: NonNullable<ReturnType<typeof weakestCompetency>>;
  onPractice: (job: { id: string; title: string }) => void;
}) {
  const { latest, weakest } = focus;
  const roleTitle = latest.jobTitle || "Vị trí gần nhất";

  return (
    <section
      aria-labelledby="focus-title"
      className={cn(CARD, "flex flex-col gap-3 border-l-4 border-l-[#E8912D] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5")}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#B45309]">Nên luyện tiếp</p>
        <h3 id="focus-title" className="mt-0.5 text-base font-semibold text-[#16181D] [overflow-wrap:anywhere]">
          {weakest.competency}
          <Chip className={cn("ml-2 align-middle", scoreTone(weakest.score).chip)}>{weakest.score.toFixed(1)}/10</Chip>
        </h3>
        <p className="mt-0.5 text-sm text-[#4A505C] [overflow-wrap:anywhere]">
          Điểm thấp nhất ở buổi gần nhất · {roleTitle}
        </p>
      </div>
      {latest.jobId ? (
        <button
          type="button"
          onClick={() => onPractice({ id: latest.jobId!, title: roleTitle })}
          className={LIGHT_BUTTON}
        >
          Luyện lại vị trí này
        </button>
      ) : null}
    </section>
  );
}

/**
 * The practice modes as one list. Chat and Voice are scored apart; the camera
 * is an option of Voice and is never scored.
 */
export function PracticeModes({
  onSelectMode,
  onStartVideo,
  t,
}: {
  onSelectMode: (mode: "video" | "voice" | "chat") => void;
  onStartVideo: () => void;
  t: Translate;
}) {
  const modes = [
    {
      key: "chat" as const,
      title: "Phỏng vấn Chat",
      desc: "Gõ câu trả lời. Hợp để sắp xếp ý trước khi nói.",
      duration: "10–15 phút",
      Icon: MessageSquare,
      iconClass: "bg-[#E3F4E7] text-[#1E6B34]",
      action: () => onSelectMode("chat"),
    },
    {
      key: "voice" as const,
      title: "Phỏng vấn Giọng nói",
      desc: "Trả lời bằng giọng nói, không cần camera.",
      duration: "10–15 phút",
      Icon: Mic,
      iconClass: "bg-[#E6EEFB] text-[#204195]",
      action: () => onSelectMode("voice"),
    },
    {
      key: "video" as const,
      title: "Giọng nói có camera",
      desc: "Như phòng Voice, bật thêm camera để quen cảm giác phỏng vấn trực tiếp. Camera chỉ dùng để nhận xét khung hình và ánh sáng, không tính vào điểm.",
      duration: "15–20 phút",
      Icon: Video,
      iconClass: "bg-[#F0E9FB] text-[#6B3FA0]",
      action: onStartVideo,
    },
  ];

  return (
    <section aria-labelledby="modes-title">
      <SectionHeading
        id="modes-title"
        title={t("userDash.modes.title")}
        subtitle="Điểm Chat và Voice được tính riêng."
      />
      <ul className={cn(CARD, "divide-y divide-[#EDEDEA]")}>
        {modes.map((mode) => (
          <li key={mode.key} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
            <span className={cn("hidden size-10 shrink-0 place-items-center rounded-lg sm:grid", mode.iconClass)} aria-hidden="true">
              <mode.Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold text-[#16181D]">
                {mode.title}
                <span className="ml-2 text-sm font-normal text-[#4A505C]">{mode.duration}</span>
              </h3>
              <p className="mt-0.5 text-sm leading-relaxed text-[#4A505C]">{mode.desc}</p>
            </div>
            <button type="button" onClick={mode.action} className={cn(LIGHT_BUTTON, "self-start sm:self-auto")}>
              Bắt đầu
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The recent sessions, each with its state, score and action. */
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
  const displaySessions = sessions.slice(0, 4);

  return (
    <section aria-labelledby="activity-title" className={cn(CARD, "flex flex-col p-4 sm:p-5")}>
      <CardTitle
        id="activity-title"
        title={t("userDash.activity.title")}
        action={
          <LinkButton onClick={() => onNavigate("/dashboard/history")}>
            {t("userDash.activity.viewAll")} →
          </LinkButton>
        }
      />
      {displaySessions.length > 0 ? (
        <ol className="mt-2 flex-1 divide-y divide-[#EDEDEA]">
          {displaySessions.map((session) => {
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
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-3 text-left hover:bg-[#F7F7F5]"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[15px] font-medium text-[#16181D]"
                      title={session.jobTitle || undefined}
                    >
                      {session.jobTitle || t("userDash.activity.eyebrow")}
                    </span>
                    <span className="mt-0.5 block text-sm leading-5 text-[#4A505C]">
                      {new Date(session.startedAt).toLocaleDateString(localeOf(lang), {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      {" · "}
                      {modeLabel(session.mode, t)}
                      {" · "}
                      <Chip
                        className={cn(
                          "ml-0.5 text-xs",
                          failed
                            ? "bg-[#FDE8E6] text-[#B42318]"
                            : closed
                              ? "bg-[#F0F0ED] text-[#4A505C]"
                              : "bg-[#FDF0D5] text-[#8A5300]",
                        )}
                      >
                        {state}
                      </Chip>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {hasScore(session) ? (
                      <Chip className={cn("px-2 py-1 text-base", scoreTone(session.overallScore).chip)}>
                        {session.overallScore.toFixed(1)}
                        <span className="text-xs font-medium opacity-75">/10</span>
                      </Chip>
                    ) : (
                      <span className="text-sm font-semibold text-[#204195] underline-offset-4 hover:underline">
                        {failed ? t("userDash.activity.startNew") : closed ? t("userDash.activity.viewReport") : t("userDash.activity.resume")} →
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="py-6">
          <p className="text-sm text-[#4A505C]">Chưa có buổi phỏng vấn nào.</p>
        </div>
      )}
    </section>
  );
}

/** Suggested target jobs */
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
    <section aria-labelledby="jobs-title">
      <SectionHeading
        id="jobs-title"
        title={t("uxWs.dash.jobs.title")}
        subtitle={t("uxWs.dash.jobs.subtitle")}
        action={<LinkButton onClick={() => onNavigate("/dashboard/jobs")}>{t("userDash.jobProfiles.viewAll")} →</LinkButton>}
      />
      {ordered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        <div className={cn(CARD, "p-5")}>
          <h3 className="text-base font-semibold text-[#16181D]">{t("userDash.jobs.emptyTitle")}</h3>
          <p className="mt-1 max-w-lg text-sm text-[#4A505C]">{t("userDash.jobs.emptyBody")}</p>
          <div className="mt-4">
            <LinkButton onClick={() => onNavigate("/dashboard/jobs")}>{t("userDash.jobs.browse")} →</LinkButton>
          </div>
        </div>
      )}
    </section>
  );
}
