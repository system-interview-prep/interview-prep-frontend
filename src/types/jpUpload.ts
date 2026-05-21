export type JpUploadStatus =
  | "PENDING"
  | "PARSING"
  | "AI_PROCESSING"
  | "DONE"
  | "FAILED";

export function normalizeJpUploadStatus(
  raw: unknown,
  opts?: { hasError?: boolean }
): JpUploadStatus | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  const upper = value.toUpperCase().replace(/[\s-]+/g, "_");
  if (!upper) return opts?.hasError ? "FAILED" : null;

  if (["DONE", "SUCCESS", "COMPLETED"].includes(upper)) return "DONE";
  if (["FAILED", "FAIL", "ERROR", "TIMEOUT"].includes(upper)) return "FAILED";
  if (["AI_PROCESSING", "AI", "ANALYZING", "ANALYSIS"].includes(upper)) return "AI_PROCESSING";
  if (["PARSING", "OCR", "EXTRACTING", "PROCESSING"].includes(upper)) return "PARSING";
  if (["PENDING", "QUEUED", "QUEUE"].includes(upper)) return "PENDING";
  return opts?.hasError ? "FAILED" : null;
}

export function isTerminalJpStatus(s: JpUploadStatus): boolean {
  return s === "DONE" || s === "FAILED";
}

export type JpStatusPayload = {
  uploadId: string;
  status: JpUploadStatus | string;
  updatedAt?: string;
  error?: string;
  parseSource?: string;
  receiveCount?: number;
} & Record<string, unknown>;

