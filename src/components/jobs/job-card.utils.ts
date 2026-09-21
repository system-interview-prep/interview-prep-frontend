import {
  EmploymentType,
  JobCardData,
  JobCardMatch,
  JobCardSalary,
  SeniorityLevel,
  WorkplaceType,
} from "./job-card.types";

function cleanString(val: unknown): string | undefined {
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === "n/a" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined" ||
    trimmed.toLowerCase() === "unknown" ||
    trimmed.toLowerCase() === "not provided"
  ) {
    return undefined;
  }
  return trimmed;
}

export function normalizeWorkplaceType(raw: unknown): WorkplaceType | undefined {
  const str = cleanString(raw)?.toLowerCase();
  if (!str) return undefined;
  if (str.includes("remote") || str.includes("từ xa")) return "remote";
  if (str.includes("hybrid") || str.includes("linh hoạt")) return "hybrid";
  if (str.includes("onsite") || str.includes("on_site") || str.includes("văn phòng") || str.includes("on-site")) {
    return "onsite";
  }
  return undefined;
}

export function normalizeEmploymentType(raw: unknown): EmploymentType | undefined {
  const str = cleanString(raw)?.toLowerCase();
  if (!str) return undefined;
  if (str.includes("full") || str.includes("toàn thời gian")) return "full_time";
  if (str.includes("part") || str.includes("bán thời gian")) return "part_time";
  if (str.includes("intern") || str.includes("thực tập")) return "internship";
  if (str.includes("contract") || str.includes("hợp đồng")) return "contract";
  if (str.includes("temp") || str.includes("tạm thời")) return "temporary";
  return undefined;
}

export function normalizeSeniority(raw: unknown): SeniorityLevel | undefined {
  const str = cleanString(raw)?.toLowerCase();
  if (!str) return undefined;
  if (str.includes("intern") || str.includes("thực tập")) return "intern";
  if (str.includes("fresher") || str.includes("entry") || str.includes("mới tốt nghiệp")) return "fresher";
  if (str.includes("junior")) return "junior";
  if (str.includes("mid") || str.includes("middle")) return "mid";
  if (str.includes("senior")) return "senior";
  if (str.includes("lead") || str.includes("trưởng nhóm")) return "lead";
  if (str.includes("manager") || str.includes("quản lý")) return "manager";
  return undefined;
}

export function getCompanyInitials(name?: string): string {
  if (!name) return "CO";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase() || "CO";
}

export function formatSalary(
  salary?: JobCardSalary,
  periodLabels?: { month?: string; year?: string; hour?: string; negotiable?: string },
  locale: string = "vi"
): string | null {
  if (!salary) return null;
  if (salary.display) return salary.display;

  const { min, max, currency = "VND", period = "month", negotiable } = salary;
  if (min == null && max == null) {
    if (negotiable === true) {
      return periodLabels?.negotiable || (locale === "vi" ? "Thỏa thuận" : "Negotiable");
    }
    return null;
  }

  const curr = (currency || "VND").toUpperCase();
  const isVnd = curr === "VND" || curr === "VNĐ";
  const isUsd = curr === "USD" || curr === "$";

  const formatNum = (num: number) => {
    if (isVnd) {
      if (num >= 1_000_000) {
        const m = num / 1_000_000;
        return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
      }
      if (num >= 1_000) {
        return `${num / 1_000}k`;
      }
      return num.toLocaleString();
    }
    if (isUsd) {
      return `$${num.toLocaleString()}`;
    }
    return `${num.toLocaleString()} ${currency}`;
  };

  let rangeStr = "";
  if (min != null && max != null) {
    if (isVnd) {
      rangeStr = `${formatNum(min)} – ${formatNum(max)} VND`;
    } else if (isUsd) {
      rangeStr = `${formatNum(min)} – ${formatNum(max)}`;
    } else {
      rangeStr = `${min.toLocaleString()} – ${max.toLocaleString()} ${currency}`;
    }
  } else if (min != null) {
    rangeStr = isVnd ? `Từ ${formatNum(min)} VND` : `From ${formatNum(min)}`;
  } else if (max != null) {
    rangeStr = isVnd ? `Tới ${formatNum(max)} VND` : `Up to ${formatNum(max)}`;
  }

  let periodSuffix = "";
  if (period === "year") {
    periodSuffix = periodLabels?.year || (locale === "vi" ? "/ năm" : "/ year");
  } else if (period === "hour") {
    periodSuffix = periodLabels?.hour || (locale === "vi" ? "/ giờ" : "/ hour");
  } else if (period === "month") {
    periodSuffix = periodLabels?.month || (locale === "vi" ? "/ tháng" : "/ month");
  }

  return periodSuffix ? `${rangeStr} ${periodSuffix}`.trim() : rangeStr;
}

