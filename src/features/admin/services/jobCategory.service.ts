import api from "@lib/apiClient";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// NOTE: BE không hỗ trợ tạo category trực tiếp – dùng Taxonomy API
// export type CreateJobCategoryBody = { name: string; description?: string; };
// export type PatchJobCategoryBody  = { name?: string; description?: string; };

/** Query params cho GET /admin/job-categories */
export type ListJobCategoriesParams = {
  limit?: number;
  cursor?: string;
  q?: string;
};

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Job Categories API – Khớp với BE module `job_categories`
 *
 * Endpoints có sẵn trên BE:
 *   GET  /admin/job-categories        → list()
 *   GET  /admin/job-categories/{id}   → get(id)
 *   POST /admin/job-categories        → trả về 403 "Use taxonomy API"
 *
 * Không có trên BE (→ không nên gọi):
 *   PATCH  /admin/job-categories/{id}  ← 404
 *   DELETE /admin/job-categories/{id}  ← 404
 *
 * Để tạo/sửa/xóa category, dùng taxonomyApi (src/lib/api/taxonomyApi.ts):
 *   PUT  /admin/taxonomy/versions/{v}/concepts/{id}
 */
export const jobCategoryApi = {
  /**
   * Lấy danh sách job categories đang active.
   * Kết quả đọc từ taxonomy_concepts với kind IN ('job_category', 'occupation').
   */
  list: (params?: ListJobCategoriesParams) =>
    api.get<JobCategoryListResponse>("/admin/job-categories", { params }),

  /** Lấy chi tiết một job category. */
  get: (id: string) =>
    api.get<JobCategory>(`/admin/job-categories/${encodeURIComponent(id)}`),

  // ── Không hỗ trợ ──────────────────────────────────────────────────────────
  // Các method dưới đây bị xóa vì BE không có route tương ứng.
  // Dùng taxonomyApi.upsertConcept() để tạo/sửa categories.
  //
  // create: (body: CreateJobCategoryBody) =>
  //   api.post<JobCategory>("/admin/job-categories", body),  // → 403 trên BE
  //
  // update: (id: string, body: PatchJobCategoryBody) =>
  //   api.patch<JobCategory>(`/admin/job-categories/${id}`, body),  // → 404 trên BE
  //
  // delete: (id: string) =>
  //   api.delete<void>(`/admin/job-categories/${id}`),  // → 404 trên BE
};
