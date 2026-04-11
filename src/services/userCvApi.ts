import api from "./api";
import { normalizeCvProcessingStatus, type CvProcessingStatus } from "@/types/cvProcessing";

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
  /** Khi BE trả về pipeline xử lý CV */
  status?: CvProcessingStatus;
  error?: string;
  score?: number;
};

/** Recover filename from S3 key shape: cvs/{userId}/{cvId}-{safeName} */
export function inferNameFromS3Key(s3Key: string, cvId: string): string {
  if (!s3Key?.trim() || !cvId) return "";
  const seg = s3Key.split("/").filter(Boolean).pop() ?? "";
  const prefix = `${cvId}-`;
  if (seg.startsWith(prefix)) return seg.slice(prefix.length).trim();
  return seg.trim();
}

function fallbackNameFromMime(contentType: string): string {
  const m = (contentType || "").toLowerCase();
  if (m.includes("pdf")) return "document.pdf";
  if (m.includes("wordprocessingml") || m.includes("officedocument")) return "document.docx";
  if (m.includes("msword")) return "document.doc";
  return "document";
}

/**
 * Normalize API JSON (camelCase or snake_case) and fill missing originalName
 * from s3Key / contentType so the UI always has a usable filename + type.
 */
export function normalizeUserCvDto(raw: unknown): UserCvDto {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const id = String(r.id ?? "");
  const userId = String(r.userId ?? r.user_id ?? "");
  let originalName = String(r.originalName ?? r.original_name ?? "").trim();
  const contentType = String(r.contentType ?? r.content_type ?? "");
  const size = Number(r.size ?? 0);
  const s3Bucket = String(r.s3Bucket ?? r.s3_bucket ?? "");
  const s3Key = String(r.s3Key ?? r.s3_key ?? "");
  const createdAt = String(r.createdAt ?? r.created_at ?? "");
  const updatedAt = String(r.updatedAt ?? r.updated_at ?? "");
  const statusRaw = r.status ?? r.processingStatus;
  const rawStatus = typeof statusRaw === "string" ? statusRaw.trim() : "";
  const apiError =
    typeof r.error === "string"
      ? r.error
      : typeof (r as { processingError?: string }).processingError === "string"
        ? (r as { processingError: string }).processingError
        : undefined;
  const normalizedStatus = normalizeCvProcessingStatus(statusRaw, { hasError: Boolean(apiError) });
  const unknownStatus = Boolean(rawStatus) && !normalizedStatus && !apiError;
  const status = (normalizedStatus ?? (unknownStatus ? "FAILED" : undefined)) as CvProcessingStatus | undefined;
  const error = apiError ?? (unknownStatus ? "userDash.myCvs.error.statusSync" : undefined);
  const score = typeof r.score === "number" ? r.score : undefined;

  if (!originalName) {
    originalName = inferNameFromS3Key(s3Key, id);
  }
  if (!originalName) {
    originalName = fallbackNameFromMime(contentType);
  }

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
  };
}

/**
 * User CV endpoints (Bearer). Upload uses multipart field "file".
 */
export const userCvApi = {
  upload: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post<unknown>("/users/me/cvs", fd);
    return { ...res, data: normalizeUserCvDto(res.data) };
  },

  list: async (limit = 50) => {
    const res = await api.get<{ items?: unknown[] }>("/users/me/cvs", {
      params: { limit },
    });
    const items = (res.data.items ?? []).map((x) => normalizeUserCvDto(x));
    return { ...res, data: { items } };
  },

  get: async (id: string) => {
    const res = await api.get<unknown>(`/users/me/cvs/${id}`);
    return { ...res, data: normalizeUserCvDto(res.data) };
  },

  remove: (id: string) => api.delete<{ success: boolean }>(`/users/me/cvs/${id}`),
};
