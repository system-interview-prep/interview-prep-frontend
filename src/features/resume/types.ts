// --- Career Classification ---
export type CareerDimension = "domain" | "occupation" | "specialization";

export type CareerClassification = {
  code: string;
  label: string;
  dimension: CareerDimension;
  taxonomyVersion: string;
  isPrimary: boolean;
  confidence: number;
  assertionSource: string;
  evidenceRefs: string[];
};

export type CareerTaxonomyItem = {
  code: string;
  label: string;
  dimension: CareerDimension;
  parentCode: string | null;
};

export type CareerTaxonomyResponse = {
  taxonomyVersion: string;
  items: CareerTaxonomyItem[];
};

export type ResumeEvidence = {
  evidenceId: string;
  text: string;
  pageNumber: number | null;
};

export type ParsedCvData = {
  profile?: Record<string, unknown>;
  skills?: Record<string, unknown>[];
  employment?: Record<string, unknown>[];
  education?: Record<string, unknown>[];
  projects?: Record<string, unknown>[];
  certifications?: Record<string, unknown>[];
  languages?: Record<string, unknown>[];
  careerClassifications: CareerClassification[];
  evidence: ResumeEvidence[];
  metadata?: { parserVersion?: string };
  [key: string]: unknown;
};

function recordOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function camelize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      camelize(child),
    ]),
  );
}

function dimensionOf(value: unknown): CareerDimension | null {
  return value === "domain" || value === "occupation" || value === "specialization" ? value : null;
}

export function normalizeCareerClassification(value: unknown): CareerClassification | null {
  const item = recordOf(value);
  const code = String(item.code ?? "").trim();
  const label = String(item.label ?? "").trim();
  const dimension = dimensionOf(item.dimension);
  if (!code || !label || !dimension) return null;
  const confidence = Number(item.confidence ?? 0);
  const refs = item.evidenceRefs ?? item.evidence_refs;
  return {
    code,
    label,
    dimension,
    taxonomyVersion: String(item.taxonomyVersion ?? item.taxonomy_version ?? "").trim(),
    isPrimary: Boolean(item.isPrimary ?? item.is_primary),
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0,
    assertionSource: String(item.assertionSource ?? item.assertion_source ?? "inferred").trim(),
    evidenceRefs: Array.isArray(refs) ? refs.map(String).filter(Boolean) : [],
  };
}

export function normalizeResumeEvidence(value: unknown): ResumeEvidence | null {
  const item = recordOf(value);
  const evidenceId = String(item.evidenceId ?? item.evidence_id ?? "").trim();
  const text = String(item.text ?? item.snippet ?? item.value ?? "").trim();
  if (!evidenceId || !text) return null;
  const rawPage = item.pageNumber ?? item.page_number ?? item.page;
  const page = Number(rawPage);
  return { evidenceId, text, pageNumber: Number.isFinite(page) && page > 0 ? page : null };
}

export function normalizeParsedCvData(value: unknown): ParsedCvData | undefined {
  if (!value || typeof value !== "object") return undefined;
  // Older API responses may wrap the canonical resume in ParsedResume.resume;
  // current user-CV responses store the canonical resume at the root.
  const envelope = recordOf(value);
  const data = recordOf(camelize(envelope.resume ?? envelope));
  const rawClassifications = data.careerClassifications ?? data.career_classifications;
  const rawEvidence = data.evidence;
  const rawMetadata = recordOf(data.metadata);
  return {
    ...data,
    profile: Object.keys(recordOf(data.profile)).length ? recordOf(data.profile) : undefined,
    skills: Array.isArray(data.skills) ? data.skills.map(recordOf) : undefined,
    employment: Array.isArray(data.employment) ? data.employment.map(recordOf) : undefined,
    education: Array.isArray(data.education) ? data.education.map(recordOf) : undefined,
    projects: Array.isArray(data.projects) ? data.projects.map(recordOf) : undefined,
    certifications: Array.isArray(data.certifications) ? data.certifications.map(recordOf) : undefined,
    languages: Array.isArray(data.languages) ? data.languages.map(recordOf) : undefined,
    careerClassifications: Array.isArray(rawClassifications)
      ? rawClassifications.map(normalizeCareerClassification).filter((item): item is CareerClassification => Boolean(item))
      : [],
    evidence: Array.isArray(rawEvidence)
      ? rawEvidence.map(normalizeResumeEvidence).filter((item): item is ResumeEvidence => Boolean(item))
      : [],
    metadata: { parserVersion: String(rawMetadata.parserVersion ?? rawMetadata.parser_version ?? "").trim() || undefined },
  };
}

export function normalizeCareerTaxonomy(value: unknown): CareerTaxonomyResponse {
  const data = recordOf(value);
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems.flatMap((value) => {
    const item = recordOf(value);
    const code = String(item.code ?? "").trim();
    const label = String(item.label ?? "").trim();
    const dimension = dimensionOf(item.dimension);
    if (!code || !label || !dimension) return [];
    return [{ code, label, dimension, parentCode: String(item.parentCode ?? item.parent_code ?? "").trim() || null }];
  });
  return { taxonomyVersion: String(data.taxonomyVersion ?? data.taxonomy_version ?? "").trim(), items };
}

export function primarySpecialization(items: CareerClassification[]): CareerClassification | null {
  return items.find((item) => item.dimension === "specialization" && item.isPrimary) ?? null;
}

export function supportingClassifications(items: CareerClassification[]): CareerClassification[] {
  return items.filter((item) => item.dimension === "domain" || item.dimension === "occupation");
}

export function resolveClassificationEvidence(
  classification: CareerClassification,
  evidence: ResumeEvidence[]
): ResumeEvidence[] {
  const byId = new Map(evidence.map((item) => [item.evidenceId, item]));
  return classification.evidenceRefs.map((ref) => byId.get(ref)).filter((item): item is ResumeEvidence => Boolean(item));
}

// --- CV Processing Status ---
export type CvProcessingStatus = "PENDING" | "PARSING" | "AI_PROCESSING" | "DONE" | "FAILED";

export function normalizeCvProcessingStatus(
  raw: unknown,
  opts?: { hasError?: boolean }
): CvProcessingStatus | null {
  const value = typeof raw === "string" ? raw.trim() : "";
  const upper = value.toUpperCase().replace(/[\s-]+/g, "_");

  if (!upper) return opts?.hasError ? "FAILED" : null;

  if (["DONE", "SUCCESS", "COMPLETED"].includes(upper)) return "DONE";
  if (["FAILED", "FAIL", "ERROR", "AI_FAILED", "PARSING_FAILED", "TIMEOUT"].includes(upper)) {
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

// --- JP Upload Status ---
export type JpUploadStatus = "PENDING" | "PARSING" | "AI_PROCESSING" | "DONE" | "FAILED";

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
