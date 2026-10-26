import { describe, expect, it } from "vitest";
import { criterionOf, groupScores } from "@features/admin/pipeline/components/TurnAiPanel";
import { scorePasses, scoreValueText, type LangfuseScore } from "@features/admin/services/langfuse.service";

const score = (name: string, value: LangfuseScore["value"], kind: LangfuseScore["kind"], dataType = "BOOLEAN"): LangfuseScore => ({
  name, value, kind, dataType, source: "API", comment: null, at: null,
});

describe("Langfuse scores in the console", () => {
  it("reads rule flags as problems and other booleans as passes", () => {
    expect(scorePasses(score("rule.flagged", 1, "rule"))).toBe(false);
    expect(scorePasses(score("rule.flagged", 0, "rule"))).toBe(true);
    expect(scorePasses(score("flag.probe_off_target", 1, "flag"))).toBe(false);
    expect(scorePasses(score("judge.probe_ok", 1, "judge"))).toBe(true);
    expect(scorePasses(score("human.decision_ok", 0, "human"))).toBe(false);
    expect(scorePasses(score("guard.rejects", 3, "other", "NUMERIC"))).toBeNull();
  });

  it("prints values", () => {
    expect(scoreValueText(score("judge.probe_ok", 1, "judge"))).toBe("✓");
    expect(scoreValueText(score("judge.probe_ok", 0, "judge"))).toBe("✗");
    expect(scoreValueText(score("grade", 7.25, "other", "NUMERIC"))).toBe("7.25");
    expect(scoreValueText(score("x", null, "other"))).toBe("—");
    expect(scoreValueText(score("rule.flagged", 0, "rule"))).toBe("không");
    expect(scorePasses(score("check.graded_questions", 0, "other", "NUMERIC"))).toBeNull();
  });

  it("groups rules (with flags), judges, reviewers", () => {
    const groups = groupScores([
      score("judge.probe_ok", 1, "judge"),
      score("flag.giveup_but_long", 1, "flag"),
      score("rule.flagged", 1, "rule"),
      score("human.probe_ok", 0, "human"),
    ]);
    expect(groups.map((g) => g.kind)).toEqual(["rule", "judge", "human"]);
    expect(groups[0].scores.map((s) => s.name)).toEqual(["flag.giveup_but_long", "rule.flagged"]);
    expect(criterionOf("human.decision_ok")).toBe("decision_ok");
  });
});
