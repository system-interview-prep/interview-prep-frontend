import api from "@/lib/apiClient";

export type TaxonomyConcept = {
  concept_id: string;
  label: string;
  kind: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  is_active: boolean;
  aliases?: string[];
};

export type ActiveTaxonomy = {
  version: string | null;
  priority?: number;
  publishedAt?: string | null;
  concepts: TaxonomyConcept[];
};
export type TaxonomyVersion = { version: string; priority: number; isActive: boolean; publishedAt?: string | null };

export const taxonomyApi = {
  downloadTemplate: () => api.get("/admin/taxonomy/template", { responseType: "blob" }),
  active: () => api.get<ActiveTaxonomy>("/admin/taxonomy/active"),
  versions: () => api.get<{ items: TaxonomyVersion[] }>("/admin/taxonomy/versions"),
  upsertVersion: (payload: { version: string; priority: number; activate: boolean }) =>
    api.put("/admin/taxonomy/versions", payload),
  deleteVersion: (version: string) =>
    api.delete(`/admin/taxonomy/versions/${encodeURIComponent(version)}`),
  cloneVersion: (version: string, sourceVersion: string) => api.post(`/admin/taxonomy/versions/${encodeURIComponent(version)}/clone`, { sourceVersion }),
  upsertConcept: (version: string, conceptId: string, payload: {
    label: string; kind: string; description?: string; aliases: string[]; metadata: Record<string, unknown>; isActive: boolean;
  }) => api.put(`/admin/taxonomy/versions/${encodeURIComponent(version)}/concepts/${encodeURIComponent(conceptId)}`, payload),
  deleteConcept: (version: string, conceptId: string) =>
    api.delete(`/admin/taxonomy/versions/${encodeURIComponent(version)}/concepts/${encodeURIComponent(conceptId)}`),
  activate: (version: string) => api.post(`/admin/taxonomy/versions/${encodeURIComponent(version)}/activate`),
  exportVersion: (version: string) => api.get(`/admin/taxonomy/versions/${encodeURIComponent(version)}/export`, { responseType: "blob" }),
  importVersion: (version: string, file: File) => { const body = new FormData(); body.append("file", file); return api.post(`/admin/taxonomy/versions/${encodeURIComponent(version)}/import`, body); },
};
