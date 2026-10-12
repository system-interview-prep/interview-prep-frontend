"use client";

import { type ReactNode } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  MessageSquare,
  Mic,
  Sparkles,
  Video,
} from "lucide-react";
import { endReasonKey } from "@/features/interview/components/ChatInterviewProgress";
import { localeOf } from "@/i18n/format";
import { JobCard, mapJobToJobCard } from "@/components/jobs";
import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { CachedFit } from "@features/matching/utils/fitCache";
import { cn } from "@/utils";
import CountUp from "@components/shared/CountUp";

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

export function hasScore(session: StoredDashboardSession): session is StoredDashboardSession & { overallScore: number } {
  return typeof session.overallScore === "number" && Number.isFinite(session.overallScore);
}

const CARD = "rounded-2xl border border-[#DCE4F3] bg-white";

/** Plain section title: clean typography, clear hierarchy. */
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
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={id} className="font-display text-xl font-bold tracking-tight text-[#14244B] sm:text-2xl">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-xs text-[#607096]">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Small heading inside a card. */
function CardTitle({ id, title, action }: { id: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 id={id} className="text-base font-bold text-[#14244B]">{title}</h3>
      {action}
    </div>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 text-xs font-semibold text-[#204195] underline-offset-4 hover:underline">
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
 * 4 Key Metrics Cards:
 * 1. Latest / Average score
 * 2. Weekly & Total sessions
 * 3. Daily practice streak
 * 4. Weekly practice time
 */
export function OverviewMetrics({
  latestScore,
  prevScore,
  weekSessions,
  totalSessions,
  streak,
  minutes,
  t,
}: {
  latestScore: number | null;
  prevScore?: number | null;
  weekSessions: number;
  totalSessions: number;
  streak: number;
  minutes: number;
  t: Translate;
}) {
  const scoreDiff =
    latestScore !== null && prevScore !== null && prevScore !== undefined
      ? latestScore - prevScore
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Điểm đánh giá gần nhất */}
      <article className="group relative overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#607096]">
            {t("userDash.overview.readiness")}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
            <Award className="size-5" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          {latestScore !== null ? (
            <>
              <span className="font-display text-3xl font-extrabold text-[#14244B]">
                <CountUp value={latestScore} decimals={1} />
              </span>
              <span className="text-sm font-semibold text-[#8B98B5]">/10</span>
              {scoreDiff !== null && Math.abs(scoreDiff) >= 0.1 && (
                <span
                  className={cn(
                    "ml-auto inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold",
                    scoreDiff > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
                  )}
                >
                  {scoreDiff > 0 ? `+${scoreDiff.toFixed(1)}` : scoreDiff.toFixed(1)}
                </span>
              )}
            </>
          ) : (
            <span className="font-display text-3xl font-extrabold text-[#14244B]">—</span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-[#607096]">
          {latestScore !== null ? "Dựa trên buổi phỏng vấn đã chấm" : t("userDash.overview.readinessEmpty")}
        </p>
      </article>

      {/* 2. Buổi luyện tập */}
      <article className="group relative overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#607096]">
            {t("userDash.overview.weekSessions")}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
            <CheckCircle2 className="size-5" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-extrabold text-[#14244B]">
            <CountUp value={weekSessions} />
          </span>
          <span className="text-sm font-semibold text-[#8B98B5]">buổi tuần này</span>
          {totalSessions > 0 && (
            <span className="ml-auto text-xs text-[#8B98B5]">Tổng {totalSessions}</span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-[#607096]">
          {weekSessions > 0 ? "Đang duy trì nhịp độ rất tốt" : t("userDash.overview.weekSessionsHelp")}
        </p>
      </article>

      {/* 3. Chuỗi ngày liên tiếp */}
      <article className="group relative overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#607096]">
            {t("userDash.overview.streak")}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500/10 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
            <Flame className="size-5 fill-current" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-extrabold text-[#14244B]">
            <CountUp value={streak} />
          </span>
          <span className="text-sm font-semibold text-[#8B98B5]">ngày</span>
        </div>
        <p className="mt-1.5 text-xs text-[#607096]">
          {streak > 0 ? "Giữ vững phong độ luyện tập!" : "Bắt đầu chuỗi ngày mới ngay hôm nay!"}
        </p>
      </article>

      {/* 4. Thời lượng luyện tập */}
      <article className="group relative overflow-hidden rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#607096]">
            {t("userDash.overview.time")}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#204195]/10 text-[#204195] transition-colors group-hover:bg-[#204195] group-hover:text-white">
            <Clock className="size-5" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-extrabold text-[#14244B]">
            <CountUp value={minutes} />
          </span>
          <span className="text-sm font-semibold text-[#8B98B5]">phút</span>
        </div>
        <p className="mt-1.5 text-xs text-[#607096]">
          {minutes > 0 ? "Thời gian rèn luyện với AI tuần này" : t("userDash.overview.timeUnavailable")}
        </p>
      </article>
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
 * Compact AI Insight Card: displays the weakest competency from the latest session
 * with a direct action to re-practice that role.
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
    <section className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-blue-50/40 p-5 shadow-xs transition-all hover:shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                Gợi ý cải thiện từ AI
              </span>
              <span className="text-xs font-medium text-[#607096]">Từ buổi gần nhất: {roleTitle}</span>
            </div>
            <h3 className="mt-1.5 text-base font-bold text-[#14244B]">
              Năng lực cần rèn luyện: <span className="text-[#204195]">{weakest.competency}</span>
              <span className="ml-2 inline-block rounded-md border border-amber-200 bg-white px-2 py-0.5 text-xs font-extrabold text-amber-700 shadow-xs">
                {weakest.score.toFixed(1)}/10
              </span>
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#607096]">
              Buổi phỏng vấn tiếp theo sẽ tăng cường các câu hỏi tình huống thực tế xoay quanh năng lực này để giúp bạn bứt phá điểm số.
            </p>
          </div>
        </div>
        {latest.jobId && (
          <button
            type="button"
            onClick={() => onPractice({ id: latest.jobId!, title: roleTitle })}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#204195] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#183275] active:scale-[0.98]"
          >
            <span>Luyện lại vị trí này</span>
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * 3 Practice Mode Cards (Video AI, Voice AI, Chat)
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
      key: "video" as const,
      title: "Phỏng vấn Video AI",
      desc: "Mô phỏng chân thực qua Webcam & AI Avatar. Đánh giá đa chiều về phong thái, giọng nói và độ tự tin.",
      duration: "15–20 phút",
      highlight: "Khuyên dùng",
      isFeatured: true,
      Icon: Video,
      color: "bg-gradient-to-br from-[#204195] to-[#14244B] text-white",
      badgeColor: "bg-[#FCB625] text-[#14244B]",
      actionLabel: "Luyện Video ngay",
      action: onStartVideo,
    },
    {
      key: "voice" as const,
      title: "Phỏng vấn Giọng nói",
      desc: "Luyện phản xạ giao tiếp tự nhiên và diễn đạt mạch lạc qua giọng nói, không áp lực về camera.",
      duration: "10–15 phút",
      highlight: "Nhanh gọn",
      isFeatured: false,
      Icon: Mic,
      color: "bg-blue-50 text-[#204195] border border-blue-200",
      badgeColor: "bg-blue-100 text-[#204195]",
      actionLabel: "Luyện Voice ngay",
      action: () => onSelectMode("voice"),
    },
    {
      key: "chat" as const,
      title: "Phỏng vấn Chat",
      desc: "Tập trung trau chuốt cấu trúc câu trả lời STAR và tư duy logic bằng văn bản trước khi nói.",
      duration: "10–15 phút",
      highlight: "Rèn cấu trúc",
      isFeatured: false,
      Icon: MessageSquare,
      color: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      badgeColor: "bg-emerald-100 text-emerald-800",
      actionLabel: "Luyện Chat ngay",
      action: () => onSelectMode("chat"),
    },
  ];

  return (
    <section aria-labelledby="modes-title" className="space-y-4">
      <SectionHeading
        id="modes-title"
        title={t("userDash.modes.title")}
        subtitle="Chọn hình thức phù hợp với thời gian và mục tiêu rèn luyện hôm nay của bạn."
      />

      <div className="grid gap-5 md:grid-cols-3">
        {modes.map((mode) => (
          <article
            key={mode.key}
            className={cn(
              "relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
              mode.isFeatured
                ? "border-[#204195] bg-gradient-to-b from-[#F0F4FC]/90 via-white to-white shadow-md ring-1 ring-[#204195]/20"
                : "border-[#DCE4F3] bg-white shadow-xs hover:border-[#204195]/40",
            )}
          >
            {mode.highlight && (
              <span
                className={cn(
                  "absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-xs",
                  mode.badgeColor,
                )}
              >
                {mode.highlight}
              </span>
            )}

            <div>
              <div className="flex items-center gap-3">
                <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", mode.color)}>
                  <mode.Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#14244B]">{mode.title}</h3>
                  <span className="text-[11px] font-medium text-[#8B98B5]">{mode.duration}</span>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[#607096]">{mode.desc}</p>
            </div>

            <div className="mt-5 border-t border-[#EAEFF8] pt-4">
              <button
                type="button"
                onClick={mode.action}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.98]",
                  mode.isFeatured
                    ? "bg-[#204195] text-white shadow-xs hover:bg-[#183275]"
                    : "border border-[#DCE4F3] bg-white text-[#14244B] hover:border-[#204195] hover:bg-[#F0F4FC] hover:text-[#204195]",
                )}
              >
                <span>{mode.actionLabel}</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
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
    <section aria-labelledby="activity-title" className={cn(CARD, "flex flex-col p-5 sm:p-6 shadow-xs")}>
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
        <ol className="mt-3 flex-1 divide-y divide-[#EAEFF8]">
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
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-[#F8FAFC]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#14244B]">
                      {session.jobTitle || t("userDash.activity.eyebrow")}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#607096]">
                      {new Date(session.startedAt).toLocaleDateString(localeOf(lang), {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      {" · "}
                      {modeLabel(session.mode, t)}
                      {" · "}
                      <span className={cn(!closed && !failed && "font-semibold text-[#8A5A00]")}>{state}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    {hasScore(session) ? (
                      <span className="font-display text-lg font-bold tabular-nums text-[#14244B]">
                        {session.overallScore.toFixed(1)}
                        <span className="text-xs font-normal text-[#9AA6C2]">/10</span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[#204195]">
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
        <div className="py-8 text-center">
          <p className="text-xs text-[#607096]">Chưa có buổi phỏng vấn nào. Hãy bắt đầu buổi luyện tập đầu tiên của bạn!</p>
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
    <section aria-labelledby="jobs-title" className="space-y-4">
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
