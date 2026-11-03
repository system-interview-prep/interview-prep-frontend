"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { jobProfileApi, type JobProfile } from "@features/admin/services/jobProfile.service";
import { useSavedJobs } from "@features/user-dashboard/hooks/useSavedJobs";
import { useTargetJob } from "@features/user-dashboard/hooks/useTargetJob";
import { interviewRuntimeApi, type InterviewRuntimeSession } from "@features/interview/services/interviewRuntime.service";
import { resolveTargetJobId, savedTargetJobs } from "@features/user-dashboard/utils/targetJobs";
import { progressApi, SKILL_AREAS, type PracticeProgress, type SkillArea } from "../services/progress.service";
import { shortDate } from "../utils/progressFormat";
import { MoreSection } from "./ProgressOverview";
import { ProgressV3 } from "./ProgressV3";
import { RealInterviewsCard } from "./ReadinessCards";
import { WeeklyStreakCard } from "./StreakCard";

/** Unique x labels: two interviews on the same day must not share a category. */
export function uniqueLabels(dates: string[], locale: string): string[] {
  const seen = new Map<string, number>();
  const times = dates.map((iso) => new Date(iso).getTime()).filter(Number.isFinite);
  const withYear = times.length > 1 && Math.max(...times) - Math.min(...times) > 300 * 86_400_000;
  return dates.map((iso) => {
    const base = withYear ? `${shortDate(iso, locale)}/${String(new Date(iso).getFullYear()).slice(2)}` : shortDate(iso, locale);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
}
/** Group skill data in the display order shared with the progress API. */
export function groupByArea<T extends { area?: SkillArea }>(skills: T[]): { area: SkillArea; skills: T[] }[] {
  return SKILL_AREAS.map((area) => ({ area, skills: skills.filter((skill) => (skill.area ?? "other") === area) })).filter(
    (group) => group.skills.length > 0,
  );
}

export function ProgressPage({ initialProgress = null }: { initialProgress?: PracticeProgress | null } = {}) {
  const { t } = useLanguage();
  const [progress, setProgress] = useState<PracticeProgress | null>(initialProgress);
  const [failed, setFailed] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [runtimeSessions, setRuntimeSessions] = useState<InterviewRuntimeSession[]>([]);
  const [runtimeSessionsFailed, setRuntimeSessionsFailed] = useState(false);
  const { savedJobIds } = useSavedJobs();
  const { targetJobId, selectTargetJob } = useTargetJob();

  useEffect(() => {
    let active = true;
    const loadSavedProfiles = async () => {
      const found: JobProfile[] = [];
      let cursor: string | undefined;
      const seenCursors = new Set<string>();
      for (;;) {
        const { data } = await jobProfileApi.list({ limit: 100, order: "desc", cursor });
        found.push(...(data.items ?? []));
        const next = data.nextCursor;
        if (!next || seenCursors.has(next)) break;
        seenCursors.add(next);
        cursor = next;
      }
      return savedTargetJobs(found, savedJobIds);
    };
    void loadSavedProfiles()
      .then((items) => { if (active) setProfiles(items); })
      .catch(() => { if (active) setProfiles([]); })
    return () => { active = false; };
  }, [savedJobIds]);

  const targetJobs = profiles;
  const effectiveJobId = resolveTargetJobId(targetJobs, targetJobId, progress?.sessions ?? []);

  useEffect(() => {
    if (effectiveJobId && effectiveJobId !== targetJobId) selectTargetJob(effectiveJobId);
  }, [effectiveJobId, selectTargetJob, targetJobId]);

  const load = useCallback(() => {
    setFailed(false);
    progressApi
      .get()
      .then(setProgress)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    if (!initialProgress) load();
  }, [load, initialProgress]);

  const loadRuntimeSessions = useCallback(() => {
    void interviewRuntimeApi.list()
      .then((items) => {
        setRuntimeSessions(items);
        setRuntimeSessionsFailed(false);
      })
      .catch(() => setRuntimeSessionsFailed(true));
  }, []);

  useEffect(() => {
    loadRuntimeSessions();
  }, [loadRuntimeSessions]);

  const changeGoal = async (goal: number) => {
    if (!progress || goal === progress.weeklyGoal) return;
    setSavingGoal(true);
    try {
      await progressApi.setWeeklyGoal(goal);
      setProgress(await progressApi.get());
    } catch {
      // Keep the saved goal visible if the request fails.
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 text-[#14244B] sm:pb-0">
      <header>
        <h1 className="font-display text-xl font-black tracking-tight sm:text-2xl">{t("practiceProgress.title")}</h1>
      </header>

      {failed ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <p>{t("practiceProgress.error")}</p>
          <button type="button" onClick={load} className="mt-3 font-bold underline">
            {t("practiceProgress.retry")}
          </button>
        </div>
      ) : !progress ? (
        <div className="flex items-center gap-2 rounded-2xl border border-[#DCE4F3] bg-white p-6 text-sm text-[#607096]">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t("practiceProgress.loading")}
        </div>
      ) : (
        <>
          <ProgressV3
            progress={progress}
            onGoal={changeGoal}
            savingGoal={savingGoal}
            targetJobs={targetJobs}
            targetJobId={effectiveJobId}
            onTargetJobChange={selectTargetJob}
            runtimeSessions={runtimeSessions}
            runtimeSessionsFailed={runtimeSessionsFailed}
            onRetryRuntimeSessions={loadRuntimeSessions}
          />
          <div className="space-y-3">
            <MoreSection title={t("practiceProgress.more.real")}>
              <RealInterviewsCard progress={progress} />
            </MoreSection>
            <MoreSection title={t("practiceProgress.more.calendar")}>
              <WeeklyStreakCard progress={progress} onGoal={changeGoal} savingGoal={savingGoal} />
            </MoreSection>
          </div>
        </>
      )}
    </div>
  );
}
