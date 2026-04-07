/** Khớp CvProcessingStatus phía BE */
export type CvProcessingStatus =
  | "PENDING"
  | "PARSING"
  | "AI_PROCESSING"
  | "DONE"
  | "FAILED";

export function isTerminalCvStatus(s: CvProcessingStatus): boolean {
  return s === "DONE" || s === "FAILED";
}

/** Payload `cv.status` từ namespace `/cv` */
export type CvStatusPayload = {
  cvId: string;
  status: CvProcessingStatus;
  updatedAt?: string;
  error?: string;
  score?: number;
  rawText?: string;
  parseSource?: string;
  structuredData?: unknown;
  receiveCount?: number;
} & Record<string, unknown>;
