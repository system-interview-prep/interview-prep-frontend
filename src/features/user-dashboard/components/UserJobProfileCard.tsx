"use client";

import React, { useMemo } from "react";
import { JobCard } from "@/components/jobs/JobCard";
import { JobCardData, JobCardMatch } from "@/components/jobs/job-card.types";
import { mapJobToJobCard } from "@/components/jobs/job-card.utils";
import type { JobProfile } from "@features/admin/services/jobProfile.service";

export type UserJobProfileCardProps = {
  jobId?: string;
  job?: JobProfile | JobCardData;
  viewDetailAria?: string;
  title?: string;
  categoryLabel?: string;
  keywordsLine?: string;
  updatedShort?: string;
  updatedPrefix?: string;
  interviewCta?: string;
  onInterview?: () => void;
  showKeywords?: boolean;
  saved?: boolean;
  onToggleSave?: (jobId: string, currentSaved: boolean) => void;
  match?: JobCardMatch;
};

export function UserJobProfileCard(props: UserJobProfileCardProps) {
  const {
    job,
    jobId,
    title,
    categoryLabel,
    updatedShort,
    onInterview,
    saved,
    onToggleSave,
    match,
  } = props;

  const cardData: JobCardData = useMemo(() => {
    if (job && "company" in job && typeof job.company === "object") {
      return job as JobCardData;
    }
    if (job) {
      return mapJobToJobCard(job, { match });
    }
    // Fallback adapter for legacy callers
    return {
      id: jobId || "",
      title: title || "",
      company: undefined,
      category: categoryLabel,
      postedAt: updatedShort,
      saved: Boolean(saved),
      match,
    };
  }, [job, jobId, title, categoryLabel, updatedShort, saved, match]);

  return (
    <JobCard
      job={cardData}
      onToggleSave={onToggleSave}
      onInterview={onInterview}
    />
  );
}

export default UserJobProfileCard;
