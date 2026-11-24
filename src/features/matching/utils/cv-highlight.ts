import type { CvEvidenceItem, HumanizedRequirement, RequirementStatus } from "../types/match-details.types";

/** One CV span and every requirement that cites it. */
export interface EvidenceMark {
  evidenceId: string;
  charStart: number;
  charEnd: number;
  text: string;
  requirementIds: string[];
  /** Best status among the citing requirements; drives the highlight colour. */
  status: RequirementStatus;
  /** True when the span was found at match time and is not in the stored parsed CV. */
  foundAtMatchTime: boolean;
}

/** A contiguous run of raw text; `evidenceIds` is empty for plain text. */
export interface CvTextSegment {
  start: number;
  end: number;
  text: string;
  evidenceIds: string[];
  requirementIds: string[];
  status: RequirementStatus | null;
}

export interface UnplacedEvidence {
  evidenceId: string;
  text: string;
  requirementIds: string[];
  reason: "missing_offsets" | "out_of_range";
}

const STATUS_RANK: Record<RequirementStatus, number> = {
  met: 3,
  unknown: 2,
  not_met: 1,
  not_applicable: 0,
};

function strongerStatus(a: RequirementStatus | null, b: RequirementStatus): RequirementStatus {
  if (a == null) return b;
  return STATUS_RANK[b] > STATUS_RANK[a] ? b : a;
}

const FALLBACK_SECTIONS = new Set(["raw_text_fallback", "raw_text_llm_retrieval"]);

/**
 * Collect the CV spans cited by requirements (directly or through concept
 * results) and group the citing requirement ids per span.
 */
export function collectEvidenceMarks(requirements: HumanizedRequirement[]): {
  marks: EvidenceMark[];
  unplaced: UnplacedEvidence[];
} {
  const byId = new Map<string, { evidence: CvEvidenceItem; requirementIds: Set<string>; status: RequirementStatus | null }>();

  const cite = (evidence: CvEvidenceItem, requirement: HumanizedRequirement) => {
    const id = evidence.evidenceId;
    if (!id) return;
    const entry = byId.get(id) ?? { evidence, requirementIds: new Set<string>(), status: null };
    entry.requirementIds.add(requirement.id);
    entry.status = strongerStatus(entry.status, requirement.status);
    byId.set(id, entry);
  };

  for (const requirement of requirements) {
    requirement.cvEvidence?.forEach((evidence) => cite(evidence, requirement));
    requirement.conceptResults?.forEach((concept) =>
      concept.evidence.forEach((evidence) => cite(evidence, requirement))
    );
  }

  const marks: EvidenceMark[] = [];
  const unplaced: UnplacedEvidence[] = [];
  for (const [evidenceId, { evidence, requirementIds, status }] of byId) {
    const ids = [...requirementIds].sort();
    const text = evidence.text || evidence.snippet || "";
    if (typeof evidence.charStart !== "number" || typeof evidence.charEnd !== "number") {
      unplaced.push({ evidenceId, text, requirementIds: ids, reason: "missing_offsets" });
      continue;
    }
    marks.push({
      evidenceId,
      charStart: evidence.charStart,
      charEnd: evidence.charEnd,
      text,
      requirementIds: ids,
      status: status ?? "unknown",
      foundAtMatchTime: FALLBACK_SECTIONS.has(evidence.section ?? ""),
    });
  }
  return { marks, unplaced };
}

/**
 * Split `rawText` into segments so overlapping evidence spans render as
 * nested-free runs. Each segment lists every span covering it.
 *
 * Spans whose offsets fall outside the text are returned in `outOfRange`
 * instead of being clipped, so the UI can say they could not be placed.
 */
export function buildCvSegments(
  rawText: string,
  marks: EvidenceMark[]
): { segments: CvTextSegment[]; outOfRange: EvidenceMark[] } {
  const length = rawText.length;
  const placed: EvidenceMark[] = [];
  const outOfRange: EvidenceMark[] = [];
  for (const mark of marks) {
    if (mark.charStart < 0 || mark.charEnd > length || mark.charEnd <= mark.charStart) {
      outOfRange.push(mark);
    } else {
      placed.push(mark);
    }
  }

  const boundaries = new Set<number>([0, length]);
  placed.forEach((mark) => {
    boundaries.add(mark.charStart);
    boundaries.add(mark.charEnd);
  });
  const points = [...boundaries].sort((a, b) => a - b);

  const segments: CvTextSegment[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    if (end <= start) continue;
    const covering = placed.filter((mark) => mark.charStart <= start && mark.charEnd >= end);
    const requirementIds = [...new Set(covering.flatMap((mark) => mark.requirementIds))].sort();
    let status: RequirementStatus | null = null;
    covering.forEach((mark) => {
      status = strongerStatus(status, mark.status);
    });
    const previous = segments[segments.length - 1];
    const evidenceIds = covering.map((mark) => mark.evidenceId).sort();
    // Merge adjacent plain-text runs to keep the DOM small.
    if (previous && previous.evidenceIds.length === 0 && evidenceIds.length === 0) {
      previous.end = end;
      previous.text = rawText.slice(previous.start, end);
      continue;
    }
    segments.push({ start, end, text: rawText.slice(start, end), evidenceIds, requirementIds, status });
  }
  return { segments, outOfRange };
}

/**
 * Merge CV evidence from the stored parsed CV with spans returned by the match
 * itself. Match spans win: they are what this result actually cited.
 */
export function mergeEvidenceSources(
  parsedEvidence: unknown,
  matchEvidence: unknown
): Array<Record<string, unknown>> {
  const merged = new Map<string, Record<string, unknown>>();
  const add = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const item of list as Array<Record<string, unknown>>) {
      const id = String(item?.evidenceId ?? item?.evidence_id ?? "");
      if (id) merged.set(id, item);
    }
  };
  add(parsedEvidence);
  add(matchEvidence);
  return [...merged.values()];
}
