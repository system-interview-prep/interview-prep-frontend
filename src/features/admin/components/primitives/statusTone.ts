import type { AdminStatusType } from "./AdminStatusBadge";

/**
 * Badge type of a content lifecycle status (questions, rubrics, versions,
 * taxonomy concepts, job descriptions), so every state has its own color.
 */
const LIFECYCLE: Record<string, AdminStatusType> = {
  DRAFT: "draft",
  IN_REVIEW: "review",
  PENDING_REVIEW: "review",
  NEEDS_REVISION: "revision",
  CHANGES_REQUESTED: "revision",
  APPROVED: "success",
  CALIBRATED: "success",
  PUBLISHED: "success",
  ACTIVE: "success",
  REJECTED: "rejected",
  RETIRED: "archived",
  ARCHIVED: "archived",
  INACTIVE: "archived",
  DEPRECATED: "archived",
  SUPERSEDED: "archived",
  NONE: "unknown",
};

/**
 * The one badge of a question version. An approved version nobody reviewed
 * (the seeded bank) is not shown as approved, and one calibrated on real
 * answers says so; every other version shows its lifecycle status.
 * `labelKey` is null when the caller should use the status label.
 */
export function questionBadge(
  status: string | null | undefined,
  trust: string | null | undefined,
): { tone: AdminStatusType; labelKey: string | null } {
  if (trust === "initial") return { tone: "warning", labelKey: "adminRoles.trust.initial" };
  if (trust === "calibrated") return { tone: "success", labelKey: "adminRoles.trust.calibrated" };
  return { tone: lifecycleTone(status), labelKey: null };
}

export function lifecycleTone(status: string | null | undefined): AdminStatusType {
  return LIFECYCLE[String(status ?? "NONE").toUpperCase()] ?? "unknown";
}
