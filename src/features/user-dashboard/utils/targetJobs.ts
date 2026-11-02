import type { JobProfile } from "@features/admin/services/jobProfile.service";
import type { ProgressSession } from "@features/progress/services/progress.service";

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
