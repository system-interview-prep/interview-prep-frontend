type Translate = (key: string) => string;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return null;
}

function extractFromPayload(payload: unknown): string {
  if (typeof payload === "string") return payload.trim();
  const rec = asRecord(payload);
  if (!rec) return "";

  const code = typeof rec.code === "string" ? rec.code.trim() : "";
  const error = typeof rec.error === "string" ? rec.error.trim() : "";
  const message = typeof rec.message === "string" ? rec.message.trim() : "";
  if (code) return code;
  if (error) return error;
  if (message) return message;
  return "";
}

function extractRawError(input: unknown): string {
  if (typeof input === "string") return input.trim();

  const rec = asRecord(input);
  if (!rec) return "";

  const direct = extractFromPayload(rec);
  if (direct) return direct;

  const response = asRecord(rec.response);
  if (response) {
    const responseData = response.data;
    const nested = extractFromPayload(responseData);
    if (nested) return nested;
  }

  const dataNested = extractFromPayload(rec.data);
  if (dataNested) return dataNested;

  return "";
}

export function mapBackendErrorToI18nKey(input: unknown): string | null {
  const raw = extractRawError(input);
  if (!raw) return null;

  if (raw.startsWith("userDash.") || raw.startsWith("interview.")) {
    return raw;
  }

  const upper = raw.toUpperCase();

  if (upper.includes("CV_ROOM_FORBIDDEN")) {
    return "userDash.myCvs.error.forbiddenCvRoom";
  }
  if (upper.includes("CV_ROOM_INVALID")) {
    return "userDash.myCvs.error.invalidCvRoom";
  }
  if (upper.includes("PROCESSING_TIMEOUT") || upper.includes("CV_PROCESSING_TIMEOUT")) {
    return "userDash.myCvs.error.processingTimeout";
  }
  if (upper.includes("CV_AI_STEP_TIMEOUT")) {
    return "userDash.myCvs.error.processingTimeout";
  }
  if (upper.includes("CV_CONTENT_NOT_RESUME") || upper.includes("CV_TEXT_TOO_SHORT")) {
    return "userDash.myCvs.error.notResumeContent";
  }
  if (
    upper.includes("AI_STRUCTURED_DATA_INVALID") ||
    upper.includes("MODEL_OUTPUT_NOT_JSON") ||
    upper.includes("MODEL_OUTPUT_NOT_OBJECT")
  ) {
    return "userDash.myCvs.error.structuredDataInvalid";
  }

  return null;
}

export function resolveBackendErrorMessage(
  input: unknown,
  t: Translate,
  fallbackKey = "userDash.myCvs.apiUploadError",
): string {
  const mappedKey = mapBackendErrorToI18nKey(input);
  if (mappedKey) return t(mappedKey);

  const raw = extractRawError(input);
  if (raw) return raw;

  return t(fallbackKey);
}
