"use client";

import React from "react";
import Link from "next/link";
import { JobCardProps } from "./job-card.types";
import JobCardHeader from "./JobCardHeader";
import JobMetadata from "./JobMetadata";
import JobSalary from "./JobSalary";
import JobMatchSummary from "./JobMatchSummary";
import JobCardFooter from "./JobCardFooter";

export function JobCard({
  job,
  onToggleSave,
  onInterview,
  onClick,
  href,
  className = "",
}: JobCardProps) {
  const targetHref = href || `/dashboard/jobs/${job.id}`;

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSave?.(job.id, Boolean(job.saved));
  };

  const handleInterview = onInterview
    ? () => onInterview(job.id)
    : undefined;

  return (
    <article
      onClick={() => onClick?.(job.id)}
      className={`group relative flex h-full flex-col justify-between rounded-2xl border border-[#DCE4F3] bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#204195]/40 hover:shadow-md ${className}`}
    >
      {/* Clickable Card Overlay */}
      <Link
        href={targetHref}
        className="absolute inset-0 z-[1] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#204195]/30"
        aria-label={job.company?.name ? `${job.title} - ${job.company.name}` : job.title}
      />

      {/* Main Content Area */}
      <div className="relative z-[2] flex flex-1 flex-col space-y-3.5">
        {/* 1. Header: Logo, Title, Company, Category, Verified, Bookmark */}
        <JobCardHeader
          title={job.title}
          company={job.company}
          category={job.category}
          saved={job.saved}
          onToggleSave={handleToggleSave}
        />

        {/* 2. Metadata: Location, Workplace, Experience, Employment, Seniority */}
        <JobMetadata
          location={job.location}
          employmentType={job.employmentType}
          seniority={job.seniority}
          experience={job.experience}
        />

        {/* 3. Salary: Clean formatted range or null */}
        <JobSalary salary={job.salary} />

        {/* 4. AI Match Section: Clean compact panel or null */}
        <JobMatchSummary match={job.match} />
      </div>

      {/* 5. Footer: Posted time, source, View Job */}
      <div className="relative z-[2] mt-4">
        <JobCardFooter
          postedAt={job.postedAt}
          sourceName={job.source?.name}
          onInterview={handleInterview}
        />
      </div>
    </article>
  );
}

export default JobCard;
