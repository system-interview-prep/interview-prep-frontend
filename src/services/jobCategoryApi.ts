import api from "./api";

export type JobCategory = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type JobCategoryListResponse = {
  items: JobCategory[];
  nextCursor?: string;
};

export type CreateJobCategoryBody = {
  name: string;
  description?: string;
};

export type PatchJobCategoryBody = {
  name?: string;
  description?: string;
};

/** Query params for GET /admin/job-categories */
export type ListJobCategoriesParams = {
  limit?: number;
  cursor?: string;
  q?: string;
};

export const jobCategoryApi = {
  list: (params?: ListJobCategoriesParams) =>
    api.get<JobCategoryListResponse>("/admin/job-categories", { params }),
  get: (id: string) => api.get<JobCategory>(`/admin/job-categories/${id}`),
  create: (body: CreateJobCategoryBody) =>
    api.post<JobCategory>("/admin/job-categories", body),
  update: (id: string, body: PatchJobCategoryBody) =>
    api.patch<JobCategory>(`/admin/job-categories/${id}`, body),
  delete: (id: string) => api.delete<void>(`/admin/job-categories/${id}`),
};