export function formatExperience(
  exp?: { minYears?: number | null; maxYears?: number | null; display?: string },
  locale: string = "vi"
): string | null {
  if (!exp) return null;
  if (exp.display) return exp.display;
  const { minYears, maxYears } = exp;
  if (minYears == null && maxYears == null) return null;
  if (minYears != null && maxYears != null) {
    if (minYears === maxYears) {
      return locale === "vi" ? `${minYears} năm kinh nghiệm` : `${minYears} yrs experience`;
    }
    return locale === "vi"
      ? `${minYears}–${maxYears} năm kinh nghiệm`
      : `${minYears}–${maxYears} yrs experience`;
  }
  if (minYears != null) {
    return locale === "vi" ? `${minYears}+ năm kinh nghiệm` : `${minYears}+ yrs experience`;
  }
  if (maxYears != null) {
    return locale === "vi"
      ? `Tối đa ${maxYears} năm kinh nghiệm`
      : `Up to ${maxYears} yrs experience`;
  }
  return null;
}

export function formatRelativeTime(isoString?: string, locale: string = "vi"): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = Date.now();
    const diffMs = now - d.getTime();
    if (Number.isNaN(diffMs)) return "";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return locale === "vi" ? "Vừa xong" : "Just now";
    }
    if (diffHours < 24) {
      return locale === "vi" ? `${diffHours}h trước` : `${diffHours}h ago`;
    }
    if (diffDays === 1) {
      return locale === "vi" ? "Hôm qua" : "Yesterday";
    }
    if (diffDays < 7) {
      return locale === "vi" ? `${diffDays} ngày trước` : `${diffDays}d ago`;
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return locale === "vi" ? `${weeks} tuần trước` : `${weeks}w ago`;
    }
    return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" });
  } catch {
    return "";
  }
}

/**
 * Normalizes raw job representations from backend or custom sources into `JobCardData`.
 * Prioritizes published top-level fields directly. NEVER fallbacks published UI from structuredData.
 */
