import { describe, expect, it } from "vitest";
import { aiPipelineVi } from "@/i18n/dicts/aiPipeline.dict";
import type { SessionPipeline, TurnExchange } from "../services/pipeline.service";
import {
  clock,
  difficultyReason,
  entryReason,
  eventDetail,
  exchangeHasWarning,
  exchangeReasons,
  formatMs,
  percentText,
  pollInterval,
  purposeKey,
  purposeLabel,
} from "../utils/pipelineFormat";

const dict: Record<string, string> = {
  ...aiPipelineVi,
  "adminPlan.difficulty.advanced": "Nâng cao",
  "adminPlan.difficulty.intermediate": "Trung bình",
};
const t = (key: string) => dict[key] ?? key;

const policy = { minMatchPercent: 0, lowFitPercent: 40, challengePercent: 70, blockNotEligible: false };
const entry = (over: Partial<SessionPipeline["entry"]>): SessionPipeline["entry"] => ({
  matchPercent: 74,
  fitBand: "strong",
  eligibility: "eligible",
  matchingDecision: "MATCH",
  warnings: [],
  practiceTier: "challenge",
  blocked: false,
  blockedReason: null,
  policy,
  ...over,
});

const exchange = (over: Partial<TurnExchange>): TurnExchange => ({
  at: null,
  action: "NEXT_QUESTION",
  stage: "DEEP_DIVE",
  intent: "ANSWER",
  sufficiency: "SUFFICIENT",
  missingAspect: null,
  probeKind: null,
  preScore: null,
  ackSource: "llm",
  ackReason: null,
  generatedBy: null,
  repeatsRecent: false,
  hardAnswerTimeout: false,
  answerChars: null,
  interviewer: null,
  coreMs: null,
  modality: "VOICE",
  ...over,
});

describe("formatting", () => {
  it("formats durations at every scale", () => {
    expect(formatMs(null)).toBe("—");
    expect(formatMs(820)).toBe("820 ms");
    expect(formatMs(3140)).toBe("3.1 s");
    expect(formatMs(42_000)).toBe("42 s");
    expect(formatMs(125_000)).toBe("2 min 05 s");
  });

  it("formats rates with their denominator in mind", () => {
    expect(percentText({ count: 0, total: 0, rate: null })).toBe("—");
    expect(percentText({ count: 1, total: 8, rate: 0.125 })).toBe("12.5%");
  });

  it("prints clock time and tolerates bad input", () => {
    expect(clock("not a date")).toBe("—");
    expect(clock(new Date(2026, 9, 19, 9, 5, 7).toISOString())).toBe("09:05:07");
  });

  it("polls only live sessions", () => {
    expect(pollInterval({ live: true })).toBe(4000);
    expect(pollInterval({ live: false })).toBeNull();
    expect(pollInterval(null)).toBeNull();
  });
});

describe("reasons", () => {
  it("explains the practice tier with the thresholds", () => {
    expect(entryReason(entry({}), t)).toBe("Mức Thử thách vì điểm 74% ≥ 70% và CV đủ điều kiện.");
    expect(entryReason(entry({ practiceTier: "basic", matchPercent: 25, warnings: ["match_low_fit"] }), t)).toBe(
      "Mức Cơ bản vì điểm 25% dưới 40%.",
    );
    expect(entryReason(entry({ practiceTier: "basic", warnings: ["match_not_eligible"] }), t)).toContain("yêu cầu bắt buộc");
    expect(entryReason(entry({ practiceTier: "standard", matchPercent: 80 }), t)).toContain("chưa đạt yêu cầu bắt buộc");
    expect(entryReason(entry({ practiceTier: "standard", matchPercent: 55 }), t)).toContain("40–70%");
    expect(entryReason(entry({ blocked: true }), t)).toContain("Bị chặn");
    expect(entryReason(entry({ practiceTier: "standard", matchPercent: null }), t)).toContain("Chưa có điểm");
  });

  it("explains a difficulty change by tier", () => {
    expect(
      difficultyReason(
        { level: "advanced", jobLevel: "intermediate", fitAdjustment: { direction: "harder", reasons: [], matchPercent: 74 } },
        t,
      ),
    ).toBe("Nâng cao (JD: Trung bình, khó hơn một bậc vì mức Thử thách)");
    expect(difficultyReason({ level: "intermediate" }, t)).toBe("Trung bình");
    expect(difficultyReason(null, t)).toBeNull();
  });

  it("explains each interviewer decision", () => {
    expect(exchangeReasons(exchange({}), t)).toEqual(["Trả lời · đủ ý"]);
    const probe = exchangeReasons(
      exchange({ action: "PROBE", sufficiency: "INSUFFICIENT", probeKind: "gap", missingAspect: "cache invalidation" }),
      t,
    );
    expect(probe).toEqual(["Trả lời · chưa đủ ý", "Hỏi thêm vì thiếu ý: cache invalidation"]);
    expect(exchangeReasons(exchange({ action: "PROBE", probeKind: "deepen" }), t)[1]).toContain("đào sâu");
    const replaced = exchange({ ackSource: "fallback", ackReason: "parroting", generatedBy: "fixed_fallback" });
    expect(exchangeReasons(replaced, t)).toContain("Câu ghi nhận của AI bị thay: lặp lại lời ứng viên");
    expect(exchangeReasons(replaced, t)).toContain("Câu hỏi thêm dùng câu dự phòng");
    expect(exchangeHasWarning(replaced)).toBe(true);
    expect(exchangeHasWarning(exchange({}))).toBe(false);
    // Unknown codes are shown as they are rather than as a missing key.
    expect(exchangeReasons(exchange({ intent: "NEW_INTENT", sufficiency: null }), t)).toEqual(["NEW_INTENT"]);
  });
});

describe("AI call purposes", () => {
  it("names a call after the step that made it", () => {
    expect(purposeKey("interviews.interview_engine.InterviewCoreEngine._generate_probe_question")).toBe("probe");
    expect(purposeKey("interviews.spoken_questions.add_spoken_versions")).toBe("spoken");
    expect(purposeKey("interviews.evaluation_engine.InterviewEvaluationEngine._call_grader")).toBe("grade");
    expect(purposeKey("user_cvs.hybrid.HybridResumeParser.parse")).toBe("parseCv");
    expect(purposeKey("job_descriptions.hybrid.HybridJobParser.parse")).toBe("parseJd");
    expect(purposeKey("matching.embeddings")).toBe("embeddings");
    expect(purposeKey("something.unknown")).toBeNull();
    expect(purposeLabel("something.unknown", t)).toBe("something.unknown");
    expect(purposeLabel("matching.targeted_reparse.evidence_search", t)).toBe("Tìm bằng chứng trong CV");
  });

  it("summarises an event payload", () => {
    expect(
      eventDetail({
        id: 1,
        at: null,
        stage: "plan",
        event: "plan_failed",
        status: "error",
        turnIndex: null,
        durationMs: 10,
        payload: { error_type: "Timeout", error_message: "slow", other: 1 },
      }),
    ).toBe("error_type=Timeout · error_message=slow");
  });
});
