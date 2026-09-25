export type RequirementStatus = "met" | "not_met" | "unknown" | "not_applicable";

export type RequirementPriority = "must_have" | "preferred" | "unknown";

export type GroupOperator = "any_of" | "all_of" | "atomic";

export type CvEvidenceItem = {
  evidenceId?: string;
  documentId?: string;
  text?: string;
  snippet?: string;
  pageNumber?: number | null;
  section?: string | null;
  charStart?: number | null;
  charEnd?: number | null;
  sourceBlockId?: string | null;
};

export type ConceptEvidenceResult = {
  conceptId: string;
  label: string;
  status: RequirementStatus;
  confidence: number;
  evidence: CvEvidenceItem[];
  evidenceStrength?: "mention" | "claimed" | "applied" | "demonstrated" | null;
  reasonCode?: string;
};

export type HumanizedRequirement = {
  id: string;
  label: string;
  kind?: "skill" | "experience" | "education" | "language" | "other";
  category?: "skill" | "experience" | "education" | "language" | "other";
  priority: RequirementPriority;
  conditionText?: string;
  status: RequirementStatus;
  statusLabel: string;
  reasonText?: string;
  reasonCode?: string;
  evidenceExplanation?: string;
  jdEvidenceText?: string;
  cvEvidence?: CvEvidenceItem[];
  conceptResults?: ConceptEvidenceResult[];
  score?: number | null;
  groupId?: string;
  groupOperator?: GroupOperator;
  rawRequirement?: Record<string, unknown>;
};

export type RequirementGroup = {
  groupId: string;
  title: string;
  subtext: string;
  operator: "any_of" | "all_of";
  priority: RequirementPriority;
  status?: RequirementStatus | null;
  statusLabel?: string | null;
  items: HumanizedRequirement[];
};

export type MatchSectionSummary = {
  total: number;
  met: number;
  unknown: number;
  notMet: number;
  notApplicable: number;
};

export type MatchFilterTab = "all" | "must_have" | "preferred" | "unknown";
