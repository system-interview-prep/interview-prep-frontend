"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { interviewRuntimeApi } from "@features/interview/services/interviewRuntime.service";
import { interviewChatApi } from "@features/interview/services/interviewChat.service";
import { AbortConfirmationModal } from "@components/interview/AbortConfirmationModal";
import { useFitCache } from "@features/matching/utils/fitCache";
import { useWeeklyGoal } from "@features/user-dashboard/hooks/useWeeklyGoal";
import { userCvApi } from "@features/resume/services/userCv.service";
import { JourneySteps, type JourneyIndex } from "@components/shared/ProcessSteps";
import { useAuthProfile } from "@features/auth/hooks/useAuthProfile";
import { JobInterviewCvModal } from "@features/user-dashboard/components/JobInterviewCvModal";
import PageHero from "@components/shared/PageHero";
import { useSavedJobs } from "@features/user-dashboard/hooks/useSavedJobs";
import { fmt } from "@/i18n/format";
import {
  CompetencyFocus,
  OverviewTiles,
  RecentActivity,
  StaleSessionNotice,
  ScoreTrend,
  SuggestedJobs,
  WeekStats,
  isFailedStart,
  sessionHref,
  type OverviewTile,
  type StoredDashboardSession,
} from "./DashboardSections";

type Props = {
  onNavigate: (href: string) => void;
  onStartVideo: (jobTitle?: string) => Promise<void>;
  videoError: boolean;
  onDismissVideoError: () => void;
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function practiceStreak(sessions: StoredDashboardSession[]) {
  const days = new Set(sessions.map((item) => new Date(item.startedAt)).filter((date) => !Number.isNaN(date.getTime())).map(dayKey));
  if (!days.size) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(dayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6" role="status" aria-label={label}>
      <div className="h-72 animate-pulse rounded-3xl bg-[#F0F4FC]/70 motion-reduce:animate-none" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {[0, 1].map((item) => <div key={item} className="h-72 animate-pulse rounded-3xl bg-white motion-reduce:animate-none" />)}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export type DashboardOverviewProps = Props & {
  userName?: string | null;
  profiles: JobProfile[];
  /** Newest first. */
  sessions: StoredDashboardSession[];
  /** null = unknown (request failed); the journey then doesn't claim the CV step either way. */
  cvCount: number | null;
  error: boolean;
  onRetry: () => void;
  /** Ends an open session the way the room does; resolves false when it failed. */
  onCloseSession?: (session: StoredDashboardSession, reason: "USER_ENDED" | "TECHNICAL_FAILURE") => Promise<boolean>;
};

/** An open session older than this gets a resume-or-close notice. */
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

/** The overview page itself: pure rendering from already-loaded data. */
export function DashboardOverview({
  onNavigate,
  onStartVideo,
  videoError,
  onDismissVideoError,
  userName,
  profiles,
  sessions,
  cvCount,
  error,
  onRetry,
  onCloseSession,
}: DashboardOverviewProps) {
  const { t, lang } = useLanguage();
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string } | null>(null);
  const { savedJobIds, toggleSave } = useSavedJobs();
  const fits = useFitCache();
  const { goal, setGoal } = useWeeklyGoal();
  const [closingSession, setClosingSession] = useState<StoredDashboardSession | null>(null);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(false);
  // Read once per mount: a render-time clock would make the notice flicker.
  const [now] = useState(() => Date.now());
  // The role to practise next: the first saved one, else the newest open role.
  const activeJob = profiles.find((profile) => savedJobIds.has(profile.id)) ?? profiles[0];
  const practiced = useMemo(() => sessions.filter((item) => !isFailedStart(item)), [sessions]);
  const hasCompetencies = practiced.some(
    (item) => typeof item.overallScore === "number" && (item.competencyScores ?? []).some((c) => (c.weight ?? 1) > 0),
  );

  const week = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const thisWeek = practiced.filter((item) => {
      const time = new Date(item.startedAt).getTime();
      return Number.isFinite(time) && time >= start.getTime() && time <= now.getTime();
    });
    const minutes = thisWeek.reduce((total, item) => {
      if (!item.endedAt) return total;
      const span = (new Date(item.endedAt).getTime() - new Date(item.startedAt).getTime()) / 60000;
      return Number.isFinite(span) && span > 0 ? total + span : total;
    }, 0);
    return { sessions: thisWeek.length, streak: practiceStreak(practiced), minutes: Math.round(minutes) };
  }, [practiced]);

  const beginRecommended = () => (activeJob ? setSelectedJob(activeJob) : void onStartVideo());

  // Where the user is in the CV → job → interview → report journey, from real data.
  const hasCv = (cvCount ?? 0) > 0 || practiced.length > 0;
  const hasSession = practiced.length > 0;
  const hasReport = practiced.some((item) => item.status === "CLOSED");
  const done = [hasCv, hasSession, hasSession, hasReport];
  const firstOpen = done.indexOf(false);
  const journeyIndex = (firstOpen === -1 ? done.length : firstOpen) as JourneyIndex;
  const journeyHint = t(`journey.hint.${["cv", "job", "interview", "report", "allDone"][journeyIndex]}`);

  // One next step: title and primary action follow the journey.
  const openSession = practiced.find((item) => item.status !== "CLOSED");
  const lastReport = practiced.find((item) => item.status === "CLOSED");
  const role = (title?: string) => title || t("userDash.activity.eyebrow");
  const next =
    journeyIndex === 0 && cvCount !== null
      ? { title: t("uxWs.dash.next.cv"), cta: t("uxWs.dash.cta.uploadCv"), run: () => onNavigate("/dashboard/cvs") }
      : openSession
        ? {
            title: t("uxWs.dash.next.resume"),
            body:
              openSession.totalTurns && openSession.answeredTurns != null
                ? t("uxWs.dash.next.resumeProgress")
                    .replace("{role}", role(openSession.jobTitle))
                    .replace("{answered}", String(openSession.answeredTurns))
                    .replace("{total}", String(openSession.totalTurns))
                : t("uxWs.dash.next.resumeBody").replace("{role}", role(openSession.jobTitle)),
            cta: t("uxWs.dash.cta.resume"),
            run: () => onNavigate(sessionHref(openSession)),
          }
        : journeyIndex === done.length
          ? { title: t("uxWs.dash.next.again"), cta: t("uxWs.dash.cta.newSession"), run: beginRecommended }
          : activeJob
            ? {
                title: t("uxWs.dash.next.practice").replace("{role}", activeJob.title),
                cta: t("uxWs.dash.cta.practiceRole").replace("{role}", activeJob.title),
                run: () => setSelectedJob(activeJob),
              }
            : { title: t("uxWs.dash.next.pickJob"), cta: t("uxWs.dash.cta.pickJob"), run: () => onNavigate("/dashboard/jobs") };

  // One tile per nav section: the top of the page sums up the whole workspace.
  const closedCount = practiced.filter((item) => item.status === "CLOSED").length;
  const openCount = practiced.length - closedCount;
  const graded = practiced.filter((item) => typeof item.overallScore === "number");
  const latestScore = graded[0]?.overallScore ?? null;
  const prevScore = graded[1]?.overallScore ?? null;
  const scoreDelta = latestScore != null && prevScore != null ? latestScore - prevScore : null;
  const tiles: OverviewTile[] = [
    {
      key: "cv",
      section: t("userDash.nav.myCvs"),
      value: cvCount == null ? "—" : String(cvCount),
      count: cvCount == null ? undefined : { value: cvCount },
      caption: t("uxWs.dash.kpi.cv"),
      note: cvCount ? t("uxWs.dash.kpi.cvNote") : t("uxWs.dash.kpi.cvEmpty"),
      noteTone: cvCount === 0 ? "attention" : "neutral",
      href: "/dashboard/cvs",
    },
    {
      key: "jobs",
      section: t("userDash.nav.openRoles"),
      value: String(savedJobIds.size),
      count: { value: savedJobIds.size },
      caption: t("uxWs.dash.kpi.saved"),
      note: savedJobIds.size ? t("uxWs.dash.kpi.savedNote") : t("uxWs.dash.kpi.savedEmpty"),
      href: "/dashboard/jobs",
    },
    {
      key: "interviews",
      section: t("userDash.nav.interviews"),
      value: String(closedCount),
      count: { value: closedCount },
      caption: t("uxWs.dash.kpi.done"),
      note: openCount ? fmt(t("uxWs.dash.kpi.open"), { n: openCount }) : t("uxWs.dash.kpi.noOpen"),
      noteTone: openCount ? "attention" : "neutral",
      href: openSession ? sessionHref(openSession) : "/interview/select",
    },
    {
      key: "report",
      section: t("userDash.nav.history"),
      value: latestScore == null ? "—" : `${latestScore.toFixed(1)}/10`,
      count: latestScore == null ? undefined : { value: latestScore, decimals: 1, suffix: "/10" },
      caption: t("uxWs.dash.progress.latest"),
      note:
        scoreDelta != null
          ? fmt(t("uxWs.dash.progress.delta"), { n: `${scoreDelta > 0 ? "+" : ""}${scoreDelta.toFixed(1)}` })
          : latestScore != null
            ? t("uxWs.dash.kpi.firstScore")
            : t("uxWs.dash.kpi.noScore"),
      noteTone: scoreDelta == null || scoreDelta === 0 ? "neutral" : scoreDelta > 0 ? "good" : "bad",
      href: graded[0] ? sessionHref(graded[0]) : "/dashboard/history",
    },
  ];

  const staleSession =
    openSession && now - new Date(openSession.startedAt).getTime() > STALE_AFTER_MS ? openSession : null;
  const confirmClose = async (reason: "USER_ENDED" | "TECHNICAL_FAILURE") => {
    if (!closingSession || !onCloseSession) return;
    setClosing(true);
    setCloseError(false);
    const ok = await onCloseSession(closingSession, reason);
    setClosing(false);
    if (!ok) {
      setCloseError(true);
      return;
    }
    const target = closingSession;
    setClosingSession(null);
    // With answers there is something to grade: the results page builds the report.
    if ((target.answeredTurns ?? 0) > 0) onNavigate(`/interview/results/${target.sessionId}`);
    else onRetry();
  };

  const firstName = (userName ?? "").trim().split(/\s+/).pop();
  const hello = firstName ? t("userDash.hello").replace("{name}", firstName) : t("userDash.helloAnon");

  return (
    <div className="space-y-8 md:space-y-10">
      {videoError ? (
        <div className="flex items-start justify-between gap-4 rounded-2xl bg-[#FDF2F2] px-5 py-3.5 text-sm text-[#C43B3B]" role="alert">
          <p><strong>{t("userDash.error.videoTitle")}</strong> {t("userDash.error.videoBody")}</p>
          <button type="button" onClick={onDismissVideoError} className="grid min-h-8 min-w-8 place-items-center rounded-full hover:bg-white/60" aria-label={t("userDash.error.dismiss")}>×</button>
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-[#FDF2F2] px-5 py-4 text-sm text-[#C43B3B] sm:flex-row sm:items-center sm:justify-between" role="alert">
          <p>{t("userDash.error.profiles")}</p>
          <button type="button" onClick={onRetry} className="min-h-9 rounded-full bg-white px-4 font-semibold text-[#C43B3B] transition-colors hover:bg-white/70">
            {t("userDash.error.retry")}
          </button>
        </div>
      ) : null}

      {staleSession ? (
        <StaleSessionNotice
          session={staleSession}
          lang={lang}
          onResume={() => onNavigate(sessionHref(staleSession))}
          onClose={() => {
            setCloseError(false);
            setClosingSession(staleSession);
          }}
          t={t}
        />
      ) : null}
      {closeError ? (
        <p className="rounded-2xl bg-[#FDF2F2] px-5 py-3 text-sm text-[#C43B3B]" role="alert">{t("uxWs.dash.stale.closeError")}</p>
      ) : null}

      <PageHero
        title={next.title}
        body={`${hello} ${"body" in next ? next.body : journeyHint}`}
        steps={<JourneySteps current={journeyIndex} />}
        aside={<WeekStats {...week} goal={goal} onGoalChange={setGoal} onStart={beginRecommended} t={t} />}
      >
        <button type="button" onClick={next.run} className="inline-flex h-11 items-center justify-center rounded-full bg-[#204195] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(32,65,149,0.8)] transition-all hover:-translate-y-px hover:bg-[#183275]">
          {next.cta}
        </button>
        {journeyIndex === done.length && lastReport ? (
          <button type="button" onClick={() => onNavigate(sessionHref(lastReport))} className="text-sm font-semibold text-[#204195] underline-offset-4 hover:underline">
            {t("uxWs.dash.cta.lastReport")} →
          </button>
        ) : null}
      </PageHero>

      <OverviewTiles tiles={tiles} onNavigate={onNavigate} label={t("uxWs.dash.kpi.aria")} />

      {sessions.length ? (
        hasCompetencies ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <ScoreTrend sessions={practiced} lang={lang} onNavigate={onNavigate} t={t} />
              <CompetencyFocus sessions={practiced} onPractice={setSelectedJob} t={t} />
            </div>
            <RecentActivity sessions={sessions} lang={lang} onNavigate={onNavigate} t={t} />
          </>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <ScoreTrend sessions={practiced} lang={lang} onNavigate={onNavigate} t={t} />
            <RecentActivity sessions={sessions} lang={lang} onNavigate={onNavigate} t={t} />
          </div>
        )
      ) : null}

      <SuggestedJobs
        profiles={profiles}
        savedJobIds={savedJobIds}
        fits={fits}
        onToggleSave={toggleSave}
        onNavigate={onNavigate}
        onPractice={setSelectedJob}
        t={t}
      />

      <AbortConfirmationModal
        isOpen={closingSession !== null}
        onClose={() => !closing && setClosingSession(null)}
        onConfirm={(reason) => void confirmClose(reason)}
        isSubmitting={closing}
      />
      <JobInterviewCvModal open={selectedJob !== null} jobTitle={selectedJob?.title ?? ""} jobProfileId={selectedJob?.id} onClose={() => setSelectedJob(null)} />
    </div>
  );
}

