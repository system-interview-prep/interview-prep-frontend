import api from "@lib/apiClient";

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
  // ── Job Description CRUD ─────────────────────────────────────────────────────
  /** Khớp BE: GET /admin/job-descriptions */
  list: (params?: ListJobProfilesParams, config?: { signal?: AbortSignal }) =>
    api.get<JobProfileListResponse>("/admin/job-descriptions", { params, ...config }),
  /** Khớp BE: GET /admin/job-descriptions/{id} */
  get: (id: string) => api.get<JobProfile>(`/admin/job-descriptions/${encodeURIComponent(id)}`),
  /** Khớp BE: PATCH /admin/job-descriptions/{id} (admin only) */
  update: (id: string, body: { description?: string | null }) =>
    api.patch<JobProfile>(`/admin/job-descriptions/${encodeURIComponent(id)}`, body),
  /** Khớp BE: DELETE /admin/job-descriptions/{id} (admin only) */
  delete: (id: string) => api.delete<void>(`/admin/job-descriptions/${encodeURIComponent(id)}`),

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
    body: {
      title: string;
      primaryTaxonomyConceptId?: string;
      categoryId?: string;
      keywords?: string[];
      status?: JobProfileStatus;
      description?: string;
    }
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
