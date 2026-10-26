import { describe, expect, it } from "vitest";
import { evidenceFacts } from "@features/admin/components/BankSuggestionCard";
import { percent, suggestionAbilities } from "@features/admin/services/bankInsights.service";

describe("bank suggestions", () => {
  it("lets authors take revisions and bank admins take retirements and variants", () => {
    expect(suggestionAbilities("RUBRIC_GAP", ["QUESTION_AUTHOR"])).toEqual({ accept: true, dismiss: false });
    expect(suggestionAbilities("RETIRE", ["QUESTION_AUTHOR"])).toEqual({ accept: false, dismiss: false });
    expect(suggestionAbilities("VARIANT", ["QUESTION_BANK_ADMIN"])).toEqual({ accept: true, dismiss: true });
    expect(suggestionAbilities("REVISE", ["QUESTION_REVIEWER"])).toEqual({ accept: false, dismiss: true });
    expect(suggestionAbilities("DUPLICATE", ["ADMIN"])).toEqual({ accept: true, dismiss: true });
  });

  it("states the evidence in short facts", () => {
    const t = (key: string) =>
      ({
        "bankAi.fact.asked": "Hỏi {asked} lần, chấm {graded}",
        "bankAi.fact.missed": "Thiếu {rate} trong {n} câu trả lời",
        "bankAi.fact.mean": "Điểm TB {score}/10",
      })[key] ?? key;
    expect(
      evidenceFacts({ kind: "RUBRIC_GAP", evidence: { asked: 8, graded: 6, missedRate: 0.833, criterionAnswers: 6, meanScore: 4.25 } }, t),
    ).toEqual(["Hỏi 8 lần, chấm 6", "Thiếu 83% trong 6 câu trả lời", "Điểm TB 4.3/10"]);
    expect(percent(null)).toBe("—");
  });
});
