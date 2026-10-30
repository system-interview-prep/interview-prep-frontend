import type { HumanizedRequirement } from "../types/match-details.types";
import { fitVi } from "@/i18n/dicts/fit.dict";
import { fmt } from "@/i18n/format";

const viT = (key: string) => fitVi[key] ?? key;

/**
 * A next step for a requirement that is not met or needs confirmation.
 *
 * Derived only from the status and reason code the matcher returned; it never
 * claims that a change would flip the result (that would need a re-run), and it
 * points at stating real experience, not at padding the CV.
 */
export function nextStepHint(
  requirement: HumanizedRequirement,
  t: (key: string) => string = viT
): string | null {
  if (requirement.status === "met" || requirement.status === "not_applicable") return null;
  const label = requirement.label;
  const condition = requirement.conditionText ? ` (${requirement.conditionText.toLowerCase()})` : "";

  switch (requirement.reasonCode) {
    case "skill_duration_below_minimum":
      return fmt(t("fit.hint.skillDuration"), { condition, label });
    case "skill_level_not_evidenced":
      return fmt(t("fit.hint.skillLevel"), { label });
    case "skill_semantic_context_needs_confirmation":
      return fmt(t("fit.hint.semantic"), { label });
    default:
      break;
  }

  if (requirement.status === "unknown") {
    return fmt(t("fit.hint.unknown"), { label });
  }
  return fmt(t("fit.hint.notMet"), { label });
}
