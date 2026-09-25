import api from "@lib/apiClient";

export type JobProfileStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";
export type ListingStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "CLOSED" | "EXPIRED";
export type FinalizeListingStatus = "DRAFT" | "ACTIVE";
export type ProcessingStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";
export type WorkMode = "remote" | "hybrid" | "on_site";
export type EmploymentType = "full_time" | "part_time" | "internship" | "contract" | "temporary";
export type SeniorityLevel = "intern" | "fresher" | "junior" | "mid" | "senior" | "lead" | "manager";
export type JobSourceType =
  | "internal_upload"
  | "manual"
  | "greenhouse"
  | "lever"
  | "company_career"
  | "other";

export type JobProfileCompany = {
  name?: string | null;
  logoUrl?: string | null;
  verified?: boolean;
};

export type JobProfileExperience = {
  minYears?: number | null;
  maxYears?: number | null;
};

export type JobProfileSalary = {
  min?: number | null;
  max?: number | null;
  currency?: string | null;
  period?: "hour" | "month" | "year" | null;
  negotiable?: boolean | null;
};

export type JobProfileSource = {
  type: JobSourceType | string;
  key: string;
  name?: string | null;
  url?: string | null;
  applyUrl?: string | null;
};

export type JobProfileTaxonomy = {
  conceptId: string;
  version?: string | null;
  label: string;
  kind?: string | null;
};

