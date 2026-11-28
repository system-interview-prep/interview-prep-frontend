/**
 * Shape of the `structuredData` blob returned with a job description.
 *
 * Mirrors `CanonicalJobDescription` in interview-prep-core
 * (`src/modules/job_descriptions/domain/schemas.py`), which serialises with a
 * camelCase alias generator. Everything is optional here: the parser may fail
 * mid-way and older rows predate newer fields.
 */

export type CanonicalTaxonomyRef = {
  conceptId?: string;
  scheme?: string;
  taxonomyVersion?: string;
  label?: string;
};

export type CanonicalEvidence = {
  evidenceId?: string;
  documentId?: string;
  documentSha256?: string;
  section?: string;
  text?: string;
  evidenceSource?: string;
  sourceRequirementId?: string | null;
  charStart?: number;
  charEnd?: number;
  page?: number | null;
  sourceBlockId?: string | null;
  readingOrder?: number | null;
};

export type CanonicalRequirement = {
  requirementId?: string;
  kind?: "skill" | "experience" | "education" | "language" | "other" | string;
  priority?: "must_have" | "preferred" | string;
  concept?: CanonicalTaxonomyRef | null;
  atomicConcepts?: CanonicalTaxonomyRef[];
  rawLabel?: string;
  minimumExperienceMonths?: number | null;
  groupId?: string | null;
  groupOperator?: "all_of" | "any_of" | "atomic" | null;
  operator?: "gte" | "gt" | "lte" | "lt" | "eq" | "required" | string | null;
  threshold?: number | null;
  scale?: number | null;
  credential?: string | null;
  equivalentAllowed?: boolean | null;
  evidenceRefs?: string[];
};

export type CanonicalGroundedText = {
  text?: string;
  evidenceRefs?: string[];
};

export type CanonicalCareerClassification = {
  code?: string;
  label?: string;
  dimension?: "domain" | "occupation" | "specialization" | string;
  taxonomyVersion?: string;
  isPrimary?: boolean;
  confidence?: number;
  assertionSource?: "explicit" | "inferred" | string;
  evidenceRefs?: string[];
};

export type CanonicalParserWarning = {
  code?: string;
  path?: string | null;
  severity?: "info" | "warning" | "error" | string;
  message?: string;
};

export type CanonicalCoverage = "complete" | "complete_empty" | "partial" | "unavailable" | string;

export type CanonicalParsing = {
  parserVersion?: string;
  extractionVersion?: string;
  parsedAt?: string;
  status?: "ready" | "review_required" | string;
  sourceArtifactKey?: string | null;
  warnings?: CanonicalParserWarning[];
  rawTextCoverage?: CanonicalCoverage;
  canonicalSectionCoverage?: Record<string, CanonicalCoverage>;
  evidenceIndexCoverage?: CanonicalCoverage;
  coverageReasonCodes?: string[];
};

export type CanonicalJd = {
  schemaVersion?: string;
  jobTitle?: string | null;
  companyName?: string | null;
  careerClassifications?: CanonicalCareerClassification[];
  seniority?: string | null;
  employmentType?: string | null;
  workMode?: string | null;
  location?: string | null;
  experienceMinYears?: number | null;
  experienceMaxYears?: number | null;
  experienceRaw?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryPeriod?: "hour" | "month" | "year" | string | null;
  salaryNegotiable?: boolean | null;
  salaryRaw?: string | null;
  responsibilities?: CanonicalGroundedText[];
  requirements?: CanonicalRequirement[];
  benefits?: CanonicalGroundedText[];
  evidence?: CanonicalEvidence[];
  parsing?: CanonicalParsing;
};

/** Narrow the untyped JSON blob without pretending it is validated. */
export function asCanonicalJd(value: Record<string, unknown> | null | undefined): CanonicalJd | null {
  if (!value || typeof value !== "object") return null;
  return value as CanonicalJd;
}

export function arrayOf<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}
