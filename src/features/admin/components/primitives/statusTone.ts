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

export function lifecycleTone(status: string | null | undefined): AdminStatusType {
  return LIFECYCLE[String(status ?? "NONE").toUpperCase()] ?? "unknown";
}
