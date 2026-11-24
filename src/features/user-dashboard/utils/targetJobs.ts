import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { GapItem, ProgressSession } from "@features/progress/services/progress.service";
import { hasScore, isFailedStart, type StoredDashboardSession } from "../components/DashboardSections";

export type PreparationStatus = "in_progress" | "due" | "not_started" | "practising" | "unknown";
export type JobPreparation = {
  job: JobProfile;
  status: PreparationStatus;
  sessions: StoredDashboardSession[];
  openSession: StoredDashboardSession | null;
  dueGap: GapItem | null;
  latestScoredSession: (StoredDashboardSession & { overallScore: number }) | null;
  latestSession: StoredDashboardSession | null;
};

/** Saved, active profiles are the target-job menu source, including unseen jobs. */
export function savedTargetJobs(profiles: JobProfile[], savedJobIds: Set<string>): JobProfile[] {
  return profiles.filter((profile) => savedJobIds.has(profile.id) && (profile.listingStatus ?? profile.status) === "ACTIVE");
}

/** Keep a valid selection; otherwise choose the most recently practised saved job, then the first saved job. */
export function resolveTargetJobId(
  jobs: Pick<JobProfile, "id">[],
  currentId: string | null,
  sessions: ProgressSession[],
): string | null {
  if (currentId && jobs.some((job) => job.id === currentId)) return currentId;
  const available = new Set(jobs.map((job) => job.id));
  const latestSavedPractice = sessions
    .filter((session) => session.jobId && available.has(session.jobId))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return latestSavedPractice?.jobId ?? jobs[0]?.id ?? null;
}

/** Build factual preparation states only for saved jobs; an unavailable history never implies "not started". */
export function jobPreparations(
  jobs: JobProfile[],
  savedJobIds: Set<string>,
  sessions: StoredDashboardSession[],
  dueGaps: GapItem[],
  sessionsAvailable = true,
): JobPreparation[] {
  const rank: Record<PreparationStatus, number> = {
    in_progress: 0,
    due: 1,
    not_started: 2,
    practising: 3,
    unknown: 4,
  };
  return jobs
    .filter((job) => savedJobIds.has(job.id) && (job.listingStatus ?? job.status) === "ACTIVE")
    .map((job) => {
      const jobSessions = sessions
        .filter((session) => session.jobId === job.id && !isFailedStart(session))
        .slice()
        .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
      const openSession = jobSessions.find((session) => session.status !== "CLOSED") ?? null;
      const dueGap = dueGaps.find((gap) => gap.due && gap.lastSeen.jobId === job.id) ?? null;
      const latestScoredSession = jobSessions.find(hasScore) ?? null;
      const historyTruncated = sessions.length >= 100 && jobSessions.length === 0;
      const status: PreparationStatus = !sessionsAvailable || historyTruncated
        ? "unknown"
        : openSession
          ? "in_progress"
          : dueGap
            ? "due"
            : jobSessions.length === 0
              ? "not_started"
              : "practising";
      return {
        job,
        status,
        sessions: jobSessions,
        openSession,
        dueGap,
        latestScoredSession,
        latestSession: jobSessions[0] ?? null,
      };
    })
    .sort((a, b) => rank[a.status] - rank[b.status]);
}
