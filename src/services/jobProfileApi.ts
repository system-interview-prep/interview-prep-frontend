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
  requirements?: string | null;
  status?: JobProfileStatus;
  createdAt?: string;
  updatedAt?: string;
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
  description?: string;
  requirements?: string;
  status?: JobProfileStatus;
};

export type JobProfileFormState = {
  title: string;
  categoryId: string;
  keywords: string;
  description: string;
  requirements: string;
  status: JobProfileStatus;
};

export const emptyJobProfileForm: JobProfileFormState = {
  title: "",
  categoryId: "",
  keywords: "",
  description: "• ",
  requirements: "• ",
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
    for (const p of items) {
      total++;
      if ((p.description ?? "").trim().length > 0) withDescription++;
      if ((p.requirements ?? "").trim().length > 0) withRequirements++;
    }
    cursor = data.nextCursor;
    if (!cursor) break;
  }

  return { total, withDescription, withRequirements };
}

export const jobProfileApi = {
  list: (params?: ListJobProfilesParams, config?: { signal?: AbortSignal }) =>
    api.get<JobProfileListResponse>("/admin/job-profiles", { params, ...config }),
  get: (id: string) => api.get<JobProfile>(`/admin/job-profiles/${id}`),
  create: (body: CreateJobProfileBody) =>
    api.post<JobProfile>("/admin/job-profiles", body),
  update: (id: string, body: Partial<CreateJobProfileBody>) =>
    api.patch<JobProfile>(`/admin/job-profiles/${id}`, body),
  delete: (id: string) => api.delete<void>(`/admin/job-profiles/${id}`),
};
