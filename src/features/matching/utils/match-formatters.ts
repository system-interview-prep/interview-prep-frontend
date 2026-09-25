import type {
  RequirementStatus,
  RequirementPriority,
  GroupOperator,
  CvEvidenceItem,
  ConceptEvidenceResult,
  HumanizedRequirement,
  RequirementGroup,
} from "../types/match-details.types";

export function formatStatusLabel(status: RequirementStatus): string {
  switch (status) {
    case "met":
      return "Phù hợp";
    case "not_met":
      return "Chưa đáp ứng";
    case "not_applicable":
      return "Không áp dụng";
    case "unknown":
    default:
      return "Chưa đủ bằng chứng";
  }
}

export function formatExperienceDuration(months?: number | null): string {
  if (months == null || months <= 0) return "";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years} năm ${remainingMonths} tháng`;
  }
  if (years > 0) {
    return `${years} năm`;
  }
  return `${remainingMonths} tháng`;
}

export function formatExperienceCondition(
  months?: number | null,
  operator?: string | null
): string {
  if (months == null || months <= 0) return "";
  const duration = formatExperienceDuration(months);
  const op = (operator || "gte").toLowerCase();

  switch (op) {
    case "gte":
    case "required":
      return `Tối thiểu ${duration} kinh nghiệm`;
    case "gt":
      return `Trên ${duration} kinh nghiệm`;
    case "lte":
      return `Tối đa ${duration} kinh nghiệm`;
    case "lt":
      return `Dưới ${duration} kinh nghiệm`;
    case "eq":
      return `Đúng ${duration} kinh nghiệm`;
    default:
      return `Tối thiểu ${duration} kinh nghiệm`;
  }
}

export function formatLanguageCondition(
  optionsOrCredential?:
    | string
    | {
        credential?: string | null;
        threshold?: number | null;
        scale?: number | null;
        operator?: string | null;
        equivalentAllowed?: boolean | null;
      }
    | null,
  thresholdArg?: number | null,
  operatorArg?: string | null,
  equivalentAllowedArg?: boolean | null
): string {
  let credential: string | null | undefined;
  let threshold: number | null | undefined;
  let operator: string | null | undefined;
  let equivalentAllowed: boolean | null | undefined;

  if (typeof optionsOrCredential === "string" || optionsOrCredential === null) {
    credential = optionsOrCredential;
    threshold = thresholdArg;
    operator = operatorArg;
    equivalentAllowed = equivalentAllowedArg;
  } else if (optionsOrCredential && typeof optionsOrCredential === "object") {
    credential = optionsOrCredential.credential;
    threshold = optionsOrCredential.threshold;
    operator = optionsOrCredential.operator;
    equivalentAllowed = optionsOrCredential.equivalentAllowed;
  }

  if (!credential && threshold == null) return "";

  const cred = credential || "Chứng chỉ ngoại ngữ";
  let opSymbol = "≥";
  const op = (operator || "gte").toLowerCase();
  if (op === "gt") opSymbol = ">";
  else if (op === "lte") opSymbol = "≤";
  else if (op === "lt") opSymbol = "<";
  else if (op === "eq" || op === "equal") opSymbol = "=";

  const scoreText = threshold != null ? ` ${opSymbol} ${threshold}` : "";
  const equivText = equivalentAllowed ? " hoặc chứng chỉ tương đương" : "";

  return `${cred}${scoreText}${equivText}`;
}

export function resolveGroupStatus(
  _operator: "any_of" | "all_of",
  _childStatuses: RequirementStatus[]
): { status?: RequirementStatus | null; statusLabel?: string | null } {
  void _operator;
  void _childStatuses;
  // Matching backend currently does NOT expose GroupRequirementResult.
  // Frontend MUST NOT conclude or compute parent status (Truthful UI contract).
  return { status: null, statusLabel: null };
}

export function humanizeRequirementPriority(rawPriority?: string | null): RequirementPriority {
  if (!rawPriority) return "unknown";
  const lower = rawPriority.toLowerCase();
  if (lower === "must_have" || lower === "required") return "must_have";
  if (lower === "preferred" || lower === "nice_to_have") return "preferred";
  return "unknown";
}

export function humanizeCategoryFromId(reqId: string): "skill" | "experience" | "education" | "language" | "other" {
  const lower = reqId.toLowerCase();
  if (lower.includes("edu") || lower.includes("degree") || lower.includes("hoc-van")) return "education";
  if (lower.includes("exp") || lower.includes("kinh-nghiem")) return "experience";
  if (lower.includes("lang") || lower.includes("tieng") || lower.includes("english")) return "language";
  if (lower.includes("skill") || lower.includes("tech") || lower.includes("ky-nang")) return "skill";
  return "other";
}

/**
 * Parses PartialDate value into formatted string e.g. "03/2024" or "2024"
 */
export function formatCvDate(raw?: { value?: string; precision?: string } | string | null): string {
  if (!raw) return "";
  const val = typeof raw === "string" ? raw : raw.value || "";
  if (!val) return "";
  const parts = val.split("-");
  if (parts.length >= 2) {
    return `${parts[1]}/${parts[0]}`;
  }
  return parts[0];
}

/**
 * Format employment date range
 */
export function formatEmploymentDateRange(start?: unknown, end?: unknown, isCurrent?: boolean): string {
  const startStr = formatCvDate(start as { value?: string; precision?: string } | string | null);
  if (isCurrent) {
    return startStr ? `${startStr} – Hiện tại` : "Hiện tại";
  }
  const endStr = formatCvDate(end as { value?: string; precision?: string } | string | null);
  if (startStr && endStr) {
    return `${startStr} – ${endStr}`;
  }
  return startStr || endStr || "";
}

export function buildHumanizedRequirementsAndGroups(params: {
  requirementResults: Array<{
    requirementId: string;
    status: string;
    score?: number | null;
    confidence?: number;
    evidenceRefs?: string[];
    reasonCode?: string;
    evidenceExplanation?: string;
    groupOperator?: string;
    conceptResults?: Array<{
      conceptId: string;
      label: string;
      status: string;
      confidence?: number | null;
      evidenceRefs?: string[];
      evidenceStrength?: "mention" | "claimed" | "applied" | "demonstrated" | null;
      reasonCode?: string;
    }>;
  }>;
  jobStructuredData?: Record<string, unknown> | null;
  cvParsedData?: Record<string, unknown> | null;
  requirementsMap?: Map<string, { label: string; kind?: string; priority?: string }>;
  resolveReasonCodeText?: (code?: string) => string;
}): {
  requirements: HumanizedRequirement[];
  groups: RequirementGroup[];
} {
  const {
    requirementResults,
    jobStructuredData,
    cvParsedData,
    requirementsMap,
    resolveReasonCodeText,
  } = params;

  // 1. Build JD Evidence map
  const jdEvidenceMap = new Map<string, string>();
  if (jobStructuredData && Array.isArray(jobStructuredData.evidence)) {
    for (const ev of jobStructuredData.evidence as Array<Record<string, unknown>>) {
      const id = String(ev.evidence_id || ev.evidenceId || "");
      const text = String(ev.text || "");
      if (id && text) {
        jdEvidenceMap.set(id, text);
      }
    }
  }

  // 2. Build CV Evidence map
  const cvEvidenceMap = new Map<string, CvEvidenceItem>();
  if (cvParsedData && Array.isArray(cvParsedData.evidence)) {
    for (const ev of cvParsedData.evidence as Array<Record<string, unknown>>) {
      const id = String(ev.evidenceId || ev.evidence_id || "");
      const text = String(ev.text || ev.snippet || "");
      const page = typeof ev.pageNumber === "number" ? ev.pageNumber : typeof ev.page === "number" ? ev.page : null;
      const section = typeof ev.section === "string" ? ev.section : null;
      if (id && text) {
        cvEvidenceMap.set(id, {
          evidenceId: id,
          documentId: String(ev.documentId || ev.document_id || "") || undefined,
          text,
          pageNumber: page,
          section,
          charStart: typeof ev.charStart === "number" ? ev.charStart : typeof ev.char_start === "number" ? ev.char_start : null,
          charEnd: typeof ev.charEnd === "number" ? ev.charEnd : typeof ev.char_end === "number" ? ev.char_end : null,
          sourceBlockId: String(ev.sourceBlockId || ev.source_block_id || "") || null,
        });
      }
    }
  }

  // 3. Index raw JD requirements
  const jdReqMap = new Map<string, Record<string, unknown>>();
  if (jobStructuredData) {
    const rawReqList = (jobStructuredData.requirements || jobStructuredData.must_have || []) as Array<Record<string, unknown>>;
    if (Array.isArray(rawReqList)) {
      for (const r of rawReqList) {
        const id = String(r.requirement_id || r.requirementId || r.id || "");
        if (id) {
          jdReqMap.set(id, r);
        }
      }
    }
  }

  // 4. Transform requirement results into HumanizedRequirement
  const humanizedList: HumanizedRequirement[] = [];

  for (const res of requirementResults) {
    const reqId = res.requirementId;
    const jdReq = jdReqMap.get(reqId);
    const mapped = requirementsMap?.get(reqId);

    // Label determination
    let label = "";
    if (mapped?.label) {
      label = mapped.label;
    } else if (jdReq?.raw_label || jdReq?.rawLabel || jdReq?.text || jdReq?.label) {
      label = String(jdReq.raw_label || jdReq.rawLabel || jdReq.text || jdReq.label);
    } else {
      const cat = humanizeCategoryFromId(reqId);
      const cleanId = reqId.replace(/^req-/, "").replaceAll("-", " ");
      label = cleanId ? `${cleanId.charAt(0).toUpperCase() + cleanId.slice(1)}` : `Yêu cầu về ${cat}`;
    }

    // Priority determination
    let priority: RequirementPriority = "unknown";
    if (mapped?.priority) {
      priority = humanizeRequirementPriority(mapped.priority);
    } else if (jdReq?.priority) {
      priority = humanizeRequirementPriority(String(jdReq.priority));
    }

    // Kind determination
    const rawKind = String(jdReq?.kind || mapped?.kind || "");
    const kind = (["skill", "experience", "education", "language", "other"] as const).find(
      (candidate) => candidate === rawKind
    ) || humanizeCategoryFromId(reqId);

    // Humanized Condition Text
    let conditionText = "";
    const minMonths = typeof jdReq?.minimum_experience_months === "number"
      ? jdReq.minimum_experience_months
      : typeof jdReq?.minimumExperienceMonths === "number"
      ? jdReq.minimumExperienceMonths
      : null;
    const op = typeof jdReq?.operator === "string" ? jdReq.operator : null;

    if (minMonths != null && minMonths > 0) {
      conditionText = formatExperienceCondition(minMonths, op);
    } else if (jdReq?.credential || jdReq?.threshold != null) {
      conditionText = formatLanguageCondition({
        credential: jdReq.credential ? String(jdReq.credential) : null,
        threshold: typeof jdReq.threshold === "number" ? jdReq.threshold : null,
        scale: typeof jdReq.scale === "number" ? jdReq.scale : null,
        operator: op,
        equivalentAllowed: Boolean(jdReq.equivalent_allowed || jdReq.equivalentAllowed),
      });
    }

    // Status mapping: strictly met | not_met | unknown | not_applicable (no "partial")
    const rawStatus = (res.status || "unknown").toLowerCase();
    const status: RequirementStatus =
      rawStatus === "met"
        ? "met"
        : rawStatus === "not_met"
        ? "not_met"
        : rawStatus === "not_applicable"
        ? "not_applicable"
        : "unknown";

    // JD Evidence text resolution: requirement.sourceEvidenceRef -> job.evidence
    let jdEvidenceText: string | undefined;
    const jdSourceRef = (jdReq?.sourceEvidenceRef || jdReq?.source_evidence_ref || (Array.isArray(jdReq?.evidence_refs) ? jdReq.evidence_refs[0] : (Array.isArray(jdReq?.evidenceRefs) ? jdReq.evidenceRefs[0] : undefined))) as string | undefined;
    if (jdSourceRef) {
      jdEvidenceText = jdEvidenceMap.get(String(jdSourceRef));
    }

    // CV Evidence resolution: requirementResult.evidenceRefs -> resume.evidence
    // (Truthful: No heuristic company/role/project fabrication)
    const cvEvidenceItems: CvEvidenceItem[] = [];
    const cvRefs = (res.evidenceRefs || []) as string[];

    if (Array.isArray(cvRefs) && cvRefs.length > 0) {
      for (const ref of cvRefs) {
        const ev = cvEvidenceMap.get(ref);
        if (ev?.text) {
          cvEvidenceItems.push(ev);
        }
      }
    }

    const conceptResults: ConceptEvidenceResult[] = Array.isArray(res.conceptResults)
      ? res.conceptResults.flatMap((concept) => {
          const conceptStatus = String(concept.status || "unknown").toLowerCase();
          const status: RequirementStatus =
            conceptStatus === "met"
              ? "met"
              : conceptStatus === "not_met"
              ? "not_met"
              : conceptStatus === "not_applicable"
              ? "not_applicable"
              : "unknown";
          const refs = Array.isArray(concept.evidenceRefs) ? concept.evidenceRefs : [];
          const evidence = [...new Set(refs)].flatMap((ref) => {
            const item = cvEvidenceMap.get(ref);
            return item
              ? [item]
              : [];
          });
          const conceptId = String(concept.conceptId || "").trim();
          const conceptLabel = String(concept.label || "").trim();
          return conceptId && conceptLabel
            ? [{
                conceptId,
                label: conceptLabel,
                status,
                confidence: Number(concept.confidence || 0),
                evidence,
                evidenceStrength: concept.evidenceStrength,
                reasonCode: concept.reasonCode,
              }]
            : [];
        })
      : [];

    // Group info
    const groupId = jdReq?.group_id ? String(jdReq.group_id) : jdReq?.groupId ? String(jdReq.groupId) : undefined;
    const resultGroupOperator = String(res.groupOperator || "");
    const groupOperator = resultGroupOperator === "atomic" || resultGroupOperator === "all_of" || resultGroupOperator === "any_of"
      ? resultGroupOperator as GroupOperator
      : jdReq?.group_operator ? (String(jdReq.group_operator) as GroupOperator) : jdReq?.groupOperator ? (String(jdReq.groupOperator) as GroupOperator) : undefined;

    // Reason code text
    const reasonText = resolveReasonCodeText ? resolveReasonCodeText(res.reasonCode) : undefined;

    humanizedList.push({
      id: reqId,
      label,
      kind,
      priority,
      conditionText: conditionText || undefined,
      status,
      statusLabel: formatStatusLabel(status),
      reasonText: reasonText || undefined,
      reasonCode: res.reasonCode,
      evidenceExplanation: res.evidenceExplanation,
      jdEvidenceText,
      cvEvidence: cvEvidenceItems,
      conceptResults: conceptResults.length > 0 ? conceptResults : undefined,
      score: res.score,
      groupId,
      groupOperator,
      rawRequirement: jdReq,
    });
  }

  // 5. Build RequirementGroup[] for items that share group_id and have any_of / all_of
  const groupMap = new Map<string, HumanizedRequirement[]>();
  for (const item of humanizedList) {
    if (item.groupId && (item.groupOperator === "any_of" || item.groupOperator === "all_of")) {
      const list = groupMap.get(item.groupId) || [];
      list.push(item);
      groupMap.set(item.groupId, list);
    }
  }

  const groups: RequirementGroup[] = [];
  for (const [groupId, items] of groupMap.entries()) {
    const first = items[0];
    const operator = first.groupOperator === "any_of" ? "any_of" : "all_of";

    // Group title: join labels with " hoặc " for any_of, or " và " for all_of
    const separator = operator === "any_of" ? " hoặc " : " và ";
    const title = items.map((i) => i.label).join(separator);

    const subtext =
      operator === "any_of"
        ? "Chỉ cần đáp ứng một trong các tiêu chí"
        : "Cần đáp ứng tất cả tiêu chí";

    // Matching backend currently does NOT expose GroupRequirementResult.
    // Frontend MUST NOT conclude or compute parent status (Truthful UI contract).
    const status = null;
    const statusLabel = null;

    // Group priority: if all are must_have -> must_have, else if any is must_have -> must_have, else preferred
    const priority = items.some((i) => i.priority === "must_have")
      ? "must_have"
      : items.some((i) => i.priority === "preferred")
      ? "preferred"
      : "unknown";

    groups.push({
      groupId,
      title,
      subtext,
      operator,
      priority,
      status,
      statusLabel,
      items,
    });
  }

  return {
    requirements: humanizedList,
    groups,
  };
}

