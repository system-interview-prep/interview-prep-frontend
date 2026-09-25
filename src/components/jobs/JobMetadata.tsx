"use client";

import React from "react";
import { MapPin, Briefcase, Clock } from "lucide-react";
import {
  EmploymentType,
  JobCardExperience,
  JobCardLocation,
  SeniorityLevel,
  WorkplaceType,
} from "./job-card.types";
import { formatExperience } from "./job-card.utils";
import { useLanguage } from "@/i18n/LanguageProvider";

interface JobMetadataProps {
  location?: JobCardLocation;
  employmentType?: EmploymentType;
  seniority?: SeniorityLevel;
  experience?: JobCardExperience;
}

function getWorkplaceLabel(type: WorkplaceType, t: (k: string) => string): string {
  switch (type) {
    case "remote":
      return t("jobs.workplace.remote") || "Remote";
    case "hybrid":
      return t("jobs.workplace.hybrid") || "Hybrid";
    case "onsite":
      return t("jobs.workplace.onsite") || "On-site";
    default:
      return type;
  }
}

function getEmploymentLabel(type: EmploymentType, t: (k: string) => string): string {
  switch (type) {
    case "full_time":
      return t("jobs.employment.full_time") || "Full-time";
    case "part_time":
      return t("jobs.employment.part_time") || "Part-time";
    case "internship":
      return t("jobs.employment.internship") || "Internship";
    case "contract":
      return t("jobs.employment.contract") || "Contract";
    case "temporary":
      return t("jobs.employment.temporary") || "Temporary";
    default:
      return type;
  }
}

function getSeniorityLabel(level: SeniorityLevel, t: (k: string) => string): string {
  switch (level) {
    case "intern":
      return t("jobs.seniority.intern") || "Intern";
    case "fresher":
      return t("jobs.seniority.fresher") || "Fresher";
    case "junior":
      return t("jobs.seniority.junior") || "Junior";
    case "mid":
      return t("jobs.seniority.mid") || "Mid-level";
    case "senior":
      return t("jobs.seniority.senior") || "Senior";
    case "lead":
      return t("jobs.seniority.lead") || "Lead";
    case "manager":
      return t("jobs.seniority.manager") || "Manager";
    default:
      return level;
  }
}

export function JobMetadata({
  location,
  employmentType,
  seniority,
  experience,
}: JobMetadataProps) {
  const { t, lang } = useLanguage();

  // Location string parts
  const locationParts: string[] = [];
  if (location?.display) {
    locationParts.push(location.display);
  }
  if (location?.workplaceType) {
    const wpLabel = getWorkplaceLabel(location.workplaceType, t);
    // Only add if not redundant with display
    if (!locationParts.some((p) => p.toLowerCase().includes(wpLabel.toLowerCase()))) {
      locationParts.push(wpLabel);
    }
  }

  // Work type & Seniority parts
  const jobTypeParts: string[] = [];
  if (employmentType) {
    jobTypeParts.push(getEmploymentLabel(employmentType, t));
  }
  if (seniority) {
    jobTypeParts.push(getSeniorityLabel(seniority, t));
  }

  const experienceText = formatExperience(experience, lang);

  const hasLocationRow = locationParts.length > 0;
  const hasExperienceRow = Boolean(experienceText);
  const hasJobTypeRow = jobTypeParts.length > 0;

  if (!hasLocationRow && !hasExperienceRow && !hasJobTypeRow) {
    return null;
  }

  return (
    <div className="space-y-1.5 text-xs text-[#607096]">
      {/* Row 1: Location & Workplace Type */}
      {hasLocationRow && (
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0 text-[#94A3B8]" aria-hidden="true" />
          <span className="truncate">{locationParts.join(" · ")}</span>
        </div>
      )}

      {/* Row 2: Experience */}
      {hasExperienceRow && (
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0 text-[#94A3B8]" aria-hidden="true" />
          <span className="truncate">{experienceText}</span>
        </div>
      )}

      {/* Row 3: Employment Type & Seniority */}
      {hasJobTypeRow && (
        <div className="flex items-center gap-1.5">
          <Briefcase className="size-3.5 shrink-0 text-[#94A3B8]" aria-hidden="true" />
          <span className="truncate">{jobTypeParts.join(" · ")}</span>
        </div>
      )}
    </div>
  );
}

export default JobMetadata;