/** Loads the overview's data, then renders `DashboardOverview`. */
export function UserDashboardHome(props: Props) {
  const { t } = useLanguage();
  const { profile } = useAuthProfile();
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [sessions, setSessions] = useState<StoredDashboardSession[]>([]);
  const [cvCount, setCvCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // First load shows the skeleton; refreshes (window focus) update in place so
  // the page isn't swapped out and entrance animations don't replay.
  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    const [profilesResult, sessionsResult, cvsResult] = await Promise.allSettled([
      jobProfileApi.list({ limit: 6, order: "desc" }),
      interviewRuntimeApi.list(),
      userCvApi.list(1),
    ]);
    setCvCount(cvsResult.status === "fulfilled" ? cvsResult.value.data.total : null);
    if (profilesResult.status === "fulfilled") {
      setProfiles((profilesResult.value.data.items ?? []).filter((profile) => profile.status === "ACTIVE"));
    } else {
      setProfiles([]);
      setError(true);
      if (axios.isAxiosError(profilesResult.reason)) console.error("Dashboard profiles:", profilesResult.reason.message);
    }
    if (sessionsResult.status === "fulfilled") {
      setSessions(
        sessionsResult.value
          .map((session) => ({
            sessionId: session.sessionId,
            jobId: session.jobId,
            // The API returns null for a session whose job was removed; the card
            // type models "absent" as undefined so it can fall back to a label.
            jobTitle: session.jobTitle ?? undefined,
            startedAt: session.startedAt,
            mode: session.mode,
            status: session.status,
            experienceType: session.experienceType,
            endedAt: session.endedAt,
            endReason: session.endReason ?? null,
            overallScore: session.overallScore ?? null,
            answeredTurns: session.answeredTurns,
            totalTurns: session.totalTurns,
            competencyScores: session.competencyScores ?? [],
          }))
          .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
      );
    } else {
      setSessions([]);
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);
  useEffect(() => {
    const refresh = () => void loadDashboard(true);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [loadDashboard]);

  // Same end path as the room: chat interviews complete through the chat
  // contract (it writes the wrap-up); voice/video and practice use /close.
  const closeSession = async (session: StoredDashboardSession, reason: "USER_ENDED" | "TECHNICAL_FAILURE") => {
    try {
      if (session.mode === "text" && session.experienceType !== "question_practice") {
        await interviewChatApi.complete(session.sessionId, reason);
      } else {
        await interviewRuntimeApi.close(session.sessionId, reason);
      }
      return true;
    } catch {
      return false;
    }
  };

  if (loading) return <DashboardSkeleton label={t("userDash.loading")} />;
  return (
    <DashboardOverview
      {...props}
      userName={profile?.name}
      profiles={profiles}
      sessions={sessions}
      cvCount={cvCount}
      error={error}
      onRetry={() => void loadDashboard()}
      onCloseSession={closeSession}
    />
  );
}
