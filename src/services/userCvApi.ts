import api from "./api";
import { normalizeCvProcessingStatus, type CvProcessingStatus } from "@/types/cvProcessing";
import {
  normalizeCareerClassification,
  normalizeCareerTaxonomy,
  normalizeParsedCvData,
  type CareerClassification,
  type CareerTaxonomyResponse,
  type ParsedCvData,
} from "@/types/careerClassification";

export type UserCvDto = {
  id: string;
  userId: string;
  originalName: string;
  contentType: string;
  size: number;
  s3Bucket: string;
  s3Key: string;
  createdAt: string;
  updatedAt: string;
  status?: CvProcessingStatus;
  error?: string;
  score?: number;
  parseSource?: string;
  parsedData?: ParsedCvData;
};

export type CareerClassificationsResponse = {
  cvId: string;
  taxonomyVersion: string;
  items: CareerClassification[];
};

/** Recover filename from storage key shape: cvs/{userId}/{cvId}-{safeName}. */
export function inferNameFromS3Key(s3Key: string, cvId: string): string {
  if (!s3Key?.trim() || !cvId) return "";
  const seg = s3Key.split("/").filter(Boolean).pop() ?? "";
  const prefix = `${cvId}-`;
  if (seg.startsWith(prefix)) return seg.slice(prefix.length).trim();
  return seg.trim();
}

function fallbackNameFromMime(contentType: string): string {
  const mime = (contentType || "").toLowerCase();
  if (mime.includes("pdf")) return "document.pdf";
  if (mime.includes("wordprocessingml") || mime.includes("officedocument")) return "document.docx";
  if (mime.includes("msword")) return "document.doc";
  return "document";
}

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

/** Normalize backend camelCase/snake_case responses without using identity/PII fields. */
export function normalizeUserCvDto(raw: unknown): UserCvDto {
  const item = recordOf(raw);
  const id = String(item.id ?? "");
  const userId = String(item.userId ?? item.user_id ?? "");
  let originalName = String(item.originalName ?? item.original_name ?? item.filename ?? "").trim();
  const contentType = String(item.contentType ?? item.content_type ?? "");
  const size = Number(item.size ?? 0);
  const s3Bucket = String(item.s3Bucket ?? item.s3_bucket ?? "");
  const s3Key = String(item.s3Key ?? item.s3_key ?? item.storageKey ?? item.storage_key ?? "");
  const createdAt = String(item.createdAt ?? item.created_at ?? "");
  const updatedAt = String(item.updatedAt ?? item.updated_at ?? "");
  const statusRaw = item.status ?? item.processingStatus ?? item.processing_status;
  const rawStatus = typeof statusRaw === "string" ? statusRaw.trim() : "";
  const apiError = typeof item.error === "string" ? item.error : typeof item.processingError === "string" ? item.processingError : undefined;
  const normalizedStatus = normalizeCvProcessingStatus(statusRaw, { hasError: Boolean(apiError) });
  const unknownStatus = Boolean(rawStatus) && !normalizedStatus && !apiError;
  const status = (normalizedStatus ?? (unknownStatus ? "FAILED" : undefined)) as CvProcessingStatus | undefined;
  const error = apiError ?? (unknownStatus ? "userDash.myCvs.error.statusSync" : undefined);
  const score = typeof item.score === "number" ? item.score : undefined;
  const parseSource = String(item.parseSource ?? item.parse_source ?? "").trim() || undefined;
  const parsedData = normalizeParsedCvData(item.parsedData ?? item.parsed_data);

  if (!originalName) originalName = inferNameFromS3Key(s3Key, id);
  if (!originalName) originalName = fallbackNameFromMime(contentType);

  return {
    id,
    userId,
    originalName,
    contentType,
    size: Number.isFinite(size) ? size : 0,
    s3Bucket,
    s3Key,
    createdAt,
    updatedAt,
    ...(status ? { status } : {}),
    ...(error ? { error } : {}),
    ...(score !== undefined ? { score } : {}),
    ...(parseSource ? { parseSource } : {}),
    ...(parsedData ? { parsedData } : {}),
  };
}

export const userCvApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<unknown>("/users/me/cvs", formData);
    return { ...response, data: normalizeUserCvDto(response.data) };
  },

  list: async (limit = 50, careerCode?: string) => {
    const response = await api.get<{ items?: unknown[] }>("/users/me/cvs", {
      params: { limit, ...(careerCode ? { careerCode } : {}) },
    });
    const items = (response.data.items ?? []).map(normalizeUserCvDto);
    return { ...response, data: { items } };
  },

  get: async (id: string) => {
    const response = await api.get<unknown>(`/users/me/cvs/${encodeURIComponent(id)}`);
    return { ...response, data: normalizeUserCvDto(response.data) };
  },

  getCareerTaxonomy: async () => {
    const response = await api.get<unknown>("/users/me/cvs/career-taxonomy");
    return { ...response, data: normalizeCareerTaxonomy(response.data) satisfies CareerTaxonomyResponse };
  },

  getCareerClassifications: async (id: string) => {
    const response = await api.get<unknown>(`/users/me/cvs/${encodeURIComponent(id)}/career-classifications`);
    const data = recordOf(response.data);
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const items = rawItems.map(normalizeCareerClassification).filter((item): item is CareerClassification => Boolean(item));
    return {
      ...response,
      data: {
        cvId: String(data.cvId ?? data.cv_id ?? id),
        taxonomyVersion: String(data.taxonomyVersion ?? data.taxonomy_version ?? ""),
        items,
      } satisfies CareerClassificationsResponse,
    };
  },

  remove: (id: string) => api.delete<{ success: boolean }>(`/users/me/cvs/${encodeURIComponent(id)}`),
};
