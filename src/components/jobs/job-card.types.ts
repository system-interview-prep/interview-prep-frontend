export type WorkplaceType = "remote" | "hybrid" | "onsite" | "on_site";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "internship"
  | "contract"
  | "temporary";

export type SeniorityLevel =
  | "intern"
  | "fresher"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "manager";

export interface JobCardCompany {
  name?: string | null;
  logoUrl?: string | null;
  verified?: boolean;
}

export interface JobCardLocation {
  display: string;
  workplaceType?: WorkplaceType;
}

export interface JobCardExperience {
  minYears?: number | null;
  maxYears?: number | null;
  display?: string;
}

export interface JobCardSalary {
  min?: number | null;
  max?: number | null;
  currency?: string | null;
  period?: "hour" | "month" | "year" | null;
  negotiable?: boolean | null;
  display?: string;
}

export interface JobCardMatch {
  score: number; // 0 to 100
  signals?: {
    experience?: "strong" | "match" | "low" | boolean;
    skills?: "strong" | "match" | "low" | boolean;
    location?: "strong" | "match" | "low" | boolean;
  };
  labels?: string[];
}

export interface JobCardData {
  id: string;
  title: string;
  company?: JobCardCompany;
  category?: string;
  location?: JobCardLocation;
  employmentType?: EmploymentType;
  seniority?: SeniorityLevel;
  experience?: JobCardExperience;
  salary?: JobCardSalary;
  postedAt?: string;
  source?: {
    name?: string;
    externalJobId?: string;
  };
  match?: JobCardMatch;
  saved?: boolean;
}

export interface JobCardProps {
  job: JobCardData;
  onToggleSave?: (jobId: string, currentSaved: boolean) => void;
  onInterview?: (jobId: string) => void;
  onClick?: (jobId: string) => void;
  href?: string;
  className?: string;
}
