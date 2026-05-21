/** Khớp CvProcessingStatus phía BE */
export type CvProcessingStatus =
  | "PENDING"
  | "PARSING"
  | "AI_PROCESSING"
  | "DONE"
  | "FAILED";

export function normalizeCvProcessingStatus(
  raw: unknown,
  opts?: { hasError?: boolean },
): CvProcessingStatus | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  const upper = value.toUpperCase().replace(/[\s-]+/g, "_");

  if (!upper) return opts?.hasError ? "FAILED" : null;

  if (["DONE", "SUCCESS", "COMPLETED"].includes(upper)) return "DONE";
  if (
    [
      "FAILED",
      "FAIL",
      "ERROR",
      "AI_FAILED",
      "PARSING_FAILED",
      "TIMEOUT",
    ].includes(upper)
  ) {
    return "FAILED";
  }
  if (["AI_PROCESSING", "AI", "ANALYZING", "ANALYSIS"].includes(upper)) return "AI_PROCESSING";
  if (["PARSING", "OCR", "EXTRACTING", "PROCESSING"].includes(upper)) return "PARSING";
  if (["PENDING", "QUEUED", "QUEUE"].includes(upper)) return "PENDING";

  return opts?.hasError ? "FAILED" : null;
}

export function isTerminalCvStatus(s: CvProcessingStatus): boolean {
  return s === "DONE" || s === "FAILED";
}

/** Payload `cv.status` từ namespace `/cv` */
export type CvStatusPayload = {
  cvId: string;
  status: CvProcessingStatus | string;
  updatedAt?: string;
  error?: string;
  score?: number;
  rawText?: string;
  parseSource?: string;
  structuredData?: unknown;
  receiveCount?: number;
} & Record<string, unknown>;
