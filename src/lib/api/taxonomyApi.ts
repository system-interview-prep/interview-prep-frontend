import api from '@/lib/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TaxonomyConceptKind =
  | 'skill'
  | 'domain'
  | 'occupation'
  | 'job_category'
  | string;

export type TaxonomyConcept = {
  concept_id: string;
  label: string;
  kind: TaxonomyConceptKind;
  is_active: boolean;
};

export type ActiveTaxonomyResponse = {
  version: string | null;
  priority?: number;
  publishedAt?: string;
  concepts: TaxonomyConcept[];
};

export type TaxonomyVersionUpsertBody = {
  version: string;
  priority?: number;
  /** Nếu true, activate ngay sau khi upsert */
  activate?: boolean;
};

export type TaxonomyVersionResponse = {
  version: string;
  active: boolean;
  priority: number;
};

export type TaxonomyConceptUpsertBody = {
  label: string;
  kind?: TaxonomyConceptKind;
  aliases?: string[];
  isActive?: boolean;
};

export type TaxonomyConceptUpsertResponse = {
  version: string;
  conceptId: string;
  aliases: string[];
};

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Taxonomy Admin API – Khớp với BE module `taxonomy`
 * Tất cả endpoint yêu cầu role ADMIN.
 *
 * Endpoints:
 *   GET  /admin/taxonomy/active                            → getActive()
 *   PUT  /admin/taxonomy/versions                          → upsertVersion(body)
 *   POST /admin/taxonomy/versions/{version}/activate       → activateVersion(version)
 *   PUT  /admin/taxonomy/versions/{version}/concepts/{id}  → upsertConcept(version, id, body)
 */
export const taxonomyApi = {
  /**
   * Lấy taxonomy version đang active và toàn bộ concepts của nó.
   */
  getActive: () =>
    api.get<ActiveTaxonomyResponse>('/admin/taxonomy/active'),

  /**
   * Tạo mới hoặc cập nhật một taxonomy version.
   * Nếu `activate: true` thì version này sẽ được set active ngay.
   */
  upsertVersion: (body: TaxonomyVersionUpsertBody) =>
    api.put<TaxonomyVersionResponse>('/admin/taxonomy/versions', body),

  /**
   * Activate một taxonomy version (version phải có ít nhất 1 skill active).
   */
  activateVersion: (version: string) =>
    api.post<{ version: string; active: boolean }>(
      `/admin/taxonomy/versions/${encodeURIComponent(version)}/activate`
    ),

  /**
   * Tạo mới hoặc cập nhật một concept trong taxonomy version.
   */
  upsertConcept: (
    version: string,
    conceptId: string,
    body: TaxonomyConceptUpsertBody
  ) =>
    api.put<TaxonomyConceptUpsertResponse>(
      `/admin/taxonomy/versions/${encodeURIComponent(version)}/concepts/${encodeURIComponent(conceptId)}`,
      body
    ),
};