export type JobProfile = {
  id: string;
  externalJobId?: string | null;
  title: string;
  company: JobProfileCompany | null;
  location: string | null;
  workMode: WorkMode | null;
  employmentType: EmploymentType | null;
  seniority: SeniorityLevel | null;
  experience: JobProfileExperience | null;
  salary: JobProfileSalary | null;
  primaryTaxonomy: JobProfileTaxonomy | null;
  source: JobProfileSource | null;
  postedAt: string | null;
  listingStatus: ListingStatus;
  processingStatus: ProcessingStatus;
  /** Legacy status alias for backwards compatibility */
  status?: JobProfileStatus;
  keywords?: string[] | null;
  description?: string | null;
  /** schema-validated canonical JD returned by the parser (for audit/review) */
  structuredData?: Record<string, unknown> | null;
  /** extractor metadata retained for audit and troubleshooting */
  extractedMetadata?: Record<string, unknown> | null;
  rawJdText?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobProfileUploadStatus = "PENDING" | "PARSING" | "AI_PROCESSING" | "DONE" | "FAILED";

export type LabeledValue = { label: string; value: unknown };

export type JobProfileUpload = {
  id: string;
  userId: string;
  filename: string;
  contentType: string;
  size: number;
  s3Key: string;
  url: string;
  status: JobProfileUploadStatus;
  parseSource?: string | null;
  rawText?: string | null;
  description?: string | null;
  /** schema-validated canonical JD returned by the parser */
  structuredData?: Record<string, unknown> | null;
  /** extractor metadata retained for audit and troubleshooting */
  extractedMetadata?: Record<string, unknown> | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobProfileListResponse = {
  items: JobProfile[];
  nextCursor?: string;
  /** When the backend returns a total count, callers can avoid walking all pages. */
  total?: number;
};

export type JobDescriptionVersion = {
  id: string;
  jobDescriptionId: string;
  versionNumber: number;
  status: "DRAFT" | "ACTIVE" | "SUPERSEDED";
  processingStatus: ProcessingStatus;
  filename?: string | null;
  checksum?: string | null;
  error?: string | null;
  createdAt: string;
  publishedAt?: string | null;
  rawText?: string | null;
  structuredData?: Record<string, unknown> | null;
  extractedMetadata?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

export type FinalizeUploadBody = {
  title: string;
  companyName?: string | null;
  companyLogoUrl?: string | null;
  location?: string | null;
  workMode?: WorkMode | null;
  employmentType?: EmploymentType | null;
  seniority?: SeniorityLevel | null;
  experience?: {
    minYears?: number | null;
    maxYears?: number | null;
  } | null;
  salary?: {
    min?: number | null;
    max?: number | null;
    currency?: string | null;
    period?: "hour" | "month" | "year" | null;
    negotiable?: boolean | null;
  } | null;
  primaryTaxonomyConceptId?: string | null;
  primaryTaxonomyVersion?: string | null;
  keywords?: string[] | null;
  description?: string | null;
  source?: {
    type?: JobSourceType | string;
    key?: string;
    name?: string | null;
    url?: string | null;
    applyUrl?: string | null;
  } | null;
  externalJobId?: string | null;
  postedAt?: string | null;
  listingStatus?: FinalizeListingStatus;
  /** @deprecated Use listingStatus */
  status?: JobProfileStatus;
};

export type CanonicalFinalizeFormState = {
  title: string;
  companyName: string;
  companyLogoUrl: string;
  location: string;
  workMode: "" | WorkMode;
  employmentType: "" | EmploymentType;
  seniority: "" | SeniorityLevel;
  experienceMinYears: string;
  experienceMaxYears: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: "" | "hour" | "month" | "year";
  salaryNegotiable: "unknown" | "yes" | "no";
  primaryTaxonomyConceptId: string;
  keywords: string;
  sourceType: JobSourceType | string;
  sourceKey: string;
  sourceName: string;
  sourceUrl: string;
  applyUrl: string;
  externalJobId: string;
  postedAt: string;
  listingStatus: FinalizeListingStatus;
};

export const initialFinalizeForm: CanonicalFinalizeFormState = {
  title: "",
  companyName: "",
  companyLogoUrl: "",
  location: "",
  workMode: "",
  employmentType: "",
  seniority: "",
  experienceMinYears: "",
  experienceMaxYears: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "VND",
  salaryPeriod: "",
  salaryNegotiable: "unknown",
  primaryTaxonomyConceptId: "",
  keywords: "",
  sourceType: "internal_upload",
  sourceKey: "default",
  sourceName: "",
  sourceUrl: "",
  applyUrl: "",
  externalJobId: "",
  postedAt: "",
  listingStatus: "DRAFT",
};

export function serializeFinalizePayload(
  form: CanonicalFinalizeFormState,
  title: string,
  descriptionHtml?: string | null
): FinalizeUploadBody {
  const cleanStr = (s?: string | null) => (s ? s.trim() || null : null);
  const cleanNum = (s?: string | null) => {
    if (!s) return null;
    const t = s.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isNaN(n) ? null : n;
  };

  const minExp = cleanNum(form.experienceMinYears);
  const maxExp = cleanNum(form.experienceMaxYears);
  const experience =
    minExp != null || maxExp != null ? { minYears: minExp, maxYears: maxExp } : null;

  const minSal = cleanNum(form.salaryMin);
  const maxSal = cleanNum(form.salaryMax);
  const negotiable =
    form.salaryNegotiable === "yes" ? true : form.salaryNegotiable === "no" ? false : null;
  const curr = cleanStr(form.salaryCurrency);
  const rawPeriod = cleanStr(form.salaryPeriod);
  const period: "hour" | "month" | "year" | null =
    rawPeriod === "hour" || rawPeriod === "month" || rawPeriod === "year" ? rawPeriod : null;

  const salary =
    minSal != null || maxSal != null || negotiable != null
      ? {
          min: minSal,
          max: maxSal,
          currency: curr,
          period,
          negotiable,
        }
      : null;

  const sourceName = cleanStr(form.sourceName);
  const sourceUrl = cleanStr(form.sourceUrl);
  const applyUrl = cleanStr(form.applyUrl);
  const source = {
    type: cleanStr(form.sourceType) || "internal_upload",
    key: cleanStr(form.sourceKey) || "default",
    name: sourceName,
    url: sourceUrl,
    applyUrl: applyUrl,
  };

  const rawWorkMode = cleanStr(form.workMode);
  const workMode: WorkMode | null =
    rawWorkMode === "remote" || rawWorkMode === "hybrid" || rawWorkMode === "on_site"
      ? rawWorkMode
      : null;

  const rawEmp = cleanStr(form.employmentType);
  const employmentType: EmploymentType | null =
    rawEmp === "full_time" ||
    rawEmp === "part_time" ||
    rawEmp === "internship" ||
    rawEmp === "contract" ||
    rawEmp === "temporary"
      ? rawEmp
      : null;

  const rawSeniority = cleanStr(form.seniority);
  const seniority: SeniorityLevel | null =
    rawSeniority === "intern" ||
    rawSeniority === "fresher" ||
    rawSeniority === "junior" ||
    rawSeniority === "mid" ||
    rawSeniority === "senior" ||
    rawSeniority === "lead" ||
    rawSeniority === "manager"
      ? rawSeniority
      : null;

  return {
    title,
    companyName: cleanStr(form.companyName),
    companyLogoUrl: cleanStr(form.companyLogoUrl),
    location: cleanStr(form.location),
    workMode,
    employmentType,
    seniority,
    experience,
    salary,
    primaryTaxonomyConceptId: cleanStr(form.primaryTaxonomyConceptId),
    primaryTaxonomyVersion: null,
    keywords: keywordsStringToArray(form.keywords),
    description: descriptionHtml?.trim() ? descriptionHtml.trim() : null,
    source,
    externalJobId: cleanStr(form.externalJobId),
    postedAt: cleanStr(form.postedAt),
    listingStatus: form.listingStatus,
  };
}

export type CreateJobProfileBody = {
  title: string;
  primaryTaxonomyConceptId?: string;
  keywords?: string[];
  status?: JobProfileStatus;
  listingStatus?: ListingStatus;
};

export type JobProfileFormState = {
  title: string;
  primaryTaxonomyConceptId: string;
  keywords: string;
  status: JobProfileStatus;
};

export const emptyJobProfileForm: JobProfileFormState = {
  title: "",
  primaryTaxonomyConceptId: "",
  keywords: "",
  status: "ACTIVE",
};

export function keywordsStringToArray(s: string): string[] {
  return s
    .split(/[,;\n]/g)
    .map((k) => k.trim())
    .filter(Boolean);
}

export function keywordsArrayToInput(a: string[] | undefined | null): string {
  if (!a?.length) return "";
  return a.join(", ");
}

export type ListJobProfilesParams = {
  limit?: number;
  cursor?: string;
  /** Filter by the primary concept in the active taxonomy. */
  taxonomyConceptId?: string;
  q?: string;
  order?: "asc" | "desc";
};

/** Map a primary-taxonomy concept to the backend query parameter. */
export function jobProfileListTaxonomyParams(
  filter: string
): Pick<ListJobProfilesParams, "taxonomyConceptId"> {
  if (filter === "all") return {};
  return { taxonomyConceptId: filter };
}

const AGGREGATE_FETCH_LIMIT = 100;

/**
 * Walks cursor pages (same filters as the list UI) to compute totals and description/requirement coverage.
 */
export async function fetchJobProfileListAggregates(
  params: Omit<ListJobProfilesParams, "cursor" | "limit">,
  options?: { signal?: AbortSignal }
): Promise<{ total: number; withDescription: number; withRequirements: number }> {
  let cursor: string | undefined;
  let total = 0;
  let withDescription = 0;
  let withRequirements = 0;

  for (;;) {
    const { data } = await jobProfileApi.list(
      { ...params, limit: AGGREGATE_FETCH_LIMIT, cursor },
      { signal: options?.signal }
    );
    const items = data.items ?? [];
    total += items.length;
    // Deprecated fields; keep shape for dashboard stats compatibility.
    // Upload-based JP no longer uses description/requirements in FE types.
    withDescription += 0;
    withRequirements += 0;
    cursor = data.nextCursor;
    if (!cursor) break;
  }

  return { total, withDescription, withRequirements };
}

export const jobProfileApi = {
  // ── Job Description CRUD ─────────────────────────────────────────────────────
  /** Khớp BE: GET /admin/job-descriptions */
  list: (params?: ListJobProfilesParams, config?: { signal?: AbortSignal }) =>
    api.get<JobProfileListResponse>("/admin/job-descriptions", { params, ...config }),
  /** Khớp BE: GET /admin/job-descriptions/{id} */
  get: (id: string) => api.get<JobProfile>(`/admin/job-descriptions/${encodeURIComponent(id)}`),
  /** Khớp BE: PATCH /admin/job-descriptions/{id} (admin only) */
  update: (id: string, body: Partial<FinalizeUploadBody>) =>
    api.patch<JobProfile>(`/admin/job-descriptions/${encodeURIComponent(id)}`, body),
  /** Khớp BE: DELETE /admin/job-descriptions/{id} (admin only) */
  delete: (id: string) => api.delete<void>(`/admin/job-descriptions/${encodeURIComponent(id)}`),
  listVersions: (id: string) =>
    api.get<{ items: JobDescriptionVersion[] }>(
      `/admin/job-descriptions/${encodeURIComponent(id)}/versions`
    ),
  getVersion: (id: string, versionId: string) =>
    api.get<JobDescriptionVersion>(
      `/admin/job-descriptions/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}`
    ),
  createVersion: (id: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<JobDescriptionVersion>(
      `/admin/job-descriptions/${encodeURIComponent(id)}/versions`,
      fd
    );
  },
  publishVersion: (id: string, versionId: string) =>
    api.post<JobProfile>(
      `/admin/job-descriptions/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/publish`
    ),

  // ── Upload flow ───────────────────────────────────────────────────────────────
  /** Khớp BE: POST /admin/job-descriptions/uploads (admin only) */
  uploadJd: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<JobProfileUpload>("/admin/job-descriptions/uploads", fd);
  },
  /** Khớp BE: GET /admin/job-descriptions/uploads/{id} */
  getUpload: (id: string) =>
    api.get<JobProfileUpload>(`/admin/job-descriptions/uploads/${encodeURIComponent(id)}`),
  deleteUpload: (id: string) =>
    api.delete<void>(`/admin/job-descriptions/uploads/${encodeURIComponent(id)}`),
  /** Khớp BE: POST /admin/job-descriptions/uploads/{id}/reparse */
  reparseUpload: (id: string) =>
    api.post<JobProfileUpload>(`/admin/job-descriptions/uploads/${encodeURIComponent(id)}/reparse`),
  /** Khớp BE: PATCH /admin/job-descriptions/uploads/{id} */
  updateUpload: (
    id: string,
    body: { structuredData?: Record<string, unknown> | null; extractedMetadata?: Record<string, unknown> | null }
  ) => api.patch<JobProfileUpload>(`/admin/job-descriptions/uploads/${encodeURIComponent(id)}`, body),
  /** Khớp BE: POST /admin/job-descriptions/uploads/{id}/finalize */
  finalizeUpload: (
    id: string,
    body: FinalizeUploadBody
  ) => api.post<JobProfile>(`/admin/job-descriptions/uploads/${encodeURIComponent(id)}/finalize`, body),

  /**
   * Download file JD gốc (PDF/DOCX).
   * Khớp với BE: GET /admin/job-descriptions/uploads/{id}/download
   */
  downloadUpload: async (
    id: string
  ): Promise<{ buffer: ArrayBuffer; filename: string; contentType: string }> => {
    const response = await api.get<ArrayBuffer>(
      `/admin/job-descriptions/uploads/${encodeURIComponent(id)}/download`,
      { responseType: "arraybuffer" }
    );
    const disposition = response.headers?.["content-disposition"] as string | undefined;
    const match = disposition?.match(/filename="?([^"\s;]+)/);
    const ct =
      (response.headers?.["content-type"] as string | undefined) ?? "application/octet-stream";
    return {
      buffer: response.data,
      filename: match?.[1] ?? "jd-file",
      contentType: ct,
    };
  },

  /**
   * Trả về URL để mở EventSource stream trạng thái JD upload parsing.
   * Khớp với BE: GET /admin/job-descriptions/uploads/{id}/events (SSE)
   *
   * @example
   * ```ts
   * const url = jobProfileApi.getUploadEventsUrl(uploadId);
   * const es = new EventSource(url);
   * es.onmessage = (e) => console.log(JSON.parse(e.data));
   * es.onerror = () => es.close();
   * ```
   */
  getUploadEventsUrl: (id: string, accessToken?: string): string => {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
    const url = new URL(
      `${base}/admin/job-descriptions/uploads/${encodeURIComponent(id)}/events`
    );
    if (accessToken) url.searchParams.set("token", accessToken);
    return url.toString();
  },
};

/** Alias dùng route /admin/job-profiles/* (BE hỗ trợ cả hai) */
export const jobProfileApiLegacy = jobProfileApi;
