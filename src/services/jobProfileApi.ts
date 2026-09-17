import api from "./api";

export type JobProfileStatus = "ACTIVE" | "DRAFT" | "ARCHIVED";

/** Nested category when API populates the relation */
export type JobProfileCategory = {
  id: string;
  name: string;
  description?: string | null;
};

export type JobProfile = {
  id: string;
  title: string;
  categoryId: string;
  category?: JobProfileCategory;
  keywords?: string[];
  description?: string | null;
  /** schema-validated canonical JD returned by the parser */
  structuredData?: Record<string, unknown> | null;
  /** extractor metadata retained for audit and troubleshooting */
  extractedMetadata?: Record<string, unknown> | null;
  rawJdText?: string | null;
  status?: JobProfileStatus;
  createdAt?: string;
  updatedAt?: string;
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

export type CreateJobProfileBody = {
  title: string;
  categoryId: string;
  keywords?: string[];
  status?: JobProfileStatus;
};

export type JobProfileFormState = {
  title: string;
  categoryId: string;
  keywords: string;
  status: JobProfileStatus;
};

export const emptyJobProfileForm: JobProfileFormState = {
  title: "",
  categoryId: "",
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
  /** Preferred filter */
  categoryId?: string;
  /** Backend compatibility alias for legacy slug filters */
  category?: string;
  q?: string;
  order?: "asc" | "desc";
};

/** Map dashboard filter value to query params (UUID/ObjectId → categoryId, else → category alias). */
export function jobProfileListCategoryParams(
  filter: string
): Pick<ListJobProfilesParams, "categoryId" | "category"> {
  if (filter === "all") return {};
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filter)
  ) {
    return { categoryId: filter };
  }
  if (/^[a-f0-9]{24}$/i.test(filter)) {
    return { categoryId: filter };
  }
  return { category: filter };
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
  list: (params?: ListJobProfilesParams, config?: { signal?: AbortSignal }) =>
    api.get<JobProfileListResponse>("/admin/job-descriptions", { params, ...config }),
  get: (id: string) => api.get<JobProfile>(`/admin/job-descriptions/${id}`),
  update: (id: string, body: { description?: string | null }) =>
    api.patch<JobProfile>(`/admin/job-descriptions/${id}`, body),
  delete: (id: string) => api.delete<void>(`/admin/job-descriptions/${id}`),

  uploadJd: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<JobProfileUpload>("/admin/job-descriptions/uploads", fd);
  },
  getUpload: (id: string) => api.get<JobProfileUpload>(`/admin/job-descriptions/uploads/${id}`),
  reparseUpload: (id: string) =>
    api.post<JobProfileUpload>(`/admin/job-descriptions/uploads/${id}/reparse`),
  updateUpload: (
    id: string,
    body: { structuredData?: Record<string, unknown> | null; extractedMetadata?: Record<string, unknown> | null }
  ) => api.patch<JobProfileUpload>(`/admin/job-descriptions/uploads/${id}`, body),
  finalizeUpload: (
    id: string,
    body: {
      title: string;
      categoryId: string;
      keywords?: string[];
      status?: JobProfileStatus;
      description?: string;
    }
  ) => api.post<{ id: string }>(`/admin/job-descriptions/uploads/${id}/finalize`, body),
};