export function mapJobToJobCard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: any,
  options?: {
    savedJobIds?: Set<string>;
    match?: JobCardMatch;
  }
): JobCardData {
  if (!raw) {
    return {
      id: "",
      title: "",
    };
  }

  // Resolve ID
  const id = String(raw.id || "");

  // Resolve Title
  const title = String(raw.title || "Untitled Role").trim();

  // Resolve Company: Only from published company fields, NEVER fallback to category/taxonomy or structuredData!
  const companyName =
    cleanString(raw.company?.name) ||
    cleanString(raw.companyName) ||
    cleanString(raw.company_name);

  const logoUrl =
    cleanString(raw.company?.logoUrl) ||
    cleanString(raw.company?.logo_url) ||
    cleanString(raw.companyLogo) ||
    cleanString(raw.company_logo);

  // Verified: Backend has no verified field. Only true if explicitly passed true.
  const verified = Boolean(
    raw.company?.verified === true || raw.verified === true
  );

  const company =
    companyName || logoUrl
      ? {
          name: companyName || null,
          logoUrl: logoUrl || null,
          verified,
        }
      : undefined;

  // Resolve Category / Taxonomy
  const category =
    cleanString(raw.primaryTaxonomy?.label) ||
    cleanString(raw.primary_taxonomy?.label) ||
    cleanString(raw.category) ||
    cleanString(raw.jobFamily) ||
    cleanString(raw.job_family);

  // Resolve Location & Workplace: Only from top-level published fields
  const rawLoc =
    cleanString(raw.location?.display) ||
    cleanString(raw.location);

  const rawWork =
    raw.workMode ||
    raw.work_mode ||
    raw.location?.workplaceType ||
    raw.location?.workplace_type ||
    raw.workplaceType ||
    raw.workplace_type;

  const workplaceType = normalizeWorkplaceType(rawWork);

  const location = rawLoc || workplaceType
    ? {
        display: rawLoc || (workplaceType === "remote" ? "Remote" : workplaceType === "hybrid" ? "Hybrid" : "On-site"),
        workplaceType,
      }
    : undefined;

  // Resolve Employment Type & Seniority: Only from published fields
  const rawEmp =
    raw.employmentType ||
    raw.employment_type ||
    raw.jobType ||
    raw.job_type ||
    raw.work_type;

  const employmentType = normalizeEmploymentType(rawEmp);

  const rawSeniority =
    raw.seniority ||
    raw.seniority_level ||
    raw.experience_level;

  const seniority = normalizeSeniority(rawSeniority);

  // Resolve Experience: Only from published fields
  let experience: { minYears?: number | null; maxYears?: number | null; display?: string } | undefined = undefined;
  const rawExp = raw.experience;
  if (rawExp && typeof rawExp === "object") {
    const minYears =
      typeof rawExp.minYears === "number"
        ? rawExp.minYears
        : typeof rawExp.min_years === "number"
          ? rawExp.min_years
          : null;
    const maxYears =
      typeof rawExp.maxYears === "number"
        ? rawExp.maxYears
        : typeof rawExp.max_years === "number"
          ? rawExp.max_years
          : null;
    if (minYears != null || maxYears != null) {
      experience = { minYears, maxYears };
    }
  } else if (
    typeof raw.experience_min_years === "number" ||
    typeof raw.experience_max_years === "number"
  ) {
    experience = {
      minYears: raw.experience_min_years ?? null,
      maxYears: raw.experience_max_years ?? null,
    };
  }

  // Resolve Salary: Only from published fields, NEVER fallback to structuredData
  let salary: JobCardSalary | undefined = undefined;
  const rawSal = raw.salary;

  if (rawSal && typeof rawSal === "object") {
    const min =
      typeof rawSal.min === "number"
        ? rawSal.min
        : typeof rawSal.salary_min === "number"
          ? rawSal.salary_min
          : typeof rawSal.from === "number"
            ? rawSal.from
            : null;

    const max =
      typeof rawSal.max === "number"
        ? rawSal.max
        : typeof rawSal.salary_max === "number"
          ? rawSal.salary_max
          : typeof rawSal.to === "number"
            ? rawSal.to
            : null;

    const currency = cleanString(rawSal.currency) || null;
    const period = cleanString(rawSal.period) || null;
    const negotiable = typeof rawSal.negotiable === "boolean" ? rawSal.negotiable : null;
    const display = cleanString(rawSal.display);

    if (min != null || max != null || negotiable === true || display) {
      salary = {
        min,
        max,
        currency,
        period:
          period === "hour" || period === "month" || period === "year"
            ? period
            : null,
        negotiable,
        display,
      };
    }
  } else if (typeof rawSal === "string" && cleanString(rawSal)) {
    salary = { display: rawSal.trim() };
  }

  // Resolve Date: NEVER fallback postedAt to createdAt or updatedAt!
  const postedAt = cleanString(raw.postedAt);

  // Resolve Source
  const sourceName =
    cleanString(raw.source?.name) ||
    cleanString(raw.source) ||
    cleanString(raw.parseSource);

  const source = sourceName ? { name: sourceName } : undefined;

  // Resolve Match
  const match: JobCardMatch | undefined =
    options?.match ||
    (raw.match && typeof raw.match.score === "number" ? raw.match : undefined);

  // Resolve Saved
  const saved = Boolean(
    raw.saved ||
      (id && options?.savedJobIds?.has(id))
  );

  return {
    id,
    title,
    company,
    category,
    location,
    employmentType,
    seniority,
    experience,
    salary,
    postedAt,
    source,
    match,
    saved,
  };
}
